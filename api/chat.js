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

REGLAS DE RESPUESTA (en este orden de prioridad):
1. RESPONDE A LO QUE TE PREGUNTAN: Lee la pregunta concreta del usuario y contéstala de forma directa en la primera frase. No cambies de tema ni recites el catálogo completo si no te lo piden. Ten en cuenta lo que se ha hablado antes en la conversación.
2. BREVEDAD: Entre 2 y 5 frases (máximo unas 90 palabras). Usa una lista corta solo si ayuda. Nada de introducciones de relleno ni repetir el saludo.
3. ENFOQUE 100% EN MIWEBPROPIA.COM: Habla en primera persona del plural ("en miwebpropia.com creamos", "nuestras soluciones"). Relaciona la respuesta con el servicio nuestro que mejor encaje.
4. SIN COMPETENCIA: Nunca recomiendes ni nombres plataformas, herramientas o agencias de terceros (Wix, WordPress, ManyChat, etc.). Si preguntan por alternativas, explica brevemente la ventaja de nuestra solución a medida.
5. SIN INVENTAR: No inventes precios, plazos, clientes, casos de éxito ni garantías. Si preguntan por precios o plazos, explica que dependen del proyecto y que se concretan en la llamada de diagnóstico.
6. TEMAS AJENOS: Si la pregunta no tiene relación con nuestros servicios, dilo con amabilidad en una frase y redirige a cómo podemos ayudar a su negocio.
7. LLAMADA A LA ACCIÓN: Cierra invitando a agendar la llamada de diagnóstico gratuita o a dejar sus datos en el formulario, pero solo cuando encaje de forma natural (no en cada mensaje si el usuario solo está preguntando detalles).
8. IDIOMA: Responde en el idioma del usuario (por defecto español). Tono profesional, cercano y seguro.`;

function sendJson(res, statusCode, payload) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

// Caché de modelos disponibles (se reutiliza mientras la función siga activa)
let cachedGeminiModels = null;

/**
 * Pregunta a Google qué modelos de texto permite la clave y los ordena por preferencia.
 * Si existe la variable GEMINI_MODEL (ej. "gemini-2.5-flash"), se prueba primero.
 */
async function getGeminiModels(apiKey) {
  if (cachedGeminiModels) return cachedGeminiModels;

  const listRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${apiKey}`
  );
  if (!listRes.ok) {
    throw new Error(`HTTP ${listRes.status} ${await listRes.text()}`);
  }

  const data = await listRes.json();
  const excluded = /(embedding|aqa|imagen|image|tts|audio|live|veo|vision|learnlm|gemma|robotics|computer-use)/i;

  const names = (data.models || [])
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name) // formato "models/gemini-x-flash"
    .filter(name => name.includes('gemini') && !excluded.test(name));

  // Preferencia: flash estable > flash preview > pro estable > resto
  const score = name => {
    let s = 0;
    if (name.includes('flash')) s += 100;
    if (name.includes('lite')) s -= 10;
    if (!/(preview|exp|experimental)/i.test(name)) s += 50;
    if (name.includes('latest')) s += 5;
    return s;
  };
  names.sort((a, b) => score(b) - score(a));

  const preferred = process.env.GEMINI_MODEL ? `models/${process.env.GEMINI_MODEL.replace(/^models\//, '')}` : null;
  const ordered = preferred ? [preferred, ...names.filter(n => n !== preferred)] : names;

  cachedGeminiModels = ordered;
  return ordered;
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

      // Descubre qué modelos permite realmente esta clave (en vez de adivinar nombres)
      let models;
      try {
        models = await getGeminiModels(cleanKey);
      } catch (listErr) {
        return sendJson(res, 502, {
          error: 'No se pudo obtener la lista de modelos de Gemini (revisa la clave GEMINI_API_KEY).',
          details: listErr.message
        });
      }

      if (models.length === 0) {
        return sendJson(res, 502, {
          error: 'Tu clave de Gemini no tiene ningún modelo disponible para generar texto.'
        });
      }

      // Historial reciente: solo turnos válidos, alternando usuario/modelo y empezando por el usuario
      const turns = chatHistory
        .slice(0, -1) // el último elemento es la pregunta actual
        .filter(h => h && typeof h.text === 'string' && h.text.trim() && !h.fallback)
        .slice(-8)
        .map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text.slice(0, 2000) }] }));

      const contents = [];
      for (const t of turns) {
        if (contents.length === 0 && t.role !== 'user') continue;
        if (contents.length && contents[contents.length - 1].role === t.role) {
          // une dos turnos seguidos del mismo rol en vez de perder uno
          contents[contents.length - 1].parts[0].text += `\n${t.parts[0].text}`;
        } else {
          contents.push(t);
        }
      }
      const currentQuestion = { role: 'user', parts: [{ text: userMessage }] };
      if (contents.length && contents[contents.length - 1].role === 'user') {
        currentQuestion.parts[0].text = `${contents.pop().parts[0].text}\n${userMessage}`;
      }
      contents.push(currentQuestion);

      const errors = [];

      // Prueba como máximo 3 modelos para no superar el tiempo límite
      for (const modelName of models.slice(0, 3)) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${cleanKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents,
                // Margen amplio: los modelos con "razonamiento" consumen tokens antes de responder
                generationConfig: { temperature: 0.4, maxOutputTokens: 4096 }
              })
            }
          );

          if (geminiRes.ok) {
            const gData = await geminiRes.json();
            const reply = gData.candidates?.[0]?.content?.parts
              ?.map(p => p.text || '')
              .join('')
              .trim();
            if (reply) {
              return sendJson(res, 200, { reply, provider: 'gemini', model: modelName });
            }
            errors.push(`${modelName}: respuesta vacía`);
          } else {
            errors.push(`${modelName}: HTTP ${geminiRes.status} ${await geminiRes.text()}`);
            // Si el modelo dejó de existir, lo quitamos de la caché
            if (geminiRes.status === 404) cachedGeminiModels = null;
          }
        } catch (fetchErr) {
          errors.push(`${modelName}: ${fetchErr.message}`);
        }
      }

      console.error('[Gemini Errors]:', errors);
      return sendJson(res, 502, {
        error: 'Google Gemini rechazó la petición.',
        details: errors.join('\n\n')
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
