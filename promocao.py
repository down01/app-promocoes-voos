"""Regras para decidir quando um preço é promoção e quando vale avisar de novo."""
from statistics import median

# Sem limite definido pela pessoa: promoção = pelo menos 15% abaixo da mediana recente
DESCONTO_AUTOMATICO = 0.15
MINIMO_AMOSTRAS = 4
# Já avisou? Só avisa de novo se o preço cair mais 3% (evita repetir o mesmo aviso a cada 6h)
QUEDA_PARA_REAVISAR = 0.03


def eh_promocao(preco, limite=None, historico=()):
    """Retorna (é_promoção, preço_de_referência).

    historico: preços anteriores da mesma rota (sem o preço atual).
    """
    if limite is not None:
        return preco <= limite, limite
    if len(historico) < MINIMO_AMOSTRAS:
        return False, None
    referencia = median(historico)
    return preco <= referencia * (1 - DESCONTO_AUTOMATICO), round(referencia)


def deve_avisar(preco, ultimo_preco_avisado=None):
    if ultimo_preco_avisado is None:
        return True
    return preco <= ultimo_preco_avisado * (1 - QUEDA_PARA_REAVISAR)
