const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

if (!fs.existsSync("./bitacoras")) {
  fs.mkdirSync("./bitacoras");
}

const db = new sqlite3.Database("./bitacoras/principal.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT DEFAULT 'usuario',
    creado_en TEXT DEFAULT (datetime('now', 'localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bitacora_correcto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT,
    fecha_hora TEXT,
    ip TEXT,
    session_id TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bitacora_fallido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_intento TEXT,
    fecha_hora TEXT,
    ip TEXT,
    motivo TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bitacora_cierre (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT,
    fecha_hora TEXT,
    ip TEXT,
    session_id TEXT
  )`);

  db.get("SELECT id FROM usuarios WHERE rol = 'admin'", (err, row) => {
    if (!row) {
      db.run("INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)",
        ["admin", "admin123", "admin"]);
    }
  });
});

module.exports = db;