"""Busca voos de uma origem para os principais aeroportos do Brasil, todas as companhias.

Exemplo:
  python varredura_brasil.py VIX 2027-04-29 2027-05-07
"""
import argparse
import csv
import random
from pathlib import Path

from playwright.sync_api import sync_playwright

from robo_voos import buscar_na_pagina

PASTA = Path(__file__).parent

AEROPORTOS = {
    "BSB": "Brasília", "GRU": "São Paulo (Guarulhos)", "CGH": "São Paulo (Congonhas)",
    "VCP": "Campinas", "GIG": "Rio (Galeão)", "SDU": "Rio (Santos Dumont)",
    "CNF": "Belo Horizonte (Confins)", "SSA": "Salvador", "REC": "Recife",
    "FOR": "Fortaleza", "POA": "Porto Alegre", "CWB": "Curitiba",
    "FLN": "Florianópolis", "BEL": "Belém", "MAO": "Manaus", "GYN": "Goiânia",
    "CGB": "Cuiabá", "CGR": "Campo Grande", "NAT": "Natal", "MCZ": "Maceió",
    "JPA": "João Pessoa", "AJU": "Aracaju", "THE": "Teresina", "SLZ": "São Luís",
    "PMW": "Palmas", "PVH": "Porto Velho", "RBR": "Rio Branco", "BVB": "Boa Vista",
    "MCP": "Macapá", "IGU": "Foz do Iguaçu", "NVT": "Navegantes", "LDB": "Londrina",
    "UDI": "Uberlândia", "IOS": "Ilhéus", "BPS": "Porto Seguro", "JDO": "Juazeiro do Norte",
    "MOC": "Montes Claros", "RAO": "Ribeirão Preto", "SJP": "São José do Rio Preto",
    "MGF": "Maringá", "JOI": "Joinville", "XAP": "Chapecó", "STM": "Santarém",
    "IMP": "Imperatriz", "FEN": "Fernando de Noronha",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("origem")
    ap.add_argument("ida")
    ap.add_argument("volta", nargs="?")
    a = ap.parse_args()
    origem = a.origem.upper()

    linhas, falhas = [], []
    with sync_playwright() as p:
        navegador = p.chromium.launch(channel="chrome", headless=True)
        pagina = navegador.new_page(locale="pt-BR")
        destinos = [d for d in AEROPORTOS if d != origem]
        for n, destino in enumerate(destinos, 1):
            voos, url = buscar_na_pagina(pagina, origem, destino, a.ida, a.volta)
            if not voos:
                falhas.append(destino)
                print(f"[{n}/{len(destinos)}] {destino}: sem resultado", flush=True)
            else:
                print(f"[{n}/{len(destinos)}] {destino}: {len(voos)} voos, a partir de R$ {voos[0]['preco']}", flush=True)
                for v in voos:
                    linhas.append({"destino": destino, "cidade": AEROPORTOS[destino], **v, "link": url})
            pagina.wait_for_timeout(random.randint(1500, 3500))  # pausa para não sobrecarregar o Google
        navegador.close()

    saida = PASTA / f"varredura_{origem}_{a.ida}{'_' + a.volta if a.volta else ''}.csv"
    with saida.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=["destino", "cidade", "companhia", "preco", "saida", "chegada",
                                          "duracao", "paradas", "link"], delimiter=";")
        w.writeheader()
        w.writerows(linhas)
    print(f"\nSalvo em {saida.name} ({len(linhas)} voos). Sem resultado: {', '.join(falhas) or 'nenhum'}")


if __name__ == "__main__":
    main()
