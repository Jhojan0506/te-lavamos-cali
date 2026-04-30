/**
 * db.js — conexión a SQLite (better-sqlite3) + inicialización del schema.
 *
 * Si ejecutas este archivo directamente (`node db.js`) crea la base de datos
 * y aplica el schema.sql. También se importa desde server.js para obtener
 * la instancia compartida de la DB.
 */
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
require("dotenv").config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "clientes.db");

// Asegura que exista la carpeta /data
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Aplica schema.sql al iniciar (idempotente, usa CREATE TABLE IF NOT EXISTS)
const schemaPath = path.join(__dirname, "schema.sql");
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);
}

// Si se invoca directamente: solo inicializar y salir.
if (require.main === module) {
  console.log(`✅ Base de datos lista en: ${DB_PATH}`);
  process.exit(0);
}

module.exports = db;
