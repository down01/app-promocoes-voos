"""Gera site/lib/aeroportos-mundo.json: todos os aeroportos com código IATA, para a busca do site
achar qualquer destino (Honolulu, Bali...). Rode de novo para atualizar:

  pip install airportsdata babel && python ferramentas/gerar_aeroportos_mundo.py
"""
import json
from pathlib import Path

import airportsdata
from babel import Locale

PAISES = Locale("pt", "BR").territories
SAIDA = Path(__file__).resolve().parent.parent / "site" / "lib" / "aeroportos-mundo.json"

linhas = []
for codigo, a in sorted(airportsdata.load("IATA").items()):
    if not a["city"] or len(codigo) != 3:
        continue
    pais = PAISES.get(a["country"], a["country"])
    # [código, cidade, nome do aeroporto, país, estado/província]
    linhas.append([codigo, a["city"], a["name"], pais, a["subd"] or ""])

SAIDA.write_text(json.dumps(linhas, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{len(linhas)} aeroportos em {SAIDA} ({SAIDA.stat().st_size // 1024} KB)")
