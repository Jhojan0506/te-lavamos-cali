/**
 * server.js — Te Lavamos Cali
 * Express + SQLite + WhatsApp.
 * Sirve también la carpeta /public (puedes subir aquí el frontend HTML/CSS/JS).
 */
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const solicitudesRouter = require("./routes/solicitudes");

const app = express();
const PORT = process.env.PORT || 3000;

// Detrás de un proxy (Render, Railway, Nginx) confiar en X-Forwarded-For
app.set("trust proxy", 1);

// Seguridad básica
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — restringe a tus dominios de frontend
const allowed = (process.env.ALLOWED_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes("*") || allowed.includes(origin)) return cb(null, true);
      return cb(new Error("Origen no permitido por CORS: " + origin));
    },
  })
);

app.use(express.json({ limit: "32kb" }));

// Rate limit para el endpoint público de solicitudes (anti-spam)
app.use(
  "/api/solicitudes",
  rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 5,              // 5 envíos por IP por minuto
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Demasiadas solicitudes, intenta en un minuto." },
  })
);

// Healthcheck
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Rutas API
app.use("/api/solicitudes", solicitudesRouter);

// Servir frontend estático (opcional). Coloca tu HTML/CSS/JS dentro de /public
app.use(express.static(path.join(__dirname, "public")));

// 404 JSON para rutas API
app.use("/api", (_req, res) => res.status(404).json({ ok: false, error: "Not Found" }));

// Manejo de errores
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "Error interno" });
});

app.listen(PORT, () => {
  console.log(`🚀 Te Lavamos Cali API en http://localhost:${PORT}`);
  console.log(`   Modo WhatsApp: ${process.env.WHATSAPP_MODE || "link"}`);
});
