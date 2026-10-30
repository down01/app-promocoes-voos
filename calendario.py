"""Atualização geral: lê o calendário de preços do Google Voos para muitas rotas.

Uma visita por rota traz o menor preço só de ida de cada dia dos próximos meses.
Cada máquina abre várias abas ao mesmo tempo (ABAS, padrão 3) e o trabalho é dividido
em partes para várias máquinas do GitHub rodarem juntas:

  python calendario.py nacional --parte 0 --partes 20
  python calendario.py internacional --parte 3 --partes 20
  python calendario.py nacional --rota VIX GRU --simular     (teste de uma rota, sem gravar)
"""
import argparse
import asyncio
import os
import random
import time
from datetime import date, datetime, timedelta, timezone
from urllib.parse import quote

from playwright.async_api import async_playwright

from aeroportos import rotas

MESES = int(os.environ.get("MESES_CALENDARIO", "5"))
ABAS = int(os.environ.get("ABAS", "3"))


async def ler_dias(pagina):
    """{data_iso: preço} dos dias visíveis no calendário (uma leitura só, direto no navegador)."""
    dias = await pagina.eval_on_selector_all(
        "[role='dialog'] [role='gridcell'][data-iso]",
        "els => els.map(e => [e.getAttribute('data-iso'), e.innerText])",
    )
    precos = {}
    for iso, texto in dias:
        linhas = [l.strip() for l in texto.split("\n") if l.strip()]
        if len(linhas) >= 2 and linhas[1].replace(".", "").isdigit():
            precos[iso] = int(linhas[1].replace(".", ""))
    return precos


async def ler_calendario(pagina, origem, destino, meses=MESES):
    amanha = (date.today() + timedelta(days=1)).isoformat()
    consulta = quote(f"Flights from {origem} to {destino} on {amanha} one way")
    await pagina.goto(f"https://www.google.com/travel/flights?q={consulta}&hl=pt-BR&curr=BRL",
                      wait_until="domcontentloaded")
    await pagina.locator("input[aria-label*='Partida']").first.click(timeout=20000)
    # Espera os preços aparecerem em vez de um tempo fixo
    await pagina.wait_for_function(
        "() => [...document.querySelectorAll(\"[role='dialog'] [role='gridcell'][data-iso]\")]"
        ".some(e => e.innerText.trim().split('\\n').length > 1)",
        timeout=15000,
    )
    precos = await ler_dias(pagina)
    avancar = pagina.locator("[role='dialog'] [aria-label='Avançar']").last
    for _ in range(meses - 1):
        antes = len(precos)
        await avancar.click(timeout=10000)
        for _ in range(12):  # até ~2,4 s esperando os dias novos carregarem
            await pagina.wait_for_timeout(200)
            novos = await ler_dias(pagina)
            if len(set(novos) - set(precos)) >= 20:
                break
        precos.update(novos)
        if len(precos) == antes:
            break  # o Google não tem mais meses com preço
    limite = (date.today() + timedelta(days=31 * meses)).isoformat()
    hoje = date.today().isoformat()
    return {d: p for d, p in precos.items() if hoje <= d <= limite}


def gravar(banco, origem, destino, precos):
    agora = datetime.now(timezone.utc).isoformat()
    linhas = [{"origem": origem, "destino": destino, "data": d, "preco": p, "atualizado_em": agora}
              for d, p in precos.items()]
    for i in range(0, len(linhas), 500):
        banco.inserir("calendario", linhas[i:i + 500], conflito="origem,destino,data", retornar=False)


async def trabalhar(fila, contexto, banco, total, resultado):
    """Uma aba: pega rotas da fila até acabar."""
    pagina = await contexto.new_page()
    while True:
        try:
            n, (origem, destino) = fila.get_nowait()
        except asyncio.QueueEmpty:
            break
        precos = {}
        for tentativa in range(2):
            try:
                precos = await ler_calendario(pagina, origem, destino)
                if precos:
                    break  # calendário vazio às vezes é carregamento incompleto: tenta de novo
            except Exception as e:  # página mudou ou demorou: tenta mais uma vez
                if tentativa:
                    print(f"  [{n}] {origem}→{destino}: erro {type(e).__name__}", flush=True)
                await pagina.wait_for_timeout(2000)
        if precos:
            if banco:
                await asyncio.to_thread(gravar, banco, origem, destino, precos)
            resultado["ok"] += 1
            menor = min(precos.items(), key=lambda x: x[1])
            print(f"[{n}/{total}] {origem}→{destino}: {len(precos)} dias, menor R$ {menor[1]} em {menor[0]}",
                  flush=True)
        else:
            resultado["falhas"].append(f"{origem}{destino}")
        await pagina.wait_for_timeout(random.randint(500, 1500))
    await pagina.close()


async def principal(lista, banco, abas):
    fila = asyncio.Queue()
    for n, rota in enumerate(lista, 1):
        fila.put_nowait((n, rota))
    resultado = {"ok": 0, "falhas": []}
    async with async_playwright() as p:
        navegador = await p.chromium.launch(channel="chrome", headless=True)
        contexto = await navegador.new_context(locale="pt-BR", viewport={"width": 1400, "height": 1000})
        await asyncio.gather(*(trabalhar(fila, contexto, banco, len(lista), resultado)
                               for _ in range(min(abas, len(lista)))))
        await navegador.close()
    return resultado


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("escopo", choices=["nacional", "internacional"])
    ap.add_argument("--parte", type=int, default=0)
    ap.add_argument("--partes", type=int, default=1)
    ap.add_argument("--rota", nargs=2, metavar=("ORIGEM", "DESTINO"), action="append")
    ap.add_argument("--abas", type=int, default=ABAS)
    ap.add_argument("--limite", type=int, help="só as N primeiras rotas (para testes)")
    ap.add_argument("--simular", action="store_true", help="não grava no banco")
    a = ap.parse_args()

    lista = [tuple(r) for r in a.rota] if a.rota else rotas(a.escopo)[a.parte::a.partes]
    if a.limite:
        lista = lista[:a.limite]
    banco = None
    if not a.simular:
        from db import Banco
        banco = Banco()

    inicio = time.time()
    print(f"{a.escopo} parte {a.parte + 1}/{a.partes}: {len(lista)} rotas, {a.abas} abas", flush=True)
    r = asyncio.run(principal(lista, banco, a.abas))
    minutos = (time.time() - inicio) / 60
    print(f"\nFim: {r['ok']} rotas atualizadas, {len(r['falhas'])} sem preço, em {minutos:.1f} min "
          f"({minutos * 60 / max(len(lista), 1):.0f} s por rota)")
    if r["falhas"]:
        print("Sem preço (pode não haver voo):", " ".join(r["falhas"]))
    # Se quase tudo falhou, provavelmente o Google bloqueou: deixa o GitHub marcar como erro
    if lista and r["ok"] < len(lista) * 0.3:
        raise SystemExit("Menos de 30% das rotas funcionaram — possível bloqueio do Google.")


if __name__ == "__main__":
    main()
