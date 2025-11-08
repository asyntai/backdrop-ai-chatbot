(function () {
  'use strict';

  var currentState = null;

  function showAlert(msg, ok) {
    var el = document.getElementById('asyntai-alert');
    if (!el) return;
    el.style.display = 'block';
    el.className = 'messages messages--' + (ok ? 'status' : 'error');
    el.textContent = msg;
  }

  function generateState() {
    return 'backdrop_' + Math.random().toString(36).substr(2, 9);
  }

  function updateFallbackLink() {
    var fallbackLink = document.getElementById('asyntai-fallback-link');
    if (fallbackLink && currentState) {
      fallbackLink.href = 'https://asyntai.com/wp-auth?platform=backdrop&state=' + encodeURIComponent(currentState);
    }
  }

  function openPopup() {
    currentState = generateState();
    updateFallbackLink();
    var base = 'https://asyntai.com/wp-auth?platform=backdrop';
    var url = base + (base.indexOf('?') > -1 ? '&' : '?') + 'state=' + encodeURIComponent(currentState);
    var w = 800, h = 720;
    var y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
    var x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
    var pop = window.open(url, 'asyntai_connect', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=' + w + ',height=' + h + ',top=' + y + ',left=' + x);

    // Check if popup was blocked after a short delay
    setTimeout(function () {
      if (!pop || pop.closed || typeof pop.closed == 'undefined') {
        showAlert('Popup blocked. Please allow popups or use the link below.', false);
        return;
      }
      pollForConnection(currentState);
    }, 100);
  }

  // Initialize fallback link on page load
  currentState = generateState();
  updateFallbackLink();

  function pollForConnection(state) {
    var attempts = 0;
    function check() {
      if (attempts++ > 60) return;
      var script = document.createElement('script');
      var cb = 'asyntai_cb_' + Date.now();
      script.src = 'https://asyntai.com/connect-status.js?state=' + encodeURIComponent(state) + '&cb=' + cb;
      window[cb] = function (data) {
        try { delete window[cb]; } catch (e) { }
        if (data && data.site_id) {
          saveConnection(data);
          return;
        }
        setTimeout(check, 500);
      };
      script.onerror = function () {
        setTimeout(check, 1000);
      };
      document.head.appendChild(script);
    }
    setTimeout(check, 800);
  }

  function saveConnection(data) {
    showAlert('Asyntai connected. Saving…', true);
    var payload = { site_id: data.site_id || '' };
    if (data.script_url) payload.script_url = data.script_url;
    if (data.account_email) payload.account_email = data.account_email;

    // Get Backdrop base path
    var basePath = '/';
    if (typeof Backdrop !== 'undefined' && Backdrop.settings && Backdrop.settings.basePath) {
      basePath = Backdrop.settings.basePath;
    } else {
      // Fallback: use current location base
      var pathArray = window.location.pathname.split('/');
      if (pathArray.length > 1) {
        basePath = '/';
      }
    }

    var saveUrl = basePath + 'asyntai/api/save';
    saveUrl = saveUrl.replace(/\/+/g, '/'); // Remove double slashes

    fetch(saveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (text) {
          throw new Error('HTTP ' + r.status + ': ' + text);
        });
      }
      return r.json();
    }).then(function (json) {
      if (!json || !json.success) throw new Error(json && json.error || 'Save failed');
      showAlert('Asyntai connected. Chatbot enabled on all pages.', true);

      // Update status
      var status = document.getElementById('asyntai-status');
      if (status) {
        // Clear existing content
        status.innerHTML = '';

        // Add status text
        var statusText = document.createTextNode('Status: ');
        status.appendChild(statusText);

        // Add connected span
        var connectedSpan = document.createElement('span');
        connectedSpan.style.color = '#28a745';
        connectedSpan.style.fontWeight = '600';
        connectedSpan.textContent = 'Connected';
        status.appendChild(connectedSpan);

        // Add email if available
        if (payload.account_email) {
          var emailText = document.createTextNode(' as ' + payload.account_email);
          status.appendChild(emailText);
        }

        // Add reset button
        var resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.id = 'asyntai-reset';
        resetBtn.className = 'button';
        resetBtn.textContent = 'Reset';
        resetBtn.style.marginLeft = '12px';
        status.appendChild(document.createTextNode(' '));
        status.appendChild(resetBtn);
      }

      // Show connected box
      var box = document.getElementById('asyntai-connected-box');
      if (box) {
        box.style.display = 'block';
        // If box is empty, add the content
        if (!box.innerHTML || box.innerHTML.trim() === '') {
          box.innerHTML = '<div style="padding:32px;border:1px solid #ddd;border-radius:8px;background:#fff;text-align:center;">' +
            '<h2>Asyntai is now enabled</h2>' +
            '<p style="font-size:16px;color:#666;">Set up your AI chatbot, review chat logs and more:</p>' +
            '<a class="button button-primary" href="https://asyntai.com/dashboard" target="_blank" rel="noopener">Open Asyntai Panel</a>' +
            '<p style="margin:20px 0 0;color:#666;"><strong>Tip:</strong> If you want to change how the AI answers, please <a href="https://asyntai.com/dashboard#setup" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline;">go here</a>.</p>' +
            '</div>';
        }
      }

      // Hide popup wrap
      var wrap = document.getElementById('asyntai-popup-wrap');
      if (wrap) wrap.style.display = 'none';
    }).catch(function (err) {
      showAlert('Could not save settings: ' + (err && err.message || err), false);
    });
  }

  function resetConnection() {
    if (!confirm('Are you sure you want to reset the Asyntai connection?')) {
      return;
    }

    // Get Backdrop base path
    var basePath = '/';
    if (typeof Backdrop !== 'undefined' && Backdrop.settings && Backdrop.settings.basePath) {
      basePath = Backdrop.settings.basePath;
    } else {
      // Fallback: use current location base
      var pathArray = window.location.pathname.split('/');
      if (pathArray.length > 1) {
        basePath = '/';
      }
    }

    var resetUrl = basePath + 'asyntai/api/reset';
    resetUrl = resetUrl.replace(/\/+/g, '/'); // Remove double slashes

    fetch(resetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'reset' })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function () {
      window.location.reload();
    }).catch(function (err) {
      showAlert('Reset failed: ' + (err && err.message || err), false);
    });
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t && t.id === 'asyntai-connect-btn') { ev.preventDefault(); openPopup(); }
    if (t && t.id === 'asyntai-reset') { ev.preventDefault(); resetConnection(); }
    if (t && t.id === 'asyntai-fallback-link') {
      // Re-generate state and update link when clicked
      currentState = generateState();
      updateFallbackLink();
      // Let the link work normally (target="_blank")
      // Also start polling for this state
      setTimeout(function () { pollForConnection(currentState); }, 1000);
    }
  });
})();
