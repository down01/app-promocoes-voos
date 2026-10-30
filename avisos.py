"""Envio dos avisos de promoção. Cada canal só funciona se a chave dele estiver configurada."""
import json
import os

import requests

NOMES_TRECHO = {"ida_volta": "ida e volta", "ida": "só a ida", "volta": "só a volta"}


def montar_mensagem(trecho, rota, preco, referencia, voo, link):
    data = rota["data_ida"] if trecho != "volta" else rota["data_volta"]
    origem, destino = (rota["origem"], rota["destino"]) if trecho != "volta" else (rota["destino"], rota["origem"])
    datas = f"{rota['data_ida']} a {rota['data_volta']}" if trecho == "ida_volta" else data
    titulo = f"Promoção em {NOMES_TRECHO[trecho]}: {origem} → {destino} por R$ {preco:,}".replace(",", ".")
    linhas = [titulo, f"Data: {datas}"]
    if referencia:
        linhas.append(f"Referência: R$ {referencia:,}".replace(",", "."))
    if voo:
        linhas.append(f"{voo.get('companhia', '')} · sai {voo.get('saida', '')} · {voo.get('paradas', '')}")
    linhas.append(link)
    return titulo, "\n".join(linhas)


def enviar_email(para, titulo, texto):
    chave = os.environ.get("RESEND_API_KEY")
    if not chave or not para:
        return False
    r = requests.post("https://api.resend.com/emails", timeout=20,
                      headers={"Authorization": f"Bearer {chave}"},
                      json={"from": os.environ.get("EMAIL_REMETENTE", "Promoções de Voos <onboarding@resend.dev>"),
                            "to": [para], "subject": titulo, "text": texto})
    return r.ok


def enviar_telegram(chat_id, texto):
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token or not chat_id:
        return False
    r = requests.post(f"https://api.telegram.org/bot{token}/sendMessage", timeout=20,
                      json={"chat_id": chat_id, "text": texto, "disable_web_page_preview": True})
    return r.ok


def enviar_push(assinatura, titulo, texto, link):
    chave = os.environ.get("VAPID_PRIVATE_KEY")
    if not chave:
        return False
    from pywebpush import WebPushException, webpush
    try:
        webpush(
            subscription_info={"endpoint": assinatura["endpoint"],
                               "keys": {"p256dh": assinatura["p256dh"], "auth": assinatura["auth"]}},
            data=json.dumps({"titulo": titulo, "texto": texto, "link": link}),
            vapid_private_key=chave,
            vapid_claims={"sub": os.environ.get("VAPID_SUBJECT", "mailto:avisos@example.com")},
        )
        return True
    except WebPushException:
        return False
