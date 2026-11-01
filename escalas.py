"""Bilhetes separados: monta viagens com conexão juntando dois voos que não são vendidos juntos.

O Google Voos só mostra voos vendidos num bilhete só. Sites como o Skyscanner também mostram
combinações de companhias diferentes ("escala não vinculada"), às vezes bem mais baratas.
Aqui o robô faz o mesmo: busca origem → cidade de conexão e cidade de conexão → destino
(no mesmo dia e no dia seguinte) e junta os pares com tempo seguro para trocar de voo.

  python escalas.py GRU HNL 2026-11-19            (mostra as melhores combinações)
  python escalas.py GRU HNL 2026-11-19 --hubs 8
"""
import argparse
import asyncio
import math
import re
from datetime import date, timedelta

import airportsdata

AEROPORTOS = airportsdata.load("IATA")

# Aeroportos grandes onde dá para fazer conexão com companhias diferentes (inclui as low cost)
HUBS = [
    # América do Sul e Central, Caribe, México
    "GRU", "GIG", "BSB", "REC", "FOR", "SCL", "EZE", "LIM", "BOG", "MDE", "UIO", "PTY", "SJO",
    "SDQ", "PUJ", "CUN", "MEX", "GDL", "TIJ", "SAL", "GUA",
    # América do Norte
    "MIA", "FLL", "MCO", "ATL", "IAH", "DFW", "JFK", "EWR", "ORD", "LAX", "SFO", "SEA", "LAS",
    "YYZ", "YUL", "YVR", "YYC",
    # Europa, África, Oriente Médio
    "LIS", "OPO", "MAD", "BCN", "CDG", "LHR", "AMS", "FRA", "FCO", "MXP", "IST", "ADD", "CMN",
    "JNB", "DXB", "DOH", "AUH",
    # Ásia e Oceania
    "DEL", "BOM", "SIN", "BKK", "KUL", "HKG", "ICN", "NRT", "HND", "TPE", "MNL", "SYD", "AKL",
]

# As maiores conexões (muitas companhias, inclusive low cost) são testadas antes das outras
PRINCIPAIS = {
    "GRU", "SCL", "EZE", "LIM", "BOG", "PTY", "SDQ", "CUN", "MEX", "MIA", "FLL", "ATL", "DFW", "IAH",
    "JFK", "LAX", "SFO", "SEA", "YYZ", "YVR", "YYC", "LIS", "MAD", "CDG", "LHR", "AMS", "FRA", "IST", "ADD",
    "DXB", "DOH", "SIN", "BKK", "HKG", "ICN", "NRT", "SYD",
}

CONEXAO_MIN = 180  # minutos: bilhete separado exige pegar a mala e fazer check-in de novo
CONEXAO_MAX = 20 * 60


def distancia(a, b):
    """Distância em km entre dois aeroportos (círculo máximo)."""
    p, q = AEROPORTOS[a], AEROPORTOS[b]
    la1, lo1, la2, lo2 = map(math.radians, (p["lat"], p["lon"], q["lat"], q["lon"]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


DISTANCIA_MINIMA = 3000  # km: em viagens curtas a conexão separada quase nunca compensa


def vale_tentar(origem, destino):
    return origem in AEROPORTOS and destino in AEROPORTOS and distancia(origem, destino) >= DISTANCIA_MINIMA


def escolher_hubs(origem, destino, quantidade=10, desvio=1.35):
    """Conexões no caminho: as que menos aumentam a distância total (até 35% a mais)."""
    if origem not in AEROPORTOS or destino not in AEROPORTOS:
        return []
    direto = distancia(origem, destino)
    candidatos = []
    for h in HUBS:
        if h in (origem, destino) or h not in AEROPORTOS:
            continue
        ida, resto = distancia(origem, h), distancia(h, destino)
        # Conexão colada na origem ou no destino não ajuda (ex.: GRU → GIG → ...)
        if min(ida, resto) < 400:
            continue
        total = ida + resto
        if total <= direto * desvio:
            candidatos.append((h not in PRINCIPAIS, total / direto, h))
    # Primeiro a melhor de cada região, depois a segunda: assim caminhos diferentes (pelo Canadá,
    # pelo Caribe, pelos EUA...) são testados antes de duas conexões quase iguais
    ordem = [h for *_, h in sorted(candidatos)]
    escolhidos, vistas = [], set()
    for rodada in range(2):
        for h in ordem:
            r = regiao(h)
            if h in escolhidos or (rodada == 0 and r in vistas):
                continue
            if rodada == 0 or sum(regiao(x) == r for x in escolhidos) < 2:
                escolhidos.append(h)
                vistas.add(r)
    return escolhidos[:quantidade]


REGIOES = {
    "BR": "brasil", "AR": "sul", "CL": "sul", "UY": "sul", "PY": "sul", "PE": "andes", "CO": "andes",
    "EC": "andes", "BO": "andes", "PA": "central", "CR": "central", "SV": "central", "GT": "central",
    "DO": "caribe", "CU": "caribe", "MX": "mexico", "US": "eua", "CA": "canada", "PT": "iberia",
    "ES": "iberia", "MA": "iberia", "FR": "europa", "GB": "europa", "NL": "europa", "DE": "europa",
    "IT": "europa", "TR": "oriente", "AE": "oriente", "QA": "oriente", "ET": "africa", "ZA": "africa",
    "IN": "asia-sul", "SG": "asia", "TH": "asia", "MY": "asia", "HK": "asia-leste", "KR": "asia-leste",
    "JP": "asia-leste", "TW": "asia-leste", "PH": "asia", "AU": "oceania", "NZ": "oceania",
}


def regiao(codigo):
    pais = AEROPORTOS[codigo]["country"]
    # EUA e Canadá são grandes: leste e oeste são caminhos diferentes
    if pais in ("US", "CA"):
        return pais + ("-oeste" if AEROPORTOS[codigo]["lon"] < -100 else "-leste")
    return REGIOES.get(pais, pais)


RE_HORA = re.compile(r"(\d{1,2}):(\d{2})(?:\+(\d))?")
RE_DURACAO = re.compile(r"(?:(\d+)\s?h)?\s?(?:(\d+)\s?min)?")


def minutos(hora, dia=0):
    """'14:27+1' → minutos desde 0h do dia do voo (+dia para voos que saem no dia seguinte)."""
    m = RE_HORA.fullmatch(hora.strip())
    if not m:
        return None
    return int(m.group(1)) * 60 + int(m.group(2)) + (int(m.group(3) or 0) + dia) * 1440


def duracao_min(texto):
    m = RE_DURACAO.fullmatch(texto.strip()) if texto else None
    if not m or not any(m.groups()):
        return None
    return int(m.group(1) or 0) * 60 + int(m.group(2) or 0)


def formatar_duracao(total):
    return f"{total // 60}h {total % 60} min" if total % 60 else f"{total // 60}h"


def formatar_hora(total):
    """Minutos desde 0h do dia da partida → '20:35+2'."""
    dias, resto = divmod(total, 1440)
    return f"{resto // 60:02d}:{resto % 60:02d}" + (f"+{dias}" if dias else "")


def combinar(origem, hub, destino, primeiros, segundos_d0, segundos_d1, data_ida):
    """Junta voos origem→hub com hub→destino (no dia da ida ou no seguinte).
    Os horários de chegada no hub e de saída do hub estão no mesmo fuso (o do hub)."""
    combos = []
    for v1 in primeiros:
        chegada_hub = minutos(v1["chegada"])
        if chegada_hub is None:
            continue
        for dia, segundos in ((0, segundos_d0), (1, segundos_d1)):
            for v2 in segundos:
                saida_hub = minutos(v2["saida"], dia)
                chegada_final = minutos(v2["chegada"], dia)
                if saida_hub is None or chegada_final is None:
                    continue
                conexao = saida_hub - chegada_hub
                if not CONEXAO_MIN <= conexao <= CONEXAO_MAX:
                    continue
                d1, d2 = duracao_min(v1["duracao"]), duracao_min(v2["duracao"])
                total = d1 + conexao + d2 if d1 is not None and d2 is not None else None
                # Chegada na hora local do destino; os dias contam a partir do dia da partida
                dias_chegada = chegada_final // 1440
                hora_chegada = formatar_hora(chegada_final % 1440)
                combos.append({
                    "saida": v1["saida"],
                    "chegada": hora_chegada + (f"+{dias_chegada}" if dias_chegada else ""),
                    "companhia": juntar_companhias(v1["companhia"], v2["companhia"]),
                    "duracao": formatar_duracao(total) if total is not None else "",
                    "paradas": f"Conexão em {hub} ({formatar_duracao(conexao)})",
                    "preco": v1["preco"] + v2["preco"],
                    "aeroportos": f"{origem}–{hub}–{destino}",
                    "separado": True,
                    "trechos": [
                        {**v1, "origem": origem, "destino": hub, "data": data_ida},
                        {**v2, "origem": hub, "destino": destino,
                         "data": (date.fromisoformat(data_ida) + timedelta(days=dia)).isoformat()},
                    ],
                })
    return combos


def juntar_companhias(a, b):
    from robo_voos import separar_companhias  # "WestJetDelta" → "WestJet, Delta"
    nomes = [n.strip() for n in separar_companhias(f"{a}, {b}").split(",") if n.strip()]
    return ", ".join(dict.fromkeys(nomes))


def melhores(combos, limite=10):
    """Mais baratas primeiro, sem repetir o mesmo par de voos, no máximo 3 por conexão."""
    vistos, por_hub, saida = set(), {}, []
    for c in sorted(combos, key=lambda c: (c["preco"], duracao_min(c["duracao"]) or 10**6)):
        chave = (c["saida"], c["chegada"], c["companhia"], c["aeroportos"])
        hub = c["aeroportos"].split("–")[1]
        if chave in vistos or por_hub.get(hub, 0) >= 3:
            continue
        vistos.add(chave)
        por_hub[hub] = por_hub.get(hub, 0) + 1
        saida.append(c)
        if len(saida) == limite:
            break
    return saida


async def buscar_escalas(paginas, origem, destino, data_ida, hubs=None, buscar=None):
    """Busca os trechos de cada conexão em várias abas e devolve as melhores combinações.
    buscar(pagina, origem, destino, data) → lista de voos (injetável para teste)."""
    if buscar is None:
        from robo_voos import buscar_na_pagina_async

        async def buscar(pagina, o, d, dia):
            voos, _ = await buscar_na_pagina_async(pagina, o, d, dia)
            return voos

    hubs = hubs if hubs is not None else escolher_hubs(origem, destino)
    dia_seguinte = (date.fromisoformat(data_ida) + timedelta(days=1)).isoformat()
    tarefas = [(h, o, d, dia) for h in hubs
               for (o, d, dia) in ((origem, h, data_ida), (h, destino, data_ida), (h, destino, dia_seguinte))]
    resultados = {}
    fila = asyncio.Queue()
    for t in tarefas:
        fila.put_nowait(t)

    async def aba(pagina):
        while not fila.empty():
            h, o, d, dia = fila.get_nowait()
            try:
                resultados[(o, d, dia)] = await buscar(pagina, o, d, dia)
            except Exception as e:  # um trecho com problema não derruba os outros
                print(f"  escalas: erro em {o}→{d} {dia}: {type(e).__name__}", flush=True)
                resultados[(o, d, dia)] = []

    await asyncio.gather(*(aba(p) for p in paginas))
    combos = []
    for h in hubs:
        combos += combinar(origem, h, destino, resultados.get((origem, h, data_ida), []),
                           resultados.get((h, destino, data_ida), []),
                           resultados.get((h, destino, dia_seguinte), []), data_ida)
    return melhores(combos)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("origem")
    ap.add_argument("destino")
    ap.add_argument("ida")
    ap.add_argument("--hubs", type=int, default=10)
    ap.add_argument("--abas", type=int, default=4)
    ap.add_argument("--lista", help="conexões a testar, separadas por vírgula (ex.: SDQ,YVR)")
    a = ap.parse_args()
    origem, destino = a.origem.upper(), a.destino.upper()
    hubs = a.lista.upper().split(",") if a.lista else escolher_hubs(origem, destino, a.hubs)
    print(f"Conexões testadas: {', '.join(hubs) or 'nenhuma'}", flush=True)

    async def rodar():
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            nav = await p.chromium.launch(channel="chrome", headless=True)
            ctx = await nav.new_context(locale="pt-BR")
            paginas = [await ctx.new_page() for _ in range(a.abas)]
            r = await buscar_escalas(paginas, origem, destino, a.ida, hubs)
            await nav.close()
            return r

    for c in asyncio.run(rodar()):
        print(f"  R$ {c['preco']:>6}  {c['saida']:>6} → {c['chegada']:<8} {c['duracao']:<12} "
              f"{c['aeroportos']:<14} {c['paradas']:<28} {c['companhia']}")


if __name__ == "__main__":
    main()
