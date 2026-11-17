(() => {
  const STEPS = [
    ['01', 'PLAN', '企画・デザイン', 'どんな服を、誰に届けるか。形と色、デザインを一緒に決めます'],
    ['02', 'MAKE', '生地・縫製', '生地えらびから縫製工場への発注まで（OEM）。数量や仕様をご相談ください'],
    ['03', 'PRINT', 'プリント', 'DTF・シルクスクリーン・オンデマンド・特殊プリント。刺繍もご相談ください'],
    ['04', 'SHOP', 'ネットショップ', 'BASE・Shopify の開設とデザイン、ブランドのWebサイトも制作します'],
    ['05', 'SELL', '売り方を伝える', '商品ページの作り方や、SNSでの見せ方など、売るための手順を一緒に'],
    ['06', 'AI', 'AI活用', '商品説明や画像づくり、日々の作業をAIで軽くする方法もお伝えします']
  ];

  const init = () => {
    const section = document.getElementById('journey');
    if (!section) return;

    section.setAttribute('aria-labelledby', 'journey-title');
    section.innerHTML = `<div class="journey-inner">
      <header class="journey-head">
        <div class="journey-title-group">
          <h2 id="journey-title" class="journey-title"><span class="journey-en-sans">FROM IDEA</span><em class="journey-en-serif">TO SHOP</em></h2>
          <p class="journey-sub">服をつくるところから、オンラインショップで売るまで</p>
        </div>
        <p class="journey-lead">一着の企画から、ネットショップでの販売まで。つくり方も、売り方も、まるごと伴走します</p>
        <div class="journey-meter" aria-hidden="true">
          <span class="journey-count"><b id="journey-current">01</b> / 06</span>
          <div class="journey-bar"><i id="journey-bar-fill"></i></div>
        </div>
      </header>
      <div class="journey-viewport">
        <ol class="journey-track">${STEPS.map(([num, code, name, desc], i) => `
          <li class="journey-panel${i === 0 ? ' is-active' : ''}" data-step="${num}">
            <div class="journey-num" aria-hidden="true"><span>${num}</span></div>
            <div class="journey-body">
              <span class="journey-line journey-code">${code}</span>
              <h3 class="journey-line journey-name">${name}</h3>
              <p class="journey-line journey-desc">${desc}</p>
            </div>
          </li>`).join('')}
        </ol>
      </div>
    </div>`;

    const track = section.querySelector('.journey-track');
    const panels = Array.from(section.querySelectorAll('.journey-panel'));
    const currentEl = section.querySelector('#journey-current');
    const barFill = section.querySelector('#journey-bar-fill');
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktopQuery = window.matchMedia('(min-width: 992px)');

    const showAll = () => {
      panels.forEach((p) => p.classList.add('is-active'));
      if (barFill) barFill.style.transform = 'scaleX(1)';
    };

    const setStepUI = (idx, progress) => {
      const c = Math.max(0, Math.min(STEPS.length - 1, idx));
      if (currentEl) currentEl.textContent = STEPS[c][0];
      if (barFill) barFill.style.transform = `scaleX(${Math.max(1 / STEPS.length, progress)})`;
      panels.forEach((panel, i) => panel.classList.toggle('is-active', i === c));
    };

    let io = null;
    let st = null;
    const cleanup = () => {
      if (io) { io.disconnect(); io = null; }
      if (st) { const animation = st.animation; st.kill(); animation?.kill(); st = null; }
      section.classList.remove('journey-pinned');
      if (track) track.style.transform = '';
      section.style.backgroundColor = '';
    };

    const setup = () => {
      cleanup();
      if (reducedQuery.matches) { showAll(); return; }
      if (desktopQuery.matches && window.gsap && window.ScrollTrigger) {
        section.classList.add('journey-pinned');
        window.gsap.registerPlugin(window.ScrollTrigger);
        const getDistance = () => Math.max(0, track.scrollWidth - section.querySelector('.journey-viewport').clientWidth);
        const tl = window.gsap.timeline({
          scrollTrigger: {
            trigger: section,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            end: () => `+=${getDistance()}`,
            onUpdate: (self) => setStepUI(Math.round(self.progress * (STEPS.length - 1)), self.progress)
          }
        });
        tl.to(track, { x: () => -getDistance(), ease: 'none', duration: 1 }, 0)
          .fromTo(section, { backgroundColor: '#282C20' }, { backgroundColor: '#111112', ease: 'power1.inOut', duration: 0.35 }, 0.65);
        st = tl.scrollTrigger;
        if (window.lenis && typeof window.lenis.resize === 'function') window.lenis.resize();
        window.ScrollTrigger.refresh();
      } else if ('IntersectionObserver' in window) {
        io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('is-active');
            const idx = panels.indexOf(e.target);
            if (idx >= 0) {
              if (currentEl) currentEl.textContent = STEPS[idx][0];
              if (barFill) barFill.style.transform = `scaleX(${(idx + 1) / STEPS.length})`;
            }
          });
        }, { threshold: 0.2 });
        panels.forEach((p) => io.observe(p));
      } else {
        showAll();
      }
    };

    setup();
    window.addEventListener('load', setup, { once: true });
    desktopQuery.addEventListener('change', setup);
    reducedQuery.addEventListener('change', setup);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
