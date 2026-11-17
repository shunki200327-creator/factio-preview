(() => {
  'use strict';
  const form = document.querySelector('#design-form'), ws = document.querySelector('#lab-workspace');
  const previewCol = document.querySelector('.preview-column'), lib = window.FactioGarments;
  if (!form || !ws || !previewCol || !lib || !Array.isArray(lib.products) || !lib.products.length) return;
  const fsets = [...form.querySelectorAll('fieldset')].filter(fs => fs.id !== 'lab-text-field'); if (fsets.length < 5) return;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.matchMedia('(max-width: 991px)').matches;
  const stepDefs = [
    { num: '01', label: 'ボディ', fs: fsets[0] }, { num: '02', label: 'カラー', fs: fsets[1] },
    { num: '03', label: '位置', fs: fsets[2] }, { num: '04', label: 'デザイン', fs: fsets[3] },
    { num: '05', label: '枚数', fs: document.querySelector('#quantity-field') || fsets[fsets.length - 1] }
  ];
  const dock = document.createElement('div'); dock.className = 'lab-steps-dock';
  const bar = document.createElement('nav'); bar.className = 'lab-steps-bar'; bar.setAttribute('aria-label', 'デザイン手順');
  const btns = stepDefs.map((s, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-step-btn'; b.dataset.step = String(i);
    b.innerHTML = `<b>${(s.fs && s.fs.querySelector('legend b') && s.fs.querySelector('legend b').textContent.trim()) || s.num}</b><span>${s.label}</span><i class="lab-step-check" aria-hidden="true">✓</i>`;
    b.addEventListener('click', () => { setActive(i, true); s.fs?.scrollIntoView({ behavior: reduced() ? 'instant' : 'smooth', block: 'start' }); });
    bar.append(b); return b;
  });
  const line = document.createElement('span'); line.className = 'lab-steps-line'; line.setAttribute('aria-hidden', 'true');
  bar.append(line);
  const sumBar = document.createElement('div'); sumBar.className = 'lab-summary-bar'; sumBar.setAttribute('aria-live', 'polite');
  sumBar.innerHTML = `<div class="lab-summary-specs"></div><div class="lab-summary-price"><span>金額</span><strong data-price>お問い合わせください</strong><small>（税込・プリント代別）</small></div>`;
  const specsEl = sumBar.querySelector('.lab-summary-specs'), priceEl = sumBar.querySelector('[data-price]');
  dock.append(bar, sumBar); form.prepend(dock);
  const legendSpans = fsets.map((fs, idx) => {
    const leg = fs.querySelector('legend'); if (!leg) return null;
    if (idx === 1) {
      const cn = leg.querySelector('#color-name');
      if (cn) { if (!leg.textContent.includes('—')) cn.before(' — '); return cn; }
    }
    let sp = leg.querySelector('.lab-legend-val');
    if (!sp) { sp = document.createElement('span'); sp.className = 'lab-legend-val'; leg.append(sp); }
    return sp;
  });
  let activeIdx = 0, touchLockUntil = 0, shownPrice = null, rafId = 0;
  function setActive(idx, lock = false) {
    activeIdx = Math.max(0, Math.min(4, idx));
    if (lock) touchLockUntil = performance.now() + 900;
    bar.style.setProperty('--active-step', String(activeIdx));
    btns.forEach((b, i) => { b.classList.toggle('is-active', i === activeIdx); b.setAttribute('aria-current', i === activeIdx ? 'step' : 'false'); });
  }
  function animatePrice(target) {
    if (shownPrice === null || reduced() || shownPrice === target) {
      cancelAnimationFrame(rafId); shownPrice = target; priceEl.textContent = `¥${target.toLocaleString('ja-JP')}〜`; return;
    }
    const start = shownPrice, diff = target - start, t0 = performance.now();
    cancelAnimationFrame(rafId);
    const tick = now => {
      const p = Math.min(1, (now - t0) / 400), cur = Math.round(start + diff * (1 - Math.pow(1 - p, 3)));
      priceEl.textContent = `¥${cur.toLocaleString('ja-JP')}〜`;
      if (p < 1) rafId = requestAnimationFrame(tick); else shownPrice = target;
    };
    rafId = requestAnimationFrame(tick);
  }
  function syncLayout() {
    if (isMobile()) {
      if (sumBar.parentElement !== previewCol) previewCol.append(sumBar);
      dock.style.setProperty('--ls-sticky-top', `${72 + Math.round(previewCol.getBoundingClientRect().height)}px`);
    } else {
      if (sumBar.parentElement !== dock) dock.append(sumBar);
      dock.style.setProperty('--ls-sticky-top', '90px');
    }
  }
  function getState() {
    const bodyId = form.querySelector('#body-controls [aria-pressed="true"]')?.dataset.body || lib.products[0].id;
    const prod = lib.products.find(p => p.id === bodyId) || lib.products[0];
    const colorBtn = form.querySelector('#color-controls [aria-pressed="true"]');
    const colorIdx = Number(colorBtn?.dataset.color ?? 0);
    const colorName = colorBtn?.getAttribute('aria-label') || document.querySelector('#color-name')?.textContent?.trim() || 'ホワイト';
    const posName = form.querySelector('#position-controls [aria-pressed="true"]')?.textContent?.trim() || '胸';
    const method = form.querySelector('#print-method')?.value || 'DTF';
    const total = [...form.querySelectorAll('.quantities input')].reduce((n, el) => n + (Number(el.value) || 0), 0);
    const up = document.querySelector('#upload-preview'), sc = Number(form.querySelector('#scale')?.value || 100);
    const hasCustomDesign = Boolean(up && !up.hidden && up.getAttribute('src')) || ['#lab-team-name','#lab-number','#lab-player-name'].some(sel => form.querySelector(sel)?.value.trim());
    const designName = hasCustomDesign ? (up && !up.hidden ? (form.querySelector('#upload')?.files?.[0]?.name || '画像あり') : '文字あり') : 'サンプルロゴ';
    return { prod, colorIdx, colorName, posName, method, total, hasCustomDesign, sc, designName };
  }
  const touched = new Set([0, 1, 2]);
  function updateUI() {
    const st = getState(), unit = lib.unitPrice(st.prod, st.colorIdx), est = unit === null ? null : unit * st.total;
    specsEl.textContent = `${st.prod.name} ${st.prod.number}／${st.colorName}／${st.posName}／${st.method}／合計 ${st.total}枚`;
    if (est === null) { cancelAnimationFrame(rafId); shownPrice = null; priceEl.textContent = 'お問い合わせください'; } else animatePrice(est);
    const legVals = [`${st.prod.name} ${st.prod.number}`, st.colorName, st.posName, `${st.designName}（${st.sc}%）`, st.method, `合計 ${st.total}枚`];
    legendSpans.forEach((sp, i) => { if (sp && legVals[i]) sp.textContent = i === 1 ? legVals[i] : ` — ${legVals[i]}`; });
    const done = [touched.has(0), touched.has(1), touched.has(2), st.hasCustomDesign || touched.has(3), st.total >= 1];
    btns.forEach((b, i) => b.classList.toggle('is-done', Boolean(done[i])));
    syncLayout();
  }
  fsets.forEach((fs, idx) => {
    const mapIdx = idx >= 4 ? (idx === 4 ? 3 : 4) : idx;
    ['click', 'input', 'change', 'focusin'].forEach(ev => fs.addEventListener(ev, () => { touched.add(mapIdx); setActive(mapIdx, true); setTimeout(updateUI, 0); }));
  });
  form.querySelector('#lab-text-field')?.addEventListener('input', () => { setActive(3,true); setTimeout(updateUI,0); });
  form.querySelector('#upload')?.addEventListener('change', () => setTimeout(updateUI, 120));
  window.addEventListener('scroll', () => {
    syncLayout();
    if (performance.now() < touchLockUntil) return;
    const refY = window.innerHeight * 0.38;
    let best = activeIdx, minD = Infinity;
    stepDefs.forEach((s, i) => {
      if (!s.fs) return;
      const r = s.fs.getBoundingClientRect(), d = Math.abs(r.top - refY);
      if (r.top <= refY && r.bottom >= 100) { best = i; minD = -1; } else if (minD >= 0 && d < minD) { minD = d; best = i; }
    });
    if (best !== activeIdx) setActive(best, false);
  }, { passive: true });
  new MutationObserver(() => updateUI()).observe(document.querySelector('#upload-preview'), {attributes:true, attributeFilter:['src','hidden']});
  window.addEventListener('resize', syncLayout); setActive(0, false); updateUI();
})();
