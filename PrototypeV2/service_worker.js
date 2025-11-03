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




chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Received message in service worker:', msg);

    if (msg.type === "LAUNCH_RANDOM") {
      const url = pickRandomSite();
      chrome.tabs.create({ url, active: true });
      return;
    }
    if (msg.type === "OPEN_PANEL_FOR_TAB") {
      const tabId = msg.tabId ?? sender.tab?.id;
      if (tabId)  {
        chrome.sidePanel.setOptions({ tabId, path: "sidepanel.html" });
        chrome.sidePanel.open({ tabId });     
      }
      return;
    }
  
  return true;
});
