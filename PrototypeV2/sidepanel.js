// ====== CONFIG: Set your endpoint for submissions ======
// const SUBMIT_ENDPOINT = "https://YOUR-DOMAIN.example/collect"; // <-- replace
// Ensure this origin is in manifest.json "host_permissions": ["https://YOUR-DOMAIN.example/*"]

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function toBaseDomain(hostname) {
  const bases = [
    "wikipedia.org","nytimes.com","bbc.com","reddit.com",
    "developer.chrome.com","web.dev","example.com"
  ];
  hostname = (hostname || "").toLowerCase();
  return bases.find(b => hostname === b || hostname.endsWith("." + b)) || "default";
}

async function loadJson(path) {
  const res = await fetch(chrome.runtime.getURL(path));
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

// ---------- Explanations (from site JSON array) ----------
function createApiDetails(responsibleApis) {
  const details = document.createElement("details");
  details.className = "api";
  const summary = document.createElement("summary");
  summary.innerHTML = `<span class="arrow">▸</span> <span class="label">responsible apis</span>`;
  details.appendChild(summary);

  const list = document.createElement("ul");
  list.className = "api-list";
  for (const api of responsibleApis || []) {
    const li = document.createElement("li");
    li.textContent = api;
    list.appendChild(li);
  }
  details.appendChild(list);
  return details;
}

function renderItems(container, data) {
  container.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    container.textContent = "No content.";
    return;
  }

  const frag = document.createDocumentFragment();

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    const feature = document.createElement("div");
    feature.className = "feature";
    feature.textContent = String(item["fingerprint feature"] ?? "");
    card.appendChild(feature);

    const what = document.createElement("div");
    what.className = "kv";
    what.innerHTML = `<span class="k">What</span> <span class="v"></span>`;
    what.querySelector(".v").textContent = String(item["What"] ?? "");
    card.appendChild(what);

    const why = document.createElement("div");
    why.className = "kv";
    why.innerHTML = `<span class="k">Why</span> <span class="v"></span>`;
    why.querySelector(".v").textContent = String(item["Why"] ?? "");
    card.appendChild(why);

    const apis = Array.isArray(item["responsible_apis"]) ? item["responsible_apis"] : [];
    const details = createApiDetails(apis);
    card.appendChild(details);

    frag.appendChild(card);
  });

  container.appendChild(frag);
}

function wireToggleAll(container) {
  const toggleAll = document.getElementById("toggleAll");
  const toggleAllText = document.getElementById("toggleAllText");
  const arrow = toggleAll.querySelector(".arrow");

  let allOpen = false;

  toggleAll.addEventListener("click", () => {
    const allDetails = container.querySelectorAll("details.api");
    allOpen = !allOpen;
    allDetails.forEach(d => d.open = allOpen);
    toggleAllText.textContent = allOpen ? "Hide all APIs" : "Show all APIs";
    arrow.textContent = allOpen ? "▾" : "▸";
  });
}

// ---------- Questions (from /content/questions.json) ----------
function renderQuestions(qaSection, questions) {
  const form = document.getElementById("qaForm");
  form.innerHTML = "";

  if (!Array.isArray(questions) || questions.length === 0) {
    qaSection.hidden = true;
    return;
  }
  qaSection.hidden = false;

  questions.forEach((q, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "q";

    const qId = q.id || `q${idx + 1}`;
    const label = document.createElement("label");
    label.className = "qtext";
    label.textContent = q.question || qId;
    label.setAttribute("for", qId);
    wrap.appendChild(label);

    const opts = document.createElement("div");
    opts.className = "opts";

    if (q.multiple_choice) {
      // Render as a radio group (single selection)
      (q.options || []).forEach((opt, oi) => {
        const id = `${qId}_${oi}`;
        const row = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = qId;
        input.value = opt;
        input.id = id;
        row.appendChild(input);
        const txt = document.createTextNode(" " + opt);
        row.appendChild(txt);
        opts.appendChild(row);
      });
    } else {
      // Free text
      const ta = document.createElement("textarea");
      ta.name = qId;
      ta.id = qId;
      ta.placeholder = q.placeholder || "";
      opts.appendChild(ta);
    }

    wrap.appendChild(opts);
    form.appendChild(wrap);
  });
}

// ---------- Collect / Save / Export / Submit ----------
function collectAnswers() {
  const form = document.getElementById("qaForm");
  const controls = form.querySelectorAll("input, textarea, select");
  const out = {};
  controls.forEach(el => {
    if (!el.name) return;
    if (el.type === "radio") {
      if (el.checked) out[el.name] = el.value;
    } else {
      out[el.name] = el.value;
    }
  });
  return out;
}

async function saveAnswers(record) {
  const key = "responses";
  const all = (await chrome.storage.local.get(key))[key] || [];
  all.push(record);
  await chrome.storage.local.set({ [key]: all });
}

async function exportAll() {
  const key = "responses";
  const all = (await chrome.storage.local.get(key))[key] || [];
  const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `responses-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// async function submitToOwner(record) {
//   if (!SUBMIT_ENDPOINT || !/^https?:\/\//.test(SUBMIT_ENDPOINT)) {
//     throw new Error("SUBMIT_ENDPOINT not configured");
//   }
//   const res = await fetch(SUBMIT_ENDPOINT, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(record)
//   });
//   if (!res.ok) {
//     const t = await res.text().catch(()=> "");
//     throw new Error(`Submit failed: ${res.status} ${res.statusText} ${t}`);
//   }
// }

// ---------- Init ----------
(async function init() {
  const urlEl = document.getElementById("url");
  const contentEl = document.getElementById("content");
  const qaEl = document.getElementById("qa");
  const saveBtn = document.getElementById("save");
  const exportBtn = document.getElementById("export");
//   const submitBtn = document.getElementById("submit");
  const statusEl = document.getElementById("status");

  const tab = await getActiveTab();
  urlEl.textContent = tab?.url || "";

  let base = "default";
  try { base = tab?.url ? toBaseDomain(new URL(tab.url).hostname) : "default"; } catch {}

  // Load explanations (per-site JSON array)
  let items;
  try {
    items = await loadJson(`/content/${base}.json`);
  } catch {
    items = await loadJson(`/content/default.json`);
  }
  renderItems(contentEl, items);
  wireToggleAll(contentEl);

  // Load questions
  let questions = [];
  try {
    questions = await loadJson(`/content/questions.json`);
  } catch { /* fine if missing */ }
  renderQuestions(qaEl, questions);

  // Wire buttons
  saveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    statusEl.textContent = "Saving…";
    try {
      const answers = collectAnswers();
      const record = {
        schemaVersion: 1,
        ts: Date.now(),
        domain: base,
        url: tab?.url || "",
        answers
      };
      await saveAnswers(record);
      statusEl.textContent = "Saved!";
      setTimeout(()=> statusEl.textContent = "", 1200);
    } catch (err) {
      statusEl.textContent = String(err);
    }
  });

  exportBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    statusEl.textContent = "Exporting…";
    try {
      await exportAll();
      statusEl.textContent = "Exported.";
      setTimeout(()=> statusEl.textContent = "", 1200);
    } catch (err) {
      statusEl.textContent = String(err);
    }
  });

//   submitBtn.addEventListener("click", async (e) => {
//     e.preventDefault();
//     statusEl.textContent = "Submitting…";
//     try {
//       const answers = collectAnswers();
//       const record = {
//         schemaVersion: 1,
//         ts: Date.now(),
//         domain: base,
//         url: tab?.url || "",
//         answers
//       };
//       await submitToOwner(record);
//       // Also save locally for your records
//       await saveAnswers(record);
//       statusEl.textContent = "Submitted!";
//       setTimeout(()=> statusEl.textContent = "", 1500);
//     } catch (err) {
//       statusEl.textContent = String(err);
//     }
//   });
})();
