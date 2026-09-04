import logging
from datetime import datetime
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def enviar_resumen_licitacion(
    cliente_email: str,
    cliente_nombre: str,
    licitacion: dict[str, Any],
    productos: list[dict[str, Any]],
    archivo: bytes,
    nombre_archivo: str,
    tipo_contenido: str,
) -> None:
    settings = get_settings()
    if not all(
        (
            settings.mailgun_api_key,
            settings.mailgun_domain,
            settings.mailgun_from_email,
        )
    ):
        logger.warning(
            "Mailgun no está configurado; no se envió el correo de la licitación %s",
            licitacion["id"],
        )
        return

    filas_productos = "".join(
        f"<tr><td>{producto['nombre']}</td>"
        f"<td>{producto['cantidad']}</td>"
        f"<td>${producto['precio']:.2f}</td>"
        f"<td>${producto['cantidad'] * producto['precio']:.2f}</td></tr>"
        for producto in productos
    )
    total_productos = sum(
        producto["cantidad"] * producto["precio"] for producto in productos
    )
    fecha_limite = licitacion["fecha_limite"]
    if isinstance(fecha_limite, datetime):
        fecha_limite = fecha_limite.isoformat()

    asunto = f"Asociados SA Licitación #{licitacion['id']}"
    texto = (
        f"Hola {cliente_nombre},\n\n"
        f"Se ha creado la licitación #{licitacion['id']}.\n"
        f"Presupuesto máximo: ${licitacion['presupuesto_maximo']:.2f}\n"
        f"Fecha límite: {fecha_limite}\n"
        f"Total de productos: ${total_productos:.2f}\n"
        f"El documento de propuesta se encuentra adjunto."
    )
    html = f"""
    <h2>Nueva licitación #{licitacion['id']}</h2>
    <p>Hola {cliente_nombre}, esperamos que se encuentren bien,</p>
    <p>Se ha creado una nueva licitación para ustedes con la siguiente información:</p>
    <ul>
      <li><strong>Presupuesto máximo:</strong> ${licitacion['presupuesto_maximo']:.2f}</li>
      <li><strong>Fecha límite:</strong> {fecha_limite}</li>
      <li><strong>Total de productos:</strong> ${total_productos:.2f}</li>
    </ul>
    <table border="1" cellpadding="6" cellspacing="0">
      <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
      <tbody>{filas_productos}</tbody>
    </table>
    <p>El documento de propuesta se encuentra adjunto.</p>
    <p>Cualquier consulta estamos a la orden.</p>
    <p>Saludos cordiales,</p>
    """

    url = f"https://api.mailgun.net/v3/{settings.mailgun_domain}/messages"
    response = httpx.post(
        url,
        auth=("api", settings.mailgun_api_key),
        data={
            "from": settings.mailgun_from_email,
            "to": cliente_email,
            "subject": asunto,
            "text": texto,
            "html": html,
        },
        files={
            "attachment": (
                nombre_archivo,
                archivo,
                tipo_contenido or "application/octet-stream",
            )
        },
        timeout=30.0,
    )
    if response.is_error:
        logger.error(
            "Mailgun rechazó el correo de la licitación %s: %s - %s",
            licitacion["id"],
            response.status_code,
            response.text,
        )
        raise RuntimeError(
            f"Mailgun rechazó el correo ({response.status_code}): {response.text}"
        )
    logger.info("Correo de licitación %s enviado a %s", licitacion["id"], cliente_email)
