"""Aeroportos usados na atualização geral. Mantenha em sincronia com site/lib/aeroportos.ts."""

BRASIL = [
    "VIX", "BSB", "GRU", "CGH", "VCP", "GIG", "SDU", "CNF", "SSA", "REC", "FOR", "POA", "CWB", "FLN",
    "BEL", "MAO", "GYN", "CGB", "CGR", "NAT", "MCZ", "JPA", "AJU", "THE", "SLZ", "PMW", "PVH", "RBR",
    "BVB", "MCP", "IGU", "NVT", "LDB", "UDI", "IOS", "BPS", "JDO", "MOC", "RAO", "SJP", "MGF", "JOI",
    "XAP", "STM", "IMP",
]

# Aeroportos brasileiros com voos internacionais: ponto de partida/chegada das rotas para fora
PORTAS_INTERNACIONAIS = [
    "GRU", "GIG", "VCP", "BSB", "CNF", "SSA", "REC", "FOR", "POA", "CWB", "FLN", "MAO", "BEL", "NAT", "VIX",
]

INTERNACIONAL = [
    "SCL", "EZE", "AEP", "MVD", "ASU", "LIM", "BOG", "MDE", "CTG", "UIO", "LPB", "VVI", "BRC", "MDZ",
    "PTY", "CUN", "MEX", "PUJ", "AUA", "CUR",
    "MIA", "MCO", "FLL", "JFK", "EWR", "LAX", "ORD", "ATL", "IAH", "BOS", "YYZ",
    "LIS", "OPO", "MAD", "BCN", "CDG", "LHR", "FCO", "MXP", "FRA", "MUC", "AMS", "ZRH", "DUB", "IST",
    "DXB", "DOH", "JNB", "CPT", "NRT", "SYD",
]


def rotas(escopo):
    """Pares (origem, destino) da atualização geral."""
    if escopo == "nacional":
        return [(o, d) for o in BRASIL for d in BRASIL if o != d]
    if escopo == "internacional":
        ida = [(o, d) for o in PORTAS_INTERNACIONAIS for d in INTERNACIONAL]
        return ida + [(d, o) for o, d in ida]  # e a volta para o Brasil
    raise ValueError(escopo)
