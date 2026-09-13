/* =========================================================
   Spark Engine — script.js (download-only site)
   ---------------------------------------------------------
   1.  Helpers
   2.  Navbar (scroll state, hamburger, scroll-spy)
   3.  Scroll reveal animations
   4.  Placeholder download links
   5.  Toast
   ========================================================= */

(function () {
  'use strict';

  /* =========================================================
     1. HELPERS
     ========================================================= */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));


  /* =========================================================
     2. NAVBAR
     ========================================================= */
  const nav       = $('#nav');
  const hamburger = $('#hamburger');
  const navLinks  = $('#navLinks');

  /* Glass background on scroll */
  function updateNavScrollState() {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 12);
  }

  /* Hamburger drawer */
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

  /* Close on resize to desktop */
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (window.innerWidth > 920) closeMenu();
    }, 140);
  });

  /* Close on Escape */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  /* Scroll-spy for the active nav link */
  const sections = ['top', 'download', 'platforms']
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

  /* Throttled scroll handler */
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
     ---------------------------------------------------------
     No real builds exist yet. Buttons are clearly marked as
     placeholders — no fake files are offered.
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
     5. TOAST
     ========================================================= */
  const toastEl = $('#toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;

    toastEl.textContent = message;
    toastEl.hidden = false;

    /* Force reflow so the transition plays */
    void toastEl.offsetWidth;
    toastEl.classList.add('is-visible');

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove('is-visible');
      window.setTimeout(() => { toastEl.hidden = true; }, 320);
    }, 3600);
  }

})();
