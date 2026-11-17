(() => {
  'use strict';
  const stage = document.getElementById('garment-stage');
  const garment = document.getElementById('garment');
  const printLayer = document.getElementById('print-layer');
  const previewCol = document.querySelector('.preview-column');
  if (!stage || !garment || !printLayer || !previewCol) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. SVG feTurbulence + feDisplacementMap (scale=5) for subtle fabric warp
  if (!document.getElementById('lab-fabric-warp')) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;overflow:hidden';
    svg.innerHTML = '<defs><filter id="lab-fabric-warp" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.045 0.065" numOctaves="2" seed="3" result="warpNoise"/><feDisplacementMap in="SourceGraphic" in2="warpNoise" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';
    document.body.appendChild(svg);
  }

  // 2. Front <-> Back Y-axis 90deg flip (0.6s, power2.inOut, perspective 1200px)
  let lastView = document.querySelector('[data-view][aria-pressed=true]')?.dataset.view;
  let lastSrc = garment.querySelector('img')?.getAttribute('src') || '';
  let lastSrcset = garment.querySelector('img')?.getAttribute('srcset') || '';
  let flipTween = null, flipRaf = 0;
  const setRy = deg => stage.style.setProperty('--stage-ry', `${deg.toFixed(2)}deg`);
  const easeInOut2 = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  const observer = new MutationObserver(() => {
    const img = garment.querySelector('img');
    if (!img) return;
    const nextSrc = img.getAttribute('src') || '', nextSrcset = img.getAttribute('srcset') || '';
    if (!lastSrc || !nextSrc || nextSrc === lastSrc) { lastSrc = nextSrc; lastSrcset = nextSrcset; return; }
    const prevSrc = lastSrc, prevSrcset = lastSrcset;
    lastSrc = nextSrc; lastSrcset = nextSrcset;
    const view = document.querySelector('[data-view][aria-pressed=true]')?.dataset.view, changed = view !== lastView; lastView = view;
    if (flipTween) flipTween.kill(); cancelAnimationFrame(flipRaf); setRy(0); stage.classList.remove('is-flipping');
    if (reduced || !changed) return;

    img.setAttribute('src', prevSrc);
    if (prevSrcset) img.setAttribute('srcset', prevSrcset); else img.removeAttribute('srcset');
    observer.takeRecords();

    let swapped = false;
    const swap = () => {
      if (swapped) return;
      swapped = true;
      const cur = garment.querySelector('img');
      if (!cur) return;
      cur.setAttribute('src', nextSrc);
      if (nextSrcset) cur.setAttribute('srcset', nextSrcset); else cur.removeAttribute('srcset');
      observer.takeRecords();
    };
    const finish = () => { swap(); setRy(0); stage.classList.remove('is-flipping'); };
    if (flipTween) flipTween.kill();
    cancelAnimationFrame(flipRaf);
    stage.classList.add('is-flipping');

    if (window.gsap) {
      const proxy = { p: 0 };
      flipTween = window.gsap.to(proxy, {
        p: 1, duration: 0.6, ease: 'power2.inOut',
        onUpdate: () => { if (proxy.p >= 0.5) swap(); setRy((proxy.p < 0.5 ? proxy.p : 1 - proxy.p) * 180); },
        onComplete: finish
      });
    } else {
      const t0 = performance.now();
      const tick = now => {
        const raw = Math.min(1, (now - t0) / 600), p = easeInOut2(raw);
        if (p >= 0.5) swap();
        setRy((p < 0.5 ? p : 1 - p) * 180);
        if (raw < 1) flipRaf = requestAnimationFrame(tick); else finish();
      };
      flipRaf = requestAnimationFrame(tick);
    }
  });
  observer.observe(garment, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

  // 3. Hover zoom (PC 1.6x at cursor) & Double-tap zoom (Mobile 1.6x)
  const setZoom = (on, cx, cy) => {
    const r = stage.getBoundingClientRect();
    if (cx != null && cy != null && r.width && r.height) {
      stage.style.setProperty('--zoom-x', `${Math.max(0, Math.min(100, ((cx - r.left) / r.width) * 100)).toFixed(1)}%`);
      stage.style.setProperty('--zoom-y', `${Math.max(0, Math.min(100, ((cy - r.top) / r.height) * 100)).toFixed(1)}%`);
    }
    stage.classList.toggle('is-zoomed', on);
    stage.style.setProperty('--stage-zoom', on ? '1.6' : '1');
  };
  stage.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && e.buttons === 0) setZoom(true, e.clientX, e.clientY); });
  stage.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') setZoom(false); });
  let lastTap = 0;
  stage.addEventListener('pointerup', e => {
    if (e.pointerType !== 'touch') return;
    const now = performance.now();
    if (now - lastTap < 300) { setZoom(!stage.classList.contains('is-zoomed'), e.clientX, e.clientY); lastTap = 0; } else lastTap = now;
  });

  // 4. Save composite PNG (garment -> print -> optional .lab-text-layer -> factio-design.png)
  const btn = Object.assign(document.createElement('button'), { type: 'button', id: 'lab-save-image', className: 'lab-save-btn', textContent: '仕上がりを画像で保存' });
  (previewCol.querySelector('.preview-bottom') || stage).insertAdjacentElement('afterend', btn);
  btn.addEventListener('click', async () => {
    const gImg = garment.querySelector('img');
    if (!gImg) return;
    btn.disabled = true;
    const old = stage.style.cssText;
    try {
      await document.fonts.ready; await gImg.decode();
      stage.classList.add('is-exporting');
      const W = gImg.naturalWidth, H = gImg.naturalHeight, gR = garment.getBoundingClientRect();
      const canvas = Object.assign(document.createElement('canvas'), {width: W, height: H}), ctx = canvas.getContext('2d');
      const sleeve=stage.classList.contains('is-sleeve');if(sleeve)await FactioSleeve.paint(ctx,gImg,stage.dataset.sleeveColor,stage.dataset.sleeveMask);else ctx.drawImage(gImg, 0, 0, W, H);
      const rect = el => { const r = el.getBoundingClientRect(); return [(r.left-gR.left)*W/gR.width,(r.top-gR.top)*H/gR.height,r.width*W/gR.width,r.height*H/gR.height]; };
      const up = document.getElementById('upload-preview'), pImg = up && !up.hidden ? up : document.querySelector('#sample-print img');
      if (!printLayer.hidden && pImg) {
        await pImg.decode(); ctx.save(); ctx.globalCompositeOperation = (stage.classList.contains('is-dark-body') || pImg.closest('.light-print')) ? 'source-over' : 'multiply';
        if (pImg.closest('.light-print')) ctx.filter = 'brightness(0) invert(1)';
        if(sleeve){const art=document.getElementById('print-art'),m=new DOMMatrix(getComputedStyle(art).transform),w=art.offsetWidth,h=art.offsetHeight,kx=W/gR.width,ky=H/gR.height;const q=[[0,0],[w,0],[w,h],[0,h]].map(([x,y])=>{const p=new DOMPoint(x,y).matrixTransform(m);return [p.x/p.w*kx,p.y/p.w*ky];});const ink=document.createElement('canvas');ink.width=W;ink.height=H;const ic=ink.getContext('2d');if(pImg.closest('.light-print'))ic.filter='brightness(0) invert(1)';SleeveProject.draw(ic,pImg,q);ctx.filter='url(#lab-fabric-warp)';ctx.drawImage(ink,0,0);}else ctx.drawImage(pImg, ...rect(pImg)); ctx.restore();
      }
      if (!sleeve && !printLayer.hidden) stage.querySelectorAll('#lab-text-front, #lab-text-name, #lab-text-num').forEach(el => {
        if (el.hidden || el.closest('[hidden]') || !el.textContent) return;
        const cs = getComputedStyle(el), [x,y,w,h] = rect(el), k = W/gR.width;
        ctx.save(); ctx.fillStyle = cs.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize)*k}px ${cs.fontFamily}`;
        if ('letterSpacing' in ctx) ctx.letterSpacing = `${parseFloat(cs.letterSpacing)*k || 0}px`;
        const stretch = el.closest('[data-font="college"]') ? 1.24 : 1;
        ctx.translate(x+w/2,y+h/2); ctx.scale(1,stretch);
        if (el.closest('[data-outline="true"]')) { ctx.lineWidth = 1.6*k; ctx.strokeStyle = cs.getPropertyValue('--text-stroke').trim(); ctx.strokeText(el.textContent,0,0,w); }
        ctx.fillText(el.textContent,0,0,w); ctx.restore();
      });
      Object.assign(document.createElement('a'), {download:'factio-design.png',href:canvas.toDataURL('image/png')}).click();
      btn.textContent = '仕上がりを画像で保存';
    } catch (_) { btn.textContent = '画像を読み込み後、もう一度お試しください'; }
    finally { stage.style.cssText = old; stage.classList.remove('is-exporting'); btn.disabled = false; }
  });
})();
