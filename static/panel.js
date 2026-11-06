// panel.js - Runs inside the DevTools panel (panel.html)
// devtools.js injects _harlyticsOpenTab(), _harlyticsUpdateFilters(),
// _harlyticsStartCapture(), _harlyticsStopCapture(), _harlyticsStartClear() into this window.

// Capture state
let isCapturing = false;

// Filter state
let filterState = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'CONNECT', 'HEAD'],
  status: ['1xx', '2xx', '3xx', '4xx', '5xx', 'Other'],
  types: ['xhr', 'fetch', 'document', 'stylesheet', 'script', 'font', 'image', 'media', 'manifest', 'websocket', 'webtransport', 'other'],
  messages: ['Authorization', 'PostData', 'QueryParameter', 'Set-Cookie', 'Plain']
};

// Load saved filter settings
chrome.storage.local.get(['captureFilters'], (result) => {
  if (chrome.runtime.lastError) {
    console.warn('Failed to load filters:', chrome.runtime.lastError);
    return;
  }
  if (result.captureFilters) {
    filterState = result.captureFilters;
    applyFilterStateToUI();
  }
  // Notify devtools.js of initial filter state
  notifyDevtoolsOfFilterChange();
});

// Open in New Tab button
document.getElementById('btnOpen').addEventListener('click', function () {
  if (typeof window._harlyticsOpenTab === 'function') {
    window._harlyticsOpenTab();
  } else {
    console.error('_harlyticsOpenTab not injected by devtools.js');
  }
});

// Capture button (Start/Stop toggle)
document.getElementById('btnCapture').addEventListener('click', function () {
  if (isCapturing) {
    // Stop capture
    if (typeof window._harlyticsStopCapture === 'function') {
      window._harlyticsStopCapture();
    } else {
      console.error('_harlyticsStopCapture not injected by devtools.js');
    }
  } else {
    // Start capture
    if (typeof window._harlyticsStartCapture === 'function') {
      window._harlyticsStartCapture();
    } else {
      console.error('_harlyticsStartCapture not injected by devtools.js');
    }
  }
});

// Clear button
document.getElementById('btnClear').addEventListener('click', function () {
  if (typeof window._harlyticsStartClear === 'function') {
    window._harlyticsStartClear();
  } else {
    console.error('_harlyticsStartClear not injected by devtools.js');
  }
});

// "All" toggle handlers
document.getElementById('allMethods').addEventListener('change', (e) => {
  toggleAllCheckboxes('.method-filter', e.target.checked);
  updateFilterState();
});

document.getElementById('allStatus').addEventListener('change', (e) => {
  toggleAllCheckboxes('.status-filter', e.target.checked);
  updateFilterState();
});

document.getElementById('allTypes').addEventListener('change', (e) => {
  toggleAllCheckboxes('.type-filter', e.target.checked);
  updateFilterState();
});

document.getElementById('allMessages').addEventListener('change', (e) => {
  toggleAllCheckboxes('.message-filter', e.target.checked);
  updateFilterState();
});

// Individual checkbox handlers
document.querySelectorAll('.method-filter, .status-filter, .type-filter, .message-filter').forEach(checkbox => {
  checkbox.addEventListener('change', updateFilterState);
});

// Reset button
document.getElementById('btnResetFilters').addEventListener('click', () => {
  filterState = {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'CONNECT', 'HEAD'],
    status: ['1xx', '2xx', '3xx', '4xx', '5xx', 'Other'],
    types: ['xhr', 'fetch', 'document', 'stylesheet', 'script', 'font', 'image', 'media', 'manifest', 'websocket', 'webtransport', 'other'],
    messages: ['Authorization', 'PostData', 'QueryParameter', 'Set-Cookie', 'Plain']
  };
  applyFilterStateToUI();
  notifyDevtoolsOfFilterChange();
});

// Save button
document.getElementById('btnSaveFilters').addEventListener('click', () => {
  chrome.storage.local.set({ captureFilters: filterState }, () => {
    if (chrome.runtime.lastError) {
      console.error('Failed to save filters:', chrome.runtime.lastError);
      return;
    }
    // Show temporary success indicator
    const btn = document.getElementById('btnSaveFilters');
    const originalText = btn.textContent;
    btn.textContent = 'Saved!';
    btn.style.background = '#065f46';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 1500);
  });
});

// Helper: Toggle all checkboxes in a group
function toggleAllCheckboxes(selector, checked) {
  document.querySelectorAll(selector).forEach(checkbox => {
    checkbox.checked = checked;
  });
}

// Helper: Update filter state from UI
function updateFilterState() {
  filterState.methods = Array.from(document.querySelectorAll('.method-filter:checked')).map(cb => cb.value);
  filterState.status = Array.from(document.querySelectorAll('.status-filter:checked')).map(cb => cb.value);
  filterState.types = Array.from(document.querySelectorAll('.type-filter:checked')).map(cb => cb.value);
  filterState.messages = Array.from(document.querySelectorAll('.message-filter:checked')).map(cb => cb.value);

  // Update "All" checkboxes state
  document.getElementById('allMethods').checked = filterState.methods.length === 8;
  document.getElementById('allStatus').checked = filterState.status.length === 6;
  document.getElementById('allTypes').checked = filterState.types.length === 12;
  document.getElementById('allMessages').checked = filterState.messages.length === 5;

  updateFilterBadge();
  notifyDevtoolsOfFilterChange();
}

// Helper: Apply filter state to UI checkboxes
function applyFilterStateToUI() {
  // Methods
  document.querySelectorAll('.method-filter').forEach(cb => {
    cb.checked = filterState.methods.includes(cb.value);
  });
  document.getElementById('allMethods').checked = filterState.methods.length === 8;

  // Status
  document.querySelectorAll('.status-filter').forEach(cb => {
    cb.checked = filterState.status.includes(cb.value);
  });
  document.getElementById('allStatus').checked = filterState.status.length === 6;

  // Types
  document.querySelectorAll('.type-filter').forEach(cb => {
    cb.checked = filterState.types.includes(cb.value);
  });
  document.getElementById('allTypes').checked = filterState.types.length === 12;

  // Messages
  document.querySelectorAll('.message-filter').forEach(cb => {
    cb.checked = filterState.messages.includes(cb.value);
  });
  document.getElementById('allMessages').checked = filterState.messages.length === 5;

  updateFilterBadge();
}

// Helper: Update filter badge
function updateFilterBadge() {
  const badge = document.getElementById('filterBadge');
  const totalChecked = filterState.methods.length + filterState.status.length +
                       filterState.types.length + filterState.messages.length;
  const totalPossible = 8 + 6 + 12 + 5; // 31 total

  if (totalChecked === totalPossible) {
    badge.textContent = 'All';
    badge.classList.remove('active');
  } else if (totalChecked === 0) {
    badge.textContent = 'None';
    badge.classList.add('active');
  } else {
    badge.textContent = `${totalChecked}/${totalPossible}`;
    badge.classList.add('active');
  }
}

// Notify devtools.js of filter changes
function notifyDevtoolsOfFilterChange() {
  if (typeof window._harlyticsUpdateFilters === 'function') {
    window._harlyticsUpdateFilters(filterState);
  } else {
    console.warn('_harlyticsUpdateFilters not injected by devtools.js yet');
  }
}

// Update capture button state (called by devtools.js)
window.updateCaptureButtons = function(capturing) {
  isCapturing = capturing;
  const btnCapture = document.getElementById('btnCapture');
  const btnClear = document.getElementById('btnClear');

  if (capturing) {
    btnCapture.textContent = 'Stop Capture';
    btnCapture.className = 'stop';
  } else {
    btnCapture.textContent = 'Start Capture';
    btnCapture.className = 'start';
  }
};

// Update filter counts (called by devtools.js)
window.updateFilterCounts = function(counts) {
  // Update method checkboxes
  document.querySelectorAll('.method-filter').forEach(cb => {
    const method = cb.value;
    const count = counts.methods[method] || 0;
    const label = cb.parentElement;
    const text = label.childNodes[label.childNodes.length - 1];
    text.textContent = ` ${method} (${count})`;
  });

  // Update status checkboxes
  document.querySelectorAll('.status-filter').forEach(cb => {
    const status = cb.value;
    const count = counts.status[status] || 0;
    const label = cb.parentElement;
    const text = label.childNodes[label.childNodes.length - 1];
    text.textContent = ` ${status} (${count})`;
  });

  // Update type checkboxes
  const typeLabels = {
    xhr: 'XHR',
    fetch: 'Fetch',
    document: 'Doc',
    stylesheet: 'CSS',
    script: 'JS',
    font: 'Font',
    image: 'Img',
    media: 'Media',
    manifest: 'Manifest',
    websocket: 'WS',
    webtransport: 'WebTransport',
    other: 'Other'
  };
  document.querySelectorAll('.type-filter').forEach(cb => {
    const type = cb.value;
    const count = counts.types[type] || 0;
    const displayLabel = typeLabels[type] || type;
    const label = cb.parentElement;
    const text = label.childNodes[label.childNodes.length - 1];
    text.textContent = ` ${displayLabel} (${count})`;
  });

  // Update message checkboxes
  const messageLabels = {
    Authorization: 'Auth',
    PostData: 'PostData',
    QueryParameter: 'Query',
    'Set-Cookie': 'Cookie',
    Plain: 'Plain'
  };
  document.querySelectorAll('.message-filter').forEach(cb => {
    const message = cb.value;
    const count = counts.messages[message] || 0;
    const displayLabel = messageLabels[message] || message;
    const label = cb.parentElement;
    const text = label.childNodes[label.childNodes.length - 1];
    text.textContent = ` ${displayLabel} (${count})`;
  });
};
