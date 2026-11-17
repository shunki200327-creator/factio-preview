(() => {
  const init = () => {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fineDesktop = () => window.matchMedia && window.matchMedia('(min-width: 992px) and (hover: hover) and (pointer: fine)').matches;
    const isMobile = () => window.innerWidth < 992;

    // 4. 流れる文字帯（ライム・オリーブの2段、逆向き）
    const marqueeTracks = [];
    document.querySelectorAll('.fx-marquee').forEach((el) => {
      if (el.dataset.fxReady) return;
      el.dataset.fxReady = '1';
      const text = (el.getAttribute('data-text') || 'TEAMWEAR — BRAND — PRINT — SHOP — SELL — AI —').trim() + ' ';
      const copies = isMobile() ? 4 : 6;
      ['is-lime', 'is-olive'].forEach((cls, idx) => {
        const row = document.createElement('div');
        row.className = `fx-marquee-row ${cls}`;
        const track = document.createElement('div');
        track.className = 'fx-marquee-track';
        for (let i = 0; i < copies; i++) {
          const item = document.createElement('span');
          item.className = 'fx-marquee-item';
          item.textContent = text;
          track.appendChild(item);
        }
        row.append(track);
        el.append(row);
        marqueeTracks.push({ track, baseDir: idx === 0 ? -1 : 1, pos: idx === 0 ? 0 : -50 });
      });
    });

    // 1. 文字が1字ずつ現れる（.display の .line、data-split 二重防止）
    const splitNode = (node, list) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          Array.from(child.nodeValue || '').forEach((ch) => {
            const s = document.createElement('span');
            s.className = 'fx-char';
            s.textContent = ch;
            list.push(s);
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains('ribbon') && !child.classList.contains('fx-char') && child.tagName !== 'BR') {
          splitNode(child, list);
        }
      });
    };

    const displays = Array.from(document.querySelectorAll('.display'));
    displays.forEach((heading) => {
      if (heading.dataset.split || reduced) return;
      const lines = heading.querySelectorAll('.line');
      const targets = lines.length ? Array.from(lines) : [heading];
      const chars = [];
      targets.forEach((line) => {
        if (line.dataset.split) return;
        line.dataset.split = 'true';
        splitNode(line, chars);
      });
      heading.dataset.split = 'true';
      if (!chars.length || reduced) return;

      const gsap = window.gsap;
      const play = () => {
        if (gsap) gsap.to(chars, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.02, overwrite: 'auto' });
        else chars.forEach((c) => { c.classList.remove('fx-init'); c.classList.add('fx-in'); });
      };
      if (gsap) gsap.set(chars, { yPercent: 105, opacity: 0 });
      else chars.forEach((c, i) => { c.style.setProperty('--i', i); c.classList.add('fx-init'); });

      if (gsap && window.ScrollTrigger) {
        window.ScrollTrigger.create({ trigger: heading, start: 'top 88%', once: true, onEnter: play });
      } else if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { play(); io.disconnect(); } }, { threshold: 0.15 });
        io.observe(heading);
      } else play();
    });

    if (reduced || window.innerWidth < 992) return;

    // 2. 独自カーソル（PC・マウスありのみ）
    let dot = null, ring = null, mx = -100, my = -100, rx = -100, ry = -100, moved = false;
    if (fineDesktop() && !document.querySelector('.fx-cursor-dot')) {
      dot = Object.assign(document.createElement('div'), { className: 'fx-cursor-dot', ariaHidden: 'true' });
      ring = Object.assign(document.createElement('div'), { className: 'fx-cursor-ring', ariaHidden: 'true', innerHTML: '<span class="fx-cursor-label">VIEW</span>' });
      document.body.append(dot, ring);
      window.addEventListener('pointermove', (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        mx = e.clientX; my = e.clientY;
        if (!moved) { rx = mx; ry = my; moved = true; dot.classList.add('is-active'); ring.classList.add('is-active'); }
        const t = e.target && e.target.closest ? e.target : null;
        const onPhoto = t && t.closest('figure, picture, .hero-art, .craft-photo, .service-art, [data-oval], img:not([src$=".svg"])');
        const onLink = t && t.closest('a, button, .button, [role="button"], label.upload-button, summary');
        ring.classList.toggle('is-view', !!onPhoto);
        ring.classList.toggle('is-hover', !onPhoto && !!onLink);
      }, { passive: true });
    }

    // 3. 吸い付くボタン（.button, a.text-link 最大8px、離れると0.4秒で戻る）
    document.querySelectorAll('.button, a.text-link').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        if (!fineDesktop() || btn.disabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const r = btn.getBoundingClientRect();
        const x = Math.max(-8, Math.min(8, ((e.clientX - (r.left + r.width / 2)) / (r.width / 2 || 1)) * 8));
        const y = Math.max(-8, Math.min(8, ((e.clientY - (r.top + r.height / 2)) / (r.height / 2 || 1)) * 8));
        if (window.gsap) window.gsap.to(btn, { x, y, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
        else { btn.style.transition = 'transform 0.15s ease-out'; btn.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`; }
      });
      btn.addEventListener('mouseleave', () => {
        if (window.gsap) window.gsap.to(btn, { x: 0, y: 0, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
        else { btn.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)'; btn.style.transform = 'translate3d(0px, 0px, 0px)'; }
      });
    });

    // 4 & 5. スクロール速度連動（文字帯の加速・逆転＋.displayのskewY最大2度）
    let lastY = window.scrollY || 0, vel = 0, scrollDir = 1;
    const onScroll = (y) => { const d = y - lastY; lastY = y; if (Math.abs(d) > 0.1) scrollDir = d > 0 ? 1 : -1; vel = Math.max(-40, Math.min(40, d)); };
    window.addEventListener('scroll', () => onScroll(window.scrollY || 0), { passive: true });
    if (window.lenis && typeof window.lenis.on === 'function') window.lenis.on('scroll', (e) => onScroll(typeof e.scroll === 'number' ? e.scroll : window.scrollY || 0));

    let raf = 0, lastFrame = 0;
    const tick = now => {
      raf = 0; if(document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 992) return;
      const delta = Math.min(2, (now - (lastFrame || now - 16.67)) / 16.67); lastFrame = now;
      vel *= 0.88;
      if (dot && ring && moved) {
        rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
        dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
        ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0) translate(-50%, -50%)`;
      }
      const mobile = isMobile(), maxSkew = mobile ? 1 : 2;
      const skew = Math.abs(vel) < 0.05 ? 0 : Math.max(-maxSkew, Math.min(maxSkew, vel * 0.08));
      if (!mobile || Math.abs(vel) > 0.02) displays.forEach((d) => { d.style.transform = skew ? `skewY(${skew.toFixed(2)}deg)` : ''; });
      const speed = (mobile ? 0.035 : 0.06) + Math.min(mobile ? 1.2 : 2.5, Math.abs(vel) * 0.06);
      marqueeTracks.forEach((m) => {
        m.pos += speed * m.baseDir * scrollDir * delta;
        if (m.pos <= -50) m.pos += 50; else if (m.pos > 0) m.pos -= 50;
        m.track.style.transform = `translate3d(${m.pos.toFixed(3)}%, 0, 0)`;
      });
      raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      if(matchMedia('(prefers-reduced-motion: reduce)').matches){
        const chars = document.querySelectorAll('.fx-char');
        window.gsap?.killTweensOf(chars);
        window.gsap?.set(chars,{yPercent:0,opacity:1});
        displays.forEach(d => d.style.transform='');
      }
      raf = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', sync);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', sync);
    if (dot || displays.length || marqueeTracks.length) sync();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
