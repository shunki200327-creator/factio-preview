// 濃い色のボディでは、プリントを掛け合わせ（multiply）でなく、そのまま重ねる。実際のプリントは下地を敷いて色を出すため
(() => {
  const stage = document.getElementById('garment-stage');
  const controls = document.getElementById('color-controls');
  if (!stage || !controls) return;
  const lum = (hex) => {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec((hex || '').trim());
    if (!m) return 1;
    const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const sync = () => {
    const btn = controls.querySelector('[aria-pressed="true"]');
    const hex = btn ? getComputedStyle(btn).getPropertyValue('--swatch') : '';
    stage.classList.toggle('is-dark-body', lum(hex) < 0.42);
  };
  controls.addEventListener('click', () => setTimeout(sync, 0));
  new MutationObserver(sync).observe(controls, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
  sync();
})();
