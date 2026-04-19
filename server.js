const express = require("express");
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");
const db = require("./database");
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

function nextId(coleccion) {
  const items = db.get(coleccion).value();
  if (items.length === 0) return 1;
  return Math.max(...items.map(i => i.id)) + 1;
}

app.post("/api/register", (req, res) => {
  const { username, password, rol } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Faltan campos" });

  const existe = db.get("usuarios").find({ username }).value();
  if (existe) return res.status(409).json({ error: "El usuario ya existe" });

  const nuevoUsuario = {
    id: nextId("usuarios"),
    username,
    password,
    rol: rol || "usuario",
    creado_en: fechaActual()
  };

  db.get("usuarios").push(nuevoUsuario).write();
  res.json({ ok: true });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  const user = db.get("usuarios").find({ username }).value();

  if (!user || user.password !== password) {
    const motivo = !user ? "Usuario no existe" : "Contrasena incorrecta";
    db.get("bitacora_fallido").push({
      id: nextId("bitacora_fallido"),
      usuario_intento: username || "desconocido",
      fecha_hora: fechaActual(),
      ip,
      motivo
    }).write();
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const sessionId = uuidv4();
  req.session.usuario = user.username;
  req.session.rol = user.rol;
  req.session.sessionId = sessionId;

  db.get("bitacora_correcto").push({
    id: nextId("bitacora_correcto"),
    usuario: user.username,
    fecha_hora: fechaActual(),
    ip,
    session_id: sessionId
  }).write();

  res.json({ ok: true, rol: user.rol, sessionId });
});

app.post("/api/logout", (req, res) => {
  if (!req.session.usuario) return res.status(401).json({ error: "Sin sesion" });
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  db.get("bitacora_cierre").push({
    id: nextId("bitacora_cierre"),
    usuario: req.session.usuario,
    fecha_hora: fechaActual(),
    ip,
    session_id: req.session.sessionId
  }).write();

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
  const colecciones = {
    correcto: "bitacora_correcto",
    fallido:  "bitacora_fallido",
    cierre:   "bitacora_cierre"
  };
  const col = colecciones[req.params.tipo];
  if (!col) return res.status(400).json({ error: "Tipo invalido" });

  const datos = db.get(col).value().slice().reverse();
  res.json(datos);
});

app.get("/api/usuarios", (req, res) => {
  if (!req.session.usuario || req.session.rol !== "admin") {
    return res.status(403).json({ error: "Acceso denegado" });
  }
  const usuarios = db.get("usuarios").map(u => ({
    id: u.id, username: u.username, rol: u.rol, creado_en: u.creado_en
  })).value();
  res.json(usuarios);
});

app.listen(3000, () => console.log("Servidor en puerto 3000"));