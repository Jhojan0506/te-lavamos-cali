-- ============================================================
-- Te Lavamos Cali — Esquema de base de datos
-- Motor: SQLite 3
-- ============================================================

CREATE TABLE IF NOT EXISTS solicitudes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre          TEXT    NOT NULL,
  telefono        TEXT    NOT NULL,
  direccion       TEXT    NOT NULL,
  servicio        TEXT    NOT NULL,
  detalles        TEXT,
  ip              TEXT,
  user_agent      TEXT,
  estado          TEXT    NOT NULL DEFAULT 'nueva'
                    CHECK (estado IN ('nueva','contactado','agendada','cerrada','cancelada')),
  whatsapp_status TEXT,                  -- 'sent' | 'failed' | 'link' | NULL
  whatsapp_error  TEXT,
  creada_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizada_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_creada_en ON solicitudes(creada_en DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado    ON solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_telefono  ON solicitudes(telefono);

-- Trigger para mantener actualizada_en
CREATE TRIGGER IF NOT EXISTS trg_solicitudes_updated
AFTER UPDATE ON solicitudes
FOR EACH ROW
BEGIN
  UPDATE solicitudes SET actualizada_en = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
