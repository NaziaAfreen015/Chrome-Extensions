async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Map hostnames to your base filename (edit list as needed)
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

(async function init() {
  const urlEl = document.getElementById("url");
  const contentEl = document.getElementById("content");

  const tab = await getActiveTab();
  urlEl.textContent = tab?.url || "";

  let base = "default";
  try {
    base = tab?.url ? toBaseDomain(new URL(tab.url).hostname) : "default";
  } catch {}

  let data;
  try {
    data = await loadJson(`/content/${base}.json`);
  } catch {
    data = await loadJson(`/content/default.json`);
  }

  renderItems(contentEl, data);
  wireToggleAll(contentEl);
})();
