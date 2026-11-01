"""Sonda temporária: como o Google Voos trata cidade (RIO/SAO) e vários aeroportos na busca."""
import re, sys
from urllib.parse import quote
from playwright.sync_api import sync_playwright

CONSULTAS = [
    "Flights from RIO to SAO on 2026-12-10 one way",
    "Flights from GIG,SDU to GRU,CGH,VCP on 2026-12-10 one way",
    "Flights from Rio de Janeiro to Sao Paulo on 2026-12-10 one way",
    "Flights from GIG or SDU to VIX on 2026-12-10 one way",
    "Flights from Rio de Janeiro state to Espirito Santo on 2026-12-10 one way",
]

with sync_playwright() as p:
    nav = p.chromium.launch(channel="chrome")
    pg = nav.new_page(locale="pt-BR", viewport={"width": 1280, "height": 1600})
    for i, c in enumerate(CONSULTAS):
        url = f"https://www.google.com/travel/flights?q={quote(c)}&hl=pt-BR&curr=BRL"
        print(f"\n===== {i}: {c}", flush=True)
        pg.goto(url, wait_until="domcontentloaded")
        try:
            for _ in range(2):
                a = pg.wait_for_selector("li:has-text('R$'), button:has-text('Rejeitar tudo'), button:has-text('Recusar tudo')", timeout=30000)
                if a.evaluate("e => e.tagName") != "BUTTON":
                    break
                a.click()
        except Exception as e:
            print("sem resultado", e)
        pg.wait_for_timeout(3000)
        vals = pg.eval_on_selector_all("input", "els => els.map(e => (e.getAttribute('aria-label')||'') + ' = ' + e.value).filter(t => t.length > 3)")
        print("CAMPOS:", vals[:6])
        chips = pg.eval_on_selector_all("[data-iata],[aria-label*='aeroporto' i]", "els => els.slice(0,12).map(e => (e.getAttribute('aria-label')||e.getAttribute('data-iata')||'').slice(0,120))")
        print("CHIPS:", chips)
        cards = pg.locator("li:has-text('R$')").all_inner_texts()
        print("CARDS:", len(cards))
        for t in cards[:4]:
            print("---\n" + t.replace("\n", " | ")[:400])
        labels = pg.eval_on_selector_all("li:has-text('R$') [aria-label]", "els => els.slice(0,6).map(e => e.getAttribute('aria-label').slice(0,300))")
        print("ARIA:", labels)
        pg.screenshot(path=f"sonda_{i}.png")
    nav.close()
