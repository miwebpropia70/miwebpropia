/**
 * miwebpropia.com - AI Agent Chatbot Widget
 * Mocked high-performance interactive AI Chat Interface
 */

(function () {
  'use strict';

  const widgetToggleBtn = document.getElementById('chat-widget-toggle');
  const chatWindow = document.getElementById('chat-widget-window');
  const chatCloseBtn = document.getElementById('chat-close-btn');
  const chatBadge = document.getElementById('chat-welcome-badge');
  const chatBadgeClose = document.getElementById('chat-badge-close');
  const chatMessagesContainer = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-input-form');
  const chatInput = document.getElementById('chat-user-input');
  const quickPromptButtons = document.querySelectorAll('.quick-prompt-btn');

  // Simulated AI Knowledge Base
  const aiResponses = {
    whatsapp: `Con un Agente de IA en WhatsApp o tu Web, tus clientes reciben respuestas instantáneas las 24 horas del día. Se integra con tu inventario, agenda citas en tiempo real y califica leads automáticamente antes de pasarlos a tu equipo humano.`,
    ahorro: `De media, nuestros clientes reducen un 70% el tiempo dedicado a responder preguntas frecuentes, confirmar citas y clasificar presupuestos. Eso equivale a unas 10 a 15 horas semanales ahorradas por empleado clave.`,
    velocidad: `Nuestras webs y aplicaciones se desarrollan con arquitecturas ultra ligeras y altamente optimizadas para Core Web Vitals. Prescindimos de código innecesario para lograr la máxima fluidez y velocidad posible que permitan el servidor y la conexión del usuario.`,
    sap: `Para empresas en expansión, preparamos la infraestructura de datos y APIs limpias para facilitar integraciones escalables con sistemas ERP de clase mundial como SAP, evitando cuellos de botella técnicos a futuro.`,
    agendar: `¡Genial! Puedes reservar una sesión de 20 minutos con nuestro equipo técnico directamente en la sección de agenda de la página o déjanos tu email aquí y te escribiremos hoy mismo.`,
    default: `Gracias por tu mensaje. Como agente de miwebpropia.com, me enfoco en diseñar agentes autónomos, webs ultrarrápidas y automatizaciones que hagan crecer tu negocio. ¿Te gustaría agendar una llamada express de 15 minutos o conocer presupuestos aproximados?`
  };

  let isOpen = false;

  function openChat() {
    isOpen = true;
    chatWindow.classList.remove('hidden-widget');
    chatWindow.classList.add('visible-widget');
    if (chatBadge) {
      chatBadge.style.display = 'none';
    }
    chatInput.focus();
    scrollToBottom();
  }

  function closeChat() {
    isOpen = false;
    chatWindow.classList.add('hidden-widget');
    chatWindow.classList.remove('visible-widget');
  }

  function scrollToBottom() {
    if (chatMessagesContainer) {
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
  }

  function showTypingIndicator() {
    const typingElem = document.createElement('div');
    typingElem.id = 'typing-indicator-box';
    typingElem.className = 'flex items-center gap-1.5 p-3 rounded-2xl chat-bubble-agent w-fit text-sm text-gray-400 my-2';
    typingElem.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-emerald-400 typing-dot"></span>
      <span class="w-2 h-2 rounded-full bg-emerald-400 typing-dot"></span>
      <span class="w-2 h-2 rounded-full bg-emerald-400 typing-dot"></span>
      <span class="text-xs ml-1 text-gray-400 font-mono">Agente escribiendo...</span>
    `;
    chatMessagesContainer.appendChild(typingElem);
    scrollToBottom();
    return typingElem;
  }

  function addMessage(sender, text) {
    const msgWrapper = document.createElement('div');
    const isUser = sender === 'user';
    msgWrapper.className = `flex flex-col ${isUser ? 'items-end' : 'items-start'} my-2.5`;

    const bubble = document.createElement('div');
    bubble.className = `max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
      isUser ? 'chat-bubble-user text-white' : 'chat-bubble-agent text-gray-200'
    }`;
    bubble.innerHTML = text;

    const time = document.createElement('span');
    time.className = 'text-[10px] text-gray-500 mt-1 px-1';
    const now = new Date();
    time.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    msgWrapper.appendChild(bubble);
    msgWrapper.appendChild(time);
    chatMessagesContainer.appendChild(msgWrapper);
    scrollToBottom();
  }

  // Conversation history for context
  const conversationHistory = [];

  async function handleUserMessage(query) {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    // Add user message to UI & history
    addMessage('user', cleanQuery);
    conversationHistory.push({ role: 'user', text: cleanQuery });
    chatInput.value = '';

    // Show typing effect
    const typing = showTypingIndicator();

    try {
      // 1. Try real backend API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: cleanQuery,
          history: conversationHistory
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        typing.remove();
        const replyText = data.reply || 'Recibido.';
        addMessage('agent', replyText);
        conversationHistory.push({ role: 'agent', text: replyText });
        return;
      }
      throw new Error(`API status ${response.status}`);
    } catch (err) {
      // 2. Intelligent local fallback if backend is offline or static hosting
      typing.remove();
      const lower = cleanQuery.toLowerCase();
      let fallbackReply = aiResponses.default;

      if (lower.includes('whatsapp') || lower.includes('bot') || lower.includes('chatbot') || lower.includes('agente')) {
        fallbackReply = aiResponses.whatsapp;
      } else if (lower.includes('ahorr') || lower.includes('hora') || lower.includes('tiempo') || lower.includes('coste') || lower.includes('precio')) {
        fallbackReply = aiResponses.ahorro;
      } else if (lower.includes('web') || lower.includes('velocidad') || lower.includes('rapida') || lower.includes('lenta') || lower.includes('app')) {
        fallbackReply = aiResponses.velocidad;
      } else if (lower.includes('sap') || lower.includes('enterprise') || lower.includes('empresa') || lower.includes('erp')) {
        fallbackReply = aiResponses.sap;
      } else if (lower.includes('agenda') || lower.includes('reunion') || lower.includes('contacto') || lower.includes('llamada')) {
        fallbackReply = aiResponses.agendar;
      }

      addMessage('agent', fallbackReply);
      conversationHistory.push({ role: 'agent', text: fallbackReply });
    }
  }

  // Event Listeners
  if (widgetToggleBtn) {
    widgetToggleBtn.addEventListener('click', () => {
      if (isOpen) {
        closeChat();
      } else {
        openChat();
      }
    });
  }

  if (chatCloseBtn) {
    chatCloseBtn.addEventListener('click', closeChat);
  }

  if (chatBadge) {
    chatBadge.addEventListener('click', (e) => {
      if (e.target !== chatBadgeClose && !chatBadgeClose.contains(e.target)) {
        openChat();
      }
    });
  }

  if (chatBadgeClose) {
    chatBadgeClose.addEventListener('click', (e) => {
      e.stopPropagation();
      chatBadge.style.display = 'none';
    });
  }

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleUserMessage(chatInput.value);
    });
  }

  quickPromptButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const promptText = btn.getAttribute('data-prompt') || btn.innerText;
      handleUserMessage(promptText);
    });
  });

})();
