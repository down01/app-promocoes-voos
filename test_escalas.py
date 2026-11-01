import asyncio

from escalas import buscar_escalas, combinar, escolher_hubs, melhores


def voo(saida, chegada, duracao, preco, companhia="X"):
    return {"saida": saida, "chegada": chegada, "duracao": duracao, "paradas": "Sem escalas",
            "preco": preco, "companhia": companhia, "aeroportos": ""}


def test_conexao_precisa_de_3h_e_atravessa_o_dia():
    ida = [voo("11:25", "17:00", "8h 35 min", 1200, "Arajet")]
    mesmo_dia = [voo("18:00", "23:00", "5h", 900), voo("21:30", "04:10+1", "6h 40 min", 800, "WestJet")]
    dia_seguinte = [voo("08:00", "14:00", "6h", 700)]
    combos = combinar("GRU", "SDQ", "HNL", ida, mesmo_dia, dia_seguinte, "2026-11-19")
    # 18:00 sai só 1h depois de chegar: fora. 21:30 (4h30) e 08:00 do dia seguinte (15h): dentro
    assert sorted(c["preco"] for c in combos) == [1900, 2000]
    c = next(c for c in combos if c["preco"] == 2000)
    assert c["chegada"] == "04:10+1"
    assert c["duracao"] == "19h 45 min"  # 8h35 + 4h30 + 6h40
    assert c["aeroportos"] == "GRU–SDQ–HNL" and c["separado"] is True
    assert c["companhia"] == "Arajet, WestJet"
    amanha = next(c for c in combos if c["preco"] == 1900)
    assert amanha["chegada"] == "14:00+1"
    assert amanha["trechos"][1]["data"] == "2026-11-20"


def test_hubs_no_caminho():
    hubs = escolher_hubs("GRU", "HNL", 8)
    assert "LAX" in hubs and "PTY" in hubs
    assert "LIS" not in hubs  # Europa não fica entre São Paulo e Havaí
    assert escolher_hubs("GRU", "XXX") == []


def test_buscar_escalas_junta_tudo():
    tabela = {("GRU", "PTY", "2026-11-19"): [voo("01:00", "07:00", "7h", 1000)],
              ("PTY", "HNL", "2026-11-19"): [voo("12:00", "18:00", "11h", 1500)]}

    async def falso(pagina, o, d, dia):
        return tabela.get((o, d, dia), [])

    r = asyncio.run(buscar_escalas([None, None], "GRU", "HNL", "2026-11-19", ["PTY"], falso))
    assert [c["preco"] for c in r] == [2500]
    assert melhores(r * 2) == r  # sem repetidos
