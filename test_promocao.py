from avisos import montar_mensagem
from promocao import deve_avisar, eh_promocao


def test_limite_da_pessoa():
    assert eh_promocao(1900, limite=2000) == (True, 2000)
    assert eh_promocao(2100, limite=2000) == (False, 2000)


def test_automatico_precisa_de_historico():
    assert eh_promocao(500, historico=[1000, 1000]) == (False, None)


def test_automatico_15_por_cento_abaixo_da_mediana():
    hist = [1000, 1050, 980, 1020]
    assert eh_promocao(850, historico=hist)[0] is True
    assert eh_promocao(900, historico=hist)[0] is False


def test_nao_repete_aviso_sem_nova_queda():
    assert deve_avisar(900) is True
    assert deve_avisar(900, ultimo_preco_avisado=900) is False
    assert deve_avisar(870, ultimo_preco_avisado=900) is True


def test_mensagem_da_volta_inverte_a_rota():
    rota = {"origem": "VIX", "destino": "SCL", "data_ida": "2027-04-29", "data_volta": "2027-05-07"}
    titulo, texto = montar_mensagem("volta", rota, 1208, 1500, {"companhia": "LATAM", "saida": "07:35",
                                                                "paradas": "1 parada"}, "https://x")
    assert titulo == "Promoção em só a volta: SCL → VIX por R$ 1.208"
    assert "2027-05-07" in texto and "R$ 1.500" in texto
