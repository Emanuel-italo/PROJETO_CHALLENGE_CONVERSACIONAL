"""Envio de e-mail com três provedores intercambiáveis.

- ``console``: apenas registra no log. É o padrão, para rodar sem credencial.
- ``smtp``   : SMTP autenticado (Gmail com senha de app, Outlook, etc.).
- ``resend`` : API HTTP do Resend, útil quando o host bloqueia portas SMTP.

Nenhuma credencial vive no código: tudo vem de variável de ambiente.
"""

from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage

import httpx

from .config import settings

logger = logging.getLogger(__name__)


class EmailError(RuntimeError):
    pass


def _enviar_smtp(destino: str, assunto: str, html: str, texto: str) -> str:
    if not settings.smtp_user or not settings.smtp_password:
        raise EmailError("SMTP_USER e SMTP_PASSWORD não configurados.")

    mensagem = EmailMessage()
    mensagem["From"] = settings.email_from
    mensagem["To"] = destino
    mensagem["Subject"] = assunto

    if settings.email_reply_to:
        mensagem["Reply-To"] = settings.email_reply_to

    mensagem.set_content(texto)
    mensagem.add_alternative(html, subtype="html")

    contexto = ssl.create_default_context()

    try:
        if settings.smtp_use_tls:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
                smtp.starttls(context=contexto)
                smtp.login(settings.smtp_user, settings.smtp_password)
                smtp.send_message(mensagem)
        else:
            with smtplib.SMTP_SSL(
                settings.smtp_host, settings.smtp_port, context=contexto, timeout=30
            ) as smtp:
                smtp.login(settings.smtp_user, settings.smtp_password)
                smtp.send_message(mensagem)
    except (smtplib.SMTPException, OSError) as exc:
        raise EmailError(f"Falha no envio SMTP: {exc}") from exc

    return "smtp"


def _enviar_resend(destino: str, assunto: str, html: str, texto: str) -> str:
    if not settings.resend_api_key:
        raise EmailError("RESEND_API_KEY não configurada.")

    try:
        resposta = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.email_from,
                "to": [destino],
                "subject": assunto,
                "html": html,
                "text": texto,
            },
            timeout=30,
        )
        resposta.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise EmailError(
            f"Resend retornou {exc.response.status_code}: {exc.response.text[:200]}"
        ) from exc
    except httpx.HTTPError as exc:
        raise EmailError(f"Falha de comunicação com o Resend: {exc}") from exc

    return "resend"


def enviar(destino: str, assunto: str, html: str, texto: str) -> str:
    """Envia e devolve o provedor usado. Levanta EmailError em caso de falha."""
    provedor = settings.email_provider.strip().lower()

    if settings.rpa_dry_run or provedor == "console":
        logger.info(
            "[RPA][console] e-mail NÃO enviado (modo simulado)\n"
            "Para: %s\nAssunto: %s\n%s",
            destino,
            assunto,
            texto,
        )
        return "console"

    if provedor == "smtp":
        return _enviar_smtp(destino, assunto, html, texto)

    if provedor == "resend":
        return _enviar_resend(destino, assunto, html, texto)

    raise EmailError(f"EMAIL_PROVIDER desconhecido: {settings.email_provider}")
