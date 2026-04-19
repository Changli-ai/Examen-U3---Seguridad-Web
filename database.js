const Database = require("better-sqlite3");

const db = new Database("./bitacoras/principal.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT DEFAULT 'usuario',
    creado_en TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS bitacora_correcto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT,
    fecha_hora TEXT,
    ip TEXT,
    session_id TEXT
  );

  CREATE TABLE IF NOT EXISTS bitacora_fallido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_intento TEXT,
    fecha_hora TEXT,
    ip TEXT,
    motivo TEXT
  );

  CREATE TABLE IF NOT EXISTS bitacora_cierre (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT,
    fecha_hora TEXT,
    ip TEXT,
    session_id TEXT
  );
`);

const adminExiste = db.prepare("SELECT id FROM usuarios WHERE rol = 'admin'").get();
if (!adminExiste) {
  db.prepare("INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)").run("admin", "admin123", "admin");
}

module.exports = db;