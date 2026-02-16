async function injectOverlayIntoTab(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["overlay.js"]
    });
  } catch (err) {
    // Common reasons: chrome:// pages, Chrome Web Store, missing host permission, etc.
    console.warn("Overlay injection failed:", err);
  }
}

// 1) On install: inject into the currently active tab (no user click needed).
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await injectOverlayIntoTab(tab.id);
  } catch (e) {
    console.warn("Could not query active tab on install:", e);
  }
});

// 2) Optional: keep it working on navigations / refreshes by injecting on page load complete.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;

  // Avoid restricted URLs
  const url = tab?.url || "";
  if (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("https://chrome.google.com/webstore") ||
    url.startsWith("https://chromewebstore.google.com/")
  ) {
    return;
  }

  await injectOverlayIntoTab(tabId);
});
