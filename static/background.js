chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: "index.html" });
});

// Real-time capture message routing
let captureTargetTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_CAPTURE_TARGET') {
    captureTargetTabId = message.tabId;
    console.log('Capture target tab set:', captureTargetTabId);
    sendResponse({ success: true });
  }
  else if (message.type === 'FORWARD_TO_TAB') {
    const tabId = message.tabId || captureTargetTabId;
    if (tabId) {
      chrome.tabs.sendMessage(tabId, message.message).catch(err => {
        console.error('Failed to send to tab:', err);
      });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'No tab ID provided' });
    }
  }

  return true; // Keep message channel open for async response
});
