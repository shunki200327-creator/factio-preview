(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const EXCLUDE_SEL = [
    'header,nav,footer,.hero,#hero,.fv,.kv,.cover,[class*="hero"],[id*="hero"]',
    '#design-lab,.design-lab,[id*="lab"],[class*="design-lab"],[data-section*="lab"]',
    '#idea-to-shop,.idea-to-shop,[id*="idea"],[class*="idea-to-shop"]',
    '[data-no-img-motion],.no-img-motion,.logo,.icon'
  ].join(',');

  function isExcludedSection(el) {
    if (el.closest(EXCLUDE_SEL)) return true;
    const sec = el.closest('section, article, .section, [data-section]');
    if (!sec) return false;
    const head = sec.querySelector('h1, h2, h3, .sec-title, .section-title, [class*="title"]');
    const txt = ((head && head.textContent) || sec.getAttribute('aria-label') || '').toUpperCase();
    return txt.includes('FROM IDEA TO SHOP') || txt.includes('DESIGN LAB');
  }

  function collectTargets() {
    const explicit = '.service-art img, #message img, .message img, [id*="message"] img, [class*="message"] img, [data-img-motion]';
    const all = Array.from(document.querySelectorAll(explicit + ', main img, section img, article img'));
    return all.filter((img) => {
      if (!img || img.dataset.imInit === '1' || isExcludedSection(img)) return false;
      if ((img.getAttribute('src') || '').toLowerCase().endsWith('.svg')) return false;
      if (img.matches(explicit)) return true;
      const w = img.clientWidth || img.naturalWidth || 0;
      return w === 0 || w >= 200;
    });
  }

  function prepareFrame(img) {
    let frame = img.closest('.service-art, .photo-frame, .img-frame, .art-frame') || img.parentElement;
    if (!frame) return null;
    if (frame.querySelector('figcaption, [class*="caption"]') && frame === img.parentElement) {
      const wrap = document.createElement('div');
      wrap.className = 'im-frame';
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
      frame = wrap;
    } else {
      frame.classList.add('im-frame');
    }
    const cf = window.getComputedStyle(frame).clipPath;
    const ci = window.getComputedStyle(img).clipPath;
    const hasClip = (cf && cf !== 'none') || (ci && ci !== 'none') || frame.hasAttribute('data-clip') || frame.classList.contains('has-clip');
    if (!hasClip) frame.classList.add('im-ellipse');
    img.classList.add('im-img');
    img.dataset.imInit = '1';
    return { frame, useEllipse: !hasClip };
  }

  function init() {
    const imgs = collectTargets();
    if (!imgs.length) return;
    const gsap = window.gsap;
    const ST = window.ScrollTrigger || (gsap && gsap.ScrollTrigger);
    if (gsap && ST && gsap.registerPlugin) gsap.registerPlugin(ST);
    if (window.lenis && ST && !window.__imLenisBound) {
      window.lenis.on('scroll', ST.update);
      window.__imLenisBound = true;
    }
    const isMobile = window.matchMedia('(max-width: 991.98px)').matches;
    const startScale = isMobile ? 1.12 : 1.25;
    const maxShift = isMobile ? 4 : 8;

    imgs.forEach((img) => {
      const prep = prepareFrame(img);
      if (!prep) return;
      const { frame, useEllipse } = prep;
      img.style.setProperty('--im-base', isMobile ? '1.04' : '1.08');
      img.style.setProperty('--im-scale', String(startScale));
      img.style.setProperty('--im-sat', isMobile ? '1' : '0.75');

      if (gsap && ST) {
        if (useEllipse) {
          gsap.fromTo(frame, { '--im-cx': '32%', '--im-cy': '38%' }, { '--im-cx': '120%', '--im-cy': '120%', ease: 'none', scrollTrigger: { trigger: frame, start: 'top 92%', end: 'top 35%', scrub: 0.6 } });
        }
        gsap.fromTo(img, { '--im-scale': startScale }, { '--im-scale': 1, ease: 'none', scrollTrigger: { trigger: frame, start: 'top 95%', end: 'top 25%', scrub: 0.7 } });
        gsap.fromTo(img, { '--im-py': -maxShift + '%' }, { '--im-py': maxShift + '%', ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
        if (!isMobile) {
          gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 85%', end: 'bottom 15%', scrub: 0.4 } })
            .fromTo(img, { '--im-sat': 0.75 }, { '--im-sat': 1, duration: 0.35, ease: 'none' })
            .to(img, { '--im-sat': 1, duration: 0.3, ease: 'none' })
            .to(img, { '--im-sat': 0.75, duration: 0.35, ease: 'none' });
        }
      }
      if (!isMobile) {
        const applyVars = (v, d, ease) => gsap ? gsap.to(img, Object.assign({ duration: d, ease, overwrite: 'auto' }, v)) : Object.entries(v).forEach(([k, val]) => img.style.setProperty(k, String(val)));
        frame.addEventListener('pointermove', (e) => {
          const r = frame.getBoundingClientRect();
          if (!r.width || !r.height) return;
          const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
          const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
          applyVars({ '--im-hs': 1.04, '--im-hx': (nx * 10).toFixed(2) + 'px', '--im-hy': (ny * 10).toFixed(2) + 'px', '--im-rx': (-ny * 3).toFixed(2) + 'deg', '--im-ry': (nx * 3).toFixed(2) + 'deg' }, 0.35, 'power2.out');
        }, { passive: true });
        frame.addEventListener('pointerleave', () => applyVars({ '--im-hs': 1, '--im-hx': '0px', '--im-hy': '0px', '--im-rx': '0deg', '--im-ry': '0deg' }, 0.55, 'power3.out'), { passive: true });
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
