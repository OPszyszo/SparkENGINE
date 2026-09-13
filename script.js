/* =========================================================
   Spark Engine — script.js
   ---------------------------------------------------------
   1.  Helpers
   2.  Smooth scrolling (custom easing + offset for navbar)
   3.  Navbar (scroll state, hamburger, scroll-spy)
   4.  Scroll reveal animations
   5.  Placeholder download links
   6.  Spark PLUS activation (code)
   7.  Toast
   ========================================================= */

(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* =========================================================
     1. SMOOTH SCROLLING
     ---------------------------------------------------------
     Custom smooth scroll with easing + offset for the fixed
     navbar. Respects prefers-reduced-motion.
     ========================================================= */
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const NAV_OFFSET = 80; // px – distance below the fixed navbar

  /** Cubic ease-in-out. */
  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /** Animate window scroll to a target Y position. */
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

  /** Scroll smoothly to an element by id. */
  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const targetY = rect.top + window.pageYOffset - NAV_OFFSET;
    animateScrollTo(Math.max(0, targetY), 950);
  }

  /* Wire up every link that has [data-scroll] or href="#..." */
  $$('a[data-scroll], a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#')) return;

      const id = href.slice(1);
      if (!id) return;

      /* Only intercept if the target element exists */
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      scrollToId(id);

      /* Update URL hash without jumping */
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

  /* Close drawer when a nav link is clicked */
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

  /* Scroll-spy */
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
     3. SCROLL REVEAL ANIMATIONS
     ========================================================= */
  const revealItems = $$('.reveal');

  if ('IntersectionObserver' in window && revealItems.length) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

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
     5. SPARK PLUS — ACTIVATION BY CODE
     ---------------------------------------------------------
     Valid demo codes are listed below. Replace this list with
     your real validation later (e.g. server request).
     ========================================================= */
  const VALID_CODES = [
    'SPARK-PLUS-2026',
    'SPARK-FREE-0001',
    'SPARK-BETA-KEYS'
  ];

  const plusForm      = $('#plusForm');
  const plusInput     = $('#plusCode');
  const plusStatus    = $('#plusStatus');
  const plusActivated = $('#plusActivated');
  const plusReset     = $('#plusReset');

  const STORAGE_KEY = 'spark-plus-activated';

  /** Show the status message under the form. */
  function setPlusStatus(message, type) {
    if (!plusStatus) return;
    plusStatus.textContent = message;
    plusStatus.className = 'plus-status ' + (type === 'error' ? 'is-error' : 'is-success');
    plusStatus.hidden = !message;
  }

  /** Switch the card into "activated" state. */
  function showActivated() {
    if (plusForm) plusForm.hidden = true;
    if (plusStatus) plusStatus.hidden = true;
    if (plusActivated) plusActivated.hidden = false;
  }

  /** Switch back to the form (used for the reset button). */
  function showForm() {
    if (plusForm) plusForm.hidden = false;
    if (plusActivated) plusActivated.hidden = true;
    if (plusInput) plusInput.value = '';
    setPlusStatus('', '');
  }

  /** Restore state on load. */
  try {
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      showActivated();
    }
  } catch (err) {
    /* Storage may be unavailable – silently ignore */
  }

  /* Handle code submission */
  if (plusForm) {
    plusForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const raw = (plusInput?.value || '').trim().toUpperCase();

      if (!raw) {
        setPlusStatus('Wpisz kod aktywacyjny.', 'error');
        return;
      }

      if (VALID_CODES.includes(raw)) {
        setPlusStatus('Kod poprawny — aktywuję Spark PLUS…', 'success');

        try { localStorage.setItem(STORAGE_KEY, '1'); } catch (err) {}

        /* Short delay so the user sees the confirmation */
        window.setTimeout(() => {
          showActivated();
          showToast('Spark PLUS został aktywowany.');
        }, 700);
      } else {
        setPlusStatus('Nieprawidłowy kod aktywacyjny. Spróbuj ponownie.', 'error');
      }
    });
  }

  /* Reset (useful for testing) */
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
