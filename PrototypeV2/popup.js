// Domains considered "inside the list"
const ALLOWED_DOMAINS = [
  "wikipedia.org",
  "developer.chrome.com",
  "web.dev",
  "nytimes.com",
  "bbc.com",
  "reddit.com",
  "example.com"
];

function isInList(urlStr) {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.toLowerCase();
    // match exact or subdomain
    return ALLOWED_DOMAINS.some(d => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

(async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const onList = tab?.url ? isInList(tab.url) : false;

  // Show/hide buttons based on current page
  const openPanelBtn = document.getElementById("openPanel");
  const hint = document.getElementById("hint");

  if (onList) {
    openPanelBtn.style.display = "block";
    hint.textContent = "This page is in your list. You can open the side panel.";
  } else {
    openPanelBtn.style.display = "none";
    hint.textContent = "This page is outside your list. You can still launch a listed site.";
  }

  document.getElementById("launch").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "LAUNCH_RANDOM" });
    window.close();
  });

   // Open a tab-specific panel (user gesture preserved here)
  openPanelBtn.addEventListener("click", async () => {
    if (!tab?.id) return;
    try {
      // Ensure no default/global panel is enabled
       chrome.sidePanel.setOptions({ enabled: false });
      // Enable for THIS tab only and open
       chrome.sidePanel.setOptions({ tabId: tab.id, path: "sidepanel.html", enabled: true });
       chrome.sidePanel.open({ tabId: tab.id });
      // Tell SW which tab owns the panel so it can auto-close on navigate/launch
      chrome.runtime.sendMessage({ type: "PANEL_OPENED_FOR_TAB", tabId: tab.id });
    } catch (e) {
      console.warn("SidePanel open failed:", e);
    } finally {
      window.close();
    }
  });
})();

// Inform SW which tab has the panel (so it can close it on launch/navigation)
chrome.runtime.onMessage.addListener((msg) => {});
// const ALLOWED_DOMAINS = [
//   "wikipedia.org",
//   "developer.chrome.com",
//   "web.dev",
//   "nytimes.com",
//   "bbc.com",
//   "reddit.com",
//   "example.com"
// ];

// function isInList(urlStr) {
//   try {
//     const u = new URL(urlStr);
//     const host = u.hostname.toLowerCase();
//     return ALLOWED_DOMAINS.some(d => host === d || host.endsWith("." + d));
//   } catch {
//     return false;
//   }
// }

// (async function init() {
//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//   const onList = tab?.url ? isInList(tab.url) : false;

//   const openPanelBtn = document.getElementById("openPanel");
//   const hint = document.getElementById("hint");

//   if (onList) {
//     openPanelBtn.style.display = "block";
//     hint.textContent = "This page is in your list. You can open the side panel.";
//   } else {
//     openPanelBtn.style.display = "none";
//     hint.textContent = "This page is outside your list. You can still launch a listed site.";
//   }

//   document.getElementById("launch").addEventListener("click", () => {
//     chrome.runtime.sendMessage({ type: "LAUNCH_RANDOM" }); // can stay via SW
//     window.close();
//   });

//   // ✅ Open side panel directly from the popup (user gesture preserved)
//   openPanelBtn.addEventListener("click", async () => {
//     if (!tab?.id) return;
//     try {
//       await chrome.sidePanel.setOptions({ tabId: tab.id, path: "sidepanel.html" });
//       await chrome.sidePanel.open({ tabId: tab.id });
//     } catch (e) {
//       console.warn("SidePanel open failed:", e);
//     } finally {
//       window.close();
//     }
//   });
// })();
