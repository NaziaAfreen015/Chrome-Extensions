// --- Config: your 10 sites ---
const SITES = [
    "https://example.com/",
    "https://developer.chrome.com/",
    "https://www.wikipedia.org/",
    "https://web.dev/",
    "https://www.nytimes.com/",
    "https://www.bbc.com/",
    "https://www.reddit.com/"
];

// Utility: pick a random site
function pickRandomSite() {
  return SITES[Math.floor(Math.random() * SITES.length)];
}

// Storage helpers
async function storeSession(tabId, url, readings) {
  const ts = Date.now();
  const session = { tabId, url, ts, readings };
  const key = `sessions`;
  const prev = (await chrome.storage.local.get(key))[key] || [];
  prev.push(session);
  await chrome.storage.local.set({ [key]: prev });

  // let the side panel know
  chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', tabId, url, ts });
}

async function openSidePanel(tabId) {
  try {
    await chrome.sidePanel.setOptions({ tabId, path: 'sidepanel.html' });
    await chrome.sidePanel.open({ tabId });
  } catch (e) {
    // Ignore errors on older/unsupported Chrome
  }
}

// --- Message handling from popup & content script ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === 'LAUNCH_RANDOM') {
      const url = pickRandomSite();
      const { id: tabId } = await chrome.tabs.create({ url, active: true });
      await openSidePanel(tabId); // show the panel immediately
      return;
    }

    if (msg.type === 'READINGS_RESULT') {
      // from content script
      const tabId = sender.tab?.id ?? msg.tabId;
      await storeSession(tabId, msg.url, msg.readings);
      sendResponse({ ok: true });
      return;
    }

    if (msg.type === 'REQUEST_COLLECT') {
      // Ask the content script in a specific tab to collect
      const tabId = msg.tabId ?? sender.tab?.id;
      if (tabId) {
        try {
          await chrome.tabs.sendMessage(tabId, { type: 'COLLECT_NOW' });
        } catch (e) {
          // content script may not be injected yet
        }
      }
    }
  })();

  // Keep the channel open if we respond async
  return true;
});

// Trigger collection after navigations, including SPA changes.
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  // Injected by manifest, but ensure we ping the script to collect.
  try {
    await chrome.tabs.sendMessage(details.tabId, { type: 'COLLECT_NOW' });
    await openSidePanel(details.tabId);
  } catch {
    // ignore
  }
});

chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  if (details.frameId !== 0) return;
  try {
    await chrome.tabs.sendMessage(details.tabId, { type: 'COLLECT_NOW' });
  } catch {}
});
