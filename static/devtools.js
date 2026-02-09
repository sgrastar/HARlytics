/**
 * HARlytics DevTools Script
 * Creates a DevTools panel with an "Open in New Tab" button.
 * Captures real-time network traffic and forwards to the opened tab.
 */

let panelWindow = null;
let targetTabId = null;
let captureBuffer = [];
let debounceTimer = null;
let isCapturing = false;
let entryIdCounter = 0;
let totalEntryCount = 0;

console.log('HARlytics DevTools script loaded');

// Create DevTools panel
chrome.devtools.panels.create(
  'HARlytics',
  'favicon.png',
  'panel.html',
  (panel) => {
    console.log('HARlytics DevTools panel created');

    panel.onShown.addListener((win) => {
      console.log('Panel shown');
      panelWindow = win;

      // Inject functions into panel window
      panelWindow._harlyticsOpenTab = openInTab;

      // Update status display
      updatePanelStatus();
    });

    panel.onHidden.addListener(() => {
      console.log('Panel hidden');
    });
  }
);

/**
 * Update the status display in panel.html using safe DOM methods
 */
function updatePanelStatus() {
  if (!panelWindow || !panelWindow.document) return;
  var statusEl = panelWindow.document.getElementById('status');
  if (!statusEl) return;

  // Clear existing content
  while (statusEl.firstChild) {
    statusEl.removeChild(statusEl.firstChild);
  }

  if (isCapturing) {
    var badge = panelWindow.document.createElement('span');
    badge.className = 'badge capturing';
    badge.textContent = 'Capturing';
    statusEl.appendChild(badge);
    statusEl.appendChild(panelWindow.document.createTextNode(' ' + totalEntryCount + ' entries'));
  } else if (totalEntryCount > 0) {
    var badge2 = panelWindow.document.createElement('span');
    badge2.className = 'badge stopped';
    badge2.textContent = 'Stopped';
    statusEl.appendChild(badge2);
    statusEl.appendChild(panelWindow.document.createTextNode(' ' + totalEntryCount + ' entries'));
  }
}

/**
 * Open HARlytics in a separate tab
 */
function openInTab() {
  var url = chrome.runtime.getURL('index.html') + '?mode=realtime';
  chrome.tabs.create({ url: url }, function(tab) {
    targetTabId = tab.id;
    console.log('Opened HARlytics in tab:', targetTabId);

    // Register this tab as capture target in background.js
    chrome.runtime.sendMessage({
      type: 'SET_CAPTURE_TARGET',
      tabId: targetTabId
    });

    // Wait for tab to load, then send current capture status
    setTimeout(function() {
      sendToTargetTab({
        type: 'DEVTOOLS_READY',
        context: 'devtools-tab',
        isCapturing: isCapturing
      });
    }, 1500);
  });
}

/**
 * Listen for messages from the tab via chrome.runtime
 */
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('DevTools received runtime message:', message.type);

  if (message.type === 'START_CAPTURE') {
    startCapture();
    sendResponse({ success: true });
  } else if (message.type === 'STOP_CAPTURE') {
    stopCapture();
    sendResponse({ success: true });
  } else if (message.type === 'CLEAR_ENTRIES') {
    clearEntries();
    sendResponse({ success: true });
  } else if (message.type === 'TAB_READY') {
    targetTabId = message.tabId || (sender.tab && sender.tab.id);
    console.log('Tab ready, target:', targetTabId);
    sendToTargetTab({
      type: 'DEVTOOLS_READY',
      context: 'devtools-tab',
      isCapturing: isCapturing
    });
    sendResponse({ success: true });
  }

  return true;
});

/**
 * Start capturing network traffic
 */
function startCapture() {
  if (isCapturing) {
    console.warn('Already capturing');
    return;
  }

  console.log('Starting network capture');
  isCapturing = true;
  captureBuffer = [];
  entryIdCounter = 0;
  totalEntryCount = 0;

  chrome.devtools.network.onRequestFinished.addListener(onRequestFinishedHandler);

  updatePanelStatus();
  sendToTargetTab({ type: 'CAPTURE_STARTED' });
}

/**
 * Stop capturing network traffic
 */
function stopCapture() {
  if (!isCapturing) {
    console.warn('Not capturing');
    return;
  }

  console.log('Stopping network capture');
  isCapturing = false;

  chrome.devtools.network.onRequestFinished.removeListener(onRequestFinishedHandler);
  flushBuffer();

  updatePanelStatus();
  sendToTargetTab({ type: 'CAPTURE_STOPPED' });
}

/**
 * Clear all captured entries
 */
function clearEntries() {
  console.log('Clearing entries');
  captureBuffer = [];
  entryIdCounter = 0;
  totalEntryCount = 0;

  updatePanelStatus();
  sendToTargetTab({ type: 'CLEAR_ENTRIES' });
}

/**
 * Handle network request finished event
 */
function onRequestFinishedHandler(request) {
  if (!isCapturing) return;

  request.getContent(function(content, encoding) {
    try {
      var harEntry = buildHarEntry(request, content, encoding);
      captureBuffer.push(harEntry);
      totalEntryCount++;

      if (captureBuffer.length >= 10) {
        flushBuffer();
      } else {
        scheduleFlush();
      }
    } catch (error) {
      console.error('Error building HAR entry:', error);
    }
  });
}

/**
 * Build HAR entry from DevTools request
 */
function buildHarEntry(request, content, encoding) {
  var url;
  try {
    url = new URL(request.request.url);
  } catch (e) {
    url = { searchParams: new URLSearchParams() };
  }

  var requestHeaders = request.request.headers.map(function(h) {
    return { name: h.name, value: h.value };
  });
  var responseHeaders = request.response.headers.map(function(h) {
    return { name: h.name, value: h.value };
  });

  var queryString = [];
  url.searchParams.forEach(function(value, name) {
    queryString.push({ name: name, value: value });
  });

  return {
    _id: entryIdCounter++,
    startedDateTime: request.startedDateTime || new Date().toISOString(),
    time: request.time || 0,
    request: {
      method: request.request.method,
      url: request.request.url,
      httpVersion: request.request.httpVersion || 'HTTP/1.1',
      headers: requestHeaders,
      queryString: queryString,
      cookies: request.request.cookies || [],
      headersSize: request.request.headersSize || -1,
      bodySize: request.request.bodySize || -1,
      postData: request.request.postData || undefined
    },
    response: {
      status: request.response.status,
      statusText: request.response.statusText,
      httpVersion: request.response.httpVersion || 'HTTP/1.1',
      headers: responseHeaders,
      cookies: request.response.cookies || [],
      content: {
        size: request.response.bodySize || 0,
        mimeType: (request.response.content && request.response.content.mimeType) || '',
        text: content || '',
        encoding: encoding || ''
      },
      redirectURL: request.response.redirectURL || '',
      headersSize: request.response.headersSize || -1,
      bodySize: request.response.bodySize || -1,
      _transferSize: request.response._transferSize || 0
    },
    cache: request.cache || {},
    timings: {
      blocked: (request.timings && request.timings.blocked) || -1,
      dns: (request.timings && request.timings.dns) || -1,
      connect: (request.timings && request.timings.connect) || -1,
      send: (request.timings && request.timings.send) || -1,
      wait: (request.timings && request.timings.wait) || -1,
      receive: (request.timings && request.timings.receive) || -1,
      ssl: (request.timings && request.timings.ssl) || -1
    },
    serverIPAddress: request.serverIPAddress || '',
    connection: request.connection || ''
  };
}

/**
 * Schedule buffer flush with debounce
 */
function scheduleFlush() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flushBuffer, 200);
}

/**
 * Flush capture buffer to target tab
 */
function flushBuffer() {
  if (captureBuffer.length === 0) return;

  var entries = captureBuffer.slice();
  captureBuffer = [];

  console.log('Flushing ' + entries.length + ' entries to target tab');

  sendToTargetTab({
    type: 'REALTIME_ENTRIES',
    entries: entries
  });

  updatePanelStatus();
}

/**
 * Send message to target tab via chrome.runtime broadcast
 */
function sendToTargetTab(message) {
  if (targetTabId) {
    chrome.runtime.sendMessage({
      type: 'DEVTOOLS_FORWARD',
      targetTabId: targetTabId,
      payload: message
    }).catch(function(err) {
      console.warn('Failed to send to target tab:', err);
    });
  }
}
