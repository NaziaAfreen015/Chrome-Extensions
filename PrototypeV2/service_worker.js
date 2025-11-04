// List of launchable sites (edit as you like)
const ALLOWED_DOMAINS = [
  "wikipedia.org",
  "developer.chrome.com",
  "web.dev",
  "nytimes.com",
  "bbc.com",
  "reddit.com",
  "example.com"
];

const SITES = [
  "https://example.com/",
  "https://developer.chrome.com/",
  "https://www.wikipedia.org/",
  "https://web.dev/",
  "https://www.nytimes.com/",
  "https://www.bbc.com/",
  "https://www.reddit.com/"
];

function pickRandomSite() {
  return SITES[Math.floor(Math.random() * SITES.length)];
}

const isInList = (urlStr) => {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(d => host === d || host.endsWith("." + d));
  } catch { return false; }
};


// Track which tab currently has our panel enabled
let panelTabId = null;

// Disable default/global panel at startup so it never shows on other tabs.
chrome.runtime.onStartup.addListener(() => {
  chrome.sidePanel.setOptions({ enabled: false });
});
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({ enabled: false });
});


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Received message in service worker:', msg);

    if (msg.type === "LAUNCH_RANDOM") {
      try{
        const [active] = chrome.tabs.query({ active: true, currentWindow: true }); // explain?
        if (panelTabId !== null && active?.id === panelTabId) {
          // If the panel is already open for the active tab, disable it
          chrome.sidePanel.setOptions({ tabId: panelTabId, enabled: false });
          panelTabId = null;
        }
      } catch (e) {
        console.error("Error querying active tab:");
      }
      const url = pickRandomSite();
      chrome.tabs.create({ url, active: true });
      return true;
    }
  return false;
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "PANEL_OPENED_FOR_TAB" && typeof msg.tabId === "number") {
    panelTabId = msg.tabId;
  }
});


// Close our panel if its tab navigates away from allowed sites.
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (tabId !== panelTabId) return;
  if (info.status === "loading" && tab.url && !isInList(tab.url)) {
    chrome.sidePanel.setOptions({ tabId: tabId, enabled: false });
    panelTabId = null;
  }
});
