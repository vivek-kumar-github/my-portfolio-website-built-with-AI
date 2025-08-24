(() => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const year = document.getElementById('year');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const header = document.querySelector('.site-header');

  // Track focus for accessibility when mobile menu is open
  let lastFocusedBeforeMenu = null;
  let focusTrapHandler = null;

  function getStoredTheme() {
    try { return localStorage.getItem('theme'); } catch (_) { return null; }
  }
  function setStoredTheme(value) {
    try { localStorage.setItem('theme', value); } catch (_) {}
  }

  function applyTheme(mode) {
    if (mode === 'dark' || (mode === 'auto' && prefersDark.matches)) {
      root.setAttribute('data-theme', 'dark');
      themeToggle && (themeToggle.ariaPressed = 'true');
    } else if (mode === 'light') {
      root.setAttribute('data-theme', 'light');
      themeToggle && (themeToggle.ariaPressed = 'false');
    } else {
      root.setAttribute('data-theme', 'auto');
      themeToggle && (themeToggle.ariaPressed = 'false');
    }
  }

  function initTheme() {
    const stored = getStoredTheme();
    if (!stored) {
      // Default to auto
      applyTheme('auto');
      return;
    }
    applyTheme(stored);
  }

  function cycleTheme() {
    const current = root.getAttribute('data-theme') || 'auto';
    const next = current === 'auto' ? 'dark' : current === 'dark' ? 'light' : 'auto';
    setStoredTheme(next);
    applyTheme(next);
  }

  // --- Layout helpers ---
  function setHeaderHeightVar() {
    const h = header ? header.offsetHeight : 60;
    root.style.setProperty('--header-h', `${h}px`);
  }

  function debounce(fn, wait = 150) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  }

  // Keep ARIA state in sync so nav is only exposed on mobile when open
  const mobileMQ = window.matchMedia('(max-width: 720px)');
  function updateNavAria() {
    if (!nav) return;
    const isMobile = mobileMQ.matches;
    const isOpen = nav.classList.contains('open');
    if (isMobile) {
      nav.setAttribute('aria-hidden', String(!isOpen));
      navToggle && navToggle.setAttribute('aria-expanded', String(isOpen));
    } else {
      // On desktop, nav is part of the layout and should be exposed
      nav.setAttribute('aria-hidden', 'false');
      navToggle && navToggle.setAttribute('aria-expanded', 'false');
    }
  }

  function setupNav() {
    if (!nav || !navToggle) return;
    
    // Toggle mobile menu
    navToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.classList.toggle('open');
      updateNavAria();
      
      // Prevent body scroll when menu is open
      if (open) {
        document.body.style.overflow = 'hidden';
        // Save last focused element and move focus into the menu
        lastFocusedBeforeMenu = document.activeElement;
        startFocusTrap();
        // Focus the first focusable element in the nav
        const first = getFocusableInNav()[0];
        if (first) first.focus();
      } else {
        document.body.style.overflow = '';
        stopFocusTrap();
        // Restore focus to the toggle for context
        navToggle.focus();
      }
    });
    
    // Close on link click (mobile)
    nav.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        stopFocusTrap();
        navToggle.focus();
        updateNavAria();
      }
    });
    
    // Close on click outside
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('open') && 
          !nav.contains(e.target) && 
          !navToggle.contains(e.target)) {
        nav.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        stopFocusTrap();
        navToggle.focus();
        updateNavAria();
      }
    });
  }

  function getFocusableInNav() {
    if (!nav) return [];
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    return Array.from(nav.querySelectorAll(selectors))
      .filter(el => el.offsetParent !== null || getComputedStyle(el).position === 'fixed');
  }

  function startFocusTrap() {
    if (focusTrapHandler) return; // already active
    focusTrapHandler = (e) => {
      if (e.key !== 'Tab' || !nav.classList.contains('open')) return;
      const focusables = getFocusableInNav();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !nav.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !nav.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', focusTrapHandler);
  }

  function stopFocusTrap() {
    if (focusTrapHandler) {
      document.removeEventListener('keydown', focusTrapHandler);
      focusTrapHandler = null;
    }
    if (lastFocusedBeforeMenu && document.body.contains(lastFocusedBeforeMenu)) {
      // optional: we already focus navToggle, so just clear reference
    }
    lastFocusedBeforeMenu = null;
  }

  function setupScrollAnimations() {
    const items = document.querySelectorAll('[data-animate]');
    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.12 });
    items.forEach(el => io.observe(el));
  }

  function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.textContent = 'Sending…';
      const data = new FormData(form);
      try {
        const res = await fetch(form.action, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          status.textContent = 'Thanks! I will get back to you soon.';
          form.reset();
        } else {
          status.textContent = 'Something went wrong. Please try again later or email me directly.';
        }
      } catch (err) {
        status.textContent = 'Network error. Please try again later.';
      }
    });
  }

  function initYear() {
    if (year) year.textContent = new Date().getFullYear();
  }

  // Init
  initTheme();
  prefersDark.addEventListener('change', () => applyTheme(getStoredTheme() || 'auto'));
  themeToggle && themeToggle.addEventListener('click', cycleTheme);
  setupNav();
  setupScrollAnimations();
  setupContactForm();
  initYear();
  setHeaderHeightVar();
  updateNavAria();
  // Sync on viewport changes
  const onResize = debounce(() => { setHeaderHeightVar(); updateNavAria(); }, 200);
  window.addEventListener('resize', onResize);
  mobileMQ.addEventListener ? mobileMQ.addEventListener('change', updateNavAria) : mobileMQ.addListener(updateNavAria);
})();



