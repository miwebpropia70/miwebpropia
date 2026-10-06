/**
 * miwebpropia.com - Local & Production Node.js Server
 * Zero-dependency server (uses native Node.js HTTP & Fetch)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple .env parser to avoid external dependencies
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          process.env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    console.log('[ENV] Variables de entorno cargadas desde .env');
  }
}

loadEnv();

const chatHandler = require('./api/chat.js');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. API Route
  if (pathname === '/api/chat') {
    return chatHandler(req, res);
  }

  // 2. Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Security check to prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Acceso denegado');
    return;
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing if path doesn't have an extension
      if (!path.extname(pathname)) {
        filePath = path.join(__dirname, 'index.html');
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('404 - Archivo no encontrado');
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
});

function startServer(portToTry) {
  server.listen(portToTry, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Servidor de miwebpropia.com activo`);
    console.log(`🔗 Web:      http://localhost:${portToTry}`);
    console.log(`🤖 API Chat: http://localhost:${portToTry}/api/chat`);
    console.log(`🔑 Estado IA: ${process.env.OPENAI_API_KEY ? 'OpenAI Conectado ✓' : process.env.GEMINI_API_KEY ? 'Gemini Conectado ✓' : 'Modo Demostración (Configura .env para IA real)'}`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Aviso] El puerto ${portToTry} está en uso. Probando el puerto ${portToTry + 1}...`);
      server.close();
      startServer(portToTry + 1);
    } else {
      console.error('[Error del servidor]:', err);
    }
  });
}

startServer(PORT);
