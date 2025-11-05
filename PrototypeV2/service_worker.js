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

let SITES = [
  "https://example.com/",
  "https://developer.chrome.com/",
  "https://www.wikipedia.org/",
  "https://web.dev/",
  "https://www.nytimes.com/",
  "https://www.bbc.com/",
  "https://www.reddit.com/"
];

let doneSites = [];

function pickRandomSite() {
  console.log("Current SITES:", SITES);
  console.log("Done SITES:", doneSites);
  if (SITES.length === 0) {
    SITES = structuredClone(doneSites);
    doneSites = [];
  }
  let index = Math.floor(Math.random() * SITES.length);
  let url = SITES[index];
  doneSites.push(SITES[index]);
  SITES.splice(index, 1);

  return url;
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
  // console.log('Tab Id: ', tabId, 'Info:', info, 'Tab:', tab);
  // console.log('Panel Tab Id:', panelTabId);
  // console.log('Tab URL:', tab.url);

  if (panelTabId != null && tabId !== panelTabId) return;
  if (info.status === "loading" && tab.url && !isInList(tab.url)) {
    console.log('Closing side panel for tab:', tabId);
    chrome.sidePanel.setOptions({ tabId: tabId, enabled: false });
    panelTabId = null;
  }
});

// potenital probelm: 
// what if from the same tabe, user navigates toward another enlisted domain? If side panel is open, it is open in the new domain as well. Is this intended?
// solution: on tab update, check if panel is open for that tab, if yes, close it?

// User launches a site on tab A, opens a panel. Then launches another site on tab B, opens a panel. User navigates to the first site on tab A, goes to
// unlisted url on tab A, the panel is still open on tab A. But it should be closed. It short circuits because panelTabId is now tab B's id and 
// if (panelTabId != null && tabId !== panelTabId) return; causes it to return early.
// Solution: to fix this, we can check if panel is open for the tab, if yes, close it. So we need to query side panel state for that tab id.