(function () {
  'use strict';

  const ROWS = [
    ['BASE', '手軽に始めるネットショップ。開設のしかたから、ブランドに合わせたデザイン作成、公開のしかたまで'],
    ['SHOPIFY', '本格的に育てるネットショップ。開設のしかたから、テーマのデザイン作成、公開のしかたまで'],
    ['WEBSITE', 'ブランドや会社の顔になるWebサイト。世界観を伝えるデザイン作成から、公開のしかたまで']
  ];

  const STEPS = [
    ['01', '開設のしかた'], ['02', 'デザイン作成'], ['03', '公開のしかた']
  ];

  function getConsultHref() {
    const email = window.FactioContact && window.FactioContact.email;
    return email ? 'mailto:' + email + '?subject=' + encodeURIComponent('ネットショップ・Webサイトのご相談') : '#about';
  }

  function insertHeroLine() {
    if (document.querySelector('.hero-sub-shop')) return;
    for (const p of document.querySelectorAll('#home .hero-title p, .hero-title p')) {
      if (p.textContent && p.textContent.includes('チームの一着を、つくる')) {
        const sub = document.createElement('p');
        sub.className = 'hero-sub-shop';
        sub.textContent = '服づくりから、BASE・Shopify・Webサイトまで';
        p.after(sub);
        break;
      }
    }
  }

  function insertMenuLink() {
    const menu = document.getElementById('menu');
    if (!menu || menu.querySelector('a[href="#shop-web"]')) return;
    const links = menu.querySelectorAll('a[href]');
    if (!links.length) return;
    const link = document.createElement('a');
    link.href = '#shop-web';
    link.textContent = 'SHOP & WEB';
    (menu.querySelector('a[href="#services"]') || links[links.length - 1]).after(link);
  }

  function buildSection() {
    if (document.getElementById('shop-web')) return null;
    const journey = document.getElementById('journey');
    if (!journey) return null;

    const sec = document.createElement('section');
    sec.id = 'shop-web';
    sec.className = 'shop-web dark';
    sec.setAttribute('aria-labelledby', 'shop-web-title');

    const rowsHtml = ROWS.map(([en, desc]) =>
      `<div class="sw-row"><span class="sw-row-en">${en}</span><p class="sw-row-desc">${desc}</p></div>`
    ).join('');
    const flowHtml = STEPS.map(([num, label]) =>
      `<li><span class="sw-num">${num}</span><span class="sw-step">${label}</span></li>`
    ).join('');

    sec.innerHTML = `
      <div class="sw-head">
        <span class="micro sw-label">SHOP &amp; WEB</span>
        <h2 id="shop-web-title" class="sw-title"><span class="sw-sans">MAKE IT.</span> <em class="sw-serif">SELL IT.</em></h2>
        <p class="sw-jp-title">つくった服を、売れる場所まで</p>
        <p class="sw-lead">服ができたら、次は売る場所。BASE・Shopify のネットショップも、ブランドのWebサイトも、開設のしかた・デザイン作成・公開のしかたまで、Factio がサポートします</p>
      </div>
      <div class="sw-rows">${rowsHtml}</div>
      <ol class="sw-flow" aria-label="サポートの流れ">${flowHtml}</ol>
      <div class="sw-actions">
        <a class="button sw-btn primary" id="sw-consult-btn" href="${getConsultHref()}">ショップづくりを相談する <span aria-hidden="true">↗</span></a>
        <a class="button sw-btn" href="#lab">まずは服をデザインする <span aria-hidden="true">↗</span></a>
      </div>`;

    // PCでは #journey がピン留めの包みに入り、その中の兄弟要素が作り直されるため、DESIGN LAB の直前に置く
    const lab = document.getElementById('lab');
    (lab && lab.parentNode ? lab : journey).before ? (lab ? lab.before(sec) : journey.after(sec)) : journey.after(sec);
    const consultBtn = sec.querySelector('#sw-consult-btn');
    if (consultBtn) consultBtn.addEventListener('click', () => { consultBtn.href = getConsultHref(); });
    return sec;
  }

  function setupMotion(sec) {
    if (!sec || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const isMobile = window.matchMedia('(max-width: 991px)').matches;
    if (isMobile && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-active');
            setTimeout(() => e.target.classList.remove('is-active'), 650);
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.45 });
      sec.querySelectorAll('.sw-row').forEach((r) => io.observe(r));
    }
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      const targets = isMobile ? sec.querySelectorAll('.sw-head') : sec.querySelectorAll('.sw-head > *, .sw-row, .sw-flow li, .sw-actions');
      gsap.from(targets, {
        y: isMobile ? 16 : 32, opacity: 0, duration: isMobile ? 0.45 : 0.7, stagger: isMobile ? 0 : 0.08,
        ease: 'power2.out', scrollTrigger: { trigger: sec, start: 'top 82%', once: true }
      });
    }
  }

  function init() { insertHeroLine(); insertMenuLink(); setupMotion(buildSection()); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
