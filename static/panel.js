// panel.js - Runs inside the DevTools panel (panel.html)
// devtools.js injects _harlyticsOpenTab() and _harlyticsUpdateStatus() into this window.

document.getElementById('btnOpen').addEventListener('click', function () {
  if (typeof window._harlyticsOpenTab === 'function') {
    window._harlyticsOpenTab();
  } else {
    console.error('_harlyticsOpenTab not injected by devtools.js');
  }
});
