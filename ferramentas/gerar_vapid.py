"""Gera o par de chaves VAPID das notificações no celular.

  python ferramentas/gerar_vapid.py chaves-vapid.local.txt

A chave privada vai só para o arquivo indicado (nunca é impressa); a pública é impressa.
"""
import base64
import sys
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec

destino = Path(sys.argv[1])
chave = ec.generate_private_key(ec.SECP256R1())
privada = chave.private_numbers().private_value.to_bytes(32, "big")
publica = chave.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)


def b64(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


destino.write_text(
    "Chaves das notificações no celular (VAPID). NÃO envie este arquivo para o GitHub.\n\n"
    f"VAPID_PRIVATE_KEY (vai nos secrets do GitHub):\n{b64(privada)}\n\n"
    f"NEXT_PUBLIC_VAPID_PUBLIC_KEY (pública, vai no Vercel):\n{b64(publica)}\n",
    encoding="utf-8",
)
print(b64(publica))
