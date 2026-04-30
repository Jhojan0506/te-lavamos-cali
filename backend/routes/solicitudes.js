/**
 * routes/solicitudes.js
 * POST /api/solicitudes  → recibe el formulario, guarda en DB, notifica WhatsApp.
 * GET  /api/solicitudes  → lista (protegido por header x-admin-token).
 */
const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { notificar } = require("../whatsapp");

const router = express.Router();

// Validación estricta del formulario
const SolicitudSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  telefono: z.string().trim().min(7).max(20).regex(/^[0-9 +()-]+$/, "Teléfono inválido"),
  direccion: z.string().trim().min(5).max(200),
  servicio: z.string().trim().min(2).max(80),
  detalles: z.string().trim().max(1000).optional().or(z.literal("")),
  // Anti-bot honeypot: el frontend NO debe rellenarlo
  website: z.string().max(0).optional(),
});

router.post("/", async (req, res) => {
  const parsed = SolicitudSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Datos inválidos",
      detalles: parsed.error.flatten().fieldErrors,
    });
  }
  const data = parsed.data;
  if (data.website) {
    // Bot detectado — fingimos éxito sin guardar
    return res.json({ ok: true });
  }

  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.ip;
  const ua = req.headers["user-agent"] || null;

  // 1) Guardar en DB
  let id;
  try {
    const stmt = db.prepare(`
      INSERT INTO solicitudes (nombre, telefono, direccion, servicio, detalles, ip, user_agent)
      VALUES (@nombre, @telefono, @direccion, @servicio, @detalles, @ip, @ua)
    `);
    const info = stmt.run({
      nombre: data.nombre,
      telefono: data.telefono,
      direccion: data.direccion,
      servicio: data.servicio,
      detalles: data.detalles || null,
      ip,
      ua,
    });
    id = info.lastInsertRowid;
  } catch (err) {
    console.error("DB insert error:", err);
    return res.status(500).json({ ok: false, error: "No se pudo guardar la solicitud" });
  }

  // 2) Notificar al negocio por WhatsApp
  const result = await notificar(data);

  try {
    db.prepare(
      `UPDATE solicitudes SET whatsapp_status = ?, whatsapp_error = ? WHERE id = ?`
    ).run(result.status, result.error || null, id);
  } catch (e) {
    console.error("DB update error:", e);
  }

  return res.json({
    ok: true,
    id,
    whatsapp: { mode: result.mode, status: result.status, link: result.link },
  });
});

// Endpoint admin protegido por token simple (configura ADMIN_TOKEN en .env si lo usas)
router.get("/", (req, res) => {
  const token = req.headers["x-admin-token"];
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: "No autorizado" });
  }
  const rows = db
    .prepare(`SELECT * FROM solicitudes ORDER BY creada_en DESC LIMIT 200`)
    .all();
  res.json({ ok: true, rows });
});

module.exports = router;
