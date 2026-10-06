# Guía de Despliegue en Vercel - miwebpropia.com

Este proyecto está 100% optimizado y preparado para desplegarse en **Vercel** en cuestión de minutos, con soporte nativo para la SPA estática y la función Serverless del Agente de IA (`/api/chat`).

---

## 🚀 Método 1: Despliegue Directo con Vercel CLI (Más rápido)

No necesitas instalar nada globalmente. Desde la terminal en esta carpeta:

```bash
cd C:\Users\USER\.gemini\antigravity\scratch\miwebpropia
npx vercel
```

1. Te pedirá iniciar sesión o confirmar tu cuenta de Vercel en el navegador.
2. Responder a las preguntas del asistente:
   - `Set up and deploy?` ➔ **Y** (Sí)
   - `Which scope?` ➔ Selecciona tu cuenta/equipo personal.
   - `Link to existing project?` ➔ **N** (No)
   - `What’s your project’s name?` ➔ **miwebpropia** (o el nombre que prefieras).
   - `In which directory is your code located?` ➔ **./** (Presiona Enter).
   - `Want to modify settings?` ➔ **N** (No, `vercel.json` ya tiene todo preconfigurado).

Para desplegar a producción definitiva:
```bash
npx vercel --prod
```

---

## 🐙 Método 2: Conectar con GitHub + Vercel (Recomendado para CI/CD)

1. **Sube este repositorio a tu GitHub:**
   ```bash
   # Si usas GitHub CLI:
   gh repo create miwebpropia --public --source=. --remote=origin --push

   # O creando un repo vacío en github.com y ejecutando:
   git remote add origin https://github.com/TU-USUARIO/miwebpropia.git
   git branch -M main
   git push -u origin main
   ```

2. **Importar en Vercel:**
   - Ve a [vercel.com/new](https://vercel.com/new).
   - Selecciona tu repositorio `miwebpropia` y pulsa **Import**.
   - No necesitas cambiar ningún comando de build.
   - Haz clic en **Deploy**.

---

## 🔑 Configurar las Variables de Entorno (API Key de IA)

Para que el Chatbot responda con IA real en producción:

1. Ve a tu proyecto en el panel de Vercel: **Project Settings** ➔ **Environment Variables**.
2. Añade la variable:
   - **Key:** `OPENAI_API_KEY`
   - **Value:** `sk-proj-...tu-clave-de-openai...`
   *(O si usas Google Gemini: `GEMINI_API_KEY` con tu clave de Google AI Studio).*
3. Marca los entornos: **Production**, **Preview**, **Development**.
4. Haz clic en **Save** y realiza un nuevo despliegue (o Redeploy) para aplicar las variables.

---

## 🌐 Conectar tu Dominio: miwebpropia.com

1. En el panel de Vercel, ve a: **Settings** ➔ **Domains**.
2. Escribe `miwebpropia.com` y haz clic en **Add**.
3. Vercel te mostrará los registros DNS que debes añadir en tu registrador de dominios (DonDominio, GoDaddy, Namecheap, Cloudflare, etc.):
   - **Tipo A:** Host `@` apuntando a `76.76.21.21`
   - **Tipo CNAME:** Host `www` apuntando a `cname.vercel-dns.com`
4. En pocos minutos, Vercel generará el certificado SSL HTTPS gratuito de forma automática.
