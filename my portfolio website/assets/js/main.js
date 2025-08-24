(() => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const year = document.getElementById('year');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

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

  function setupNav() {
    if (!nav || !navToggle) return;
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    // Close on link click (mobile)
    nav.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
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
})();



