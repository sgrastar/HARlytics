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

// Capture filter state
let captureFilters = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'CONNECT', 'HEAD'],
  status: ['1xx', '2xx', '3xx', '4xx', '5xx', 'Other'],
  types: ['xhr', 'fetch', 'document', 'stylesheet', 'script', 'font', 'image', 'media', 'manifest', 'websocket', 'webtransport', 'other'],
  messages: ['Authorization', 'PostData', 'QueryParameter', 'Set-Cookie', 'Plain']
};

// Filter statistics
let filterStats = { total: 0, filtered: 0 };

// Filter counts for each category
let filterCounts = {
  methods: { GET: 0, POST: 0, PUT: 0, DELETE: 0, PATCH: 0, OPTIONS: 0, CONNECT: 0, HEAD: 0 },
  status: { '1xx': 0, '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, 'Other': 0 },
  types: { xhr: 0, fetch: 0, document: 0, stylesheet: 0, script: 0, font: 0, image: 0, media: 0, manifest: 0, websocket: 0, webtransport: 0, other: 0 },
  messages: { Authorization: 0, PostData: 0, QueryParameter: 0, 'Set-Cookie': 0, Plain: 0 }
};

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
      panelWindow._harlyticsUpdateFilters = updateCaptureFilters;
      panelWindow._harlyticsStartCapture = startCapture;
      panelWindow._harlyticsStopCapture = stopCapture;
      panelWindow._harlyticsStartClear = clearEntries;

      // Update status display, button state, and filter counts
      updatePanelStatus();
      updatePanelButtons();
      updatePanelFilterCounts();
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

    var entryText = ' ' + totalEntryCount + ' entries';
    var filterText = filterStats.filtered > 0
      ? ' (' + filterStats.filtered + ' filtered)'
      : '';
    statusEl.appendChild(panelWindow.document.createTextNode(entryText + filterText));
  } else if (totalEntryCount > 0) {
    var badge2 = panelWindow.document.createElement('span');
    badge2.className = 'badge stopped';
    badge2.textContent = 'Stopped';
    statusEl.appendChild(badge2);

    var entryText2 = ' ' + totalEntryCount + ' entries';
    var filterText2 = filterStats.filtered > 0
      ? ' (' + filterStats.filtered + ' filtered)'
      : '';
    statusEl.appendChild(panelWindow.document.createTextNode(entryText2 + filterText2));
  }
}

/**
 * Update the capture button state in panel.html
 */
function updatePanelButtons() {
  if (!panelWindow || typeof panelWindow.updateCaptureButtons !== 'function') return;
  panelWindow.updateCaptureButtons(isCapturing);
}

/**
 * Update filter counts in panel.html
 */
function updatePanelFilterCounts() {
  if (!panelWindow || typeof panelWindow.updateFilterCounts !== 'function') return;
  panelWindow.updateFilterCounts(filterCounts);
}

/**
 * Increment filter counts for a HAR entry
 */
function incrementFilterCounts(harEntry) {
  // Method count
  var method = harEntry.request.method;
  if (filterCounts.methods[method] !== undefined) {
    filterCounts.methods[method]++;
  }

  // Status count
  var status = harEntry.response.status;
  var statusRange = 'Other';
  if (status >= 100 && status < 200) statusRange = '1xx';
  else if (status >= 200 && status < 300) statusRange = '2xx';
  else if (status >= 300 && status < 400) statusRange = '3xx';
  else if (status >= 400 && status < 500) statusRange = '4xx';
  else if (status >= 500 && status < 600) statusRange = '5xx';
  filterCounts.status[statusRange]++;

  // Resource type count (we need to store this from request._resourceType)
  var resourceType = (harEntry._resourceType || 'other').toLowerCase();
  if (filterCounts.types[resourceType] !== undefined) {
    filterCounts.types[resourceType]++;
  }

  // Message element count
  if (hasAuthorizationHeader(harEntry)) {
    filterCounts.messages.Authorization++;
  }
  if (harEntry.request.postData) {
    filterCounts.messages.PostData++;
  }
  if (harEntry.request.queryString && harEntry.request.queryString.length > 0) {
    filterCounts.messages.QueryParameter++;
  }
  if (hasSetCookieHeader(harEntry)) {
    filterCounts.messages['Set-Cookie']++;
  }
  if (!hasAuthorizationHeader(harEntry) &&
      !harEntry.request.postData &&
      !hasSetCookieHeader(harEntry) &&
      (!harEntry.request.queryString || harEntry.request.queryString.length === 0)) {
    filterCounts.messages.Plain++;
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
 * Update capture filters from panel UI
 */
function updateCaptureFilters(newFilters) {
  captureFilters = newFilters;
  console.log('Capture filters updated:', captureFilters);

  // Notify target tab of filter changes (optional)
  sendToTargetTab({
    type: 'FILTERS_UPDATED',
    filters: captureFilters
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
  filterStats = { total: 0, filtered: 0 };
  filterCounts = {
    methods: { GET: 0, POST: 0, PUT: 0, DELETE: 0, PATCH: 0, OPTIONS: 0, CONNECT: 0, HEAD: 0 },
    status: { '1xx': 0, '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, 'Other': 0 },
    types: { xhr: 0, fetch: 0, document: 0, stylesheet: 0, script: 0, font: 0, image: 0, media: 0, manifest: 0, websocket: 0, webtransport: 0, other: 0 },
    messages: { Authorization: 0, PostData: 0, QueryParameter: 0, 'Set-Cookie': 0, Plain: 0 }
  };

  chrome.devtools.network.onRequestFinished.addListener(onRequestFinishedHandler);

  updatePanelStatus();
  updatePanelButtons();
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
  updatePanelButtons();
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
  filterStats = { total: 0, filtered: 0 };
  filterCounts = {
    methods: { GET: 0, POST: 0, PUT: 0, DELETE: 0, PATCH: 0, OPTIONS: 0, CONNECT: 0, HEAD: 0 },
    status: { '1xx': 0, '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, 'Other': 0 },
    types: { xhr: 0, fetch: 0, document: 0, stylesheet: 0, script: 0, font: 0, image: 0, media: 0, manifest: 0, websocket: 0, webtransport: 0, other: 0 },
    messages: { Authorization: 0, PostData: 0, QueryParameter: 0, 'Set-Cookie': 0, Plain: 0 }
  };

  updatePanelStatus();
  updatePanelButtons();
  updatePanelFilterCounts();
  sendToTargetTab({ type: 'CLEAR_ENTRIES' });
}

/**
 * Handle network request finished event with filtering
 * Wait for response to complete with 5 second timeout
 */
function onRequestFinishedHandler(request) {
  if (!isCapturing) return;

  filterStats.total++;

  // Phase 1: Fast filtering (before getContent)
  // Method filter (skip if all 8 methods are selected or none selected)
  if (captureFilters.methods.length > 0 && captureFilters.methods.length < 8 &&
      !captureFilters.methods.includes(request.request.method)) {
    filterStats.filtered++;
    updatePanelStatus();
    return;
  }

  // Status filter (skip if all 6 status ranges are selected or none selected)
  if (captureFilters.status.length > 0 && captureFilters.status.length < 6) {
    var status = request.response.status;
    var matchesStatus = captureFilters.status.some(function(range) {
      if (range === '1xx') return status >= 100 && status < 200;
      if (range === '2xx') return status >= 200 && status < 300;
      if (range === '3xx') return status >= 300 && status < 400;
      if (range === '4xx') return status >= 400 && status < 500;
      if (range === '5xx') return status >= 500 && status < 600;
      if (range === 'Other') return status < 100 || status >= 600 || isNaN(status);
      return false;
    });

    if (!matchesStatus) {
      filterStats.filtered++;
      updatePanelStatus();
      return;
    }
  }

  // Resource type filter (skip if all 12 types are selected or none selected)
  if (captureFilters.types.length > 0 && captureFilters.types.length < 12 &&
      !checkResourceTypeFilter(request._resourceType, captureFilters.types)) {
    filterStats.filtered++;
    updatePanelStatus();
    return;
  }

  // Phase 2: Continue with existing 5-second timeout logic
  var startTime = Date.now();
  var maxWaitTime = 5000;
  var checkInterval = 100;

  function checkRequestComplete() {
    var elapsed = Date.now() - startTime;
    var isComplete = request.time > 0 &&
                     request.timings &&
                     (request.timings.receive >= 0 || elapsed >= maxWaitTime);

    if (isComplete || elapsed >= maxWaitTime) {
      request.getContent(function(content, encoding) {
        try {
          var harEntry = buildHarEntry(request, content, encoding);

          // Phase 3: Message element filtering (skip if all 5 types are selected or none selected)
          if (captureFilters.messages.length > 0 && captureFilters.messages.length < 5 &&
              !passesMessageElementFilter(harEntry, captureFilters.messages)) {
            filterStats.filtered++;
            updatePanelStatus();
            return;
          }

          // Add resource type to harEntry for counting
          harEntry._resourceType = request._resourceType;

          // Increment filter counts
          incrementFilterCounts(harEntry);

          captureBuffer.push(harEntry);
          totalEntryCount++;

          if (captureBuffer.length >= 10) {
            flushBuffer();
          } else {
            scheduleFlush();
          }

          updatePanelStatus();
          updatePanelFilterCounts();
        } catch (error) {
          console.error('Error building HAR entry:', error);
        }
      });
    } else {
      setTimeout(checkRequestComplete, checkInterval);
    }
  }

  checkRequestComplete();
}

/**
 * Check if resource type matches any selected type filter
 */
function checkResourceTypeFilter(resourceType, selectedTypes) {
  if (selectedTypes.length === 0) return true;
  var type = (resourceType || 'other').toLowerCase();
  return selectedTypes.includes(type);
}

/**
 * Check if HAR entry passes message element filters
 */
function passesMessageElementFilter(harEntry, selectedMessages) {
  if (selectedMessages.length === 0) return true;

  for (var i = 0; i < selectedMessages.length; i++) {
    var msgType = selectedMessages[i];
    switch (msgType) {
      case 'Authorization':
        if (hasAuthorizationHeader(harEntry)) return true;
        break;
      case 'PostData':
        if (harEntry.request.postData) return true;
        break;
      case 'QueryParameter':
        if (harEntry.request.queryString && harEntry.request.queryString.length > 0) return true;
        break;
      case 'Set-Cookie':
        if (hasSetCookieHeader(harEntry)) return true;
        break;
      case 'Plain':
        if (!hasAuthorizationHeader(harEntry) &&
            !harEntry.request.postData &&
            !hasSetCookieHeader(harEntry) &&
            (!harEntry.request.queryString || harEntry.request.queryString.length === 0)) {
          return true;
        }
        break;
    }
  }
  return false;
}

/**
 * Check if entry has authorization-related headers
 */
function hasAuthorizationHeader(harEntry) {
  var headers = harEntry.request.headers || [];
  var authHeaders = [
    'authorization', 'x-api-key', 'api-key', 'x-custom-auth',
    'x-session-token', 'session-token', 'x-csrf-token', 'x-xsrf-token',
    'x-application-key', 'x-client-id', 'x-device-token', 'x-access-token',
    'x-refresh-token', 'x-tenant-id', 'x-auth-token', 'x-tracking-id',
    'x-user-id', 'ocp-apim-subscription-key', 'x-organization-id',
    'x-account-id', 'x-otp', 'x-workspace-id', 'x-signature',
    'x-project-id', 'x-partner-id', 'x-instance-id'
  ];

  for (var i = 0; i < headers.length; i++) {
    var headerName = headers[i].name.toLowerCase();
    if (authHeaders.indexOf(headerName) !== -1) {
      return true;
    }
  }
  return false;
}

/**
 * Check if entry has Set-Cookie header
 */
function hasSetCookieHeader(harEntry) {
  var headers = harEntry.response.headers || [];
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].name.toLowerCase() === 'set-cookie') {
      return true;
    }
  }
  return false;
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
    timings: request.timings ? {
      blocked: request.timings.blocked >= 0 ? request.timings.blocked : -1,
      dns: request.timings.dns >= 0 ? request.timings.dns : -1,
      connect: request.timings.connect >= 0 ? request.timings.connect : -1,
      send: request.timings.send >= 0 ? request.timings.send : 0,
      wait: request.timings.wait >= 0 ? request.timings.wait : 0,
      receive: request.timings.receive >= 0 ? request.timings.receive : 0,
      ssl: request.timings.ssl >= 0 ? request.timings.ssl : -1
    } : {
      blocked: -1,
      dns: -1,
      connect: -1,
      send: 0,
      wait: 0,
      receive: 0,
      ssl: -1
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
