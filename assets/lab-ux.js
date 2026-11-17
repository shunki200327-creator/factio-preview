(() => {
  'use strict';
  const init = () => {
    const lab = document.querySelector('#lab');
    if (!lab) return;
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. Quantity -/+ buttons with long-press
    const qtyInputs = $$('.quantities input');
    qtyInputs.forEach((input) => {
      if (input.dataset.uxReady) return;
      input.dataset.uxReady = '1';
      input.setAttribute('inputmode', 'numeric');
      input.min = '0';
      input.max = '999';
      const step = (delta) => {
        const cur = Math.max(0, Math.min(999, parseInt(input.value, 10) || 0));
        const next = Math.max(0, Math.min(999, cur + delta));
        if (next !== cur || input.value !== String(next)) {
          input.value = String(next);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };
      const makeBtn = (label, cls, delta) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `qty-btn ${cls}`;
        b.textContent = label;
        let t1 = 0, t2 = 0, held = false;
        const stop = () => { clearTimeout(t1); clearInterval(t2); t1 = t2 = 0; };
        b.addEventListener('pointerdown', (e) => {
          if (e.button && e.button !== 0) return;
          e.preventDefault();
          held = true;
          step(delta);
          stop();
          t1 = setTimeout(() => { t2 = setInterval(() => step(delta), 80); }, 400);
        });
        ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach((ev) => b.addEventListener(ev, stop));
        b.addEventListener('click', (e) => {
          e.preventDefault();
          if (held) { held = false; return; }
          step(delta);
        });
        return b;
      };
      input.before(makeBtn('−', 'qty-minus', -1));
      input.after(makeBtn('＋', 'qty-plus', 1));
    });

    // 3. Guard submit when total is 0
    let errTimer = 0;
    const submitBtn = $('#design-form .submit-button, #design-form [type="submit"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        const total = qtyInputs.reduce((sum, i) => sum + (parseInt(i.value, 10) || 0), 0);
        if (total > 0) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        const field = $('#quantity-field') || $('.quantities');
        let err = $('#quantity-error');
        if (!err && $('.quantities')) {
          err = document.createElement('p');
          err.id = 'quantity-error';
          err.setAttribute('role', 'alert');
          $('.quantities').after(err);
        }
        if (err) {
          err.textContent = '枚数を入れてください';
          err.hidden = false;
          clearTimeout(errTimer);
          errTimer = setTimeout(() => { err.hidden = true; }, 3000);
        }
        field?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
      }, true);
    }

    // 4. Deadline select + hidden date input
    const setupDeadline = () => {
      let dateIn = $('#design-form input[type="date"], #deadline[type="date"]');
      let sel = $('select#deadline, #design-form select[name="deadline"]');
      if (dateIn && !sel) {
        sel = document.createElement('select');
        sel.className = 'deadline-select';
        sel.setAttribute('aria-label', '希望納期の年月');
        dateIn.after(sel);
      } else if (sel && !dateIn) {
        dateIn = document.createElement('input');
        dateIn.type = 'date';
        sel.before(dateIn);
      }
      if (!sel || !dateIn) return;
      dateIn.hidden = true;
      dateIn.style.display = 'none';
      let rawVal = '';
      try {
        Object.defineProperty(dateIn, 'value', {
          get: () => rawVal,
          set: (v) => { rawVal = String(v ?? ''); dateIn.setAttribute('value', rawVal); },
          configurable: true
        });
      } catch (_) {}
      if (!sel.options.length) {
        sel.append(new Option('未定', ''));
        const now = new Date();
        for (let i = 0; i <= 12; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
          const y = d.getFullYear(), m = d.getMonth() + 1;
          sel.append(new Option(`${y}年${m}月`, `${y}-${String(m).padStart(2, '0')}`));
        }
      }
      sel.addEventListener('change', () => {
        dateIn.value = sel.value;
        dateIn.dispatchEvent(new Event('change', { bubbles: true }));
      });
    };
    setupDeadline();

    // 5. Disable BACK button & show message when back image is missing
    const syncBack = () => {
      const products = window.FactioGarments?.products;
      if (!products) return;
      const activeId = $('[data-body][aria-pressed="true"]')?.dataset.body || products[0]?.id;
      const prod = products.find((p) => p.id === activeId);
      const hasBack = Boolean(prod?.back);
      const backBtn = $('[data-view="back"]');
      if (backBtn) backBtn.disabled = !hasBack;
      const note = $('.preview-note');
      const msg = '背面の写真は準備中。背中のプリントは配置の目安です';
      if (note && !hasBack && !note.textContent.includes(msg)) {
        note.textContent = (prod?.note ? `${prod.note}。` : '') + `${msg}。`;
      }
    };
    syncBack();
    ['#body-controls', '#position-controls', '#view-controls'].forEach((s) => $(s)?.addEventListener('click', () => setTimeout(syncBack, 0)));

    // 7. Copy button feedback for 2 seconds
    const copyBtn = $('#copy-summary');
    let copyTimer = 0, origCopy = copyBtn?.innerHTML || '';
    copyBtn?.addEventListener('click', () => {
      copyBtn.textContent = 'コピーしました';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { copyBtn.innerHTML = origCopy; }, 2000);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
