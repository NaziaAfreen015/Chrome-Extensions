// List of 7 websites to choose from
const SITES = [
  "https://www.wikipedia.org/",
  "https://www.bbc.com/",
  "https://www.nytimes.com/",
  "https://www.reddit.com/",
  "https://web.dev/",
  "https://developer.mozilla.org/",
  "https://stackoverflow.com/"
];

// Function to pick one random website from the list
function pickRandomSite() {
  const randomIndex = Math.floor(Math.random() * SITES.length);
  return SITES[randomIndex];
}

// Track which tab we want to open side panel for
let pendingTabId = null;

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  
  // Check if the message is asking to launch a random website
  if (message.type === 'LAUNCH_RANDOM') {
    
    // Step 1: Pick a random website
    const randomUrl = pickRandomSite();
    console.log('Opening random site:', randomUrl);
    
    // Step 2: Create a new tab with that website
    chrome.tabs.create({ url: randomUrl, active: true }, function(newTab) {
      
      // Remember this tab ID
      pendingTabId = newTab.id;
      
      // Step 3: Configure the side panel for this specific tab
      chrome.sidePanel.setOptions({
        tabId: newTab.id,
        path: 'sidepanel.html',
        enabled: true
      });
      
      console.log('Side panel configured for tab:', newTab.id);
      console.log('It will open automatically when the page loads');
    });
    
    sendResponse({ success: true });
  }
  
  return true;
});

// Listen for when tabs finish loading
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  
  // Check if this is our pending tab and it just finished loading
  if (tabId === pendingTabId && changeInfo.status === 'complete') {
    
    console.log('Page loaded! Opening side panel...');
    
    // Try to open the side panel
    try {
      await chrome.sidePanel.open({ tabId: tabId });
      console.log('Side panel opened successfully!');
    } catch (error) {
      // If it fails due to user gesture requirement, that's ok
      // The user can click the extension icon to open it
      console.log('Side panel ready (click extension icon to open)');
    }
    
    // Clear the pending tab
    pendingTabId = null;
  }
});