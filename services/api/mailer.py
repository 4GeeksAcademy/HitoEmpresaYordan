import json
import logging
import os
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)


def send_password_reset_email(email: str, token: str) -> None:
    try:
        api_key = os.environ["RESEND_API_KEY"]
        sender = os.environ["RESEND_FROM_EMAIL"]
        base_url = os.environ["APP_BASE_URL"].rstrip("/")
        parsed_url = urlsplit(base_url)
        if (
            parsed_url.scheme not in {"http", "https"}
            or not parsed_url.netloc
            or parsed_url.query
            or parsed_url.fragment
        ):
            raise ValueError("APP_BASE_URL invalida")
        reset_url = f"{base_url}/reset-password?{urlencode({'token': token})}"
        payload = {
            "from": sender,
            "to": [email],
            "subject": "Restablecer tu contrasena",
            "text": (
                "Para restablecer tu contrasena, abre este enlace:\n"
                f"{reset_url}\n\n"
                "El enlace caduca en 30 minutos y solo puede utilizarse una vez.\n"
                "Si no lo solicitaste, ignora este correo."
            ),
        }
        request = Request(
            "https://api.resend.com/emails",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Nexova-API/1.0",
            },
            method="POST",
        )
        with urlopen(request, timeout=10) as response:
            response.read()
    except Exception:
        logger.error("No se pudo enviar el correo de recuperacion de contrasena")