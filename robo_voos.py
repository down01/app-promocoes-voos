"""Robô de teste: busca voos no Google Voos e opcionalmente monitora o preço.

Exemplos:
  python robo_voos.py VIX SCL 2027-04-29 2027-05-07
  python robo_voos.py VIX SCL 2027-04-29 2027-05-07 --alerta 2000
  python robo_voos.py VIX SCL 2027-04-29            (só ida)
"""
import argparse
import csv
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright

PASTA = Path(__file__).parent
HISTORICO = PASTA / "historico_precos.csv"

RE_HORA = re.compile(r"^\d{1,2}:\d{2}(\+\d)?$")
RE_PRECO = re.compile(r"R\$\s?([\d.]+)")
RE_DURACAO = re.compile(r"^\d+\s?h(\s?\d+\s?min)?$")
RE_PARADAS = re.compile(r"^(\d+ paradas?|Sem escalas|Direto)$", re.I)


def montar_url(origem, destino, ida, volta=None):
    consulta = f"Flights from {origem} to {destino} on {ida}"
    if volta:
        consulta += f" through {volta}"
    else:
        consulta += " one way"
    return f"https://www.google.com/travel/flights?q={quote(consulta)}&hl=pt-BR&curr=BRL"


def ler_voo(texto):
    """Transforma o texto de um card de resultado em um dicionário."""
    linhas = [l.strip() for l in texto.splitlines() if l.strip() and l.strip() != "–"]
    horas = [l for l in linhas if RE_HORA.match(l)]
    preco = next((RE_PRECO.search(l) for l in linhas if RE_PRECO.search(l)), None)
    if len(horas) < 2 or not preco:
        return None
    i_chegada = linhas.index(horas[1])
    companhia = linhas[i_chegada + 1] if i_chegada + 1 < len(linhas) else ""
    companhia = companhia.split("Operado por")[0].strip()
    return {
        "saida": horas[0],
        "chegada": horas[1],
        "companhia": companhia,
        "duracao": next((l for l in linhas if RE_DURACAO.match(l)), ""),
        "paradas": next((l for l in linhas if RE_PARADAS.match(l)), ""),
        "preco": int(preco.group(1).replace(".", "")),
    }


def buscar(origem, destino, ida, volta=None, mostrar_navegador=False):
    with sync_playwright() as p:
        navegador = p.chromium.launch(channel="chrome", headless=not mostrar_navegador)
        pagina = navegador.new_page(locale="pt-BR")
        resultado = buscar_na_pagina(pagina, origem, destino, ida, volta)
        navegador.close()
    return resultado


def buscar_na_pagina(pagina, origem, destino, ida, volta=None):
    """Faz a busca numa página já aberta (permite reaproveitar o navegador em varreduras)."""
    url = montar_url(origem, destino, ida, volta)
    pagina.goto(url, wait_until="domcontentloaded")
    # Aviso de cookies (aparece em alguns casos): recusa os opcionais
    try:
        pagina.get_by_role("button", name=re.compile("Rejeitar tudo|Recusar tudo")).click(timeout=3000)
    except Exception:
        pass
    try:
        pagina.wait_for_selector("li:has-text('R$')", timeout=30000)
    except Exception:
        # Guarda o que a página mostrou (bloqueio, captcha...) para investigar
        try:
            pagina.screenshot(path=str(PASTA / f"falha_{origem}_{destino}.png"), full_page=True)
        except Exception:
            pass
        return [], url
    pagina.wait_for_timeout(2000)
    textos = pagina.locator("li:has-text('R$')").all_inner_texts()

    voos, vistos = [], set()
    for texto in textos:
        voo = ler_voo(texto)
        if not voo:
            continue
        chave = (voo["saida"], voo["chegada"], voo["companhia"], voo["preco"])
        if chave not in vistos:
            vistos.add(chave)
            voos.append(voo)
    return sorted(voos, key=lambda v: v["preco"]), url


def salvar_historico(origem, destino, ida, volta, voos):
    novo = not HISTORICO.exists()
    with HISTORICO.open("a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if novo:
            w.writerow(["data_busca", "origem", "destino", "ida", "volta", "menor_preco", "companhia", "saida"])
        m = voos[0]
        w.writerow([datetime.now().isoformat(timespec="minutes"), origem, destino, ida, volta or "",
                    m["preco"], m["companhia"], m["saida"]])


def main():
    ap = argparse.ArgumentParser(description="Robô de busca de voos (teste)")
    ap.add_argument("origem", help="código do aeroporto, ex.: VIX")
    ap.add_argument("destino", help="código do aeroporto, ex.: SCL")
    ap.add_argument("ida", help="AAAA-MM-DD")
    ap.add_argument("volta", nargs="?", help="AAAA-MM-DD (opcional)")
    ap.add_argument("--alerta", type=int, help="avisa se o menor preço ficar abaixo deste valor (R$)")
    ap.add_argument("--json", action="store_true", help="imprime o resultado em JSON")
    ap.add_argument("--ver", action="store_true", help="mostra o navegador trabalhando")
    a = ap.parse_args()

    voos, url = buscar(a.origem.upper(), a.destino.upper(), a.ida, a.volta, a.ver)
    if not voos:
        print("Nenhum voo encontrado. Confira as datas ou rode com --ver para olhar a página.")
        sys.exit(1)

    salvar_historico(a.origem.upper(), a.destino.upper(), a.ida, a.volta, voos)

    if a.json:
        print(json.dumps({"url": url, "voos": voos}, ensure_ascii=False, indent=2))
    else:
        tipo = "ida e volta" if a.volta else "só ida"
        print(f"\n{a.origem.upper()} → {a.destino.upper()}  |  {a.ida}{' a ' + a.volta if a.volta else ''}  ({tipo})\n")
        for v in voos:
            print(f"  R$ {v['preco']:>6,}".replace(",", ".") +
                  f"  {v['saida']:>7} → {v['chegada']:<7} {v['duracao']:<12} {v['paradas']:<10} {v['companhia']}")
        print(f"\nLink: {url}")

    if a.alerta:
        menor = voos[0]["preco"]
        if menor <= a.alerta:
            print(f"\n*** ALERTA: preço caiu para R$ {menor} (limite R$ {a.alerta}) ***\a")
        else:
            print(f"\nMenor preço R$ {menor}, ainda acima do limite de R$ {a.alerta}.")


if __name__ == "__main__":
    main()
