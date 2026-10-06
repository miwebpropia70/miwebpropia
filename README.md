# miwebpropia.com - SPA Portfolio & Tech Agency

Sitio web oficial y landing page de alta conversión para **miwebpropia.com**, especializada en Agentes de Inteligencia Artificial, Chatbots autónomos 24/7, Desarrollo Web ultra rápido y Consultoría de Escalabilidad Enterprise.

---

## 🎨 Sistema de Diseño (Dark Mode Tech)

- **Fondo:** Deep Dark Theme (`#0D0D0D` / `#121212`)
- **Acento Primario:** Electric Neon Green (`#00FF87`) para llamadas a la acción (CTAs) e interactividad.
- **Acento Secundario:** Deep AI Violet (`#7F00FF`) para gradientes de titulares y resplandores de fondo.
- **Tipografía:** *Plus Jakarta Sans* vía Google Fonts.
- **Layout:** Bento Grid moderno con bordes luminosos sutiles y micro-interacciones suaves al scroll.

---

## 🚀 Características Técnicas & Rendimiento

- **Single Page Application (SPA):** Cero dependencias complejas en tiempo de ejecución, optimizada para máximos estándares de Core Web Vitals (CLS = 0).
- **SEO & Metadatos:** Etiquetas OpenGraph, Twitter Card, Canonical URL y Schema.org JSON-LD estructurado (`ProfessionalService`).
- **Agente de IA Flotante:** Widget de chat flotante en la esquina inferior derecha con badge de bienvenida interactivo, sugerencias de prompts rápidos y respuestas inteligentes simuladas.
- **Agenda & Captación:** Selector interactivo de reservas tipo Calendly con pre-reserva de huecos y formulario de leads con validación.

---

## 📂 Estructura del Proyecto

```
miwebpropia/
├── index.html            # Landing page principal semántica y accesible
├── assets/
│   ├── css/
│   │   └── custom.css    # Resplandores, gradientes, animaciones y diseño del widget
│   └── js/
│       ├── main.js       # Navegación móvil, animaciones on-scroll y lógica de reservas
│       └── chatbot.js    # Lógica interactiva del widget de Agente de IA
├── scripts/
│   └── generate-seo.js   # Script automatizado Node.js para sitemap y robots
├── sitemap.xml           # Mapa del sitio generado para motores de búsqueda
├── robots.txt            # Reglas de rastreo e indexación
└── README.md             # Esta documentación
```

---

## 💻 Cómo Probar Localmente

Puedes servir los archivos de inmediato con cualquier servidor estático:

### Opción 1: Con Node.js (npx serve / http-server)
```bash
npx serve .
# o
npx http-server -p 3000
```

### Opción 2: Con Python
```bash
python -m http.server 8080
```

Luego abre tu navegador en `http://localhost:3000` o `http://localhost:8080`.

---

## 🔄 Regenerar Sitemap y Robots.txt

Cada vez que agregues secciones o modifiques rutas, ejecuta:

```bash
node scripts/generate-seo.js
```

---

## 🌐 Guía de Despliegue en Producción

Para publicar `miwebpropia.com` en hosting con CDN de baja latencia:

1. **Vercel / Netlify / Cloudflare Pages:**
   - Conecta el repositorio o arrastra la carpeta `miwebpropia`.
   - No requiere comando de compilación (Static Site). Raíz: `/`.
2. **Dominio personalizado:**
   - En tu proveedor de dominio (DNS de `miwebpropia.com`), apunta el registro `CNAME` o `A` según el proveedor elegido.
