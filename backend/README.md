# Te Lavamos Cali — Backend

Backend en **Node.js + Express + SQLite** que:

1. Recibe el formulario desde `agendar.html`.
2. Guarda al cliente en la base de datos.
3. **Notifica por WhatsApp** al número del negocio (modo `link` con `wa.me` o modo `cloud` con WhatsApp Cloud API real).

---

## 📁 Estructura

```
backend/
├── server.js              # Express app
├── db.js                  # Conexión SQLite
├── schema.sql             # Esquema de la DB
├── whatsapp.js            # Envío por WhatsApp (link o Cloud API)
├── routes/
│   └── solicitudes.js     # POST/GET /api/solicitudes
├── public/
│   └── agendar-snippet.html  # Código JS para tu frontend
├── Dockerfile
├── package.json
└── .env.example
```

---

## ⚡ Instalación local

```bash
cd backend
cp .env.example .env       # edita NUMERO_NEGOCIO y ALLOWED_ORIGIN
npm install
npm run init-db            # crea data/clientes.db
npm start                  # http://localhost:3000
```

Prueba el endpoint:
```bash
curl -X POST http://localhost:3000/api/solicitudes \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","telefono":"3001112233","direccion":"Cali","servicio":"Lavado de sala"}'
```

---

## 🔌 Conectar tu frontend (HTML estático)

En `agendar.html`, agrega el campo honeypot dentro del `<form id="form-agendar">`:

```html
<input type="text" name="website" tabindex="-1" autocomplete="off"
       style="position:absolute;left:-9999px" aria-hidden="true">
```

Reemplaza el `<script>` actual (el que abre `wa.me` directo) por el de
`public/agendar-snippet.html`, cambiando `API_URL` por la URL de tu backend
en producción.

---

## 📲 Modo WhatsApp

### Modo `link` (por defecto, sin configuración)
El backend devuelve una URL `https://wa.me/...` con el mensaje pre-llenado.
El frontend la abre en una nueva pestaña → el cliente toca **"Enviar"** en su WhatsApp.
✅ Funciona inmediatamente. ❌ Requiere que el cliente pulse Enviar.

### Modo `cloud` (envío automático real, recomendado en producción)
Usa **WhatsApp Cloud API** de Meta. El mensaje llega solo al número del negocio.

Pasos:
1. Crea una app en https://developers.facebook.com/ → producto **WhatsApp**.
2. Obtén `Phone number ID` y un **Access Token permanente** (System User).
3. En **WhatsApp Manager** crea una plantilla aprobada llamada `nueva_solicitud`
   con idioma `es_CO` y este cuerpo (5 variables):
   ```
   Nueva solicitud:
   Nombre: {{1}}
   Tel: {{2}}
   Dirección: {{3}}
   Servicio: {{4}}
   Detalles: {{5}}
   ```
4. En `.env` pon:
   ```
   WHATSAPP_MODE=cloud
   WHATSAPP_TOKEN=EAAG...
   WHATSAPP_PHONE_ID=1234567890
   WHATSAPP_TEMPLATE=nueva_solicitud
   WHATSAPP_TEMPLATE_LANG=es_CO
   NUMERO_NEGOCIO=573001112233
   ```

---

## 🚀 Subir a producción — Guía paso a paso

Tienes 3 caminos según tu hosting. Elige uno:

### Opción A — Render.com (recomendado, gratis para empezar)

1. Sube esta carpeta `backend/` a un repositorio en GitHub.
2. Entra a https://render.com → **New → Web Service** → conecta el repo.
3. Configuración:
   - **Environment**: Node
   - **Build command**: `npm install`
   - **Start command**: `node server.js`
4. En **Environment Variables** agrega todo lo de `.env.example`
   (NO subas tu `.env` al repo — está en `.gitignore`).
5. En **Disks**, crea un disco persistente de 1 GB montado en `/opt/render/project/src/data`
   y pon `DB_PATH=/opt/render/project/src/data/clientes.db`.
   *(Sin disco persistente la DB se borrará en cada redeploy.)*
6. Render te da una URL como `https://telavamos-api.onrender.com`.
   Pon esa URL en `API_URL` de tu frontend.

### Opción B — Railway / Fly.io / VPS con Docker

1. Construye la imagen:
   ```bash
   docker build -t telavamos-api .
   docker run -d --name telavamos-api \
     -p 3000:3000 \
     -v $(pwd)/data:/app/data \
     --env-file .env \
     telavamos-api
   ```
2. Apunta tu dominio (`api.telavamoscali.com`) al servidor con Nginx + SSL
   (usa Caddy o Certbot para HTTPS).

### Opción C — Hosting cPanel con Node.js (Hostinger, Namecheap, etc.)

1. En el panel: **Setup Node.js App** → versión Node 18+ → carpeta del proyecto.
2. Sube todos los archivos por FTP excepto `node_modules/` y `data/`.
3. Pulsa **Run NPM Install**, luego **Restart App**.
4. Crea las variables de entorno en la sección **Environment variables**.
5. El panel te dará la URL pública (normalmente `https://tudominio.com/api`).

> ⚠️ El hosting compartido tipo "solo HTML/PHP" (sin Node) **no sirve**
> para este backend. Necesitas un proveedor que ejecute Node.js.

---

## 🌐 Subir el frontend HTML

El frontend (HTML/CSS/JS) puede ir en **cualquier hosting estático**:
- **Netlify** o **Vercel** (drag & drop del ZIP — gratis)
- **Hostinger / cPanel** (subir por FTP a `public_html/`)
- **GitHub Pages**
- O incluso **el mismo backend**: copia tus HTML dentro de `backend/public/`
  y se servirán automáticamente en la raíz.

Recuerda en tu `.env` del backend:
```
ALLOWED_ORIGIN=https://telavamoscali.com
```

---

## 🛡️ Seguridad incluida

- Validación con **Zod** (longitudes, formato de teléfono).
- **Rate limit**: 5 envíos por IP por minuto.
- **Helmet** + **CORS** restringido por dominio.
- **Honeypot** anti-bots (campo oculto `website`).
- Endpoint admin (`GET /api/solicitudes`) protegido con header `x-admin-token`.

---

## 📊 Ver clientes registrados

```bash
# Define un token primero en .env: ADMIN_TOKEN=algo-secreto-largo
curl https://tu-api.com/api/solicitudes -H "x-admin-token: algo-secreto-largo"
```

O con cualquier visor SQLite (DB Browser for SQLite) abre `data/clientes.db`.
