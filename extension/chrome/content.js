/**
 * VaultCloud Extension - Content Script
 * Detects login forms, injects autofill UI, and captures login submissions
 */

(function() {
  'use strict';

  const VAULTCLOUD_BANNER_ID = 'vaultcloud-save-banner';
  const VAULTCLOUD_MENU_ID = 'vaultcloud-autofill-menu';
  let capturedCredentials = null;
  let formObserver = null;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    .vaultcloud-input-icon {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      cursor: pointer;
      z-index: 999999;
      background: #4f46e5;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      font-weight: bold;
      opacity: 0.9;
      transition: opacity 0.2s;
    }

    .vaultcloud-input-icon:hover {
      opacity: 1;
    }

    .vaultcloud-autofill-menu {
      position: absolute;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      min-width: 280px;
      max-width: 400px;
      max-height: 300px;
      overflow-y: auto;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .vaultcloud-menu-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
      font-size: 13px;
      color: #111827;
      background: #f9fafb;
      border-radius: 8px 8px 0 0;
    }

    .vaultcloud-menu-item {
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.15s;
    }

    .vaultcloud-menu-item:hover {
      background: #f3f4f6;
    }

    .vaultcloud-menu-item:last-child {
      border-bottom: none;
      border-radius: 0 0 8px 8px;
    }

    .vaultcloud-menu-item-title {
      font-weight: 500;
      font-size: 14px;
      color: #111827;
      margin-bottom: 2px;
    }

    .vaultcloud-menu-item-username {
      font-size: 12px;
      color: #6b7280;
    }

    .vaultcloud-menu-item-url {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 2px;
    }

    .vaultcloud-menu-empty {
      padding: 20px 16px;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
    }

    #vaultcloud-save-banner {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      width: 360px;
      font-family: system-ui, -apple-system, sans-serif;
      animation: vaultcloud-slide-in 0.3s ease-out;
    }

    @keyframes vaultcloud-slide-in {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .vaultcloud-banner-header {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .vaultcloud-banner-icon {
      width: 32px;
      height: 32px;
      background: #4f46e5;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: white;
      flex-shrink: 0;
    }

    .vaultcloud-banner-title {
      font-weight: 600;
      font-size: 15px;
      color: #111827;
      flex: 1;
    }

    .vaultcloud-banner-close {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #6b7280;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }

    .vaultcloud-banner-close:hover {
      background: #f3f4f6;
    }

    .vaultcloud-banner-content {
      padding: 16px;
    }

    .vaultcloud-banner-field {
      margin-bottom: 12px;
    }

    .vaultcloud-banner-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 6px;
    }

    .vaultcloud-banner-value {
      font-size: 14px;
      color: #111827;
      padding: 8px 12px;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      word-break: break-all;
    }

    .vaultcloud-banner-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      box-sizing: border-box;
    }

    .vaultcloud-banner-input:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .vaultcloud-banner-actions {
      padding: 12px 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }

    .vaultcloud-banner-btn {
      flex: 1;
      padding: 10px 16px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }

    .vaultcloud-banner-btn-primary {
      background: #4f46e5;
      color: white;
    }

    .vaultcloud-banner-btn-primary:hover {
      background: #4338ca;
    }

    .vaultcloud-banner-btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .vaultcloud-banner-btn-secondary:hover {
      background: #e5e7eb;
    }

    .vaultcloud-banner-error {
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: #991b1b;
      font-size: 13px;
      margin-top: 12px;
    }
  `;
  document.head.appendChild(style);

  // Find password fields
  function findPasswordFields() {
    return Array.from(document.querySelectorAll('input[type="password"]'))
      .filter(field => field.offsetParent !== null); // Visible fields only
  }

  // Find username field near password field
  function findUsernameField(passwordField) {
    const form = passwordField.closest('form');
    if (form) {
      // Look for email or text inputs in the same form
      const candidates = Array.from(form.querySelectorAll('input[type="email"], input[type="text"], input[type="tel"]'))
        .filter(field => field.offsetParent !== null);
      
      // Prioritize email type, then by position
      const emailField = candidates.find(f => f.type === 'email');
      if (emailField) return emailField;

      // Find the closest text field before the password field
      for (let i = candidates.length - 1; i >= 0; i--) {
        const rect1 = candidates[i].getBoundingClientRect();
        const rect2 = passwordField.getBoundingClientRect();
        if (rect1.top < rect2.top || (rect1.top === rect2.top && rect1.left < rect2.left)) {
          return candidates[i];
        }
      }

      return candidates[0];
    }

    // Look for nearby input before password field
    const allInputs = Array.from(document.querySelectorAll('input[type="email"], input[type="text"], input[type="tel"]'))
      .filter(field => field.offsetParent !== null);
    
    return allInputs[allInputs.length - 1];
  }

  // Add autofill icon to password field
  function addAutofillIcon(passwordField) {
    if (passwordField.dataset.vaultcloudIcon) return;
    passwordField.dataset.vaultcloudIcon = 'true';

    const parent = passwordField.parentElement;
    const position = window.getComputedStyle(parent).position;
    if (position === 'static') {
      parent.style.position = 'relative';
    }

    const icon = document.createElement('div');
    icon.className = 'vaultcloud-input-icon';
    icon.innerHTML = '🔑';
    icon.title = 'VaultCloud Autofill';

    icon.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await showAutofillMenu(passwordField, icon);
    });

    parent.appendChild(icon);
  }

  // Show autofill menu
  async function showAutofillMenu(passwordField, icon) {
    // Remove existing menu
    const existingMenu = document.getElementById(VAULTCLOUD_MENU_ID);
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    const menu = document.createElement('div');
    menu.id = VAULTCLOUD_MENU_ID;
    menu.className = 'vaultcloud-autofill-menu';

    // Position menu
    const rect = icon.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left - 260}px`;

    // Get entries for current domain
    const domain = window.location.hostname;
    let entries = [];

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getEntriesForDomain',
        domain: domain,
      });

      if (response.success) {
        entries = response.data;
      }
    } catch (error) {
      console.error('Failed to get entries:', error);
    }

    // Build menu content
    const header = document.createElement('div');
    header.className = 'vaultcloud-menu-header';
    header.textContent = `VaultCloud (${entries.length})`;
    menu.appendChild(header);

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'vaultcloud-menu-empty';
      empty.textContent = 'No credentials saved for this site';
      menu.appendChild(empty);
    } else {
      entries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'vaultcloud-menu-item';

        const title = document.createElement('div');
        title.className = 'vaultcloud-menu-item-title';
        title.textContent = entry.title || 'Untitled';
        item.appendChild(title);

        const username = document.createElement('div');
        username.className = 'vaultcloud-menu-item-username';
        username.textContent = entry.username || 'No username';
        item.appendChild(username);

        if (entry.url) {
          const url = document.createElement('div');
          url.className = 'vaultcloud-menu-item-url';
          url.textContent = entry.url;
          item.appendChild(url);
        }

        item.addEventListener('click', async () => {
          await fillCredentials(passwordField, entry);
          menu.remove();
        });

        menu.appendChild(item);
      });
    }

    document.body.appendChild(menu);

    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== icon) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 0);
  }

  // Fill credentials into form
  async function fillCredentials(passwordField, entry) {
    // Decrypt password if needed
    let password = entry.password_encrypted;

    // Check if PGP encryption is used
    if (password.includes('-----BEGIN PGP MESSAGE-----')) {
      // Need to decrypt - send message to get decrypted password
      try {
        // For now, we can't decrypt in content script
        // This would need user's private key and passphrase
        console.log('PGP encrypted password - decryption in extension not yet implemented');
        password = 'ENCRYPTED'; // Placeholder
      } catch (error) {
        console.error('Decryption failed:', error);
        return;
      }
    }

    // Fill password
    passwordField.value = password;
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('change', { bubbles: true }));

    // Fill username
    const usernameField = findUsernameField(passwordField);
    if (usernameField && entry.username) {
      usernameField.value = entry.username;
      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Visual feedback
    passwordField.style.borderColor = '#10b981';
    setTimeout(() => {
      passwordField.style.borderColor = '';
    }, 1000);
  }

  // Capture form submission
  function captureFormSubmission() {
    document.addEventListener('submit', async (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;

      const passwordFields = Array.from(form.querySelectorAll('input[type="password"]'))
        .filter(f => f.value && f.offsetParent !== null);

      if (passwordFields.length === 0) return;

      const passwordField = passwordFields[0];
      const usernameField = findUsernameField(passwordField);

      if (!usernameField || !usernameField.value) return;

      capturedCredentials = {
        username: usernameField.value,
        password: passwordField.value,
        url: window.location.href,
        domain: window.location.hostname,
      };

      // Show save banner after a short delay (to allow redirect)
      setTimeout(() => {
        showSaveBanner();
      }, 1000);
    });
  }

  // Show save credentials banner
  function showSaveBanner() {
    if (!capturedCredentials) return;

    // Check if already exists
    if (document.getElementById(VAULTCLOUD_BANNER_ID)) return;

    const banner = document.createElement('div');
    banner.id = VAULTCLOUD_BANNER_ID;

    banner.innerHTML = `
      <div class="vaultcloud-banner-header">
        <div class="vaultcloud-banner-icon">🔐</div>
        <div class="vaultcloud-banner-title">Save to VaultCloud?</div>
        <button class="vaultcloud-banner-close" data-action="close">×</button>
      </div>
      <div class="vaultcloud-banner-content">
        <div class="vaultcloud-banner-field">
          <label class="vaultcloud-banner-label">Website</label>
          <div class="vaultcloud-banner-value">${escapeHtml(capturedCredentials.domain)}</div>
        </div>
        <div class="vaultcloud-banner-field">
          <label class="vaultcloud-banner-label">Username</label>
          <div class="vaultcloud-banner-value">${escapeHtml(capturedCredentials.username)}</div>
        </div>
        <div class="vaultcloud-banner-field">
          <label class="vaultcloud-banner-label">Title (optional)</label>
          <input type="text" class="vaultcloud-banner-input" data-field="title" placeholder="e.g., My Account" />
        </div>
        <div id="vaultcloud-banner-error"></div>
      </div>
      <div class="vaultcloud-banner-actions">
        <button class="vaultcloud-banner-btn vaultcloud-banner-btn-secondary" data-action="dismiss">
          Not Now
        </button>
        <button class="vaultcloud-banner-btn vaultcloud-banner-btn-primary" data-action="save">
          Save Password
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    // Event handlers
    banner.addEventListener('click', async (e) => {
      const target = e.target;
      const action = target.dataset.action;

      if (action === 'close' || action === 'dismiss') {
        banner.remove();
        capturedCredentials = null;
      } else if (action === 'save') {
        await saveCredentialsToBanner(banner);
      }
    });

    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      if (document.getElementById(VAULTCLOUD_BANNER_ID)) {
        banner.remove();
        capturedCredentials = null;
      }
    }, 30000);
  }

  // Save credentials from banner
  async function saveCredentialsToBanner(banner) {
    const titleInput = banner.querySelector('[data-field="title"]');
    const errorDiv = banner.querySelector('#vaultcloud-banner-error');
    const saveBtn = banner.querySelector('[data-action="save"]');

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      // Check if logged in
      const sessionResponse = await chrome.runtime.sendMessage({ action: 'getSession' });
      if (!sessionResponse.success || !sessionResponse.session.token) {
        throw new Error('Please log in to VaultCloud extension first');
      }

      // Get PGP public key for encryption
      let publicKey = null;
      try {
        const pgpResponse = await chrome.runtime.sendMessage({ action: 'getStoredPgpKey' });
        if (pgpResponse.success && pgpResponse.publicKey) {
          publicKey = pgpResponse.publicKey;
        }
      } catch (e) {
        console.log('No PGP key found, storing password as plain text');
      }

      // Encrypt password if PGP key available
      let encryptedPassword = capturedCredentials.password;
      if (publicKey) {
        // Load OpenPGP
        if (typeof openpgp === 'undefined') {
          await loadOpenPGP();
        }
        
        if (typeof openpgp !== 'undefined') {
          try {
            const publicKeyObj = await openpgp.readKey({ armoredKey: publicKey });
            const message = await openpgp.createMessage({ text: capturedCredentials.password });
            encryptedPassword = await openpgp.encrypt({
              message,
              encryptionKeys: publicKeyObj,
            });
          } catch (e) {
            console.error('PGP encryption failed:', e);
          }
        }
      }

      const entry = {
        title: titleInput.value || capturedCredentials.domain,
        username: capturedCredentials.username,
        password_encrypted: encryptedPassword,
        url: capturedCredentials.url,
        notes: '',
        tags: [],
        folder: '',
      };

      const response = await chrome.runtime.sendMessage({
        action: 'createEntry',
        entry: entry,
      });

      if (response.success) {
        saveBtn.textContent = '✓ Saved!';
        saveBtn.style.background = '#10b981';
        setTimeout(() => {
          banner.remove();
          capturedCredentials = null;
        }, 1500);
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      errorDiv.className = 'vaultcloud-banner-error';
      errorDiv.textContent = error.message;
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Password';
    }
  }

  // Load OpenPGP library
  function loadOpenPGP() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('openpgp.min.js');
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize
  function init() {
    // Find and enhance password fields
    const passwordFields = findPasswordFields();
    passwordFields.forEach(addAutofillIcon);

    // Capture form submissions
    captureFormSubmission();

    // Observe DOM changes for dynamically added forms
    formObserver = new MutationObserver((mutations) => {
      const passwordFields = findPasswordFields();
      passwordFields.forEach(addAutofillIcon);
    });

    formObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
