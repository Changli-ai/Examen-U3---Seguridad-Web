async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    mostrarMensaje("Acceso correcto. Redirigiendo...", "exito");
    setTimeout(() => {
      window.location.href = data.rol === "admin" ? "/admin.html" : "/dashboard.html";
    }, 1000);
  } else {
    mostrarMensaje("Acceso denegado: " + data.error, "error");
  }
}

async function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const rol = document.getElementById("rol") ? document.getElementById("rol").value : "usuario";

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, rol })
  });

  const data = await res.json();
  mostrarMensaje(res.ok ? "Usuario registrado correctamente." : data.error, res.ok ? "exito" : "error");
}

async function logout() {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/";
}

async function verificarSesion(rolRequerido) {
  const res = await fetch("/api/session-info");
  if (!res.ok) { window.location.href = "/"; return null; }
  const data = await res.json();
  if (rolRequerido && data.rol !== rolRequerido) { window.location.href = "/"; return null; }
  return data;
}

async function cargarBitacora(tipo, tbodyId) {
  const res = await fetch("/api/bitacoras/" + tipo);
  const datos = await res.json();
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = "";
  datos.forEach(fila => {
    const tr = document.createElement("tr");
    tr.innerHTML = Object.values(fila).map(v => "<td>" + v + "</td>").join("");
    tbody.appendChild(tr);
  });
}

function mostrarMensaje(texto, tipo) {
  const el = document.getElementById("mensaje");
  if (!el) return;
  el.textContent = texto;
  el.className = tipo;
}

function copiarSessionId() {
  const id = document.getElementById("session-id-valor").textContent;
  navigator.clipboard.writeText(id);
  mostrarMensaje("Session ID copiado al portapapeles.", "exito");
}