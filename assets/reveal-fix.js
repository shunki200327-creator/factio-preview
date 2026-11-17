// 楕円で現れる写真（[data-oval]）が、部品どうしの取り合いで開かないまま止まるのを防ぐ（11/17）
(() => {
  const els = [...document.querySelectorAll('[data-oval]')];
  if (!els.length) return;
  const show = (el) => el.classList.add('is-visible');
  if (!('IntersectionObserver' in window)) { els.forEach(show); return; }
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) { setTimeout(() => show(en.target), 200); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0 });
  els.forEach((e) => io.observe(e));
  // 念のため：画面より上に来たものは必ず開く
  addEventListener('scroll', () => els.forEach((e) => { if (e.getBoundingClientRect().top < innerHeight * 0.9) show(e); }), { passive: true });
})();
