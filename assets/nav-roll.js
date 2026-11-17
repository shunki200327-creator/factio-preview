(() => {
  const SELECTOR = '#menu a, .footer-bottom nav a';

  function splitTextNodes(node, state) {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.nodeValue || '';
        if (!text) continue;
        const frag = document.createDocumentFragment();
        for (const rawChar of text) {
          if (rawChar === '\n' || rawChar === '\r' || rawChar === '\t') continue;
          const ch = rawChar === ' ' ? '\u00A0' : rawChar;
          const span = document.createElement('span');
          span.className = 'roll-letter';
          span.setAttribute('aria-hidden', 'true');
          span.setAttribute('data-letter', ch);
          span.style.setProperty('--i', String(state.index++));
          span.textContent = ch;
          frag.appendChild(span);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        splitTextNodes(child, state);
      }
    }
  }

  function initNavRoll() {
    document.querySelectorAll(SELECTOR).forEach((link) => {
      if (link.hasAttribute('data-roll-ready')) return;
      const originalText = (link.textContent || '').replace(/\s+/g, ' ').trim();
      if (!originalText) return;

      link.setAttribute('data-roll-ready', 'true');
      link.setAttribute('aria-label', originalText);

      splitTextNodes(link, { index: 0 });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavRoll, { once: true });
  } else {
    initNavRoll();
  }
})();
