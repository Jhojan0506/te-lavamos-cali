// ============================================================
//  SCROLL REVEAL
// ============================================================
function revealOnScroll() {
  document.querySelectorAll(".reveal").forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight - 100) {
      el.classList.add("active");
    }
  });
}
window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);


// ============================================================
//  SLIDER ANTES/DESPUÉS
// ============================================================
const slider = document.querySelector(".slider");
const after  = document.querySelector(".after");

if (slider && after) {
  slider.addEventListener("input", e => {
    after.style.clipPath = `inset(0 ${100 - e.target.value}% 0 0)`;
  });
}

const baSlider = document.getElementById("ba-slider");
const baAfter  = document.querySelector(".ba-after");

if (baSlider && baAfter) {
  let isDragging = false;
  baSlider.addEventListener("mousedown", () => isDragging = true);
  window.addEventListener("mouseup",    () => isDragging = false);
  window.addEventListener("mousemove",  e => {
    if (!isDragging) return;
    const rect    = baSlider.parentElement.getBoundingClientRect();
    let x         = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const percent = (x / rect.width) * 100;
    baSlider.style.left    = percent + "%";
    baAfter.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
  });
}


// ============================================================
//  CONFIGURACIÓN
// ============================================================
const TU_NUMERO  = "573226835629";   // tu WhatsApp Business
const APIKEY     = "4700001";        // tu API key de CallMeBot


// ============================================================
//  FORMULARIO
// ============================================================
const form = document.getElementById("formulario");

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre    = document.getElementById("nombre").value.trim();
    const direccion = document.getElementById("direccion").value.trim();
    const telefono  = document.getElementById("telefono").value.trim();
    const servicio  = document.getElementById("servicio").value;
    const detalles  = document.getElementById("detalles").value.trim();

    // — Validaciones —
    if (!nombre || !direccion || !telefono || !servicio) {
      mostrarAlerta("⚠️ Por favor completa todos los campos obligatorios.", "error");
      return;
    }

    if (!/^[0-9+\s]{7,15}$/.test(telefono)) {
      mostrarAlerta("⚠️ Ingresa un número de teléfono válido.", "error");
      return;
    }

    // — Fecha y hora —
    const ahora = new Date().toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      dateStyle: "short",
      timeStyle: "short"
    });

    // — Mensaje —
    const mensaje =
`🧼 NUEVA SOLICITUD — Te Lavamos Cali
──────────────────────────
👤 Nombre:      ${nombre}
📍 Dirección:   ${direccion}
📞 Teléfono:    ${telefono}
🛋️ Servicio:    ${servicio}
📝 Detalles:    ${detalles || "Sin detalles adicionales"}
──────────────────────────
🕐 Fecha: ${ahora}`;

    // — Animación botón —
    const btn = form.querySelector("button[type='submit']");
    btn.textContent = "Enviando...";
    btn.disabled = true;

    // — Enviar con CallMeBot (automático a tu número) —
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${TU_NUMERO}&text=${encodeURIComponent(mensaje)}&apikey=${APIKEY}`;
      await fetch(url, { mode: "no-cors" });

      mostrarAlerta("✅ ¡Solicitud enviada! Te contactaremos pronto.", "exito");
      form.reset();

    } catch (err) {
      // Si falla CallMeBot, abre WhatsApp normal como respaldo
      window.open(
        `https://wa.me/${TU_NUMERO}?text=${encodeURIComponent(mensaje)}`,
        "_blank"
      );
      mostrarAlerta("✅ ¡Listo! Se abrió WhatsApp con tu solicitud.", "exito");
      form.reset();
    }

    btn.textContent = "📲 Enviar solicitud";
    btn.disabled = false;
  });
}


// ============================================================
//  ALERTA VISUAL
// ============================================================
function mostrarAlerta(mensaje, tipo) {
  const prev = document.getElementById("alerta-form");
  if (prev) prev.remove();

  const alerta = document.createElement("div");
  alerta.id = "alerta-form";
  alerta.textContent = mensaje;

  Object.assign(alerta.style, {
    position:     "fixed",
    bottom:       "100px",
    left:         "50%",
    transform:    "translateX(-50%)",
    background:   tipo === "exito" ? "#00e5c0" : "#ff4d4d",
    color:        tipo === "exito" ? "#060d1a" : "#fff",
    padding:      "14px 28px",
    borderRadius: "50px",
    fontWeight:   "700",
    fontSize:     "15px",
    fontFamily:   "'DM Sans', sans-serif",
    boxShadow:    "0 8px 30px rgba(0,0,0,0.3)",
    zIndex:       "9999",
    maxWidth:     "90vw",
    textAlign:    "center",
    transition:   "opacity .4s ease",
  });

  document.body.appendChild(alerta);

  setTimeout(() => {
    alerta.style.opacity = "0";
    setTimeout(() => alerta.remove(), 400);
  }, 4000);
}