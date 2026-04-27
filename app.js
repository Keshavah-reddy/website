/**
 * FusionX Collab - Client-Side Application Logic
 * Wrapped to prevent Vercel Serverless Function errors.
 */

if (typeof window !== 'undefined') {
  // Global Browser-specific Constants
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isHashLanding = Boolean(window.location.hash);

  /* ===== LOADER ===== */
  const loader = document.getElementById('loader');
  const pathName = (window.location.pathname || '').toLowerCase();
  const hasHash = Boolean(window.location.hash);

  const normalizedPath = (() => {
    if (!pathName || pathName === '/') return '/index.html';
    return pathName.endsWith('/') ? `${pathName}index.html` : pathName;
  })();

  const loaderSeenKey = `fc_loader_seen_${normalizedPath}`;
  const forceLoaderOnce = (() => {
    try {
      return sessionStorage.getItem('fc_force_loader_once') === '1';
    } catch {
      return false;
    }
  })();

  const runLoader = () => {
    if (!loader) return;
    document.body.classList.add('is-loading');
    loader.style.display = 'flex';
    loader.style.alignItems = 'center';
    loader.style.justifyContent = 'center';
    loader.classList.remove('is-hidden');

    const LOADER_MS = prefersReducedMotion ? 220 : 1200;
    setTimeout(() => loader.classList.add('is-hidden'), LOADER_MS);
    setTimeout(() => {
      loader.style.display = 'none';
      document.body.classList.remove('is-loading');
    }, LOADER_MS + 280);
  };

  const hideLoader = () => {
    if (loader) loader.style.display = 'none';
    document.body.classList.remove('is-loading');
  };

  if (loader && !hasHash) {
    const seen = (() => {
      try {
        return sessionStorage.getItem(loaderSeenKey) === '1';
      } catch {
        return false;
      }
    })();

    if (forceLoaderOnce || !seen) {
      runLoader();
      try {
        sessionStorage.setItem(loaderSeenKey, '1');
      } catch {}
    } else {
      hideLoader();
    }

    if (forceLoaderOnce) {
      try {
        sessionStorage.removeItem('fc_force_loader_once');
      } catch {}
    }
  } else {
    hideLoader();
  }

  /* ===== MOBILE NAV ===== */
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      setTimeout(() => {
        const headerEl = document.querySelector('.site-header');
        const h = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 76;
        document.documentElement.style.setProperty('--header-offset', `${h}px`);
      }, 0);
    });
  }

  /* ===== THEME LOCK (DARK ONLY) ===== */
  document.documentElement.setAttribute('data-theme', 'dark');
  try { localStorage.removeItem('fc_theme'); } catch {}

  /* ===== MOBILE CLASS ===== */
  const setMobileClass = () => {
    document.documentElement.classList.toggle('is-mobile', window.innerWidth <= 900);
  };
  setMobileClass();
  window.addEventListener('resize', setMobileClass);

  /* ===== HASH NAV ===== */
  const header = document.querySelector('.site-header');
  const syncHeaderOffset = () => {
    const h = header ? Math.ceil(header.getBoundingClientRect().height) : 76;
    document.documentElement.style.setProperty('--header-offset', `${h}px`);
  };
  syncHeaderOffset();
  window.addEventListener('resize', syncHeaderOffset);

  const headerOffset = () => (header ? header.getBoundingClientRect().height + 10 : 84);

  const scrollToHash = (hash, push = true) => {
    if (!hash || !hash.startsWith('#')) return;
    const el = document.querySelector(hash);
    if (!el) return;
    const top = window.scrollY + el.getBoundingClientRect().top - headerOffset();
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    if (push) history.replaceState(null, '', hash);
  };

  [...document.querySelectorAll('a[href^="#"]')].forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      e.preventDefault();
      if (nav) nav.classList.remove('open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
      scrollToHash(href);
    });
  });

  if (window.location.hash) {
    setTimeout(() => scrollToHash(window.location.hash, false), 80);
  }

  /* ===== PAGE TRANSITION LOADER (INTERNAL LINKS) ===== */
  const startPageTransition = (toHref) => {
    if (!toHref) return;

    if (loader) {
      loader.style.display = 'flex';
      loader.style.alignItems = 'center';
      loader.style.justifyContent = 'center';
      loader.classList.remove('is-hidden');
      document.body.classList.add('is-loading');
      try {
        sessionStorage.setItem('fc_force_loader_once', '1');
      } catch {}
    }

    const delay = prefersReducedMotion ? 0 : 220;
    window.setTimeout(() => {
      window.location.href = toHref;
    }, delay);
  };

  [...document.querySelectorAll('a[href]')].forEach((a) => {
    const rawHref = a.getAttribute('href') || '';
    if (rawHref.startsWith('#')) return;

    a.addEventListener('click', (e) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.hasAttribute('download')) return;
      if ((a.getAttribute('target') || '').toLowerCase() === '_blank') return;

      let url;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash
      ) {
        return;
      }
      if (url.href === window.location.href) return;

      e.preventDefault();
      if (nav) nav.classList.remove('open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
      startPageTransition(url.href);
    });
  });

  /* ===== ACTIVE NAV ===== */
  const anchorLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  const anchorMap = anchorLinks
    .map((a) => ({ a, id: a.getAttribute('href') }))
    .filter((x) => document.querySelector(x.id));

  if (anchorMap.length) {
    const setActive = () => {
      let current = '#home';
      for (const x of anchorMap) {
        const sec = document.querySelector(x.id);
        if (!sec) continue;
        const top = sec.getBoundingClientRect().top;
        if (top - headerOffset() <= 22) current = x.id;
      }
      anchorLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === current));
    };
    window.addEventListener('scroll', setActive, { passive: true });
    setActive();
  }

  /* ===== SCROLL PROGRESS ===== */
  const progress = document.getElementById('scrollProgress');
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${pct}%`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  /* ===== CURSOR GLOW ===== */
  const cursorGlow = document.getElementById('cursorGlow');
  if (cursorGlow && !prefersReducedMotion) {
    window.addEventListener('mousemove', (e) => {
      cursorGlow.style.left = `${e.clientX}px`;
      cursorGlow.style.top = `${e.clientY}px`;
    });
  }

  /* ===== REVEAL ===== */
  const revealEls = [
    ...document.querySelectorAll(
      '.reveal, .section, .panel, .card, .service-card, .metric-card, .case-card, .team-card, .insight-card, .vertical-card, .policy-card, .dashboard-widget, .cta-band'
    ),
  ];

  if (revealEls.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    revealEls.forEach((el, i) => {
      el.classList.add('reveal-on-scroll');
      el.style.transitionDelay = `${Math.min(i % 6, 5) * 45}ms`;
      obs.observe(el);
    });

    setTimeout(() => revealEls.forEach((el) => el.classList.add('in')), isHashLanding ? 100 : 550);
  }

  /* ===== KPI COUNTERS ===== */
  const
