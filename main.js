/* =========================================================
   Recreación landonorris.com — animaciones
   GSAP + ScrollTrigger + Lenis
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => innerWidth <= 800;

  /* ---------------- seeded random ---------------- */
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hashStr = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

  /* =========================================================
     HELMET GENERATOR (SVG original, perfil lateral)
     ========================================================= */
  const SCHEMES = {
    season25:  { base: '#d2ff00', ink: ['#111112'], style: 'squiggle', chin: '#111112' },
    discoball: { base: '#cfd2d6', ink: ['#ffffff', '#8b9097'], style: 'disco', chin: '#3a3d42' },
    darkglit:  { base: '#141414', ink: ['#d2ff00', '#4a4a4a'], style: 'squiggle', chin: '#d2ff00' },
    season24:  { base: '#c9f400', ink: ['#111112', '#ff7a00'], style: 'squiggle', chin: '#111112' },
    porcelain: { base: '#f6f4ef', ink: ['#1f4fa8', '#8fb0e6'], style: 'squiggle', chin: '#1f4fa8' },
    japan:     { base: '#f4f4ed', ink: ['#e3262f', '#111112'], style: 'waves', chin: '#e3262f' },
    gif:       { base: '#d2ff00', ink: ['#ff4fb4', '#111112'], style: 'dots', chin: '#ff4fb4' },
    darkmode:  { base: '#1b1c1e', ink: ['#5c5f66', '#d2ff00'], style: 'squiggle', chin: '#000' },
    race23:    { base: '#ff8a1f', ink: ['#5a2d0c', '#111112'], style: 'squiggle', chin: '#5a2d0c' },
    vegas:     { base: '#121212', ink: ['#e7c45a', '#ffffff'], style: 'stripes', chin: '#e7c45a' },
    chrome:    { base: '#dcdfe3', ink: ['#ffffff', '#9aa0a8'], style: 'stripes', chin: '#5e636b' },
    beach:     { base: '#ffffff', ink: ['#ff5a4f', '#ffd23f', '#3fa7ff', '#36c46f'], style: 'beach', chin: '#3fa7ff' },
    basket:    { base: '#e2702a', ink: ['#2a1608'], style: 'lines', chin: '#2a1608' },
    season21:  { base: '#ffd200', ink: ['#0b5bd3', '#111112'], style: 'squiggle', chin: '#0b5bd3' },
    silver20:  { base: '#f2f2ee', ink: ['#111112', '#ff7a00'], style: 'sketch', chin: '#111112' },
    season19:  { base: '#ffe100', ink: ['#00a3ff', '#ff3d8b'], style: 'squiggle', chin: '#00a3ff' },
  };

  function smoothPath(pts, closed = false) {
    // Catmull-Rom -> Bezier
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    const n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const a = closed || i > 0 ? p0 : p1, b = closed || i < n - 2 ? p3 : p2;
      const c1 = [p1[0] + (p2[0] - a[0]) / 6, p1[1] + (p2[1] - a[1]) / 6];
      const c2 = [p2[0] - (b[0] - p1[0]) / 6, p2[1] - (b[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + (closed ? 'Z' : '');
  }

  let helmetUid = 0;
  function helmetSVG(key, seed = 1) {
    const s = SCHEMES[key] || SCHEMES.season25;
    const r = rng(seed * 9973 + hashStr(key));
    const id = 'h' + (helmetUid++);
    const shell = 'M30 150C22 80 70 22 150 18C228 14 280 62 284 128L286 160C287 176 276 188 260 188L92 188C70 188 58 200 40 196C28 192 32 172 30 150Z';
    const visor = 'M150 84C190 74 250 76 283 92L285 134C250 128 196 128 160 133C146 121 142 98 150 84Z';
    let art = '';
    const ink = (i) => s.ink[i % s.ink.length];

    if (s.style === 'squiggle' || s.style === 'sketch') {
      const count = s.style === 'sketch' ? 30 : 46;
      for (let i = 0; i < count; i++) {
        const cx = 10 + r() * 290, cy = 5 + r() * 200;
        const pts = [];
        let ang = r() * Math.PI * 2, x = cx, y = cy;
        const len = 4 + Math.floor(r() * 5);
        for (let k = 0; k < len; k++) {
          pts.push([x, y]);
          ang += (r() - 0.5) * 2.6;
          const step = 7 + r() * 11;
          x += Math.cos(ang) * step; y += Math.sin(ang) * step;
        }
        const w = s.style === 'sketch' ? 1.6 + r() * 1.6 : 3.5 + r() * 3.5;
        art += `<path d="${smoothPath(pts)}" stroke="${ink(i < count * 0.8 ? 0 : 1)}" stroke-width="${w.toFixed(1)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    } else if (s.style === 'dots' || s.style === 'disco') {
      const step = s.style === 'disco' ? 11 : 18;
      for (let y = 10; y < 200; y += step) for (let x = 20 + ((y / step) % 2) * step / 2; x < 300; x += step) {
        if (s.style === 'disco') art += `<rect x="${x}" y="${y}" width="${step - 2}" height="${step - 2}" fill="${r() > .5 ? ink(0) : ink(1)}" opacity="${(.4 + r() * .6).toFixed(2)}"/>`;
        else art += `<circle cx="${x}" cy="${y}" r="${(3 + r() * 5).toFixed(1)}" fill="${ink(r() > .6 ? 1 : 0)}"/>`;
      }
    } else if (s.style === 'stripes') {
      for (let i = 0; i < 9; i++) art += `<path d="M${-20 + i * 40} 220L${80 + i * 40} 0" stroke="${ink(i % 2)}" stroke-width="${8 + (i % 3) * 5}" opacity=".85"/>`;
    } else if (s.style === 'beach') {
      for (let i = 0; i < 4; i++) art += `<path d="M150 110L${150 + Math.cos(i * 1.57 + .4) * 400} ${110 + Math.sin(i * 1.57 + .4) * 400}L${150 + Math.cos(i * 1.57 + 1.2) * 400} ${110 + Math.sin(i * 1.57 + 1.2) * 400}Z" fill="${ink(i)}"/>`;
    } else if (s.style === 'lines') {
      art += `<path d="M20 70C120 110 200 110 300 60M150 0C130 80 130 150 160 230M40 200C90 140 90 60 60 0M250 220C220 160 220 80 260 10" stroke="${ink(0)}" stroke-width="4.5" fill="none"/>`;
    } else if (s.style === 'waves') {
      for (let y = 0; y < 230; y += 22) art += `<path d="M0 ${y}q18 -14 36 0t36 0t36 0t36 0t36 0t36 0t36 0t36 0t36 0" stroke="${ink(y % 44 ? 0 : 1)}" stroke-width="5" fill="none"/>`;
      art += `<circle cx="110" cy="90" r="34" fill="${ink(0)}"/>`;
    }

    return `<svg class="helmet" viewBox="0 0 300 215" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="${id}c"><path d="${shell}"/></clipPath>
        <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <linearGradient id="${id}v" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2d33"/><stop offset=".5" stop-color="#07080a"/><stop offset="1" stop-color="#3b3f47"/></linearGradient>
        <radialGradient id="${id}s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="160" cy="203" rx="130" ry="10" fill="url(#${id}s)"/>
      <g clip-path="url(#${id}c)">
        <rect width="300" height="215" fill="${s.base}"/>
        ${art}
        <rect x="0" y="168" width="300" height="30" fill="${s.chin}"/>
        <path d="M0 140C80 150 150 152 300 140L300 215L0 215Z" fill="#000" opacity=".18"/>
        <path d="${shell}" fill="url(#${id}g)"/>
      </g>
      <path d="${visor}" fill="url(#${id}v)"/>
      <path d="M162 92C200 86 240 87 270 96" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="140" y="80" width="10" height="20" rx="3" fill="#2b2b2b"/>
      <path d="${shell}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.5"/>
      <text x="80" y="183" font-family="Mona Sans, Arial" font-weight="900" font-size="12" fill="${s.base}" opacity=".9">LN4</text>
    </svg>`;
  }

  // Foto generada de cada casco (assets/helmets/*.jpg); el SVG queda de respaldo si falta.
  const HELMET_FILES = {
    season25: 'h-season25', discoball: 'h-discoball', darkglit: 'h-darkglitter', season24: 'h-season24',
    porcelain: 'h-porcelain', japan: 'h-japan', gif: 'h-gif', darkmode: 'h-darkmode', race23: 'h-race23',
    vegas: 'h-vegas', chrome: 'h-chrome', beach: 'h-beachball', basket: 'h-basketball', season21: 'h-season21',
    silver20: 'h-silverstone', season19: 'h-season19',
  };
  const helmetMarkup = (key, seed) =>
    helmetSVG(key, seed) +
    `<img class="helmet-img" src="assets/helmets/${HELMET_FILES[key]}.jpg" alt="" onload="this.classList.add('ok')" onerror="this.remove()">`;

  // inject helmets into [data-helmet]
  const HELMET_MAP = { hero: 'season25', 'hero-alt': 'darkglit', season25: 'season25', season24: 'season24', footer: 'season24' };
  $$('[data-helmet]').forEach((el, i) => {
    const key = HELMET_MAP[el.dataset.helmet] || 'season25';
    el.insertAdjacentHTML('afterbegin', el.dataset.helmet.startsWith('hero') ? helmetSVG(key, i + 3) : helmetMarkup(key, i + 3));
  });

  // Helmet grid
  const HELMETS = [
    ['Season', 2025, 'season25'], ['Discoball', 2025, 'discoball'], ['Dark Glitter', 2025, 'darkglit'], ['Season', 2024, 'season24'],
    ['Porcelain', 2024, 'porcelain'], ['Japan', 2024, 'japan'], ['GIF', 2024, 'gif'], ['Dark Mode', 2024, 'darkmode'],
    ['Race', 2023, 'race23'], ['Las Vegas', 2023, 'vegas'], ['Chrome', 2023, 'chrome'], ['Beachball', 2023, 'beach'],
    ['Basketball', 2022, 'basket'], ['Season', 2021, 'season21'], ['Silverstone', 2020, 'silver20'], ['Season', 2019, 'season19'],
  ];
  const grid = $('#helmetGrid');
  grid.innerHTML = HELMETS.map(([n, y, k], i) =>
    `<a href="#" class="hcard"><div class="hcard__inner">${helmetMarkup(k, i + 11)}</div><div class="hcard__meta"><span>${n}</span><b>${y}</b></div></a>`
  ).join('');

  // tint the plain media placeholders
  $$('.media:not(.media--helmet)').forEach((m, i) => {
    const r = rng(i + 40);
    const h = 60 + r() * 60, h2 = h + 20 + r() * 40;
    m.style.background = `radial-gradient(110% 80% at ${20 + r() * 60}% ${10 + r() * 40}%, hsla(${h},20%,78%,.55), transparent 60%), linear-gradient(${120 + r() * 80}deg, hsl(${h},${10 + r() * 20}%,${35 + r() * 20}%), hsl(${h2},15%,${12 + r() * 10}%))`;
  });

  // Social fan cards
  const fan = $('#fan');
  const FAN = [['TIKTOK', 'g'], ['INSTAGRAM', 'season24'], ['YOUTUBE', 'g'], ['TWITCH', 'darkglit'], ['INSTAGRAM', 'g'], ['TIKTOK', 'gif'], ['YOUTUBE', 'g']];
  fan.innerHTML = FAN.map(([t, k], i) => {
    const inner = k === 'g'
      ? `<div class="media" data-label="Post ${i + 1}"><img src="assets/social${i + 1}.jpg" alt="" onerror="this.remove()"></div>`
      : `<div class="media media--helmet">${helmetMarkup(k, i + 70)}</div>`;
    return `<div class="fan__card">${inner}<span class="tag">${t}</span></div>`;
  }).join('');
  $$('.fan__card .media:not(.media--helmet)').forEach((m, i) => {
    const h = [20, 200, 330, 90, 260, 40, 160][i % 7];
    m.style.background = `radial-gradient(90% 70% at 50% 25%, hsla(${h},70%,80%,.6), transparent 60%), linear-gradient(170deg, hsl(${h},45%,45%), hsl(${h + 30},40%,14%))`;
  });

  /* =========================================================
     TOPOGRAPHIC CONTOURS (canvas, marching squares)
     ========================================================= */
  const perm = new Uint8Array(512);
  { const r = rng(42); const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
  function noise(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const a = perm[X] + Y, b = perm[X + 1] + Y;
    const l1 = grad(perm[a], x, y) + u * (grad(perm[b], x - 1, y) - grad(perm[a], x, y));
    const l2 = grad(perm[a + 1], x, y - 1) + u * (grad(perm[b + 1], x - 1, y - 1) - grad(perm[a + 1], x, y - 1));
    return l1 + v * (l2 - l1);
  }
  const fbm = (x, y) => noise(x, y) * 0.65 + noise(x * 2.1, y * 2.1) * 0.25 + noise(x * 4.3, y * 4.3) * 0.1;

  function drawTopo(cv, offset = 0) {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    if (cv.dataset.bg && cv.dataset.bg !== 'transparent') { ctx.fillStyle = cv.dataset.bg; ctx.fillRect(0, 0, w, h); }
    ctx.strokeStyle = cv.dataset.color || '#ccc'; ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
    const cell = 14, cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1;
    const sc = 1 / 650, seed = offset * 7.13;
    const f = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) f[j * cols + i] = fbm(i * cell * sc + seed, j * cell * sc + seed * .5);
    const levels = [-0.36, -0.18, 0, 0.18, 0.36];
    ctx.beginPath();
    for (const lv of levels) {
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
        const a = f[j * cols + i], b = f[j * cols + i + 1], c = f[(j + 1) * cols + i + 1], d = f[(j + 1) * cols + i];
        const idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x = i * cell, y = j * cell;
        const t = (p, q) => (lv - p) / (q - p);
        const T = [x + cell * t(a, b), y], R = [x + cell, y + cell * t(b, c)], B = [x + cell * t(d, c), y + cell], L = [x, y + cell * t(a, d)];
        const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
        switch (idx) {
          case 1: case 14: seg(L, B); break;
          case 2: case 13: seg(B, R); break;
          case 3: case 12: seg(L, R); break;
          case 4: case 11: seg(T, R); break;
          case 5: seg(L, T); seg(B, R); break;
          case 6: case 9: seg(T, B); break;
          case 7: case 8: seg(L, T); break;
          case 10: seg(T, R); seg(L, B); break;
        }
      }
    }
    ctx.stroke();
  }
  const topos = $$('canvas.topo');
  const drawAllTopo = () => topos.forEach((c, i) => drawTopo(c, i + 1));

  /* =========================================================
     SMOOTH SCROLL
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* ---------------- helpers ---------------- */
  function prepSig(path) {
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    return len;
  }
  $$('.sig-path').forEach(prepSig);
  const drawSig = (path, opts = {}) => gsap.to(path, { strokeDashoffset: 0, ease: 'power2.inOut', duration: 1.8, ...opts });

  /* ---------------- split manifesto words ---------------- */
  $$('#manifestoText .line').forEach((line) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (!w) return;
            if (/^\s+$/.test(w)) frag.append(w);
            else { const s = document.createElement('span'); s.className = 'word'; s.textContent = w; frag.append(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName === 'EM') {
          n.classList.add('word');
        }
      });
    };
    walk(line);
    const wipe = document.createElement('span'); wipe.className = 'wipe'; line.append(wipe);
  });

  /* =========================================================
     LOADER + INTRO
     ========================================================= */
  const heroHelmet = $('.hero__portrait'); // foto o casco: se anima el contenedor

  // Hero WebGL (franjas del casco). Si no hay WebGL o faltan imágenes, queda el retrato + círculo.
  let heroGL = null;
  const heroGLReady = (window.HeroGL && !reduce
    ? HeroGL.init({
        hero: $('#hero'),
        portrait: 'assets/hero.png',
        helmet: 'assets/hero-helmet.png',
        holo: 'assets/hero-holo.png',
        rect: (W, H) => { const s = Math.min(H * 1.2, W <= 800 ? W * 1.15 : W * 0.95); return { x: (W - s) / 2, y: H - s * 0.86, s }; },
      }).catch((e) => { console.warn('HeroGL', e); return null; })
    : Promise.resolve(null)
  ).then((g) => (window.__heroGL = heroGL = g));
  $('#hero').addEventListener('dblclick', () => heroGL && heroGL.sweep());
  gsap.set('.hero__card', { y: 30, opacity: 0 });
  gsap.set('.nav', { y: -30, opacity: 0 });

  function intro() {
    const heroTarget = heroGL ? heroGL.canvas : heroHelmet;
    if (heroGL) gsap.set(heroTarget, { y: 90, opacity: 0 }); else gsap.set(heroTarget, { yPercent: 40, scale: 0.85, opacity: 0 });
    const counter = { v: 0 };
    const tl = gsap.timeline();
    tl.to(counter, {
      v: 100, duration: reduce ? 0.1 : 1.6, ease: 'power2.inOut',
      onUpdate: () => ($('#loaderCount').textContent = Math.round(counter.v)),
    })
      .to('.loader__mark', { scale: 1.6, duration: 0.5, ease: 'power3.in' }, '-=0.2')
      .to('#loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.15')
      .add(() => { document.body.classList.remove('is-loading'); $('#loader').style.display = 'none'; lenis && lenis.start(); }, '-=0.1')
      .to(heroTarget, heroGL ? { y: 0, opacity: 1, duration: 1.6, ease: 'expo.out' } : { yPercent: 0, scale: 1, opacity: 1, duration: 1.6, ease: 'expo.out' }, '-=0.7')
      .add(() => heroGL && heroGL.sweep(1.4), '-=1.2')
      .to('.nav', { y: 0, opacity: 1, duration: 1, ease: 'expo.out' }, '-=1.4')
      .to('.hero__card', { y: 0, opacity: 1, duration: 1, ease: 'expo.out' }, '-=1.2');
    $('#loader').style.clipPath = 'inset(0 0 0% 0)';
  }

  /* =========================================================
     HERO interactions — tilt + cursor reveal
     ========================================================= */
  const stage = $('#heroStage');
  const reveal = $('#heroReveal');
  const tiltEls = $$('.hero__ph, .hero__portrait img, .hero__helmet-img, .hero__slice img');
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, r: 0 };
  const cur = { x: mouse.x, y: mouse.y, r: 0 };
  $('#hero').addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.r = isMobile() ? 0 : 150; });
  $('#hero').addEventListener('pointerleave', () => (mouse.r = 0));
  gsap.ticker.add(() => {
    cur.x += (mouse.x - cur.x) * 0.12; cur.y += (mouse.y - cur.y) * 0.12; cur.r += (mouse.r - cur.r) * 0.1;
    const b = stage.getBoundingClientRect();
    reveal.style.clipPath = `circle(${cur.r.toFixed(1)}px at ${(cur.x - b.left).toFixed(1)}px ${(cur.y - b.top).toFixed(1)}px)`;
    const nx = cur.x / innerWidth - 0.5, ny = cur.y / innerHeight - 0.5;
    const tr = `rotateY(${(nx * 14).toFixed(2)}deg) rotateX(${(-ny * 8).toFixed(2)}deg)`;
    tiltEls.forEach((el) => (el.style.transform = tr));
  });

  /* =========================================================
     SCROLL ANIMATIONS
     ========================================================= */
  function setupScroll() {
    // nav states
    ScrollTrigger.create({ start: 80, onToggle: (s) => $('#nav').classList.toggle('is-scrolled', s.isActive) });
    $$('.marquee-s, .manifesto, .gallery, .helmets, .footer__panel').forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 40px', end: 'bottom 40px',
        onToggle: (s) => $('#nav').classList.toggle('is-light', s.isActive && !(sec.classList.contains('gallery') && s.progress > 0.35)),
        onUpdate: (s) => { if (sec.classList.contains('gallery')) $('#nav').classList.toggle('is-light', s.progress < 0.42); },
      });
    });

    // HERO: pin & let marquee slide over, helmet zooms back
    ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: '+=100%', pin: true, pinSpacing: false });
    gsap.to(['#heroStage', heroGL && heroGL.canvas].filter(Boolean), { scale: 0.8, yPercent: 8, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=100%', scrub: true } });

    // MARQUEE section: pin, rows slide in opposite directions, image grows
    const mtl = gsap.timeline({ scrollTrigger: { trigger: '#marqueeS', start: 'top top', end: '+=120%', pin: true, scrub: 0.6 } });
    $$('.mrow').forEach((row) => {
      const dir = +row.dataset.dir;
      mtl.fromTo(row.querySelector('.mrow__track'), { xPercent: dir > 0 ? -40 : 0 }, { xPercent: dir > 0 ? 0 : -40, ease: 'none' }, 0);
    });
    mtl.fromTo('.marquee-s__media', { scale: 0.7, filter: 'grayscale(1) brightness(.7)' }, { scale: 1.15, filter: 'grayscale(0) brightness(1)', ease: 'none' }, 0)
      .to('.signature--marquee .sig-path', { strokeDashoffset: 0, ease: 'none', duration: 0.6 }, 0.1)
      .to('.marquee-s__rows', { opacity: 0.2, ease: 'none', duration: 0.3 }, 0.7);

    // MANIFESTO: lime wipe per line
    $$('#manifestoText .line').forEach((line, i) => {
      const words = line.querySelectorAll('.word');
      const wipe = line.querySelector('.wipe');
      gsap.set(words, { opacity: 0 });
      gsap.timeline({ scrollTrigger: { trigger: line, start: 'top 82%', toggleActions: 'play none none reverse' } })
        .set(wipe, { transformOrigin: 'left' })
        .to(wipe, { scaleX: 1, duration: 0.45, ease: 'expo.in', delay: i * 0.02 })
        .set(words, { opacity: 1 })
        .set(wipe, { transformOrigin: 'right' })
        .to(wipe, { scaleX: 0, duration: 0.55, ease: 'expo.out' });
    });

    // GALLERY: parallax + background shift + caption reveals
    if (!isMobile()) {
      $$('.gallery [data-speed]').forEach((el) => {
        const sp = parseFloat(el.dataset.speed);
        gsap.fromTo(el, { y: () => innerHeight * sp }, { y: () => -innerHeight * sp, ease: 'none', scrollTrigger: { trigger: '#gallery', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
      });
    }
    gsap.timeline({ scrollTrigger: { trigger: '#gallery', start: '25% center', end: '45% center', scrub: true } })
      .to('#gallery', { backgroundColor: '#a8ab9b', color: '#111112', ease: 'none' })
      .to('#gallery .topo', { opacity: 0.6, ease: 'none' }, 0);
    $$('.gallery .media').forEach((m) => {
      gsap.fromTo(m, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: m, start: 'top 92%' } });
      const img = m.firstElementChild;
      if (img) gsap.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: m, start: 'top 92%' } });
    });
    $$('.quote').forEach((q) => {
      gsap.from(q.querySelector('p'), { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: q, start: 'top 85%' } });
      drawSig(q.querySelector('.sig-path'), { paused: true, scrollTrigger: { trigger: q, start: 'top 75%' } });
    });

    // ON / OFF TRACK
    gsap.from('.otot__title h2 span', { yPercent: 110, opacity: 0, stagger: 0.08, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.otot__head', start: 'top 60%' } });
    gsap.to('.otot__scribble .sig-path', { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', scrollTrigger: { trigger: '.otot__head', start: 'top 45%' } });
    gsap.fromTo('.otot__panel', { clipPath: 'inset(12% 6% 0 6% round 1.5rem)' }, { clipPath: 'inset(0% 0% 0 0% round 0rem)', ease: 'none', scrollTrigger: { trigger: '.otot__split', start: 'top bottom', end: 'top top', scrub: true } });
    $$('.otot__panel .media').forEach((m) => gsap.fromTo(m, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.otot__split', start: 'top bottom', end: 'bottom top', scrub: true } }));

    // HELMETS grid batch reveal
    gsap.set('.hcard__inner', { y: 60, opacity: 0, rotate: 8 });
    ScrollTrigger.batch('.hcard', {
      start: 'top 90%',
      onEnter: (els) => gsap.to(els.map((e) => e.querySelector('.hcard__inner')), { y: 0, opacity: 1, rotate: 0, stagger: 0.08, duration: 1.2, ease: 'expo.out' }),
    });
    $$('.hcard').forEach((c) => {
      const inner = c.querySelector('.hcard__inner svg');
      c.addEventListener('pointermove', (e) => {
        const b = c.getBoundingClientRect();
        gsap.to(inner, { x: (e.clientX - b.left - b.width / 2) * 0.08, y: (e.clientY - b.top - b.height / 2) * 0.08, duration: 0.6, ease: 'power3.out' });
      });
      c.addEventListener('pointerleave', () => gsap.to(inner, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,.5)' }));
    });

    // generic reveal lines
    $$('.reveal-line > span').forEach((s) => {
      gsap.from(s, { yPercent: 110, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: s.parentElement, start: 'top 88%' } });
    });

    // STORE parallax
    $$('.store [data-speed]').forEach((el) => {
      const sp = parseFloat(el.dataset.speed);
      gsap.fromTo(el, { y: () => 200 * sp }, { y: () => -260 * sp, ease: 'none', scrollTrigger: { trigger: '#store', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
    });
    gsap.fromTo('.sp5', { rotate: -12 }, { rotate: 8, ease: 'none', scrollTrigger: { trigger: '#store', start: 'top bottom', end: 'bottom top', scrub: true } });

    // PARTNERS scribble
    gsap.to('.partners__scribble .sig-path', { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '#partners', start: 'top 80%', end: 'center center', scrub: 0.8 } });

    // SOCIAL fan
    const cards = $$('.fan__card');
    const mid = (cards.length - 1) / 2;
    gsap.set(cards, { rotate: 0, y: 80 });
    gsap.to(cards, {
      rotate: (i) => (i - mid) * 11, y: (i) => Math.abs(i - mid) * 12, ease: 'none',
      scrollTrigger: { trigger: '#fan', start: 'top 95%', end: 'center 45%', scrub: 0.8 },
    });
    cards.forEach((c, i) => {
      c.style.zIndex = 10 - Math.round(Math.abs(i - mid));
      c.addEventListener('pointerenter', () => gsap.to(c, { yPercent: -8, scale: 1.04, duration: 0.6, ease: 'expo.out' }));
      c.addEventListener('pointerleave', () => gsap.to(c, { yPercent: 0, scale: 1, duration: 0.6, ease: 'expo.out' }));
    });

    // FOOTER
    gsap.from('.footer__panel', { y: 120, ease: 'none', scrollTrigger: { trigger: '#footer', start: 'top bottom', end: 'top 20%', scrub: true } });
    gsap.from('.footer__helmet svg', { yPercent: 60, rotate: -10, ease: 'none', scrollTrigger: { trigger: '#footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    drawSig($('.signature--footer .sig-path'), { scrollTrigger: { trigger: '.footer__title', start: 'top 75%' } });
    gsap.from('.flink', { yPercent: 100, opacity: 0, stagger: 0.04, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '.footer__cols', start: 'top 85%' } });
  }

  /* =========================================================
     MENU
     ========================================================= */
  let menuOpen = false;
  const menuTl = gsap.timeline({ paused: true })
    .to('.menu__bg', { clipPath: 'inset(0 0 0% 0 round 0 0 0rem 0rem)', duration: 0.9, ease: 'expo.inOut' })
    .to('.menu__link span', { yPercent: -105, stagger: 0.05, duration: 0.9, ease: 'expo.out' }, '-=0.35')
    .to('.menu__foot', { opacity: 1, duration: 0.5 }, '-=0.6');
  gsap.set('.menu__link span', { y: 0, yPercent: 0 });
  gsap.set('.menu__link span', { transform: 'translateY(105%)' });
  function toggleMenu(force) {
    menuOpen = force ?? !menuOpen;
    document.body.classList.toggle('menu-open', menuOpen);
    if (menuOpen) { lenis && lenis.stop(); menuTl.timeScale(1).play(); }
    else { lenis && lenis.start(); menuTl.timeScale(1.6).reverse(); }
  }
  $('#burger').addEventListener('click', () => toggleMenu());
  $$('.menu__link').forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
  addEventListener('keydown', (e) => e.key === 'Escape' && menuOpen && toggleMenu(false));

  // anchor links via lenis
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) { e.preventDefault(); lenis ? lenis.scrollTo(0) : scrollTo(0, 0); return; }
    const t = $(id); if (!t) return;
    e.preventDefault(); setTimeout(() => (lenis ? lenis.scrollTo(t, { duration: 1.6 }) : t.scrollIntoView()), menuOpen ? 500 : 0);
  }));

  /* ---------------- magnetic buttons ---------------- */
  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - b.left - b.width / 2) * 0.3, y: (e.clientY - b.top - b.height / 2) * 0.3, duration: 0.5, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,.4)' }));
  });

  /* ---------------- boot ---------------- */
  const boot = () => {
    drawAllTopo();
    heroGLReady.then(() => { setupScroll(); intro(); });
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { drawAllTopo(); ScrollTrigger.refresh(); }, 250); });
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else addEventListener('load', boot);
})();
