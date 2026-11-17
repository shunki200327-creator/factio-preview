(() => {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const form = $('#design-form'), printLayer = $('#print-layer'), uploadField = $('#upload')?.closest('fieldset');
  if (!form || !printLayer || !uploadField || $('#lab-text-field')) return;
  const fonts = [{ id: 'block', label: 'BLOCK' }, { id: 'classic', label: 'CLASSIC' }, { id: 'college', label: 'COLLEGE' }];
  const textColors = [
    { id: 'white', name: '白', hex: '#F4F4ED', stroke: '#111112', check: '#111112' },
    { id: 'black', name: '黒', hex: '#111112', stroke: '#F4F4ED', check: '#F4F4ED' },
    { id: 'lime', name: 'ライム', hex: '#D2FF00', stroke: '#111112', check: '#111112' },
    { id: 'red', name: '赤', hex: '#C8102E', stroke: '#F4F4ED', check: '#F4F4ED' },
    { id: 'navy', name: 'ネイビー', hex: '#1F2A44', stroke: '#F4F4ED', check: '#F4F4ED' },
    { id: 'gold', name: 'ゴールド', hex: '#C9A227', stroke: '#111112', check: '#111112' }
  ];
  const state = { team: '', number: '', player: '', font: 'block', color: 0, outline: false };
  const fieldset = document.createElement('fieldset');
  fieldset.id = 'lab-text-field';
  fieldset.innerHTML = `<legend><b>05</b> チーム名・背番号</legend><div class="lab-text-grid">
    <label class="field-label" for="lab-team-name">チーム名（胸・最大16文字）</label>
    <input id="lab-team-name" type="text" maxlength="16" placeholder="FACTIO">
    <label class="field-label" for="lab-number">背番号（背中・0〜99）</label>
    <div class="lab-num-stepper">
      <button type="button" data-num-step="-1" aria-label="背番号を減らす">−</button>
      <input id="lab-number" type="number" min="0" max="99" step="1" inputmode="numeric" placeholder="10">
      <button type="button" data-num-step="1" aria-label="背番号を増やす">＋</button>
    </div>
    <label class="field-label" for="lab-player-name">名前（背中の上・ローマ字 最大12文字 <span>任意</span>）</label>
    <input id="lab-player-name" type="text" maxlength="12" inputmode="latin" autocomplete="off" placeholder="TAKAHASHI">
    <span class="field-label">書体</span><div class="choice-row" id="lab-font-controls"></div>
    <span class="field-label">文字の色 <span id="lab-text-color-name">${textColors[0].name}</span></span>
    <div class="lab-color-row"><div class="swatches" id="lab-text-colors"></div>
      <button type="button" id="lab-outline-toggle" class="lab-outline-btn" aria-pressed="false">縁取り OFF</button>
    </div></div>`;
  uploadField.after(fieldset);
  [...form.querySelectorAll('fieldset legend b')].forEach((el,i) => el.textContent=String(i+1).padStart(2,'0'));
  fonts.forEach((f, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.font = f.id; b.textContent = f.label; b.setAttribute('aria-pressed', String(i === 0));
    $('#lab-font-controls').append(b);
  });
  textColors.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.textColor = String(i);
    b.style.setProperty('--swatch', c.hex); b.style.setProperty('--check', c.check);
    b.setAttribute('aria-label', c.name); b.setAttribute('aria-pressed', String(i === 0)); b.innerHTML = '<span></span>';
    $('#lab-text-colors').append(b);
  });
  const layer = document.createElement('div');
  layer.id = 'lab-text-layer'; layer.className = 'lab-text-layer';
  layer.innerHTML = `<div id="lab-text-front" class="lab-text-front" hidden></div><div id="lab-text-back" class="lab-text-back" hidden><span id="lab-text-name" class="lab-text-name" hidden></span><span id="lab-text-num" class="lab-text-num" hidden></span></div>`;
  printLayer.append(layer);
  const frontEl = $('#lab-text-front'), backEl = $('#lab-text-back'), nameEl = $('#lab-text-name'), numEl = $('#lab-text-num');
  const teamIn = $('#lab-team-name'), numIn = $('#lab-number'), playerIn = $('#lab-player-name'), outlineBtn = $('#lab-outline-toggle');
  const getView = () => $('[data-view][aria-pressed="true"]')?.dataset.view || 'front';
  function fitTeam() {
    frontEl.style.fontSize = '';
    if (!frontEl.hidden && frontEl.clientWidth && frontEl.scrollWidth > frontEl.clientWidth) frontEl.style.fontSize = `${parseFloat(getComputedStyle(frontEl).fontSize) * frontEl.clientWidth / frontEl.scrollWidth}px`;
  }
  window.addEventListener('resize', fitTeam);
  function sync() {
    const view = getView(), c = textColors[state.color];
    layer.dataset.view = view; layer.dataset.font = state.font; layer.dataset.outline = String(state.outline);
    layer.style.setProperty('--text-color', c.hex); layer.style.setProperty('--text-stroke', c.stroke);
    $('#lab-text-color-name').textContent = c.name;
    outlineBtn.setAttribute('aria-pressed', String(state.outline));
    outlineBtn.textContent = `縁取り ${state.outline ? 'ON' : 'OFF'}`;
    $$('#lab-font-controls [data-font]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.font === state.font)));
    $$('#lab-text-colors [data-text-color]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.textColor) === state.color)));
    frontEl.textContent = state.team; frontEl.hidden = view !== 'front' || !state.team;
    nameEl.textContent = state.player; nameEl.hidden = !state.player;
    numEl.textContent = state.number; numEl.hidden = state.number === '';
    backEl.hidden = view !== 'back' || (nameEl.hidden && numEl.hidden);
    fitTeam();
  }
  teamIn.addEventListener('input', () => {
    state.team = teamIn.value.slice(0, 16);
    if (teamIn.value !== state.team) teamIn.value = state.team;
    if ($('#team')) $('#team').value = state.team;
    sync();
  });
  function setNumber(raw) {
    if (raw === '' || raw === null || Number.isNaN(Number(raw))) { state.number = ''; numIn.value = ''; }
    else { state.number = String(Math.max(0, Math.min(99, Math.trunc(Number(raw))))); numIn.value = state.number; }
    sync();
  }
  numIn.addEventListener('input', () => setNumber(numIn.value.trim()));
  fieldset.addEventListener('click', e => {
    const stepBtn = e.target.closest('[data-num-step]'), fontBtn = e.target.closest('[data-font]'), colorBtn = e.target.closest('[data-text-color]');
    if (stepBtn) setNumber((state.number === '' ? 0 : Number(state.number)) + Number(stepBtn.dataset.numStep));
    else if (fontBtn) { state.font = fontBtn.dataset.font; sync(); }
    else if (colorBtn) { state.color = Number(colorBtn.dataset.textColor); sync(); }
    else if (e.target.closest('#lab-outline-toggle')) { state.outline = !state.outline; sync(); }
  });
  playerIn.addEventListener('input', () => {
    state.player = playerIn.value.replace(/[^a-zA-Z .'-]/g, '').toUpperCase().slice(0, 12);
    if (playerIn.value !== state.player) playerIn.value = state.player;
    sync();
  });
  $('#team')?.addEventListener('input', () => { teamIn.value = $('#team').value.slice(0,16); state.team = teamIn.value; sync(); });
  if ($('#view-controls')) new MutationObserver(sync).observe($('#view-controls'), { attributes: true, subtree: true, attributeFilter: ['aria-pressed'] });
  ['#view-controls', '#position-controls', '#body-controls'].forEach(sel => $(sel)?.addEventListener('click', () => requestAnimationFrame(sync)));
  form.addEventListener('submit', () => {
    const details = $('#summary-details'), text = $('#summary-text');
    if (!details || !details.children.length) return;
    const rows = [
      ['チーム名', state.team || $('#team')?.value.trim() || '未定'],
      ['背番号', state.number !== '' ? state.number : 'なし'],
      ['名前', state.player || 'なし'],
      ['書体', fonts.find(f => f.id === state.font)?.label || 'BLOCK'],
      ['文字色', `${textColors[state.color].name}（縁取り：${state.outline ? 'オン' : 'オフ'}）`]
    ];
    [...details.querySelectorAll('tr')].filter(tr => tr.querySelector('th')?.textContent === 'チーム名').forEach(tr => tr.remove());
    if (text) text.value = text.value.split('\n').filter(line => !line.startsWith('チーム名：')).join('\n');
    rows.forEach(([k, v]) => {
      const tr = document.createElement('tr'), th = document.createElement('th'), td = document.createElement('td');
      th.scope = 'row'; th.textContent = k; td.textContent = v; tr.append(th, td); details.append(tr);
    });
    if (text) text.value += '\n' + rows.map(([k, v]) => `${k}：${v}`).join('\n');
  });
  sync();
})();
