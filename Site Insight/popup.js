document.getElementById('launchBtn').addEventListener('click', async () => {
  chrome.runtime.sendMessage({ type: 'LAUNCH_RANDOM' });
  window.close();
});
