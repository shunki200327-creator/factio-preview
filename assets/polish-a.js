(() => {
  const sync = () => {
    const h = document.getElementById('header');
    if (h) document.documentElement.style.setProperty('--header-h', `${h.offsetHeight}px`);
    const form = document.getElementById('design-form');
    if (form && matchMedia('(max-width: 991px)').matches) {
      const sum = document.querySelector('#lab .lab-summary-bar');
      const save = document.querySelector('#lab .lab-save-btn');
      if (save && save.parentElement !== form) { form.prepend(save); requestAnimationFrame(() => window.dispatchEvent(new Event('resize'))); }
    }
    const targets = [document.getElementById('lab'), document.getElementById('shop-web')].filter(Boolean);
    if (io) targets.forEach((t) => { if (!hit.has(t)) { hit.set(t, false); io.observe(t); } });
  };
  const hit = new Map();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach((e) => hit.set(e.target, e.isIntersecting));
    document.body.classList.toggle('in-lab-or-shop', [...hit.values()].some(Boolean));
  }, { threshold: 0.01 }) : null;
  const init = () => {
    sync();
    window.addEventListener('resize', sync, { passive: true });
    new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
