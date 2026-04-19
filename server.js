const express = require("express");
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");
const db = require("./database");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: "seguridad_web_clave_secreta",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 30 }
}));

function fechaActual() {
  return new Date().toLocaleString("es-MX");
}

app.post("/api/register", (req, res) => {
  const { username, password, rol } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  try {
    db.prepare("INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)").run(
      username, password, rol || "usuario"
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: "El usuario ya existe" });
  }
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  const user = db.prepare("SELECT * FROM usuarios WHERE username = ?").get(username);

  if (!user || user.password !== password) {
    db.prepare("INSERT INTO bitacora_fallido (usuario_intento, fecha_hora, ip, motivo) VALUES (?, ?, ?, ?)").run(
      username || "desconocido",
      fechaActual(),
      ip,
      !user ? "Usuario no existe" : "Contrasena incorrecta"
    );
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const sessionId = uuidv4();
  req.session.usuario = user.username;
  req.session.rol = user.rol;
  req.session.sessionId = sessionId;

  db.prepare("INSERT INTO bitacora_correcto (usuario, fecha_hora, ip, session_id) VALUES (?, ?, ?, ?)").run(
    user.username, fechaActual(), ip, sessionId
  );

  res.json({ ok: true, rol: user.rol, sessionId });
});

app.post("/api/logout", (req, res) => {
  if (!req.session.usuario) return res.status(401).json({ error: "Sin sesion" });
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  db.prepare("INSERT INTO bitacora_cierre (usuario, fecha_hora, ip, session_id) VALUES (?, ?, ?, ?)").run(
    req.session.usuario, fechaActual(), ip, req.session.sessionId
  );

  req.session.destroy();
  res.json({ ok: true });
});

app.get("/api/session-info", (req, res) => {
  if (!req.session.usuario) return res.status(401).json({ error: "No autenticado" });
  res.json({
    usuario: req.session.usuario,
    rol: req.session.rol,
    sessionId: req.session.sessionId
  });
});

app.get("/api/bitacoras/:tipo", (req, res) => {
  if (!req.session.usuario || req.session.rol !== "admin") {
    return res.status(403).json({ error: "Acceso denegado" });
  }
  const tablas = {
    correcto: "bitacora_correcto",
    fallido:  "bitacora_fallido",
    cierre:   "bitacora_cierre"
  };
  const tabla = tablas[req.params.tipo];
  if (!tabla) return res.status(400).json({ error: "Tipo invalido" });
  const datos = db.prepare("SELECT * FROM " + tabla + " ORDER BY id DESC").all();
  res.json(datos);
});

app.get("/api/usuarios", (req, res) => {
  if (!req.session.usuario || req.session.rol !== "admin") {
    return res.status(403).json({ error: "Acceso denegado" });
  }
  const usuarios = db.prepare("SELECT id, username, rol, creado_en FROM usuarios").all();
  res.json(usuarios);
});

app.listen(3000, () => console.log("Servidor en puerto 3000"));