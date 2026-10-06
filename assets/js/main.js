/**
 * miwebpropia.com - Main Application Logic
 * IntersectionObserver animations, smooth scrolling, booking simulation, and lead form validation
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // 1. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuLinks = document.querySelectorAll('.mobile-nav-link');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isExpanded = mobileMenu.classList.toggle('hidden');
      mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
    });

    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // 2. IntersectionObserver for Reveal Animations on Scroll
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback if IntersectionObserver is not supported
    revealElements.forEach(el => el.classList.add('is-visible'));
  }

  // 3. Interactive Scheduling / Calendly Mockup Behavior
  const timeSlots = document.querySelectorAll('.time-slot-btn');
  const selectedSlotText = document.getElementById('selected-slot-display');
  const confirmBookingBtn = document.getElementById('confirm-booking-btn');
  const bookingFeedback = document.getElementById('booking-feedback');

  let currentSelectedSlot = null;

  timeSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      timeSlots.forEach(s => {
        s.classList.remove('bg-emerald-400', 'text-black', 'border-emerald-400', 'font-bold');
        s.classList.add('bg-zinc-800/80', 'text-zinc-300', 'border-zinc-700');
      });

      slot.classList.remove('bg-zinc-800/80', 'text-zinc-300', 'border-zinc-700');
      slot.classList.add('bg-emerald-400', 'text-black', 'border-emerald-400', 'font-bold');

      currentSelectedSlot = slot.getAttribute('data-time');
      if (selectedSlotText) {
        selectedSlotText.textContent = `Horario seleccionado: ${currentSelectedSlot} (Madrid / CET)`;
      }
      if (confirmBookingBtn) {
        confirmBookingBtn.removeAttribute('disabled');
        confirmBookingBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    });
  });

  if (confirmBookingBtn) {
    confirmBookingBtn.addEventListener('click', () => {
      if (!currentSelectedSlot) return;
      confirmBookingBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-black inline" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg> Bloqueando hueco...
      `;

      setTimeout(() => {
        if (bookingFeedback) {
          bookingFeedback.classList.remove('hidden');
          bookingFeedback.innerHTML = `
            <div class="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-sm flex items-start gap-3">
              <svg class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <div>
                <p class="font-bold text-white">¡Hueco pre-reservado para las ${currentSelectedSlot}!</p>
                <p class="text-xs text-emerald-400/90 mt-1">Completa el formulario de la derecha con tus datos para confirmar el enlace de Google Meet o llamada telefónica.</p>
              </div>
            </div>
          `;
        }
        confirmBookingBtn.innerHTML = `Cita Reservada ✓`;
      }, 800);
    });
  }

  // 4. Lead Capture Form Handler
  const leadForm = document.getElementById('lead-capture-form');
  const formSuccessAlert = document.getElementById('form-success-alert');

  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = leadForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-black inline" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg> Enviando solicitud...
      `;

      // Simulating API dispatch
      setTimeout(() => {
        leadForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        if (formSuccessAlert) {
          formSuccessAlert.classList.remove('hidden');
          formSuccessAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          setTimeout(() => {
            formSuccessAlert.classList.add('hidden');
          }, 8000);
        }
      }, 1000);
    });
  }

  // 5. Dynamic Year in Footer
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});
