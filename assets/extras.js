(() => {
  const STATS = [
    { num: 1, en: 'PIECE〜', jp: '1枚から' },
    { num: 2, en: 'WEEKS', jp: '納期は2週間前後' },
    { num: 4, en: 'PRINT METHODS', jp: 'DTF・シルク・オンデマンド・特殊' },
    { num: 2, en: 'SHOP PLATFORMS', jp: 'BASE・Shopify に対応' }
  ];
  const FAQS = [
    ['1枚だけでも頼めますか', 'はい、1枚から承ります。'],
    ['納期はどれくらいですか', '2週間前後が目安です。枚数や内容によって変わるため、ご相談ください。'],
    ['どんなプリント方法がありますか', 'DTF・シルクスクリーン・オンデマンド印刷・特殊プリントの4つです。刺繍もご相談ください。'],
    ['デザインがなくても大丈夫ですか', 'はい。どんな一着にしたいかをお聞きして、一緒に形にします。'],
    ['つくった服をネットで売りたいです', 'BASE・Shopify のショップづくりから、売り方まで一緒に進めます。'],
    ['服の値段はいくらですか', 'ボディ（服）とプリントの内容、枚数をうかがってお見積りします。お気軽にお問い合わせください。']
  ];

  const init = () => {
    if (document.querySelector('section.stats')) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. 数字の帯 (.stats) を PRINT METHODS の直前に差し込む
    const printSec = document.getElementById('print-methods');
    const statsSec = document.createElement('section');
    statsSec.className = 'stats dark';
    statsSec.setAttribute('aria-label', 'Factioの制作体制');
    statsSec.innerHTML = `<div class="stats-head"><span>KEY NUMBERS</span><span>FACTIO SPEC</span></div><div class="stats-grid">${STATS.map(s => `<div class="stat-item"><div class="stat-num" data-target="${s.num}">${reduced ? s.num : 0}</div><div><div class="stat-en">${s.en}</div><p class="stat-jp">${s.jp}</p></div></div>`).join('')}</div>`;
    if (printSec) printSec.before(statsSec);

    // 3. よくある質問 (.faq) を ABOUT の直前に差し込む
    const aboutSec = document.getElementById('about');
    const faqSec = document.createElement('section');
    faqSec.className = 'faq';
    faqSec.id = 'faq';
    faqSec.setAttribute('aria-labelledby', 'faq-title');
    faqSec.innerHTML = `<div class="faq-inner"><span class="faq-kicker">FAQ</span><h2 class="faq-title" id="faq-title">QUESTIONS <em>&amp; ANSWERS</em></h2><div class="faq-list">${FAQS.map(([q, a]) => `<details class="faq-item"><summary class="faq-q"><span>${q}</span><span class="faq-icon" aria-hidden="true">＋</span></summary><div class="faq-a-wrap"><p class="faq-a">${a}</p></div></details>`).join('')}</div></div>`;
    if (aboutSec) aboutSec.before(faqSec);

    // FAQ のなめらかな高さ開閉
    faqSec.querySelectorAll('.faq-item').forEach(det => {
      const sum = det.querySelector('.faq-q');
      const wrap = det.querySelector('.faq-a-wrap');
      sum.addEventListener('click', e => {
        if (reduced) return;
        e.preventDefault();
        if (!det.hasAttribute('open')) {
          det.setAttribute('open', '');
          const h = wrap.scrollHeight;
          wrap.style.height = '0px';
          requestAnimationFrame(() => { wrap.style.height = `${h}px`; });
          wrap.addEventListener('transitionend', () => { wrap.style.height = 'auto'; }, { once: true });
        } else {
          wrap.style.height = `${wrap.scrollHeight}px`;
          requestAnimationFrame(() => { wrap.style.height = '0px'; });
          wrap.addEventListener('transitionend', () => { det.removeAttribute('open'); wrap.style.height = ''; }, { once: true });
        }
      });
    });

    // 2. スマホの下に固定ボタン（991px以下）
    const bar = document.createElement('nav');
    bar.className = 'mobile-cta-bar';
    bar.setAttribute('aria-label', '相談・デザインショートカット');
    bar.innerHTML = `<a class="mobile-cta-btn is-primary" href="#lab">デザインを試す <span aria-hidden="true">↗</span></a><a class="mobile-cta-btn is-secondary" id="ex-gmail-btn" href="#about">Gmailで相談 <span aria-hidden="true">↗</span></a>`;
    document.body.appendChild(bar);

    const gmailBtn = bar.querySelector('#ex-gmail-btn');
    const syncGmail = () => {
      const email = window.FactioContact && window.FactioContact.email;
      gmailBtn.setAttribute('aria-disabled', String(!email));
      if (!email) gmailBtn.removeAttribute('href');
      if (email) gmailBtn.href = `mailto:${email}?subject=${encodeURIComponent('Factioへのご相談')}`;
    };
    syncGmail();
    gmailBtn.addEventListener('click', e => { syncGmail(); if (!window.FactioContact?.email) e.preventDefault(); });

    const hero = document.getElementById('home') || document.querySelector('.hero');
    const lab = document.getElementById('lab');
    const footer = document.querySelector('.footer-wrap') || document.querySelector('footer');
    const inView = el => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };
    const updateBar = () => {
      const passedHero = hero ? hero.getBoundingClientRect().bottom <= 0 : window.scrollY > 300;
      const visible = passedHero && !inView(lab) && !inView(footer) && !document.body.classList.contains('menu-open');
      bar.classList.toggle('is-visible', visible); bar.inert = !visible;
    };
    window.addEventListener('scroll', updateBar, { passive: true });
    window.addEventListener('resize', updateBar, { passive: true });
    updateBar();

    if (reduced) return;
    let counted = false;
    const runCount = () => {
      if (counted) return;
      counted = true;
      const start = performance.now();
      const nums = statsSec.querySelectorAll('.stat-num');
      const tick = now => {
        const p = Math.min(1, (now - start) / 1000);
        const ease = 1 - Math.pow(1 - p, 3);
        nums.forEach(el => { el.textContent = Math.round(Number(el.dataset.target) * ease); });
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      window.gsap.from(statsSec.querySelectorAll('.stat-item'), {
        y: 28, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: statsSec, start: 'top 82%', once: true, onEnter: runCount }
      });
      window.gsap.from(faqSec.querySelectorAll('.faq-title, .faq-item'), {
        y: 20, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out',
        scrollTrigger: { trigger: faqSec, start: 'top 82%', once: true }
      });
    } else if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { runCount(); io.disconnect(); } }, { threshold: 0.2 });
      io.observe(statsSec);
    } else runCount();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
