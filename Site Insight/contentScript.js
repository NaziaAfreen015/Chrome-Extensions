// Debounce to avoid spamming on rapid SPA events
let collectTimer = null;
function debounceCollect() {
  clearTimeout(collectTimer);
  collectTimer = setTimeout(collectAndSend, 150);
}

async function collectAndSend() {
  const readings = await safeCollect();
  chrome.runtime.sendMessage({
    type: 'READINGS_RESULT',
    url: location.href,
    readings
  });
}

async function safeCollect() {
  const R = {};
  const safe = (label, fn) => {
    try {
      const v = fn();
      R[label] = { ok: true, value: v };
    } catch (e) {
      R[label] = { ok: false, error: String(e) };
    }
  };

  safe('userAgent', () => navigator.userAgent);
  safe('platform', () => navigator.platform);
  safe('vendor', () => navigator.vendor);
  safe('languages', () => navigator.languages);
  safe('language', () => navigator.language);
  safe('deviceMemory', () => navigator.deviceMemory ?? null);
  safe('hardwareConcurrency', () => navigator.hardwareConcurrency ?? null);
  safe('doNotTrack', () => navigator.doNotTrack ?? null);
  safe('colorDepth', () => screen.colorDepth);
  safe('pixelDepth', () => screen.pixelDepth);
  safe('pixelRatio', () => (self.devicePixelRatio || 1));
  safe('screen', () => ({
    width: screen.width,
    height: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight
  }));
  safe('touch', () => ('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
  safe('timezone', () => Intl.DateTimeFormat().resolvedOptions().timeZone);

  // New UA hints (may be restricted / partial)
  safe('uaData', () => {
    const d = navigator.userAgentData;
    if (!d) return null;
    return {
      mobile: d.mobile ?? null,
      platform: d.platform ?? null,
      brands: d.brands ?? null
    };
  });

  // Lightweight canvas probe (non-invasive; single text draw, hashed)
  safe('canvasHash', () => {
    const c = document.createElement('canvas');
    c.width = 180; c.height = 30;
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = "16px 'Arial'";
    ctx.fillText('fingerprint probe', 2, 2);
    const data = c.toDataURL();
    // hash the base64 quickly
    let h = 0;
    for (let i=0; i<data.length; i++) {
      h = ((h << 5) - h) + data.charCodeAt(i);
      h |= 0;
    }
    return h >>> 0;
  });

  return R;
}

// Listen to background requests
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'COLLECT_NOW') debounceCollect();
});

// Initial collect on load
debounceCollect();

// SPA: hook History API to re-collect
(function patchHistory() {
  const push = history.pushState;
  const replace = history.replaceState;
  history.pushState = function(...args) { const r = push.apply(this, args); debounceCollect(); return r; };
  history.replaceState = function(...args) { const r = replace.apply(this, args); debounceCollect(); return r; };
  addEventListener('popstate', debounceCollect);
})();
