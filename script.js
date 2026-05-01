/* =========================================================
   Rinku Ahirwar — Magazine-Spread Horizontal Portfolio JS
   ========================================================= */

const deck = document.getElementById('deck');
const panels = [...document.querySelectorAll('.panel')];
const dockItems = [...document.querySelectorAll('.dock-item')];
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressFill = document.getElementById('progressFill');
const pageCurrent = document.getElementById('pageCurrent');
const pageTotal = document.getElementById('pageTotal');
const chapterLabel = document.getElementById('chapterLabel');

let currentIndex = 0;

/* ---------- Cover typewriter cycle ---------- */
(() => {
  const el = document.getElementById('typeText');
  if (!el) return;
  const phrases = ['Rinku Ahirwar', 'Software Engineer 2', 'MAQ Software'];
  const TYPE_MS = 75;
  const ERASE_MS = 35;
  const HOLD_MS = 1500;
  const GAP_MS = 350;
  let pi = 0, ci = 0, deleting = false;
  function tick() {
    const phrase = phrases[pi];
    if (!deleting) {
      ci++;
      el.textContent = phrase.slice(0, ci);
      if (ci === phrase.length) {
        deleting = true;
        return setTimeout(tick, HOLD_MS);
      }
      return setTimeout(tick, TYPE_MS);
    }
    ci--;
    el.textContent = phrase.slice(0, ci);
    if (ci === 0) {
      deleting = false;
      pi = (pi + 1) % phrases.length;
      return setTimeout(tick, GAP_MS);
    }
    return setTimeout(tick, ERASE_MS);
  }
  setTimeout(tick, 600);
})();

/* ---------- Portrait slideshow (crossfade) ---------- */
(() => {
  const wrap = document.getElementById('portraitSlides');
  if (!wrap) return;
  const slides = [...wrap.querySelectorAll('.slide')];
  if (slides.length < 2) return;
  let i = 0;
  setInterval(() => {
    slides[i].classList.remove('is-active');
    i = (i + 1) % slides.length;
    slides[i].classList.add('is-active');
  }, 4000);
})();

/* ---------- Loader ---------- */
(() => {
  const loader = document.getElementById('loader');
  const statusEl = document.getElementById('loaderStatus');
  const messages = [
    'Loading…',
  ];
  let i = 0;
  const interval = setInterval(() => {
    i = (i + 1) % messages.length;
    if (statusEl) statusEl.textContent = messages[i];
  }, 500);
  window.addEventListener('load', () => {
    setTimeout(() => {
      clearInterval(interval);
      loader.classList.add('hidden');
      // Activate first panel after loader hides
      panels[0].classList.add('in-view');
    }, 1700);
  });
})();

/* ---------- Set page total ---------- */
if (pageTotal) pageTotal.textContent = String(panels.length).padStart(2, '0');

/* ---------- Navigate to a panel ---------- */
function goTo(idx) {
  idx = Math.max(0, Math.min(panels.length - 1, idx));
  currentIndex = idx;
  deck.scrollTo({ left: window.innerWidth * idx, behavior: 'smooth' });
}

prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

dockItems.forEach((item, i) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    goTo(+item.dataset.target);
  });
});

/* ---------- Keyboard nav ---------- */
window.addEventListener('keydown', (e) => {
  // Ignore when user is typing in an input / textarea / contentEditable
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

  if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goTo(currentIndex + 1); return; }
  if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   { e.preventDefault(); goTo(currentIndex - 1); return; }
  if (e.key === 'Home') { e.preventDefault(); goTo(0); return; }
  if (e.key === 'End')  { e.preventDefault(); goTo(panels.length - 1); return; }
  if (e.key === 'Escape') { e.preventDefault(); goTo(0); return; }
  // Digits 1–6 → jump straight to that panel
  if (/^[1-9]$/.test(e.key)) {
    const idx = parseInt(e.key, 10) - 1;
    if (idx < panels.length) { e.preventDefault(); goTo(idx); }
  }
});

/* ---------- Hide keyboard hint after first nav ---------- */
(() => {
  const hint = document.getElementById('kbdHint');
  if (!hint) return;
  let dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    hint.classList.add('is-gone');
  }
  // Auto-fade after 6s if untouched
  setTimeout(dismiss, 6000);
  // Or as soon as the user navigates by any means
  ['keydown', 'click'].forEach(ev => window.addEventListener(ev, dismiss, { once: true, capture: true }));
  if (deck) deck.addEventListener('scroll', dismiss, { once: true, passive: true });
})();

/* ---------- Wheel: vertical scroll → horizontal panel jump ----------
   We translate vertical wheel movement into "next/prev panel"
   so the user feels like they're scrolling a regular page,
   but each scroll moves to the next spread. We allow native
   horizontal scroll inside .exp-rail for the experience cards. */
(() => {
  let wheelLock = false;

  deck.addEventListener('wheel', (e) => {
    // 1) If the experience rail itself overflows horizontally, let it scroll
    //    inside (kept for safety, the rail is a 2-col grid by default).
    const expRail = document.getElementById('expRail');
    if (expRail && expRail.scrollWidth > expRail.clientWidth + 2) {
      const rect = expRail.getBoundingClientRect();
      const insideExp = e.clientY > rect.top && e.clientY < rect.bottom &&
                        e.clientX > rect.left && e.clientX < rect.right;
      if (insideExp) {
        e.preventDefault();
        expRail.scrollBy({ left: e.deltaY + e.deltaX, behavior: 'auto' });
        return;
      }
    }

    // 2) If the active panel is *actually* vertically scrollable AND the
    //    gesture is pretty much pure-vertical, let the browser scroll natively.
    //    `scrollHeight > clientHeight` alone is not enough — a panel with
    //    `overflow: hidden` still reports overflowing scrollHeight even though
    //    it can't be scrolled, which would otherwise silently swallow the
    //    forward swipe. So we also check the computed overflow-y.
    const active = panels[currentIndex];
    const dy = e.deltaY;
    const dx = e.deltaX;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const horizontalIntent = absX > 4 && absX * 1.2 >= absY;
    const pureVertical = !horizontalIntent && absY > absX * 1.5;

    if (active && pureVertical) {
      const oy = getComputedStyle(active).overflowY;
      const reallyScrollable = (oy === 'auto' || oy === 'scroll') &&
        active.scrollHeight - active.clientHeight > 2;
      if (reallyScrollable) {
        const canScrollDown = active.scrollHeight - active.clientHeight - active.scrollTop > 2;
        const canScrollUp = active.scrollTop > 2;
        if ((dy > 0 && canScrollDown) || (dy < 0 && canScrollUp)) {
          // Let the browser handle vertical scroll natively.
          return;
        }
      }
    }

    // 3) Otherwise: jump panels — pick the dominant axis so vertical
    //    wheel input also navigates (e.g. mouse wheel on a desktop).
    e.preventDefault();
    if (wheelLock) return;
    const delta = horizontalIntent ? dx : (absY >= absX ? dy : dx);
    if (Math.abs(delta) < 8) return;
    wheelLock = true;
    if (delta > 0) goTo(currentIndex + 1);
    else goTo(currentIndex - 1);
    setTimeout(() => { wheelLock = false; }, 700);
  }, { passive: false });
})();

/* ---------- Track active panel via scroll position ---------- */
let scrollTimer;
deck.addEventListener('scroll', () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    const idx = Math.round(deck.scrollLeft / window.innerWidth);
    setActive(idx);
  }, 50);
}, { passive: true });

function setActive(idx) {
  const changed = idx !== currentIndex;
  currentIndex = idx;

  // Per-panel animated theme
  document.body.dataset.activePanel = String(idx);

  // Panels: in-view animation
  panels.forEach((p, i) => p.classList.toggle('in-view', i === idx));

  // Only reset vertical scroll when *changing* panels (otherwise scroll
  // events on the deck would constantly reset the panel mid-scroll).
  const active = panels[idx];
  if (active && changed) {
    active.scrollTop = 0;
  }
  if (active && active.classList.contains('panel-exp')) {
    requestAnimationFrame(() => updateExpScrollHint(active));
  }

  // Dock items
  dockItems.forEach((d, i) => {
    const isActive = i === idx;
    d.classList.toggle('active', isActive);
    if (isActive) d.setAttribute('aria-current', 'page');
    else d.removeAttribute('aria-current');
  });

  // Page indicator
  if (pageCurrent) pageCurrent.textContent = String(idx + 1).padStart(2, '0');

  // Chapter label
  if (chapterLabel && panels[idx]) {
    chapterLabel.style.opacity = '0';
    chapterLabel.style.transform = 'translateY(8px)';
    setTimeout(() => {
      chapterLabel.textContent = panels[idx].dataset.chapter || '';
      chapterLabel.style.opacity = '1';
      chapterLabel.style.transform = 'translateY(0)';
    }, 200);
  }

  // Progress bar
  if (progressFill) {
    const pct = ((idx + 1) / panels.length) * 100;
    progressFill.style.width = pct + '%';
  }

  // Update prev/next button disabled state (visually + functionally)
  prevBtn.disabled = idx === 0;
  nextBtn.disabled = idx === panels.length - 1;
}

/* ---------- Re-snap on resize ---------- */
window.addEventListener('resize', () => {
  deck.scrollTo({ left: window.innerWidth * currentIndex, behavior: 'auto' });
  const expPanel = document.querySelector('.panel-exp');
  if (expPanel) updateExpScrollHint(expPanel);
});

/* ---------- Experience panel "scroll for more" hint ---------- */
function updateExpScrollHint(panel) {
  if (!panel) return;
  const overflow = panel.scrollHeight - panel.clientHeight > 4;
  panel.classList.toggle('has-overflow', overflow);
  const atBottom = overflow && (panel.scrollHeight - panel.clientHeight - panel.scrollTop < 8);
  panel.classList.toggle('scrolled-bottom', atBottom);
}
(() => {
  const expPanel = document.querySelector('.panel-exp');
  if (!expPanel) return;
  expPanel.addEventListener('scroll', () => updateExpScrollHint(expPanel), { passive: true });
  // Initial check after layout settles
  requestAnimationFrame(() => updateExpScrollHint(expPanel));
})();

/* ---------- Animated stat counters (fire when panel becomes active) ---------- */
(() => {
  const animated = new WeakSet();
  function animateNum(el) {
    if (animated.has(el)) return;
    animated.add(el);
    const target = +el.dataset.count;
    const dur = 1400;
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(target * eased);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }
  // observe class changes on about panel
  const aboutPanel = document.querySelector('.panel-about');
  if (aboutPanel) {
    const obs = new MutationObserver(() => {
      if (aboutPanel.classList.contains('in-view')) {
        aboutPanel.querySelectorAll('.stat-num').forEach(animateNum);
      }
    });
    obs.observe(aboutPanel, { attributes: true, attributeFilter: ['class'] });
  }
})();

/* ---------- Magnetic dock ---------- */
(() => {
  const dock = document.querySelector('.dock');
  if (!dock) return;
  const items = dock.querySelectorAll('.dock-item');
  dock.addEventListener('mousemove', (e) => {
    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const max = 70;
      if (dist < max) {
        const f = (1 - dist / max) * 0.4;
        item.style.transform = `translate(${dx * f}px, ${dy * f - 4}px) scale(${1 + (1 - dist/max) * 0.15})`;
      } else {
        item.style.transform = '';
      }
    });
  });
  dock.addEventListener('mouseleave', () => items.forEach(it => it.style.transform = ''));
})();

/* ---------- Portrait card 3D parallax ---------- */
(() => {
  const card = document.querySelector('.portrait-card');
  const wrap = document.querySelector('.portrait-stack');
  if (!card || !wrap) return;
  wrap.addEventListener('mousemove', (e) => {
    const rect = wrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) rotate(${-3 + x * 3}deg)`;
  });
  wrap.addEventListener('mouseleave', () => { card.style.transform = ''; });
})();

/* ---------- Aurora cursor follow ---------- */
(() => {
  const a1 = document.querySelector('.aurora-1');
  const a2 = document.querySelector('.aurora-2');
  if (!a1 || !a2) return;
  let mx = 0, my = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 60;
    my = (e.clientY / window.innerHeight - 0.5) * 60;
  });
  function tick() {
    cx += (mx - cx) * 0.04;
    cy += (my - cy) * 0.04;
    a1.style.translate = `${cx}px ${cy}px`;
    a2.style.translate = `${-cx}px ${-cy}px`;
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ---------- Image fallback ---------- */
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('error', () => {
    if (img.dataset.fellBack) return;
    img.dataset.fellBack = '1';
    img.src = 'https://via.placeholder.com/600x800/e85d3c/fbf5e6?text=Rinku';
  });
});

/* ---------- Drag-to-pan support (touch / mouse drag) ---------- */
(() => {
  let isDown = false, startX = 0, startScroll = 0, hasMoved = false;
  deck.addEventListener('mousedown', (e) => {
    // ignore drags that begin on interactive elements or inside the
    // vertically-scrollable experience panel
    if (e.target.closest('a, button, .exp-rail, .panel-exp')) return;
    isDown = true; hasMoved = false;
    startX = e.pageX;
    startScroll = deck.scrollLeft;
    deck.style.scrollBehavior = 'auto';
    document.body.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    document.body.style.cursor = '';
    // snap to nearest panel
    const idx = Math.round(deck.scrollLeft / window.innerWidth);
    deck.style.scrollBehavior = 'smooth';
    goTo(idx);
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 5) hasMoved = true;
    deck.scrollLeft = startScroll - dx;
  });
})();

/* ---------- Initial setup ---------- */
setActive(0);

/* ---------- Experience timeline interactions ---------- */
(() => {
  const expPanel = document.querySelector('.panel-exp');
  if (!expPanel) return;
  const ticks = [...expPanel.querySelectorAll('.exp-tick')];
  if (!ticks.length) return;

  // Click → scroll the matching card into view (within the panel)
  ticks.forEach(tick => {
    tick.addEventListener('click', () => {
      const id = tick.dataset.target;
      const card = id && document.getElementById(id);
      if (!card) return;

      // Compute offset relative to the panel's scroll container
      const cardTop = card.offsetTop - expPanel.offsetTop;
      // Leave room for the timeline above the card
      const offset = Math.max(0, cardTop - 24);
      expPanel.scrollTo({ top: offset, behavior: 'smooth' });

      // Brief highlight pulse on the card
      card.classList.remove('is-focused');
      // force reflow so the animation can replay
      void card.offsetWidth;
      card.classList.add('is-focused');
      setTimeout(() => card.classList.remove('is-focused'), 1700);

      // Mark this tick active
      ticks.forEach(t => t.classList.toggle('is-active', t === tick));
    });
  });

  // Auto-update active tick as you scroll past the cards
  const cards = ticks
    .map(t => document.getElementById(t.dataset.target))
    .filter(Boolean);
  if ('IntersectionObserver' in window && cards.length) {
    const io = new IntersectionObserver((entries) => {
      // Pick the card whose top is closest to the panel's top
      const visible = entries
        .filter(en => en.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      const id = visible.target.id;
      ticks.forEach(t => t.classList.toggle('is-active', t.dataset.target === id));
    }, { root: expPanel, threshold: 0.45 });
    cards.forEach(c => io.observe(c));
  }
})();

/* =========================================================
   CREATIVE LAYER — cursor · constellation · spotlight · magnetic
   ========================================================= */
const isTouch = window.matchMedia('(hover: none)').matches || window.innerWidth < 901;

/* ---------- Custom magazine cursor ---------- */
(() => {
  if (isTouch) return;
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const label = document.getElementById('cursorLabel');
  if (!dot || !ring) return;

  document.body.classList.add('cursor-active');

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
  }, { passive: true });

  function tick() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(tick);
  }
  tick();

  // Hover targets — set state + label
  const interactive = 'a, button, .chip, .stat-mini, .edu-card, .exp-card, .hobby, .info-card, .dock-item, .nav-arrow, .portrait-card';

  function getLabel(el) {
    if (el.matches('.contact-cta')) return 'Email';
    if (el.matches('.dock-cta')) return 'Hello';
    if (el.tagName === 'A' && el.href && el.href.startsWith('mailto:')) return 'Write';
    if (el.matches('.portrait-card')) return 'Hello!';
    if (el.matches('.nav-arrow')) return el.id === 'nextBtn' ? 'Next' : 'Prev';
    return null;
  }

  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest(interactive);
    if (!el) return;
    ring.classList.add('hover');
    const text = getLabel(el);
    if (text) {
      ring.classList.add('text');
      label.textContent = text;
    }
  });
  document.addEventListener('mouseout', (e) => {
    const el = e.target.closest(interactive);
    if (!el) return;
    if (e.relatedTarget && el.contains(e.relatedTarget)) return;
    ring.classList.remove('hover', 'text');
    label.textContent = '';
  });

  document.addEventListener('mouseleave', () => document.body.classList.add('cursor-hidden'));
  document.addEventListener('mouseenter', () => document.body.classList.remove('cursor-hidden'));

  // Click pulse
  document.addEventListener('mousedown', () => ring.classList.add('hover'));
  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      // only clear if not hovering anything
      if (!document.querySelector(interactive + ':hover')) {
        ring.classList.remove('hover', 'text');
      }
    }, 50);
  });
})();

/* ---------- Cursor-following spotlight ---------- */
(() => {
  if (isTouch) return;
  const sp = document.getElementById('spotlight');
  if (!sp) return;
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my;
  document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  function tick() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    sp.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ---------- Constellation particle field ---------- */
(() => {
  if (isTouch) return;
  const canvas = document.getElementById('constellation');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, particles = [];
  let mouse = { x: -9999, y: -9999 };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(90, Math.max(40, Math.floor((w * h) / 22000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.4 + 0.4,
      tw: Math.random() * Math.PI * 2, // twinkle phase
    }));
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
  }, { passive: true });
  document.addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; });

  // Read current --accent so particles tint with the panel theme
  let accentRGB = [255, 107, 139];
  function refreshAccent() {
    const c = getComputedStyle(document.body).getPropertyValue('--accent').trim();
    const m = c.match(/#([0-9a-f]{6})/i);
    if (m) {
      accentRGB = [
        parseInt(m[1].slice(0, 2), 16),
        parseInt(m[1].slice(2, 4), 16),
        parseInt(m[1].slice(4, 6), 16),
      ];
    }
  }
  refreshAccent();
  // Re-read on panel change (theme is set via body[data-active-panel])
  const obs = new MutationObserver(refreshAccent);
  obs.observe(document.body, { attributes: true, attributeFilter: ['data-active-panel'] });
  // Animate the accent color smoothly between panels
  let curR = accentRGB[0], curG = accentRGB[1], curB = accentRGB[2];

  let t = 0;
  function frame() {
    t += 0.012;
    ctx.clearRect(0, 0, w, h);

    // ease the read accent (per-panel) toward the latest computed value
    curR += (accentRGB[0] - curR) * 0.04;
    curG += (accentRGB[1] - curG) * 0.04;
    curB += (accentRGB[2] - curB) * 0.04;
    const accentStr = `${curR | 0}, ${curG | 0}, ${curB | 0}`;

    // particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;

      const tw = (Math.sin(t + p.tw) + 1) / 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(236, 230, 245, ${0.25 + tw * 0.45})`;
      ctx.fill();
    }

    // connecting lines
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < 130) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(167, 139, 250, ${0.18 * (1 - d / 130)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
      // beam to cursor
      const dxm = a.x - mouse.x, dym = a.y - mouse.y;
      const dm = Math.hypot(dxm, dym);
      if (dm < 200) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(${accentStr}, ${0.45 * (1 - dm / 200)})`;
        ctx.lineWidth = 0.85;
        ctx.stroke();
      }
    }

    requestAnimationFrame(frame);
  }
  frame();
})();

/* ---------- Magnetic chips & contact links ---------- */
(() => {
  if (isTouch) return;
  const targets = document.querySelectorAll('.chip, .contact-links a, .nav-arrow');
  targets.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate(${dx * 0.3}px, ${dy * 0.3}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
})();

/* ---------- 3D tilt for cards (subtle, perspective-based) ---------- */
(() => {
  if (isTouch) return;
  const cards = document.querySelectorAll('.exp-card, .info-card, .portrait-tag, .portrait-badge');
  cards.forEach(card => {
    card.style.transformStyle = 'preserve-3d';
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

/* ---------- Confetti sparkles when contact CTA is clicked ---------- */
(() => {
  const cta = document.querySelector('.contact-cta');
  if (!cta) return;
  cta.addEventListener('click', (e) => {
    const rect = cta.getBoundingClientRect();
    const ox = e.clientX || rect.left + rect.width / 2;
    const oy = e.clientY || rect.top + rect.height / 2;
    const colors = ['#ff6b8b', '#ffd66b', '#5eead4', '#a78bfa'];
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('span');
      s.className = 'confetti-bit';
      s.textContent = ['✦','✧','◆','◈','✶'][i % 5];
      s.style.left = ox + 'px';
      s.style.top  = oy + 'px';
      s.style.color = colors[i % colors.length];
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
      const dist = 80 + Math.random() * 140;
      s.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      s.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
      s.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1200);
    }
  });
})();

/* =================  VISITOR COUNT  ================= */
/* Uses Abacus by Jason Cameron (api.counterapi.dev) — free, no signup, GET-only.
   Falls back to a local-only counter if the API is unreachable. */
(function visitorCount() {
  const chip = document.getElementById('visitorChip');
  const out = document.getElementById('visitorCount');
  if (!chip || !out) return;

  // Unique-ish namespace + key per site so this can't collide with other portfolios.
  const NS = 'rinku-portfolio';
  const KEY = 'site-visits';
  const STORAGE_KEY = 'rinku.visitorCount.v1';
  const SESSION_KEY = 'rinku.visitorCount.session';

  // Format with thousand separators.
  const fmt = (n) => {
    try { return n.toLocaleString('en-US'); }
    catch { return String(n); }
  };

  // Animate count from current to target value.
  const setCount = (target) => {
    const start = parseInt(out.dataset.value || '0', 10) || 0;
    if (target === start) {
      out.textContent = fmt(target);
      out.dataset.value = String(target);
      chip.classList.add('is-loaded');
      return;
    }
    const dur = 900;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = Math.round(start + (target - start) * eased);
      out.textContent = fmt(v);
      if (k < 1) requestAnimationFrame(tick);
      else {
        out.dataset.value = String(target);
        chip.classList.add('is-loaded');
      }
    };
    requestAnimationFrame(tick);
  };

  // Local fallback: increment in localStorage so the chip never shows '—' forever.
  const localFallback = () => {
    let n = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    if (!sessionStorage.getItem(SESSION_KEY)) {
      n += 1;
      localStorage.setItem(STORAGE_KEY, String(n));
      sessionStorage.setItem(SESSION_KEY, '1');
    }
    if (n < 1) n = 1;
    setCount(n);
  };

  // Increment once per browser session, otherwise just read.
  const alreadyCounted = sessionStorage.getItem(SESSION_KEY) === '1';
  const url = alreadyCounted
    ? `https://api.counterapi.dev/v1/${NS}/${KEY}/`
    : `https://api.counterapi.dev/v1/${NS}/${KEY}/up`;

  // Race against a 4s timeout so a slow API never blocks the chip.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);

  fetch(url, { signal: ctrl.signal, cache: 'no-store' })
    .then((r) => {
      if (!r.ok) throw new Error('counter http ' + r.status);
      return r.json();
    })
    .then((data) => {
      clearTimeout(timer);
      const n = (data && (data.count ?? data.value)) | 0;
      if (n > 0) {
        sessionStorage.setItem(SESSION_KEY, '1');
        localStorage.setItem(STORAGE_KEY, String(n));
        setCount(n);
      } else {
        localFallback();
      }
    })
    .catch(() => {
      clearTimeout(timer);
      localFallback();
    });
})();
