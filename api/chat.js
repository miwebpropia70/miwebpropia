/**
 * Serverless Handler for /api/chat
 * Compatible with Vercel, Netlify, and local Node.js server
 */

const SYSTEM_PROMPT = `Eres el Agente Comercial y Consultor Tecnológico exclusivo de "miwebpropia.com".
Tu único objetivo es promover, explicar y vender los servicios y soluciones de miwebpropia.com a emprendedores, profesionales y pymes.

CATÁLOGO EXCLUSIVO DE NUESTROS PRODUCTOS Y SERVICIOS:
1. Agentes de IA & Chatbots para WhatsApp y Web:
   - Atención al cliente y captación de ventas en tiempo real 24/7.
   - Entrenados con los datos específicos del negocio del cliente.
   - Integración nativa con WhatsApp Business API, CRMs y Google Calendar.
2. Desarrollo de Páginas Web y Apps Ultra Rápidas:
   - Sitios web de alto impacto diseñados para maximizar la conversión.
   - Código limpio, optimizado para Core Web Vitals, sin plantillas infladas ni plugins pesados.
   - Arquitecturas modernas sobre Edge CDN con carga instantánea y SEO técnico avanzado.
3. Automatización de Procesos Operativos:
   - Eliminación de tareas manuales repetitivas (sincronización con Excel, facturación, leads).
   - Integración de flujos entre WhatsApp, email y herramientas de gestión.
4. Soluciones Enterprise y Preparación para SAP/ERP:
   - Consultoría estratégica para empresas en fase de crecimiento.
   - Modelado de bases de datos y APIs limpias para facilitar saltos seguros a sistemas como SAP u otros ERPs.

REGLAS ESTRICTAS DE RESPUESTA:
- ENFOQUE 100% EN MIWEBPROPIA.COM: Habla siempre en primera persona del plural ("nosotros desarrollamos", "en miwebpropia.com creamos", "nuestras soluciones").
- PROHIBIDO RECOMENDAR O MENCIONAR COMPETENCIA: Jamás recomiendes plataformas de terceros, herramientas de la competencia ni soluciones genéricas externas (como Wix, WordPress, ManyChat, otras agencias, etc.). Si el usuario pregunta por alternativas genéricas o competidores, explica cortésmente por qué en miwebpropia.com ofrecemos una solución a medida, superior, más rápida y adaptada a sus objetivos comerciales.
- LLAMADA A LA ACCIÓN (CTA) CONSTANTE: En cada respuesta, invita amablemente al usuario a agendar una llamada de diagnóstico gratuita de 20 minutos o a dejar sus datos en el formulario de la página para prepararle una propuesta sin compromiso.
- TONO Y ESTILO: Profesional, cercano, persuasivo, seguro y directo. No prometas tiempos de respuesta absolutos o irreales.
- IDIOMA: Responde siempre en el idioma que use el usuario (por defecto español).`;

function sendJson(res, statusCode, payload) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function handleChatRequest(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Método no permitido. Utiliza POST.' });
  }

  // Parse body
  let bodyData = req.body;
  if (!bodyData && req.on) {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const raw = Buffer.concat(buffers).toString('utf-8');
      bodyData = raw ? JSON.parse(raw) : {};
    } catch (parseErr) {
      return sendJson(res, 400, { error: 'JSON inválido en el cuerpo de la petición.' });
    }
  }

  const userMessage = bodyData?.message?.trim();
  const chatHistory = Array.isArray(bodyData?.history) ? bodyData.history : [];

  if (!userMessage) {
    return sendJson(res, 400, { error: 'El campo "message" es obligatorio.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // 1. If OpenAI API key is present
  if (apiKey) {
    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...chatHistory.slice(-6).map(h => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.text
        })),
        { role: 'user', content: userMessage }
      ];

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 450
        })
      });

      if (!aiResponse.ok) {
        const errorDetails = await aiResponse.text();
        console.error('[OpenAI Error]:', errorDetails);
        return sendJson(res, 502, { error: 'Error al comunicarse con OpenAI.', details: errorDetails });
      }

      const data = await aiResponse.json();
      const reply = data.choices?.[0]?.message?.content || 'No se obtuvo respuesta del modelo.';

      return sendJson(res, 200, { reply, provider: 'openai' });
    } catch (err) {
      console.error('[Chat API Exception]:', err);
      return sendJson(res, 500, { error: 'Error interno procesando la solicitud.', message: err.message });
    }
  }

  // 2. If Gemini API key is present
  if (geminiApiKey) {
    try {
      const cleanKey = geminiApiKey.trim();
      
      // Lista de modelos oficiales disponibles en Google AI Studio por orden de preferencia
      const modelsToTry = [
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-pro'
      ];

      let lastErrorText = '';

      for (const modelName of modelsToTry) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;
        
        try {
          const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [{ text: `${SYSTEM_PROMPT}\n\nPregunta del cliente: ${userMessage}` }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 600
              }
            })
          });

          if (geminiRes.ok) {
            const gData = await geminiRes.json();
            const reply = gData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) {
              return sendJson(res, 200, { reply, provider: 'gemini', model: modelName });
            }
          } else {
            lastErrorText = await geminiRes.text();
            console.error(`[Gemini ${modelName} Error HTTP ${geminiRes.status}]:`, lastErrorText);
          }
        } catch (fetchErr) {
          lastErrorText = fetchErr.message;
        }
      }

      // Si todos los modelos fallaron con la clave proporcionada
      return sendJson(res, 502, { 
        error: 'Google Gemini rechazó la petición.', 
        details: lastErrorText 
      });
    } catch (err) {
      console.error('[Gemini Exception]:', err);
      return sendJson(res, 500, { error: 'Error interno en conexión con Gemini.', message: err.message });
    }
  }

  // 3. Fallback when neither key is configured yet
  return sendJson(res, 200, {
    reply: `(Modo Demostración): He recibido tu consulta: "${userMessage}". Para respuestas 100% dinámicas con IA, configura tu clave OPENAI_API_KEY o GEMINI_API_KEY en las variables de entorno de tu proyecto en Vercel.`,
    isDemo: true
  });
}

module.exports = handleChatRequest;
