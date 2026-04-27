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
const counters = document.querySelectorAll('[data-counter]');
if (counters.length) {
  const animateCounter = (el) => {
    const target = Number(el.dataset.counter || 0);
    const suffix = el.dataset.suffix || '';
    const duration = 1100;
    const start = performance.now();

    const frame = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = target * eased;

      let text;
      if (target >= 1000) text = Math.floor(value).toLocaleString();
      else if (target % 1 !== 0) text = value.toFixed(1).replace('.0', '');
      else text = Math.floor(value).toString();

      el.textContent = `${text}${suffix}`;
      if (p < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  };

  const counterObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterObs.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => counterObs.observe(counter));
}

/* ===== TILT ===== */
if (!prefersReducedMotion) {
  const tiltEls = document.querySelectorAll('[data-tilt]');
  tiltEls.forEach((el) => {
    const max = 5;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const ry = (x - 0.5) * max;
      const rx = (0.5 - y) * max;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

/* ===== CONTACT FORM (INQUIRY TYPE) ===== */
const contactForm = document.querySelector('form[data-contact-form]');
if (contactForm) {
  const inquiryInput = contactForm.querySelector('[name="inquiryType"]');
  const inquiryButtons = [...contactForm.querySelectorAll('[data-inquiry-target]')];
  const conditional = [...contactForm.querySelectorAll('[data-inquiry]')];
  const note = contactForm.querySelector('.form-note');

  const syncInquiryBlocks = () => {
    const value = inquiryInput ? inquiryInput.value : 'brand';
    conditional.forEach((block) => {
      const show = block.getAttribute('data-inquiry') === value;
      block.hidden = !show;
      block.querySelectorAll('input, select, textarea').forEach((field) => {
        if (!show) field.setAttribute('disabled', 'disabled');
        else field.removeAttribute('disabled');
      });
    });
  };

  const setInquiry = (value) => {
    if (!inquiryInput) return;
    inquiryInput.value = value;
    inquiryButtons.forEach((btn) => {
      const active = btn.getAttribute('data-inquiry-target') === value;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    syncInquiryBlocks();
  };

  if (inquiryButtons.length) {
    inquiryButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute('data-inquiry-target') || 'brand';
        setInquiry(value);
      });
    });
  }

  setInquiry((inquiryInput && inquiryInput.value) || 'brand');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (note) {
      note.textContent = 'Submitting your inquiry...';
    }

    window.dispatchEvent(
      new CustomEvent('fc:form_submit_started', {
        detail: { inquiryType: inquiryInput ? inquiryInput.value : 'brand' }
      })
    );

    try {
      const endpoint = contactForm.getAttribute('action') || 'contact.php';
      const res = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });

      let data = null;
      try { data = await res.json(); } catch {}

      if (!res.ok || !data || !data.ok) {
        throw new Error('submit_failed');
      }

      if (note) {
        note.textContent = data.message || 'Thank you. Your inquiry has been sent successfully.';
      }

      window.dispatchEvent(
        new CustomEvent('fc:form_submit_success', {
          detail: { message: note ? note.textContent : '' }
        })
      );

      contactForm.reset();
      setInquiry('brand');
    } catch (err) {
      if (note) {
        note.textContent = 'Submission failed right now. Please email contact@fusionxcollab.in directly (backup: contact@fusioncollab.in).';
      }

      window.dispatchEvent(
        new CustomEvent('fc:form_submit_error', {
          detail: { message: note ? note.textContent : '' }
        })
      );
    }
  });
}

/* ===== EMAIL FALLBACK (WINDOWS / MOBILE SAFE) ===== */
(() => {
  // Keep copy buttons only in footer contact block to avoid duplicate UI on mobile overlays
  const allCopyButtons = Array.from(document.querySelectorAll('.copy-btn[data-email]'));
  for (const btn of allCopyButtons) {
    if (!btn.closest('footer')) btn.remove();
  }

  const attachCopy = (btn, email) => {
    if (!btn || !email) return;
    if (btn.dataset.boundCopy === '1') return;
    btn.dataset.boundCopy = '1';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(email);
        const old = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = old; }, 1400);
      } catch (_) {
        // no-op
      }
    });
  };

  // Normalize all email links
  const links = Array.from(document.querySelectorAll('a.email-link[href^="mailto:"]'));
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    let email = href.replace(/^mailto:/i, '').split('?')[0].trim();
    if (!email) email = (link.textContent || '').trim();
    if (!email || !email.includes('@')) continue;

    const subject = encodeURIComponent('FusionX Collab Inquiry');
    link.setAttribute('href', `mailto:${email}?subject=${subject}`);
    link.textContent = email;
  }

  // Bind footer-only copy buttons (do not auto-create buttons)
  // Also dedupe per email so mobile menu never shows extra copy buttons.
  const footerButtons = Array.from(document.querySelectorAll('footer .copy-btn'));
  const seenEmails = new Set();
  for (const btn of footerButtons) {
    let email = (btn.dataset.email || '').trim().toLowerCase();

    if (!email) {
      const row = btn.closest('.contact-email-row') || btn.parentElement;
      const link = row ? row.querySelector('a.email-link[href^="mailto:"]') : null;
      if (link) {
        email = (link.getAttribute('href') || '').replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase();
      }
    }

    if (!email || seenEmails.has(email)) {
      btn.remove();
      continue;
    }

    btn.dataset.email = email;
    seenEmails.add(email);
    attachCopy(btn, email);
  }
})();

/* ===== YEAR (LOCKED AS REQUESTED) ===== */
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = '2023';
});

/* ===== TEAM PHOTO FAILSAFE (CACHE-SAFE) ===== */
(() => {
  const v = '20260407vs2';

  const makeImg = (alt, src, className) => {
    const img = document.createElement('img');
    img.alt = alt;
    img.className = className;
    img.decoding = 'async';
    img.loading = 'lazy';
    img.src = src;
    return img;
  };

  const bindFallback = (img, initials) => {
    if (!img) return;
    img.addEventListener('error', () => {
      if (img.dataset.failed === '1') return;
      img.dataset.failed = '1';
      const fallback = document.createElement('div');
      fallback.className = 'avatar';
      fallback.textContent = initials;
      img.replaceWith(fallback);
    });
  };

  const ensureTeamPhotos = () => {
    const teamGrid = document.querySelector('#team [data-team-grid]');
    if (!teamGrid) return;

    const insertBeforeCreative = (card) => {
      const creativeCard = [...teamGrid.querySelectorAll('.team-card')].find((el) =>
        (el.textContent || '').includes('Rick Das')
      );
      if (creativeCard) teamGrid.insertBefore(card, creativeCard);
      else teamGrid.appendChild(card);
    };

    const ensureMemberCard = (name, initials, src, className, cardHtml) => {
      const nameEl = [...teamGrid.querySelectorAll('h3')].find(
        (el) => el.textContent.trim() === name
      );

      let card;
      if (!nameEl) {
        card = document.createElement('article');
        card.className = 'team-card founder';
        card.innerHTML = cardHtml;
        insertBeforeCreative(card);
      } else {
        card = nameEl.closest('.team-card');
      }

      const top = card && card.querySelector('.member-top');
      if (!top) return;

      let img = top.querySelector('img.staff-photo');
      if (!img) {
        img = makeImg(name, src, className);
        const avatar = top.querySelector('.avatar');
        if (avatar) avatar.replaceWith(img);
        else top.prepend(img);
      } else {
        img.src = src;
        img.alt = name;
        img.className = className;
      }

      bindFallback(img, initials);
    };

    ensureMemberCard(
      'Shaikh Faiz',
      'SF',
      `assets/shaikh-faiz-team.jpg?v=${v}`,
      'staff-photo founder-photo',
      '<div class="member-top"><img alt="Shaikh Faiz" class="staff-photo founder-photo" decoding="async" loading="lazy" src="https://fusioncollab.in/assets/shaikh-faiz-team.jpg?v=' + v + '"/><div><div class="member-tag">Founder</div><h3>Shaikh Faiz</h3><div class="member-role">Founder &amp; CEO</div></div></div><p>Leads FusionX Collab strategy, creator growth partnerships, and campaign execution systems across gaming and creator-led verticals.</p>'
    );

    ensureMemberCard(
      'Denish Sarva',
      'DS',
      `assets/denish-sarva-team.jpg?v=${v}`,
      'staff-photo denish-photo',
      '<div class="member-top"><img alt="Denish Sarva" class="staff-photo denish-photo" decoding="async" loading="lazy" src="https://fusioncollab.in/assets/denish-sarva-team.jpg?v=' + v + '"/><div><div class="member-tag">Co-Founder</div><h3>Denish Sarva</h3><div class="member-role">Co-Founder &amp; Head of Data &amp; Analytics</div></div></div><p>Data systems, campaign tracking, revenue analytics, and reporting infrastructure.</p>'
    );

    ensureMemberCard(
      'Vikram Singh',
      'VS',
      `assets/vikram-singh-team.jpg?v=${v}`,
      'staff-photo vikram-photo',
      '<div class="member-top"><img alt="Vikram Singh" class="staff-photo vikram-photo" decoding="async" loading="lazy" src="https://fusioncollab.in/assets/vikram-singh-team.jpg?v=' + v + '"/><div><div class="member-tag">Co-Founder</div><h3>Vikram Singh</h3><div class="member-role">Co-Founder &amp; CMO</div></div></div><p>Leads creator acquisition, relationship management, deal negotiations, and talent growth strategy across Fusion Collab.</p>'
    );

    ensureMemberCard(
      'Shishir Kumar',
      'SK',
      `assets/shishir-kumar-team.jpg?v=${v}`,
      'staff-photo shishir-photo',
      '<div class="member-top"><img alt="Shishir Kumar" class="staff-photo shishir-photo" decoding="async" loading="lazy" src="https://fusioncollab.in/assets/shishir-kumar-team.jpg?v=' + v + '"/><div><div class="member-tag">Talent</div><h3>Shishir Kumar</h3><div class="member-role">Creator Acquisition &amp; Talent Growth</div></div></div><p>Leads creator acquisition, relationship management, deal negotiations, and talent growth strategy across Fusion Collab.</p>'
    );

ensureMemberCard(
      'Isha Patil',
      'IP',
      `assets/isha-patil-team.jpg?v=${v}`,
      'staff-photo isha-photo',
      '<div class="member-top"><img alt="Isha Patil" class="staff-photo isha-photo" decoding="async" loading="lazy" src="https://fusioncollab.in/assets/isha-patil-team.jpg?v=' + v + '"/><div><div class="member-tag">Partnerships</div><h3>Isha Patil</h3><div class="member-role">Head of Brand Partnerships &amp; Creator Relations</div></div></div><p>Leads brand partnership development, creator relationship management, and collaboration planning to maximize campaign fit, retention, and long-term revenue growth.</p>'
    );

    ensureMemberCard(
      'Rishana Rahman',
      'RR',
      `assets/rishana-rahman-team.jpg?v=${v}`,
      'staff-photo rishana-photo',
      '<div class="member-top"><img alt="Rishana Rahman" class="staff-photo rishana-photo" decoding="async" loading="lazy" src="https://fusioncollab.in/assets/rishana-rahman-team.jpg?v=' + v + '"/><div><div class="member-tag">Operations</div><h3>Rishana Rahman</h3><div class="member-role">Campaign Operations Associate</div></div></div><p>Supports campaign coordination, creator communication, and daily execution follow-ups to keep brand deliverables on track.</p>'
    );

    ensureMemberCard(
      'Pratiksha S.',
      'PS',
      `assets/pratiksha-s-team.jpg?v=${v}`,
      'staff-photo pratiksha-photo',
      '<div class="member-top"><img alt="Pratiksha S." class="staff-photo pratiksha-photo" decoding="async" loading="lazy" src="https://fusioncollab.in/assets/pratiksha-s-team.jpg?v=' + v + '"/><div><div class="member-tag">Support</div><h3>Pratiksha S.</h3><div class="member-role">Creator Support Associate</div></div></div><p>Supports creator communication, content handoff coordination, and day-to-day follow-ups to keep campaign delivery smooth.</p>'
    );
    ensureMemberCard(
      'Rick Das',
      'RD',
      `assets/rick-das-team.jpg?v=${v}`,
      'staff-photo rick-photo',
      '<div class="member-top"><img alt="Rick Das" class="staff-photo rick-photo" decoding="async" loading="lazy" src="https://fusioncollab.in/assets/rick-das-team.jpg?v=' + v + '"/><div><div class="member-tag">Creative</div><h3>Rick Das</h3><div class="member-role">Creative Director</div></div></div><p>Creative strategy, visual identity, branding, and content design direction.</p>'
    );

  };

  ensureTeamPhotos();
  setTimeout(ensureTeamPhotos, 200);
  setTimeout(ensureTeamPhotos, 1200);
})();

/* ===== BACKGROUND PARTICLES ===== */
const bg = document.getElementById('bgfx');
if (bg && !prefersReducedMotion && window.innerWidth > 900) {
  const ctx = bg.getContext('2d');
  let w = 0;
  let h = 0;
  let dpr = 1;
  let mx = -999;
  let my = -999;
  let points = [];
  let stars = [];

  const rand = (min, max) => Math.random() * (max - min) + min;

  const reset = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);

    bg.width = Math.round(w * dpr);
    bg.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const area = w * h;
    const pointCount = Math.min(130, Math.max(64, Math.round(area / 42000)));
    const starCount = Math.min(260, Math.max(90, Math.round(area / 22000)));

    points = Array.from({ length: pointCount }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      vx: rand(-0.16, 0.16),
      vy: rand(-0.16, 0.16),
      r: rand(0.8, 1.9),
    }));

    stars = Array.from({ length: starCount }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      r: rand(0.6, 1.6),
      a: rand(0.12, 0.7),
      tw: rand(0.002, 0.012),
    }));
  };

  window.addEventListener('resize', reset);
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  reset();

  const draw = () => {
    ctx.clearRect(0, 0, w, h);

    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.12, w * 0.5, h * 0.52, h * 0.95);
    vignette.addColorStop(0, 'rgba(10, 12, 18, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.46)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.a += s.tw * (Math.random() > 0.5 ? 1 : -1);
      if (s.a < 0.05) s.a = 0.05;
      if (s.a > 0.86) s.a = 0.86;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 245, 248, ${s.a * 0.52})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const pointerGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 260);
    pointerGrad.addColorStop(0, 'rgba(255, 67, 98, 0.09)');
    pointerGrad.addColorStop(1, 'rgba(255, 67, 98, 0)');
    ctx.fillStyle = pointerGrad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      const mDist = Math.hypot(mx - p.x, my - p.y);
      if (mDist < 180) {
        p.x -= (mx - p.x) * 0.0012;
        p.y -= (my - p.y) * 0.0012;
      }

      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 82, 114, 0.26)';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < points.length; j++) {
        const q = points[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 110) {
          ctx.strokeStyle = `rgba(255, 72, 104, ${(110 - d) / 900})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  };

  draw();
}

/* ===== FUSION GUIDE CHARACTER (LOCAL PROTOTYPE) ===== */
(() => {
  const sections = [...document.querySelectorAll('main section, section')];
  if (!sections.length) return;

  sections.forEach((section, idx) => {
    if (!section.id) section.id = `fc-auto-section-${idx + 1}`;
  });

  const lowPower =
    prefersReducedMotion ||
    ((navigator.hardwareConcurrency || 8) <= 4) ||
    ((navigator.deviceMemory || 8) <= 4);

  const path = (window.location.pathname || '').toLowerCase();
  const pageName = path.split('/').pop() || 'index.html';

  const safeGet = (key, fallback = null) => {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch {
      return fallback;
    }
  };
  const safeSet = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  };

  const totalVisits = Number(safeGet('fc_guide_total_visits', '0')) + 1;
  safeSet('fc_guide_total_visits', String(totalVisits));
  const pageVisitKey = `fc_guide_visits_${pageName}`;
  const pageVisits = Number(safeGet(pageVisitKey, '0')) + 1;
  safeSet(pageVisitKey, String(pageVisits));
  const isFirstEverVisit = totalVisits <= 1;

  const sectionMeta = {
    home: {
      tip: 'Welcome to FusionX Collab. I will guide you through strategy, execution, and results.',
      selector: '.hero .btn.primary, .hero h1',
      mood: 'react',
      dock: 'right',
      mode: 'guide'
    },
    brands: {
      tip: 'These are representative brand logos from our network.',
      selector: '.trusted-marquee, .logo-chip, .section-title',
      mood: 'focus',
      dock: 'right',
      mode: 'guide'
    },
    approach: {
      tip: 'Our approach combines strategy, execution, and reporting loops.',
      selector: '.section-title, .service-card',
      mood: 'focus',
      dock: 'right',
      mode: 'guide'
    },
    'brand-evaluation': {
      tip: 'These insight prompts align campaign design with business goals.',
      selector: '.section-title, .panel, .service-card',
      mood: 'point',
      dock: 'right',
      mode: 'assist'
    },
    'brand-confidence': {
      tip: 'This section highlights control, governance, and execution quality.',
      selector: '.section-title, .service-card',
      mood: 'focus',
      dock: 'right',
      mode: 'assist'
    },
    creators: {
      tip: 'Creator programs are structured for performance and consistency.',
      selector: '.section-title, .creator-card, .program-card, .service-card',
      mood: 'focus',
      dock: 'left',
      mode: 'guide'
    },
    team: {
      tip: 'Leadership and operations drive daily campaign outcomes.',
      selector: '.section-title, .team-card',
      mood: 'focus',
      dock: 'left',
      mode: 'guide',
      milestone: 'Team section reviewed. Good coverage.'
    },
    'leadership-model': {
      tip: 'Here is how decisions move from strategy to execution.',
      selector: '.section-title, .creator-story, .service-card',
      mood: 'point',
      dock: 'left',
      mode: 'assist'
    },
    insights: {
      tip: 'Use these insight cards to understand conversion-focused thinking.',
      selector: '.section-title, .service-card, .insight-card',
      mood: 'focus',
      dock: 'right',
      mode: 'guide'
    },
    contact: {
      tip: 'Share objective plus timeline. We will propose a practical execution plan.',
      selector: '.section-title, .contact-card, .btn.primary, form',
      mood: 'point',
      dock: 'left',
      mode: 'assist',
      milestone: 'Contact section reached. Ready to convert.'
    },
    'founders-roles': {
      tip: 'Governance roles define strategic and operational accountability.',
      selector: '.policy-card, .section-title',
      mood: 'focus',
      dock: 'right',
      mode: 'guide',
      milestone: 'Governance viewed. Trust signal improved.'
    }
  };

  const dynamicTip = (section) => {
    const heading = section.querySelector('h1, h2, h3');
    if (!heading) return 'Explore this section for key campaign details.';
    const title = heading.textContent.trim().replace(/\s+/g, ' ');
    return `Explore this section: ${title}.`;
  };

  const initialSection = sections[0];
  const initialMeta = sectionMeta[initialSection.id] || null;
  const defaultInitialTip = initialMeta?.tip || dynamicTip(initialSection);
  const initialTip = isFirstEverVisit
    ? 'Welcome. I am your Fusion guide for this walkthrough.'
    : (pageVisits > 1
        ? `Welcome back. Continuing ${pageName.replace('.html', '')} walkthrough.`
        : defaultInitialTip);

  const guide = document.createElement('aside');
  guide.className = 'fc-guide';
  guide.dataset.mood = 'idle';
  guide.dataset.mode = isFirstEverVisit ? 'guide' : 'assist';
  if (lowPower) guide.classList.add('low-power');
  guide.setAttribute('aria-hidden', 'true');
  guide.innerHTML = `
    <div class="fc-guide-bubble">${initialTip}</div>
    <div class="fc-guide-character" title="Fusion guide">
      <div class="fc-guide-antenna"></div>
      <div class="fc-guide-shadow"></div>
      <div class="fc-guide-head">
        <span class="fc-eye fc-eye-left"><span class="fc-pupil"></span></span>
        <span class="fc-eye fc-eye-right"><span class="fc-pupil"></span></span>
        <span class="fc-cheek fc-cheek-left"></span>
        <span class="fc-cheek fc-cheek-right"></span>
        <span class="fc-smile"></span>
      </div>
      <div class="fc-guide-body">
        <span class="fc-guide-badge"></span>
      </div>
      <div class="fc-guide-arm fc-guide-arm-left"></div>
      <div class="fc-guide-arm fc-guide-arm-right"></div>
      <div class="fc-guide-ping"></div>
    </div>
  `;
  document.body.appendChild(guide);

  const bubble = guide.querySelector('.fc-guide-bubble');
  const guideCharacter = guide.querySelector('.fc-guide-character');

  let activeSectionId = '';
  let focusedEl = null;
  let eyeTarget = null;
  let manualDockUntil = 0;
  let lastInteractionTs = Date.now();
  let lastNudgeAt = 0;
  let bubbleResetTimer = null;
  let modeTimer = null;

  const completedKey = 'fc_guide_completed_sections';
  const completed = (() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem(completedKey) || '[]'));
    } catch {
      return new Set();
    }
  })();

  const saveCompleted = () => {
    try {
      sessionStorage.setItem(completedKey, JSON.stringify([...completed]));
    } catch {}
  };

  const setDock = (dock = 'right', holdMs = 0) => {
    if (dock === 'left') guide.classList.add('at-left');
    else guide.classList.remove('at-left');
    if (holdMs > 0) manualDockUntil = Date.now() + holdMs;
  };

  const setMode = (mode = 'guide', holdMs = 0) => {
    guide.dataset.mode = mode;
    if (holdMs > 0) {
      window.clearTimeout(modeTimer);
      modeTimer = window.setTimeout(() => {
        guide.dataset.mode = 'guide';
      }, holdMs);
    }
  };

  const setMood = (mood, ms = 1200) => {
    guide.dataset.mood = mood;
    if (ms > 0) {
      window.clearTimeout(setMood._timer);
      setMood._timer = window.setTimeout(() => {
        guide.dataset.mood = 'idle';
      }, ms);
    }
  };

  const setBubble = (message, holdMs = 0) => {
    if (!message) return;
    bubble.textContent = message;
    if (holdMs > 0) {
      window.clearTimeout(bubbleResetTimer);
      bubbleResetTimer = window.setTimeout(() => {
        if (activeSectionId) {
          const section = document.getElementById(activeSectionId);
          if (section) {
            const meta = sectionMeta[section.id] || null;
            bubble.textContent = meta?.tip || dynamicTip(section);
          }
        }
      }, holdMs);
    }
  };

  const clearFocus = () => {
    if (!focusedEl) return;
    focusedEl.classList.remove('fc-guide-focus');
    focusedEl = null;
  };

  const pointToSection = (section) => {
    clearFocus();
    const meta = sectionMeta[section.id] || null;
    const selector = meta?.selector || '.section-title, h2, .btn.primary, .service-card, .team-card, .policy-card';
    const target = section.querySelector(selector);
    if (!target) return;
    target.classList.add('fc-guide-focus');
    focusedEl = target;
    eyeTarget = target;
    window.setTimeout(clearFocus, 1700);
  };

  const markMilestone = (sectionId) => {
    const meta = sectionMeta[sectionId];
    if (!meta?.milestone) return;
    if (completed.has(sectionId)) return;

    completed.add(sectionId);
    saveCompleted();
    guide.classList.add('is-celebrating');
    setMode('assist', 5000);
    setMood('done', 1700);
    setBubble(meta.milestone, 2400);
    window.setTimeout(() => guide.classList.remove('is-celebrating'), 980);
  };

  const chooseSafeDock = (preferredDock) => {
    let dock = preferredDock;
    const cta = document.querySelector('.btn.primary, button[type="submit"], .cta-band .btn');
    if (!cta) return dock;

    const rect = cta.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const overlapLeft = rect.left < vw * 0.42 && rect.bottom > vh * 0.58;
    const overlapRight = rect.right > vw * 0.58 && rect.bottom > vh * 0.58;

    if (dock === 'left' && overlapLeft) dock = 'right';
    if (dock === 'right' && overlapRight) dock = 'left';
    return dock;
  };

  const dodgeGuide = (event) => {
    const vw = window.innerWidth;
    const x = event && typeof event.clientX === 'number' ? event.clientX : vw / 2;
    const preferredDock = x >= vw * 0.5 ? 'left' : 'right';
    const currentlyLeft = guide.classList.contains('at-left');

    let dock = chooseSafeDock(preferredDock);
    // ensure visible movement intent: if same side, force opposite
    if ((dock === 'left') === currentlyLeft) {
      dock = currentlyLeft ? 'right' : 'left';
    }

    setDock(dock, 3200);
    guide.classList.add('is-dodging');
    setMode('assist', 4200);
    setMood('react', 1200);
    setBubble(dock === 'left' ? 'Caught me. I will guide from this side.' : 'Too close. Switching to this side.', 1800);

    window.setTimeout(() => {
      guide.classList.remove('is-dodging');
    }, 760);
  };

  const runBlinkLoop = () => {
    if (lowPower) return;
    const blinkOnce = () => {
      if (document.hidden) {
        window.setTimeout(blinkOnce, 1800);
        return;
      }
      const roll = Math.random();
      if (roll < 0.24) {
        const winkClass = roll < 0.12 ? 'wink-left' : 'wink-right';
        guide.classList.add(winkClass);
        window.setTimeout(() => guide.classList.remove(winkClass), 220);
      } else {
        guide.classList.add('blink');
        window.setTimeout(() => guide.classList.remove('blink'), 170);
      }
      const next = 2000 + Math.random() * 3200;
      window.setTimeout(blinkOnce, next);
    };
    window.setTimeout(blinkOnce, 1200);
  };

  let eyeRaf = null;
  const updateEyes = (x, y) => {
    if (lowPower) return;
    const head = guide.querySelector('.fc-guide-head');
    if (!head) return;
    const r = head.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = Math.max(-2.1, Math.min(2.1, (x - cx) / 24));
    const dy = Math.max(-1.8, Math.min(1.8, (y - cy) / 28));
    guide.style.setProperty('--fc-pupil-x', `${dx.toFixed(2)}px`);
    guide.style.setProperty('--fc-pupil-y', `${dy.toFixed(2)}px`);
  };

  const lookAtElement = (el) => {
    if (!el || lowPower) return;
    const r = el.getBoundingClientRect();
    updateEyes(r.left + r.width / 2, r.top + r.height / 2);
  };

  const queueEyeUpdate = (x, y) => {
    if (lowPower) return;
    if (eyeRaf) return;
    eyeRaf = window.requestAnimationFrame(() => {
      eyeRaf = null;
      updateEyes(x, y);
    });
  };

  const updateSafePlacement = () => {
    const mobile = window.innerWidth <= 760;
    let raise = false;
    const cta = document.querySelector('.btn.primary, button[type="submit"], .cta-band .btn');
    if (mobile && cta) {
      const r = cta.getBoundingClientRect();
      raise = r.bottom > window.innerHeight * 0.55;
    }
    guide.classList.toggle('raise', raise);
  };

  const runIntentNudge = () => {
    if (document.hidden) return;
    if (document.body.classList.contains('is-loading')) return;

    const ctaCandidates = [...document.querySelectorAll('.btn.primary, .cta-band .btn, form button[type="submit"]')];
    const cta = ctaCandidates.find((el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 0.9 && r.bottom > 0;
    });

    if (!cta) {
      setMode('assist', 9000);
      setMood('react', 1500);
      setBubble('Want a quick growth plan? Scroll to contact and start inquiry.', 2600);
      return;
    }

    cta.classList.add('fc-guide-focus', 'fc-guide-cta-signal');
    window.setTimeout(() => {
      cta.classList.remove('fc-guide-focus');
      cta.classList.remove('fc-guide-cta-signal');
    }, 1900);
    eyeTarget = cta;
    setMode('assist', 9000);
    guide.classList.add('is-pointing-cta');
    window.setTimeout(() => guide.classList.remove('is-pointing-cta'), 1400);
    setMood('point', 1800);
    setBubble('Want a quick growth plan? Start inquiry when you are ready.', 2600);
  };

  const onUserActivity = () => {
    lastInteractionTs = Date.now();
  };

  const nudger = window.setInterval(() => {
    if (document.hidden) return;
    if (document.body.classList.contains('is-loading')) return;

    const now = Date.now();
    if (now - lastInteractionTs < (lowPower ? 15000 : 12000)) return;
    if (now - lastNudgeAt < (lowPower ? 28000 : 22000)) return;

    runIntentNudge();
    lastNudgeAt = now;
  }, lowPower ? 2600 : 1500);

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;

      const sectionEl = visible.target;
      const sectionId = sectionEl.id;

      if (sectionId !== activeSectionId) {
        activeSectionId = sectionId;
        const meta = sectionMeta[sectionId] || null;

        if (Date.now() > manualDockUntil) {
          setDock(chooseSafeDock(meta?.dock || 'right'));
        }

        setMode(meta?.mode || 'guide', 6000);
        setBubble((meta && meta.tip) || dynamicTip(sectionEl));
        pointToSection(sectionEl);
        markMilestone(sectionId);
      }

      const mood = sectionMeta[sectionId]?.mood || 'focus';
      if (mood === 'point') setMood('point', 1700);
      else if (mood === 'react') setMood('react', 900);
      else setMood('focus', 900);

      if (eyeTarget) lookAtElement(eyeTarget);
    },
    {
      root: null,
      threshold: [0.35, 0.55, 0.75],
      rootMargin: '-10% 0px -28% 0px'
    }
  );

  sections.forEach((section) => observer.observe(section));

  const interactiveTargets = document.querySelectorAll(
    '.btn, .service-card, .team-card, .policy-card, .status-pill, .main-nav a, .logo-chip, form input, form textarea, form select'
  );
  let hoverWaveCooldownUntil = 0;
  interactiveTargets.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      setMode('assist', 8000);
      setMood('react', 900);
      lastInteractionTs = Date.now();
      if (!lowPower && Date.now() > hoverWaveCooldownUntil) {
        hoverWaveCooldownUntil = Date.now() + 2200;
        guide.classList.add('is-hover-greet');
        eyeTarget = el;
        window.setTimeout(() => guide.classList.remove('is-hover-greet'), 780);
      }
    });
    el.addEventListener('focusin', () => {
      setMode('assist', 8000);
      setMood('react', 900);
      lastInteractionTs = Date.now();
    });
  });

  if (guideCharacter) {
    guideCharacter.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onUserActivity();
      dodgeGuide(e);
    });
  }

  window.addEventListener('mousemove', (e) => {
    queueEyeUpdate(e.clientX, e.clientY);
  }, { passive: true });
  window.addEventListener('pointerdown', onUserActivity, { passive: true });
  window.addEventListener('keydown', onUserActivity, { passive: true });
  window.addEventListener('scroll', () => {
    onUserActivity();
    updateSafePlacement();
  }, { passive: true });
  window.addEventListener('resize', updateSafePlacement, { passive: true });

  window.addEventListener('fc:form_submit_started', () => {
    setMode('assist', 8000);
    setMood('focus', 1200);
    setBubble('Submitting your inquiry...', 1200);
  });

  window.addEventListener('fc:form_submit_error', () => {
    setMode('assist', 12000);
    setMood('point', 1900);
    setDock(chooseSafeDock('left'), 3000);
    setBubble('Please fill email and requirement briefly, then try again.', 3600);
  });

  window.addEventListener('fc:form_submit_success', () => {
    setMode('assist', 12000);
    guide.classList.add('is-celebrating');
    setMood('done', 2200);
    setBubble('Great. Inquiry received. Team will respond shortly.', 3200);
    window.setTimeout(() => guide.classList.remove('is-celebrating'), 980);
  });

  document.addEventListener('visibilitychange', () => {
    guide.classList.toggle('is-paused', document.hidden);
    if (!document.hidden) {
      lastInteractionTs = Date.now();
      if (eyeTarget) lookAtElement(eyeTarget);
    }
  });

  if (prefersReducedMotion) {
    guide.classList.add('no-motion');
  }

  runBlinkLoop();
  updateSafePlacement();

  const revealWhenReady = () => {
    if (document.body.classList.contains('is-loading')) {
      window.setTimeout(revealWhenReady, 140);
      return;
    }
    guide.classList.add('is-ready');
  };

  revealWhenReady();

  // Safety cleanup for SPA-like local testing refreshes
  window.addEventListener('beforeunload', () => {
    window.clearInterval(nudger);
  });
})();


/* ===== PREMIUM DEPTH INTERACTIONS ===== */
(() => {
  const cards = [...document.querySelectorAll('.depth-card[data-depth]')];
  if (!cards.length) return;

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  cards.forEach((card) => {
    const max = 7;

    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (0.5 - py) * max;
      const ry = (px - 0.5) * max;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();
