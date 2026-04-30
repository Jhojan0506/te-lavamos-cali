/**
 * whatsapp.js — utilidades para enviar mensajes por WhatsApp.
 *
 * Soporta dos modos:
 *   - "link"  : devuelve una URL wa.me (no requiere API). El frontend la abre.
 *   - "cloud" : envía el mensaje real usando WhatsApp Cloud API (Meta).
 */
const fetch = require("node-fetch");

const MODE = (process.env.WHATSAPP_MODE || "link").toLowerCase();
const NUMERO_NEGOCIO = (process.env.NUMERO_NEGOCIO || "").replace(/\D/g, "");

function construirMensaje(data) {
  return (
`Hola, quiero agendar un servicio:
*Nombre:* ${data.nombre}
*Dirección:* ${data.direccion}
*Teléfono:* ${data.telefono}
*Servicio:* ${data.servicio}
*Detalles:* ${data.detalles || "—"}`
  );
}

function buildLink(data) {
  const texto = encodeURIComponent(construirMensaje(data));
  return `https://wa.me/${NUMERO_NEGOCIO}?text=${texto}`;
}

/**
 * Envía mensaje al NEGOCIO usando una plantilla aprobada en Meta.
 * Las plantillas son obligatorias cuando inicias conversación con un usuario
 * fuera de la ventana de 24h (caso típico de notificaciones).
 *
 * Plantilla esperada (créala en business.facebook.com → WhatsApp Manager):
 *   Nombre: nueva_solicitud
 *   Idioma: es_CO  (o es)
 *   Cuerpo con 5 variables:
 *     "Nueva solicitud:
 *      Nombre: {{1}}
 *      Tel: {{2}}
 *      Dirección: {{3}}
 *      Servicio: {{4}}
 *      Detalles: {{5}}"
 */
async function sendCloudTemplate(data) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE || "nueva_solicitud";
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || "es_CO";

  if (!token || !phoneId) throw new Error("Falta WHATSAPP_TOKEN o WHATSAPP_PHONE_ID");
  if (!NUMERO_NEGOCIO) throw new Error("Falta NUMERO_NEGOCIO");

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to: NUMERO_NEGOCIO,
    type: "template",
    template: {
      name: templateName,
      language: { code: lang },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: data.nombre },
            { type: "text", text: data.telefono },
            { type: "text", text: data.direccion },
            { type: "text", text: data.servicio },
            { type: "text", text: data.detalles || "Sin detalles" },
          ],
        },
      ],
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `HTTP ${res.status}`;
    throw new Error(`WhatsApp Cloud API: ${msg}`);
  }
  return json;
}

async function notificar(data) {
  if (MODE === "cloud") {
    try {
      const r = await sendCloudTemplate(data);
      return {
        mode: "cloud",
        status: "sent",
        messageId: r?.messages?.[0]?.id || null,
        link: buildLink(data), // por si el frontend también quiere abrirlo
      };
    } catch (err) {
      // Si falla la API, devolvemos al menos el link como respaldo
      return { mode: "cloud", status: "failed", error: err.message, link: buildLink(data) };
    }
  }
  // Modo link (default)
  return { mode: "link", status: "link", link: buildLink(data) };
}

module.exports = { notificar, construirMensaje, buildLink };
