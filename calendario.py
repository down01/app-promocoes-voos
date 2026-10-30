"""Atualização geral: lê o calendário de preços do Google Voos para muitas rotas.

Uma visita por rota traz o menor preço só de ida de cada dia dos próximos meses.
Roda dividido em partes (shards) para várias máquinas trabalharem ao mesmo tempo:

  python calendario.py nacional --parte 0 --partes 20
  python calendario.py internacional --parte 3 --partes 20
  python calendario.py nacional --rota VIX GRU --simular     (teste de uma rota, sem gravar)
"""
import argparse
import os
import random
import time
from datetime import date, datetime, timedelta, timezone
from urllib.parse import quote

from playwright.sync_api import sync_playwright

from aeroportos import rotas

MESES = int(os.environ.get("MESES_CALENDARIO", "5"))


def ler_dias(pagina):
    """{data_iso: preço} dos dias visíveis no calendário."""
    precos = {}
    for c in pagina.locator("[role='dialog'] [role='gridcell'][data-iso]").all():
        linhas = [l.strip() for l in c.inner_text().split("\n") if l.strip()]
        if len(linhas) >= 2 and linhas[1].replace(".", "").isdigit():
            precos[c.get_attribute("data-iso")] = int(linhas[1].replace(".", ""))
    return precos


def ler_calendario(pagina, origem, destino, meses=MESES):
    amanha = (date.today() + timedelta(days=1)).isoformat()
    consulta = quote(f"Flights from {origem} to {destino} on {amanha} one way")
    pagina.goto(f"https://www.google.com/travel/flights?q={consulta}&hl=pt-BR&curr=BRL",
                wait_until="domcontentloaded")
    pagina.locator("input[aria-label*='Partida']").first.click(timeout=20000)
    pagina.wait_for_timeout(2500)
    precos = ler_dias(pagina)
    avancar = pagina.locator("[role='dialog'] [aria-label='Avançar']").last
    for _ in range(meses - 1):
        avancar.click(timeout=10000)
        pagina.wait_for_timeout(1800)
        precos.update(ler_dias(pagina))
    limite = (date.today() + timedelta(days=31 * meses)).isoformat()
    hoje = date.today().isoformat()
    return {d: p for d, p in precos.items() if hoje <= d <= limite}


def gravar(banco, origem, destino, precos):
    agora = datetime.now(timezone.utc).isoformat()
    linhas = [{"origem": origem, "destino": destino, "data": d, "preco": p, "atualizado_em": agora}
              for d, p in precos.items()]
    for i in range(0, len(linhas), 500):
        banco.inserir("calendario", linhas[i:i + 500], conflito="origem,destino,data", retornar=False)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("escopo", choices=["nacional", "internacional"])
    ap.add_argument("--parte", type=int, default=0)
    ap.add_argument("--partes", type=int, default=1)
    ap.add_argument("--rota", nargs=2, metavar=("ORIGEM", "DESTINO"))
    ap.add_argument("--simular", action="store_true", help="não grava no banco")
    a = ap.parse_args()

    lista = [tuple(a.rota)] if a.rota else rotas(a.escopo)[a.parte::a.partes]
    banco = None
    if not a.simular:
        from db import Banco
        banco = Banco()

    inicio, ok, falhas = time.time(), 0, []
    print(f"{a.escopo} parte {a.parte + 1}/{a.partes}: {len(lista)} rotas", flush=True)
    with sync_playwright() as p:
        navegador = p.chromium.launch(channel="chrome", headless=True)
        pagina = navegador.new_page(locale="pt-BR", viewport={"width": 1400, "height": 1000})
        for n, (origem, destino) in enumerate(lista, 1):
            precos = {}
            for tentativa in range(2):
                try:
                    precos = ler_calendario(pagina, origem, destino)
                    break
                except Exception as e:  # página mudou ou demorou: tenta mais uma vez
                    if tentativa:
                        print(f"  [{n}] {origem}→{destino}: erro {type(e).__name__}", flush=True)
                    pagina.wait_for_timeout(3000)
            if precos:
                if banco:
                    gravar(banco, origem, destino, precos)
                ok += 1
                menor = min(precos.items(), key=lambda x: x[1])
                print(f"[{n}/{len(lista)}] {origem}→{destino}: {len(precos)} dias, "
                      f"menor R$ {menor[1]} em {menor[0]}", flush=True)
            else:
                falhas.append(f"{origem}{destino}")
            pagina.wait_for_timeout(random.randint(800, 2000))
        navegador.close()

    print(f"\nFim: {ok} rotas atualizadas, {len(falhas)} sem preço, em {(time.time() - inicio) / 60:.1f} min")
    if falhas:
        print("Sem preço (pode não haver voo):", " ".join(falhas))
    # Se quase tudo falhou, provavelmente o Google bloqueou: deixa o GitHub marcar como erro
    if lista and ok < len(lista) * 0.3:
        raise SystemExit("Menos de 30% das rotas funcionaram — possível bloqueio do Google.")


if __name__ == "__main__":
    main()
