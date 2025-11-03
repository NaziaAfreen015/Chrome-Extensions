chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "HOLD",
  });
});

const extensions = 'https://developer.chrome.com/docs/extensions';
const webstore = 'https://developer.chrome.com/docs/webstore';

// Prefer chrome.action, but fall back to chrome.browserAction for older Chromium
const actionAPI = chrome.action ?? chrome.browserAction;

if (actionAPI?.onClicked) {
  actionAPI.onClicked.addListener(async (tab) => {
    try {
      // Guard: only toggle on our allowed docs pages and when tab has a URL
      const url = tab?.url ?? '';
      const isAllowed = url.startsWith(extensions) || url.startsWith(webstore);
      if (!isAllowed) {
        return;
      }

      console.log('Toggling Focus Mode extension');
      console.log('Current tab URL:', url);
      console.log('Current tab id:', tab.id);

      // Retrieve the action badge to check if the extension is 'ON' or 'HOLD'
      const prevState = await actionAPI.getBadgeText({ tabId: tab.id });
      // Next state will always be the opposite
      const nextState = prevState === 'ON' ? 'HOLD' : 'ON';

      // Set the action badge to the next state
      await actionAPI.setBadgeText({ tabId: tab.id, text: nextState });

      // Apply or remove CSS based on state
      if (nextState === 'ON') {
        await chrome.scripting.insertCSS({
          files: ['focus-mode.css'],
          target: { tabId: tab.id },
        });
      } else {
        await chrome.scripting.removeCSS({
          files: ['focus-mode.css'],
          target: { tabId: tab.id },
        });
      }
    } catch (e) {
      console.error('Focus Mode toggle failed:', e);
    }
  });
} else {
  console.warn('action API not available in this environment; onClicked listener not registered');
}


console.log('Outside Toggling Focus Mode extension');
