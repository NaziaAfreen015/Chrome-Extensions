// Wait for the popup to fully load
document.addEventListener('DOMContentLoaded', function() {
  
  // Find the button by its ID
  const button = document.getElementById('launchBtn');
  
  // When the button is clicked, do this:
  button.addEventListener('click', function() {
    // Send a message to the background script
    chrome.runtime.sendMessage({ type: 'LAUNCH_RANDOM' });
    
    // Close the popup after clicking
    window.close();
  });
  
});