/**
 * Serverless Handler for /api/chat
 * Compatible with Vercel, Netlify, and local Node.js server
 */

const SYSTEM_PROMPT = `Eres el Agente Inteligente oficial de "miwebpropia.com".
Tu función principal es asesorar a emprendedores, profesionales y pymes interesados en:
1. Agentes de Inteligencia Artificial para WhatsApp y Web (atención al cliente, ventas y soporte 24/7).
2. Desarrollo de páginas Web y Aplicaciones ultra optimizadas (código limpio, alta velocidad, arquitectura moderna).
3. Automatización de tareas repetitivas y conexión con CRMs y bases de datos.
4. Consultoría tecnológica y preparación de datos para escalar a sistemas corporativos como SAP/ERP.

Pautas de comportamiento:
- Sé amable, profesional, conciso y directo.
- NO prometas plazos rígidos (como "en menos de 1 segundo" o "en 2 horas exactas"); resalta la alta optimización, eficiencia y adaptabilidad a las condiciones técnicas de cada negocio.
- Si el usuario muestra interés en presupuestos, demostraciones o detalles técnicos avanzados, anímalo amablemente a agendar una llamada de diagnóstico o dejar sus datos en el formulario de la página.
- Responde siempre en el idioma en que te hablen (por defecto español).`;

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
      // Usamos el endpoint oficial de Gemini (compatible con gemini-1.5-flash y gemini-2.0-flash)
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`;
      
      const contents = [
        ...chatHistory.slice(-4).map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ];

      const requestBody = {
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      };

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error('[Gemini Error HTTP]:', geminiRes.status, errText);
        
        // Intento de fallback si el modelo flash con systemInstruction necesita estructura simple
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`;
        const simpleRes = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: `${SYSTEM_PROMPT}\n\nPregunta del usuario: ${userMessage}` }]
            }]
          })
        });

        if (simpleRes.ok) {
          const sData = await simpleRes.json();
          const reply = sData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return sendJson(res, 200, { reply, provider: 'gemini' });
        }

        return sendJson(res, 502, { error: 'Error al comunicarse con Gemini.', details: errText });
      }

      const gData = await geminiRes.json();
      const reply = gData.candidates?.[0]?.content?.parts?.[0]?.text || 'No se obtuvo respuesta de Gemini.';

      return sendJson(res, 200, { reply, provider: 'gemini' });
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
