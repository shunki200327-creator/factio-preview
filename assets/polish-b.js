(() => {
  const cleanUnitPrice = () => {
    const el = document.getElementById('unit-price');
    if (!el) return;
    const links = el.querySelectorAll('a');
    links.forEach((a) => {
      if (!a.textContent.includes('公式参考上代') && links.length > 1) return;
      const prev = a.previousSibling;
      if (prev && prev.nodeType === 3) {
        prev.nodeValue = prev.nodeValue.replace(/[\s(（/・]+$/, '');
      }
      while (a.nextSibling) {
        a.parentNode.removeChild(a.nextSibling);
      }
      a.remove();
    });
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const cleaned = node.nodeValue.replace(/[（(]?\s*公式参考上代[\s\S]*$/, '');
      if (cleaned !== node.nodeValue) node.nodeValue = cleaned;
    }
  };

  const initPriceObserver = () => {
    const el = document.getElementById('unit-price');
    if (!el) return;
    cleanUnitPrice();
    const obs = new MutationObserver(() => cleanUnitPrice());
    obs.observe(el, { childList: true, subtree: true, characterData: true });
  };

  document.addEventListener('focusin', (e) => {
    const t = e.target;
    if (!t || !t.matches || !t.matches('#lab input')) return;
    const key = `${t.id || ''} ${t.name || ''}`.toLowerCase();
    const view = key.includes('team')
      ? 'front'
      : /(number|num|back|name)/.test(key)
        ? 'back'
        : '';
    if (view) document.querySelector(`[data-view="${view}"]`)?.click();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPriceObserver, { once: true });
  } else {
    initPriceObserver();
  }
})();
