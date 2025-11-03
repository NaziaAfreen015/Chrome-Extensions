const $ = (s) => document.querySelector(s);

const EXPLANATIONS = {
  userAgent: {
    title: "Navigator userAgent",
    text: "Legacy browser identifier; coarse OS/engine hints. Often used for analytics; limited reliability for precise fingerprinting on modern Chrome."
  },
  uaData: {
    title: "User-Agent Client Hints",
    text: "Modern structured hints (brands, platform, mobile) with privacy guards. Sites can request more detail via permissions policy."
  },
  languages: {
    title: "Preferred languages",
    text: "Used for localization and A/B variants; can contribute to fingerprinting when combined with other signals."
  },
  timezone: {
    title: "Time zone",
    text: "Helps schedule, localize, and can aid coarse geo inference."
  },
  screen: {
    title: "Screen size",
    text: "Responsive layout; when combined with pixel ratio and fonts can aid device fingerprinting."
  },
  deviceMemory: {
    title: "Device memory",
    text: "Coarse bucket of RAM (e.g., 4/8 GB). Useful for performance tuning; limited buckets to reduce identifiability."
  },
  hardwareConcurrency: {
    title: "CPU threads",
    text: "Used for tuning heavy scripts; can vary by device."
  },
  doNotTrack: {
    title: "Do Not Track",
    text: "User preference flag; rarely honored across the web."
  },
  pixelRatio: {
    title: "Device pixel ratio",
    text: "Impacts rendering scale and sharpness; used in responsive designs."
  },
  canvasHash: {
    title: "Canvas render hash",
    text: "Tiny hash from drawing text on a canvas; differences can arise from GPU/OS/fonts. Demonstrative only."
  }
};

// Render helpers
function renderOverview(session) {
  $('#currentUrl').textContent = session?.url ?? '';
  const o = $('#overview');
  o.innerHTML = '';
  if (!session) {
    o.innerHTML = '<div class="muted">No data yet. Use the popup to open a site.</div>';
    return;
  }

  const R = session.readings || {};
  const rows = [
    ['Language(s)', (R.languages?.value || []).join(', ') || R.language?.value || '—'],
    ['Timezone', R.timezone?.value || '—'],
    ['Screen', R.screen?.value ? `${R.screen.value.width}×${R.screen.value.height} (avail ${R.screen.value.availWidth}×${R.screen.value.availHeight})` : '—'],
    ['Pixel Ratio', R.pixelRatio?.value ?? '—'],
    ['Device Memory (GB)', R.deviceMemory?.value ?? '—'],
    ['CPU Threads', R.hardwareConcurrency?.value ?? '—'],
    ['Touch Support', R.touch?.value ? 'Yes' : 'No'],
  ];

  rows.forEach(([k, v]) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div class="k">${k}</div><div class="v">${String(v)}</div>`;
    o.appendChild(row);
  });
}

function renderExplanations(session) {
  const wrap = $('#explanations');
  wrap.innerHTML = '';
  if (!session) return;
  for (const key of Object.keys(EXPLANATIONS)) {
    const exp = EXPLANATIONS[key];
    const val = session.readings?.[key]?.value ?? '—';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="row">
        <div class="k">${exp.title}</div>
        <div class="v">${escapeHtml(JSON.stringify(val))}</div>
      </div>
      <div class="muted" style="margin-top:6px">${exp.text}</div>
    `;
    wrap.appendChild(card);
  }
}

function renderHistory(sessions) {
  const wrap = $('#history');
  if (!sessions?.length) {
    wrap.innerHTML = '<div class="muted">No sessions yet.</div>';
    return;
  }
  const latestFirst = [...sessions].sort((a,b) => b.ts - a.ts).slice(0, 10);
  wrap.innerHTML = latestFirst.map(s => {
    const d = new Date(s.ts).toLocaleString();
    const lang = (s.readings.languages?.value || []).join(', ') || s.readings.language?.value || '—';
    const scr = s.readings.screen?.value ? `${s.readings.screen.value.width}×${s.readings.screen.value.height}` : '—';
    return `<div style="margin-bottom:8px">
      <div class="v">${escapeHtml(s.url)}</div>
      <div class="muted">${d} • Lang: ${escapeHtml(lang)} • Screen: ${escapeHtml(scr)}</div>
    </div>`;
  }).join('');
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');
}

// Load the latest session for the active tab
async function loadForActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const all = (await chrome.storage.local.get('sessions')).sessions || [];
  const session = all.filter(s => s.tabId === tab.id).sort((a,b)=> b.ts - a.ts)[0];
  renderOverview(session);
  renderExplanations(session);
  renderHistory(all);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SESSION_UPDATED') {
    loadForActiveTab();
  }
});

$('#qaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget).entries());
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const key = 'answers';
  const prev = (await chrome.storage.local.get(key))[key] || [];
  prev.push({ tabId: tab.id, url: $('#currentUrl').textContent, ts: Date.now(), answers: data });
  await chrome.storage.local.set({ [key]: prev });
  const status = $('#saveStatus');
  status.textContent = 'Saved';
  setTimeout(()=> status.textContent = '', 1200);
});

// Initial render
loadForActiveTab();
