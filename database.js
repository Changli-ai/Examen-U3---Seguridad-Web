const fs = require("fs");
const path = require("path");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

if (!fs.existsSync("./bitacoras")) {
  fs.mkdirSync("./bitacoras");
}

const adapter = new FileSync("./bitacoras/principal.json");
const db = low(adapter);

db.defaults({
  usuarios: [
    { id: 1, username: "admin", password: "admin123", rol: "admin", creado_en: new Date().toLocaleString("es-MX") }
  ],
  bitacora_correcto: [],
  bitacora_fallido: [],
  bitacora_cierre: []
}).write();

module.exports = db;