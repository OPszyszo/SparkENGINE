/* =========================================================
   Spark Engine — script.js
   ---------------------------------------------------------
   1.  Helpers
   2.  Smooth scrolling
   3.  Navbar (scroll state, hamburger, scroll-spy)
   4.  Scroll reveal animations
   5.  Placeholder download links
   6.  Spark PLUS — activation
   7.  Toast
   ========================================================= */

(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* =========================================================
     1. SMOOTH SCROLLING
     ========================================================= */
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const NAV_OFFSET = 80;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateScrollTo(targetY, duration = 900) {
    if (prefersReducedMotion) {
      window.scrollTo(0, targetY);
      return;
    }
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const startTime = performance.now();

    function step(now) {
      const elapsed = Math.min((now - startTime) / duration, 1);
      const eased = easeInOutCubic(elapsed);
      window.scrollTo(0, startY + distance * eased);
      if (elapsed < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const targetY = rect.top + window.pageYOffset - NAV_OFFSET;
    animateScrollTo(Math.max(0, targetY), 950);
  }

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      const id = href.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      scrollToId(id);

      if (history.replaceState) {
        history.replaceState(null, '', '#' + id);
      }
    });
  });

  /* =========================================================
     2. NAVBAR
     ========================================================= */
  const nav       = $('#nav');
  const hamburger = $('#hamburger');
  const navLinks  = $('#navLinks');

  function updateNavScrollState() {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 12);
  }

  function closeMenu() {
    if (!navLinks || !hamburger) return;
    navLinks.classList.remove('is-open');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    if (!navLinks || !hamburger) return;
    const open = navLinks.classList.toggle('is-open');
    hamburger.classList.toggle('is-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  }

  if (hamburger) hamburger.addEventListener('click', toggleMenu);

  $$('.nav-link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (window.innerWidth > 920) closeMenu();
    }, 140);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  const sections = ['top', 'download', 'platforms', 'plus']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const spyLinks = $$('.nav-link');

  function updateScrollSpy() {
    if (!sections.length) return;
    const offset = window.innerHeight * 0.32;
    let activeId = sections[0].id;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= offset) activeId = section.id;
    });

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
      activeId = sections[sections.length - 1].id;
    }

    spyLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      link.classList.toggle('is-active', href === '#' + activeId);
    });
  }

  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      updateNavScrollState();
      updateScrollSpy();
      scrollTicking = false;
    });
  }, { passive: true });

  updateNavScrollState();
  updateScrollSpy();

  /* =========================================================
     3. SCROLL REVEAL
     ========================================================= */
  const revealItems = $$('.reveal');

  if ('IntersectionObserver' in window && revealItems.length) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('is-visible'));
  }

  /* =========================================================
     4. PLACEHOLDER DOWNLOAD LINKS
     ========================================================= */
  $$('[data-placeholder-download]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const platform = link.getAttribute('data-placeholder-download');
      showToast(
        `The ${platform} build is not published yet. Download links are placeholders.`
      );
    });
  });

  /* =========================================================
     5. SPARK PLUS — ACTIVATION
     ---------------------------------------------------------
     Demo codes. Replace with real validation later.
     ========================================================= */
  const VALID_CODES = [
    'SPARK-PLUS-2026',
    'SPARK-FREE-0001',
    'SPARK-BETA-KEYS'
  ];

  const CODE_PREFIX   = 'SPARK';
  const CODE_GROUPS   = 4;   // SPARK-XXXX-XXXX-XXXX  →  4 grupy
  const GROUP_LENGTH  = 4;   // każda grupa ma 4 znaki
  const TOTAL_CHARS   = CODE_GROUPS * GROUP_LENGTH;

  const plusForm    = $('#plusForm');
  const plusInput   = $('#plusCode');
  const plusSubmit  = $('#plusSubmit');
  const plusMessage = $('#plusMessage');
  const plusSuccess = $('#plusSuccess');
  const plusReset   = $('#plusReset');
  const codeWrap    = $('#codeWrap');
  const codeClear   = $('#codeClear');
  const codeCounter = $('#codeCounter');

  const STORAGE_KEY = 'spark-plus-activated';

  /* --- Formatowanie kodu: XXXX-XXXX-XXXX-XXXX --- */
  function formatCode(raw) {
    const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const groups = [];
    for (let i = 0; i < clean.length && groups.length < CODE_GROUPS; i += GROUP_LENGTH) {
      groups.push(clean.slice(i, i + GROUP_LENGTH));
    }
    return groups.join('-');
  }

  /* --- Aktualizacja UI licznika i przycisku --- */
  function updateCodeUI() {
    if (!plusInput || !plusCounter) return;
    const raw = plusInput.value;
    const clean = raw.replace(/[^A-Za-z0-9]/g, '');
    const count = Math.min(clean.length, TOTAL_CHARS);
    codeCounter.textContent = `${count} / ${TOTAL_CHARS} znaków`;
    codeCounter.classList.toggle('is-complete', count === TOTAL_CHARS);

    if (plusSubmit) {
      plusSubmit.disabled = clean.length !== TOTAL_CHARS;
    }
    if (codeClear) {
      codeClear.hidden = raw.length === 0;
    }
  }

  /* --- Ukryj / pokaż komunikat --- */
  function setPlusMessage(text, type) {
    if (!plusMessage) return;
    if (!text) {
      plusMessage.hidden = true;
      plusMessage.textContent = '';
      return;
    }
    plusMessage.textContent = text;
    plusMessage.className = 'activate-message ' + (type === 'error' ? 'is-error' : 'is-info');
    plusMessage.hidden = false;
  }

  /* --- Stany --- */
  function showActivated() {
    if (plusForm) plusForm.hidden = true;
    if (plusMessage) plusMessage.hidden = true;
    if (plusSuccess) plusSuccess.hidden = false;
  }

  function showForm() {
    if (plusForm) plusForm.hidden = false;
    if (plusSuccess) plusSuccess.hidden = true;
    if (plusInput) plusInput.value = '';
    if (codeWrap) codeWrap.classList.remove('is-invalid', 'is-focused');
    setPlusMessage('', '');
    updateCodeUI();
  }

  /* --- Zdarzenia inputu --- */
  if (plusInput) {
    plusInput.addEventListener('input', () => {
      const formatted = formatCode(plusInput.value);
      if (formatted !== plusInput.value) {
        plusInput.value = formatted;
      }
      if (codeWrap) codeWrap.classList.remove('is-invalid');
      updateCodeUI();
    });

    plusInput.addEventListener('focus', () => {
      if (codeWrap) codeWrap.classList.add('is-focused');
    });

    plusInput.addEventListener('blur', () => {
      if (codeWrap) codeWrap.classList.remove('is-focused');
    });
  }

  /* --- Przycisk czyszczenia --- */
  if (codeClear) {
    codeClear.addEventListener('click', () => {
      if (!plusInput) return;
      plusInput.value = '';
      plusInput.focus();
      if (codeWrap) codeWrap.classList.remove('is-invalid');
      updateCodeUI();
      setPlusMessage('', '');
    });
  }

  /* --- Restore z localStorage --- */
  try {
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      showActivated();
    } else {
      updateCodeUI();
    }
  } catch (err) {
    updateCodeUI();
  }

  /* --- Submit --- */
  if (plusForm) {
    plusForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const raw = (plusInput?.value || '').trim().toUpperCase();

      if (raw.length !== TOTAL_CHARS + (CODE_GROUPS - 1)) {
        setPlusMessage('Wpisz pełny kod aktywacyjny.', 'error');
        if (codeWrap) codeWrap.classList.add('is-invalid');
        return;
      }

      /* „Loading” */
      if (plusSubmit) {
        plusSubmit.disabled = true;
        plusSubmit.textContent = 'Sprawdzanie…';
      }

      /* Symulacja krótkiego opóźnienia (usunąć przy realnej walidacji) */
      window.setTimeout(() => {
        if (VALID_CODES.includes(raw)) {
          setPlusMessage('Kod poprawny — aktywuję Spark PLUS…', 'info');
          try { localStorage.setItem(STORAGE_KEY, '1'); } catch (err) {}

          window.setTimeout(() => {
            showActivated();
            showToast('Spark PLUS został aktywowany.');
          }, 650);
        } else {
          if (codeWrap) codeWrap.classList.add('is-invalid');
          setPlusMessage('Nieprawidłowy kod aktywacyjny. Spróbuj ponownie.', 'error');
          if (plusSubmit) {
            plusSubmit.disabled = false;
            plusSubmit.textContent = 'Aktywuj Spark PLUS';
          }
        }
      }, 450);
    });
  }

  /* --- Reset (tryb testowy) --- */
  if (plusReset) {
    plusReset.addEventListener('click', () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
      showForm();
      showToast('Spark PLUS dezaktywowany (tryb testowy).');
    });
  }

  /* =========================================================
     6. TOAST
     ========================================================= */
  const toastEl = $('#toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    void toastEl.offsetWidth;
    toastEl.classList.add('is-visible');

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove('is-visible');
      window.setTimeout(() => { toastEl.hidden = true; }, 320);
    }, 3600);
  }

})();
