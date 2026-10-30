"""Robô agendado: atualiza os preços das rotas e manda os avisos de promoção.

  python worker.py              rodada completa (o GitHub roda a cada 6 horas)
  python worker.py --pedidos    só as buscas pedidas agora pelo site
  python worker.py --simular    não envia avisos, só mostra o que mandaria

Precisa das variáveis SUPABASE_URL e SUPABASE_SECRET_KEY. Canais de aviso opcionais:
RESEND_API_KEY, TELEGRAM_BOT_TOKEN, VAPID_PRIVATE_KEY.
"""
import argparse
import asyncio
import itertools
import os
import random
import time
from datetime import date, datetime, timedelta, timezone

import requests
from playwright.async_api import async_playwright

from aeroportos import BRASIL
from avisos import enviar_email, enviar_push, enviar_telegram, montar_mensagem
from db import Banco
from promocao import deve_avisar, eh_promocao
from robo_voos import buscar_na_pagina_async

MAX_BUSCAS = int(os.environ.get("MAX_BUSCAS", "60"))
DIAS_DE_INTERESSE = 30  # rota sem ninguém pesquisando/monitorando há 30 dias deixa de ser atualizada
ABAS = int(os.environ.get("ABAS", "4"))  # buscas ao mesmo tempo
# No modo --pedidos o robô fica ligado um pouco depois da fila acabar: quem pesquisar nesse tempo
# não espera o GitHub ligar outra máquina. Depois de MAX_MINUTOS para de aceitar pedidos novos.
ESPERA_PEDIDOS = int(os.environ.get("ESPERA_PEDIDOS", "90"))
MAX_MINUTOS = int(os.environ.get("MAX_MINUTOS", "35"))


def agora():
    return datetime.now(timezone.utc)


def trecho_de_ida(banco, rota):
    return banco.rpc("registrar_rota", p_origem=rota["origem"], p_destino=rota["destino"], p_ida=rota["data_ida"])


def trecho_de_volta(banco, rota):
    return banco.rpc("registrar_rota", p_origem=rota["destino"], p_destino=rota["origem"], p_ida=rota["data_volta"])


def rotas_para_atualizar(banco):
    hoje = date.today().isoformat()
    limite = (agora() - timedelta(days=DIAS_DE_INTERESSE)).isoformat()
    alertas = banco.selecionar("alertas", select="rota_id", ativo="eq.true")
    com_alerta = {a["rota_id"] for a in alertas}

    # Toda rota de ida e volta monitorada também tem os dois trechos separados acompanhados
    for rota in banco.selecionar("rotas", select="*", id=f"in.({','.join(map(str, com_alerta))})") if com_alerta else []:
        if rota["data_volta"]:
            com_alerta.add(trecho_de_ida(banco, rota)["id"])
            com_alerta.add(trecho_de_volta(banco, rota)["id"])

    rotas = banco.selecionar("rotas", select="*", data_ida=f"gte.{hoje}",
                             ultimo_interesse_em=f"gte.{limite}")
    extra = {r["id"] for r in rotas}
    faltando = com_alerta - extra
    if faltando:
        rotas += banco.selecionar("rotas", select="*", id=f"in.({','.join(map(str, faltando))})",
                                  data_ida=f"gte.{hoje}")
    # Primeiro as rotas com alerta, depois as que estão há mais tempo sem atualizar
    rotas.sort(key=lambda r: (r["id"] not in com_alerta, r["ultima_busca_em"] or ""))
    return rotas[:MAX_BUSCAS]


def rotas_das_promocoes(banco, quantidade=12):
    """Viagens que aparecem nas promoções da página inicial: deixa horários e companhias prontos."""
    br = f"({','.join(BRASIL)})"
    campos = "origem,destino,data"
    promocoes = (
        banco.selecionar("promocoes", select=campos, origem=f"in.{br}", destino=f"in.{br}",
                         order="preco", limit=quantidade)
        + banco.selecionar("promocoes", select=campos, origem=f"in.{br}", destino=f"not.in.{br}",
                           order="preco", limit=quantidade)
        + banco.selecionar("promocoes", select=campos, origem=f"not.in.{br}", destino=f"in.{br}",
                           order="preco", limit=quantidade // 4)
    )
    return [banco.rpc("registrar_rota", p_origem=p["origem"], p_destino=p["destino"], p_ida=p["data"])
            for p in promocoes]


def gravar_rota(banco, rota, voos, url):
    m = voos[0]
    banco.atualizar("rotas", {"preco_atual": m["preco"], "voos_atuais": voos[:15], "link": url,
                              "ultima_busca_em": agora().isoformat()}, id=f"eq.{rota['id']}")
    banco.inserir("precos", {"rota_id": rota["id"], "menor_preco": m["preco"], "companhia": m["companhia"],
                             "saida": m["saida"], "chegada": m["chegada"], "paradas": m["paradas"]})
    return m["preco"]


def pegar_pedidos(banco):
    pedidos = banco.selecionar("pedidos_busca", select="id,rota:rotas(*)", status="eq.pendente")
    for p in pedidos:
        banco.atualizar("pedidos_busca", {"status": "buscando"}, id=f"eq.{p['id']}")
    return pedidos


def concluir_pedidos(banco, ids):
    banco.atualizar("pedidos_busca", {"status": "pronto", "concluido_em": agora().isoformat()},
                    id=f"in.({','.join(map(str, ids))})")


async def buscar_rotas(banco, rotas, abas=ABAS, espera=0, max_minutos=MAX_MINUTOS):
    """Busca as rotas em várias abas. A cada 5 s olha se o site pediu buscas novas, que passam
    na frente da fila; cada pedido fica pronto assim que a sua rota termina."""
    fila = asyncio.PriorityQueue()
    ordem = itertools.count(1)
    pedidos_da_rota = {}  # rota_id → pedidos esperando por ela
    estado = {"ocupadas": 0, "fim": False}
    inicio = time.monotonic()

    def enfileirar(rota, prioridade):
        fila.put_nowait((prioridade, next(ordem), rota))

    for r in rotas:
        enfileirar(r, 1)

    async def vigiar():
        parado_desde = None
        while True:
            if time.monotonic() - inicio < max_minutos * 60:
                try:
                    for p in await asyncio.to_thread(pegar_pedidos, banco):
                        rota = p["rota"]
                        if rota["id"] not in pedidos_da_rota:
                            enfileirar(rota, 0)
                        pedidos_da_rota.setdefault(rota["id"], []).append(p["id"])
                except Exception as e:  # banco fora do ar por um instante: tenta na próxima
                    print(f"  erro ao ler pedidos: {e}", flush=True)
            if fila.empty() and estado["ocupadas"] == 0:
                parado_desde = parado_desde or time.monotonic()
                if time.monotonic() - parado_desde >= espera:
                    estado["fim"] = True
                    return
            else:
                parado_desde = None
            await asyncio.sleep(5)

    async def aba(contexto):
        pagina = await contexto.new_page()
        while not estado["fim"]:
            try:
                _, n, rota = await asyncio.wait_for(fila.get(), timeout=1)
            except asyncio.TimeoutError:
                continue
            estado["ocupadas"] += 1
            preco = None
            try:
                voos, url = await buscar_na_pagina_async(pagina, rota["origem"], rota["destino"],
                                                         rota["data_ida"], rota["data_volta"])
                if voos:
                    preco = await asyncio.to_thread(gravar_rota, banco, rota, voos, url)
            except Exception as e:  # uma rota com problema não pode parar as outras
                print(f"  erro em {rota['id']}: {e}", flush=True)
            ids = pedidos_da_rota.pop(rota["id"], [])
            if ids:
                try:
                    await asyncio.to_thread(concluir_pedidos, banco, ids)
                except Exception as e:
                    print(f"  erro ao concluir pedidos {ids}: {e}", flush=True)
            volta = f" a {rota['data_volta']}" if rota["data_volta"] else ""
            print(f"[{n}] {rota['origem']}→{rota['destino']} {rota['data_ida']}{volta}: "
                  f"{'R$ ' + str(preco) if preco else 'sem resultado'}{' (pedido do site)' if ids else ''}",
                  flush=True)
            estado["ocupadas"] -= 1
            await pagina.wait_for_timeout(random.randint(1000, 2500))
        await pagina.close()

    async with async_playwright() as p:
        navegador = await p.chromium.launch(channel="chrome", headless=True)
        contexto = await navegador.new_context(locale="pt-BR")
        await asyncio.gather(vigiar(), *(aba(contexto) for _ in range(abas)))
        await navegador.close()

    # Pedidos que chegaram no último instante voltam para a fila do próximo robô
    sobra = [i for ids in pedidos_da_rota.values() for i in ids]
    if sobra:
        banco.atualizar("pedidos_busca", {"status": "pendente"}, id=f"in.({','.join(map(str, sobra))})")


def historico(banco, rota_id):
    desde = (agora() - timedelta(days=30)).isoformat()
    linhas = banco.selecionar("precos", select="menor_preco", rota_id=f"eq.{rota_id}",
                              buscado_em=f"gte.{desde}", order="buscado_em.desc")
    return [l["menor_preco"] for l in linhas[1:]]  # sem o preço que acabou de entrar


def conferir_alertas(banco, simular=False):
    alertas = banco.selecionar("alertas", select="*,rota:rotas(*)", ativo="eq.true")
    enviados = 0
    for alerta in alertas:
        rota = alerta["rota"]
        trechos = [("ida_volta" if rota["data_volta"] else "ida", rota, alerta["limite_ida_volta"] if rota["data_volta"] else alerta["limite_ida"])]
        if rota["data_volta"]:
            trechos += [("ida", trecho_de_ida(banco, rota), alerta["limite_ida"]),
                        ("volta", trecho_de_volta(banco, rota), alerta["limite_volta"])]

        perfil = None
        for nome, r, limite in trechos:
            preco = r.get("preco_atual")
            if preco is None:
                continue
            promo, referencia = eh_promocao(preco, limite, historico(banco, r["id"]))
            if not promo:
                continue
            ultimo = banco.selecionar("avisos", select="preco", alerta_id=f"eq.{alerta['id']}",
                                      trecho=f"eq.{nome}", order="enviado_em.desc", limit=1)
            if not deve_avisar(preco, ultimo[0]["preco"] if ultimo else None):
                continue

            voo = (r.get("voos_atuais") or [None])[0]
            titulo, texto = montar_mensagem(nome, rota, preco, referencia, voo, r.get("link") or "")
            if simular:
                print(f"[simulação] {alerta['id']}: {titulo}")
                continue

            if perfil is None:
                perfil = (banco.selecionar("perfis", select="*", user_id=f"eq.{alerta['user_id']}") or [{}])[0]
            canais = []
            if alerta["avisar_email"] and enviar_email(perfil.get("email"), titulo, texto):
                canais.append("email")
            if alerta["avisar_telegram"] and enviar_telegram(perfil.get("telegram_chat_id"), texto):
                canais.append("telegram")
            if alerta["avisar_push"]:
                for a in banco.selecionar("push_assinaturas", select="*", user_id=f"eq.{alerta['user_id']}"):
                    if enviar_push(a, titulo, texto, r.get("link") or ""):
                        canais.append("push")
                        break
            banco.inserir("avisos", {"alerta_id": alerta["id"], "trecho": nome, "preco": preco, "canais": canais})
            enviados += 1
            print(f"Aviso: {titulo} → {', '.join(canais) or 'nenhum canal funcionou'}")
    return enviados


def vincular_telegram(banco):
    """Quem manda /start CÓDIGO para o bot tem o Telegram ligado à conta do site."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        return
    r = requests.get(f"https://api.telegram.org/bot{token}/getUpdates", timeout=20).json()
    ultimo_id = None
    for u in r.get("result", []):
        ultimo_id = u["update_id"]
        msg = u.get("message") or {}
        partes = (msg.get("text") or "").split()
        if len(partes) == 2 and partes[0] == "/start":
            achou = banco.atualizar("perfis", {"telegram_chat_id": str(msg["chat"]["id"])},
                                    telegram_codigo=f"eq.{partes[1]}")
            enviar_telegram(msg["chat"]["id"], "Pronto! Você vai receber as promoções aqui." if achou
                            else "Código não encontrado. Copie o código que aparece no site.")
    if ultimo_id is not None:
        requests.get(f"https://api.telegram.org/bot{token}/getUpdates", params={"offset": ultimo_id + 1}, timeout=20)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pedidos", action="store_true", help="só as buscas pedidas pelo site")
    ap.add_argument("--simular", action="store_true", help="não envia avisos")
    a = ap.parse_args()
    if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_SECRET_KEY"):
        print("Supabase ainda não configurado (SUPABASE_URL / SUPABASE_SECRET_KEY). Nada a fazer.")
        return
    banco = Banco()

    vincular_telegram(banco)
    inicio = time.time()
    if a.pedidos:
        # Só os pedidos do site (lidos dentro de buscar_rotas), esperando um pouco por novos no fim
        asyncio.run(buscar_rotas(banco, [], espera=ESPERA_PEDIDOS))
    else:
        # A rodada completa atende os pedidos do site (sempre na frente), depois as viagens
        # pesquisadas e por fim as das promoções (para abrirem já com horários e companhias)
        rotas, vistas = [], set()
        for r in rotas_para_atualizar(banco) + rotas_das_promocoes(banco):
            if r["id"] not in vistas:
                vistas.add(r["id"])
                rotas.append(r)
        print(f"{len(rotas)} rotas para buscar, {ABAS} abas", flush=True)
        asyncio.run(buscar_rotas(banco, rotas))
    print(f"Buscas terminadas em {(time.time() - inicio) / 60:.1f} min", flush=True)

    print(f"{conferir_alertas(banco, a.simular)} avisos enviados")


if __name__ == "__main__":
    main()
