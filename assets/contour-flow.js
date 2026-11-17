(function () {
  'use strict';
  const PERIOD = 60000, RADIUS = 200, RADIUS2 = RADIUS * RADIUS, FPS_MS = 1000 / 30;
  const EDGES = [[], [3, 2], [2, 1], [3, 1], [0, 1], [3, 0, 1, 2], [0, 2], [3, 0], [3, 0], [0, 2], [0, 1, 2, 3], [0, 1], [3, 1], [2, 1], [3, 2], []];
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * (i + 1)), t = perm[i];
    perm[i] = perm[j]; perm[j] = t;
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];

  function vnoise(x, y) {
    const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255, xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const aa = perm[perm[xi] + yi], ab = perm[perm[xi] + yi + 1], ba = perm[perm[xi + 1] + yi], bb = perm[perm[xi + 1] + yi + 1];
    return ((aa + u * (ba - aa)) + v * ((ab + u * (bb - ab)) - (aa + u * (ba - aa)))) / 255;
  }
  const fbm = (x, y, ox, oy) => vnoise(x + ox, y + oy) * 0.68 + vnoise(x * 2.03 - oy * 0.7 + 17.3, y * 2.03 + ox * 0.7 + 31.7) * 0.32;

  function isDark(el) {
    if (el.dataset.contourTheme) return el.dataset.contourTheme === 'dark';
    if (/\b(olive|dark|black|closing|night)\b/i.test(el.className)) return true;
    const bg = getComputedStyle(el).backgroundColor.match(/\d+/g);
    return !!(bg && bg.length >= 3 && +bg[3] !== 0 && (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]) < 128);
  }

  function initContourFlow() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = document.querySelectorAll('.contour');
    if (!els.length || !HTMLCanvasElement.prototype.getContext) return;
    const style = document.createElement('style');
    style.textContent = '.contour[data-contour-ready],.contour[data-contour-ready]::before,.contour[data-contour-ready]::after{background-image:none!important}.contour[data-contour-ready]>.contour-svg,.contour[data-contour-ready]>svg.contour-bg{display:none!important}';
    document.head.appendChild(style);

    const instances = [];
    let rafId = 0, lastFrame = 0;
    const setPower = (p, target, dur) => window.gsap ? window.gsap.to(p, { power: target, duration: dur, ease: 'power2.out', overwrite: true }) : (p.targetPower = target);

    els.forEach((el) => {
      if (el.dataset.contourReady) return;
      const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;display:block;';
      Array.from(el.children).forEach((ch) => { if (getComputedStyle(ch).position === 'static') ch.style.position = 'relative'; });
      el.insertBefore(canvas, el.firstChild);
      el.dataset.contourReady = '1';

      const s = { el, canvas, ctx, visible: false, w: 0, h: 0, dpr: 1, step: 24, cols: 0, rows: 0, grid: new Float32Array(0), dark: isDark(el), pointer: { x: -9999, y: -9999, tx: -9999, ty: -9999, power: 0, targetPower: 0 } };
      const resize = () => {
        const compact = window.innerWidth < 992;
        s.dpr = compact ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
        s.step = compact ? 30 : 22;
        s.w = Math.max(1, el.clientWidth); s.h = Math.max(1, el.clientHeight);
        canvas.width = Math.round(s.w * s.dpr); canvas.height = Math.round(s.h * s.dpr);
        ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
        s.cols = Math.ceil(s.w / s.step) + 1; s.rows = Math.ceil(s.h / s.step) + 1;
        s.grid = new Float32Array(s.cols * s.rows); s.dark = isDark(el);
      };
      resize();
      const onMove = (e) => {
        const pt = e.touches ? e.touches[0] : e, rect = pt && el.getBoundingClientRect();
        if (!pt) return;
        s.pointer.tx = pt.clientX - rect.left; s.pointer.ty = pt.clientY - rect.top;
        if (s.pointer.power < 0.01) { s.pointer.x = s.pointer.tx; s.pointer.y = s.pointer.ty; }
        setPower(s.pointer, 1, 0.25);
      };
      const onLeave = () => setPower(s.pointer, 0, 0.8);
      ['pointermove', 'touchmove'].forEach((ev) => el.addEventListener(ev, onMove, { passive: true }));
      ['pointerleave', 'touchend', 'touchcancel'].forEach((ev) => el.addEventListener(ev, onLeave, { passive: true }));
      window.addEventListener('resize', resize, { passive: true });
      instances.push(s);
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { const inst = instances.find((it) => it.el === e.target); if (inst) inst.visible = e.isIntersecting; });
      if (instances.some((it) => it.visible) && !rafId) rafId = requestAnimationFrame(tick);
    }, { threshold: 0 });
    instances.forEach((it) => io.observe(it.el));

    function draw(s, ox, oy, dt) {
      const p = s.pointer, { cols, rows, step, grid, ctx, w, h } = s, scale = 0.0024;
      if (!window.gsap) p.power += (p.targetPower - p.power) * Math.min(1, (dt / (p.targetPower ? 0.2 : 0.8)) * 3);
      p.x += (p.tx - p.x) * 0.25; p.y += (p.ty - p.y) * 0.25;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const wx = c * step, wy = r * step, dx = wx - p.x, dy = wy - p.y, d2 = dx * dx + dy * dy;
        let val = fbm(wx * scale, wy * scale, ox, oy);
        if (p.power > 0.001 && d2 < RADIUS2) { const f = 1 - Math.sqrt(d2) / RADIUS; val += f * f * (3 - 2 * f) * 0.26 * p.power; }
        grid[r * cols + c] = val;
      }
      ctx.clearRect(0, 0, w, h);
      const levels = window.innerWidth < 992 ? 12 : 15, limeIdx = Math.floor(levels * 0.55);
      ctx.lineWidth = 1;
      for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        ctx.strokeStyle = pass === 0 ? (s.dark ? 'rgba(244,244,237,.10)' : '#CBCBB9') : '#D2FF00';
        for (let l = 0; l < levels; l++) {
          if ((l === limeIdx) !== (pass === 1)) continue;
          const iso = 0.18 + (l / (levels - 1)) * 0.64;
          for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
            const x = c * step, y = r * step, i = r * cols + c, v00 = grid[i], v10 = grid[i + 1], v11 = grid[i + cols + 1], v01 = grid[i + cols];
            const segs = EDGES[(v00 > iso ? 8 : 0) | (v10 > iso ? 4 : 0) | (v11 > iso ? 2 : 0) | (v01 > iso ? 1 : 0)];
            for (let k = 0; k < segs.length; k++) {
              const e = segs[k], px = e === 0 ? x + step * (iso - v00) / (v10 - v00 || 1e-6) : e === 1 ? x + step : e === 2 ? x + step * (iso - v01) / (v11 - v01 || 1e-6) : x;
              const py = e === 0 ? y : e === 1 ? y + step * (iso - v10) / (v11 - v10 || 1e-6) : e === 2 ? y + step : y + step * (iso - v00) / (v01 - v00 || 1e-6);
              (k & 1) === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
          }
        }
        ctx.stroke();
      }
    }

    function tick(now) {
      if (!instances.some((it) => it.visible)) { rafId = 0; return; }
      rafId = requestAnimationFrame(tick);
      if (now - lastFrame < FPS_MS) return;
      const dt = Math.min(0.1, (now - (lastFrame || now)) / 1000); lastFrame = now;
      const ang = (now % PERIOD) / PERIOD * Math.PI * 2, ox = Math.cos(ang) * 1.4, oy = Math.sin(ang) * 1.4;
      instances.forEach((s) => { if (s.visible) draw(s, ox, oy, dt); });
    }
  }

  window.initContourFlow = initContourFlow;
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', initContourFlow) : initContourFlow();
})();
