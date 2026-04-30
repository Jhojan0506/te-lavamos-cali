/* Te Lavamos Cali — JS */
const NUMERO_WHATSAPP = "573226835629"; // ⚠️ reemplaza con tu número (indicativo + número, sin + ni espacios)

// Navbar scroll
const navbar = document.getElementById("navbar");
if (navbar) {
  const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScroll);
  onScroll();
}

// Menú mobile
const toggle = document.getElementById("navToggle");
const links = document.getElementById("navLinks");
if (toggle && links) {
  toggle.addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));
}

// Formulario → WhatsApp
const form = document.getElementById("agendarForm");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const msg =
      `*Nuevo agendamiento — Te Lavamos Cali*%0A%0A` +
      `👤 *Nombre:* ${data.get("nombre")}%0A` +
      `📱 *Teléfono:* ${data.get("telefono")}%0A` +
      `🧽 *Servicio:* ${data.get("servicio")}%0A` +
      `📍 *Dirección:* ${data.get("direccion")}%0A` +
      `📝 *Detalles:* ${data.get("mensaje") || "—"}`;
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${msg}`, "_blank");
  });
}
