/**
 * VaultCloud Extension - Popup UI
 */

let state = {
  session: null,
  currentTab: 'credentials',
  currentDomain: null,
  entries: [],
  fidoAvailable: false,
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  await checkFidoSupport();
  render();
});

async function loadState() {
  try {
    // Get current tab domain
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      try {
        state.currentDomain = new URL(tab.url).hostname;
      } catch (e) {
        state.currentDomain = null;
      }
    }

    // Get session
    const response = await chrome.runtime.sendMessage({ action: 'getSession' });
    if (response.success) {
      state.session = response.session;
      
      // Get frontend URL
      const { frontendUrl } = await chrome.storage.local.get('frontendUrl');
      if (frontendUrl) {
        state.session.frontendUrl = frontendUrl;
      }
      
      if (state.session.token) {
        // Load entries
        await loadEntries();
      }
    }
  } catch (error) {
    console.error('Failed to load state:', error);
  }
}

async function loadEntries() {
  try {
    let response;
    if (state.currentDomain) {
      response = await chrome.runtime.sendMessage({
        action: 'getEntriesForDomain',
        domain: state.currentDomain,
      });
    } else {
      response = await chrome.runtime.sendMessage({ action: 'getEntries' });
    }

    if (response.success) {
      state.entries = response.data;
    }
  } catch (error) {
    console.error('Failed to load entries:', error);
  }
}

async function checkFidoSupport() {
  state.fidoAvailable = window.PublicKeyCredential !== undefined;
}

function render() {
  const app = document.getElementById('app');

  if (!state.session || !state.session.apiUrl) {
    app.innerHTML = renderSetup();
  } else if (!state.session.token) {
    // Set default tab to password if not on fido
    if (state.currentTab !== 'password' && state.currentTab !== 'fido') {
      state.currentTab = 'password';
    }
    app.innerHTML = renderLogin();
  } else {
    app.innerHTML = renderMain();
  }

  attachEventListeners();
}

function renderSetup() {
  return `
    <div class="section">
      <div class="section-title">🚀 Welcome to VaultCloud</div>
      <p style="font-size: 13px; color: #6b7280; margin-bottom: 16px;">
        Please enter your VaultCloud URLs to get started.
      </p>
      <div class="form-group">
        <label class="form-label">Backend API URL (Cloudflare Workers)</label>
        <input
          type="url"
          class="form-input"
          id="api-url-input"
          placeholder="https://your-api.workers.dev"
          value="${state.session?.apiUrl || ''}"
        />
      </div>
      <div class="form-group">
        <label class="form-label">Frontend URL (Cloudflare Pages)</label>
        <input
          type="url"
          class="form-input"
          id="frontend-url-input"
          placeholder="https://your-app.pages.dev"
          value="${state.session?.frontendUrl || ''}"
        />
        <p style="font-size: 11px; color: #9ca3af; margin-top: 4px;">
          Required for FIDO/WebAuthn security key authentication
        </p>
      </div>
      <div id="setup-error"></div>
      <button class="btn btn-primary" id="btn-setup-save">
        Save Configuration
      </button>
    </div>
    <div class="section">
      <p style="font-size: 12px; color: #6b7280; text-align: center;">
        Don't have a VaultCloud instance?<br>
        <a href="https://github.com/yourusername/vaultcloud" target="_blank" style="color: #667eea;">
          Learn more
        </a>
      </p>
    </div>
  `;
}

function renderLogin() {
  const tabs = `
    <div class="tabs">
      <button class="tab ${state.currentTab === 'password' ? 'active' : ''}" data-tab="password">
        Password
      </button>
      ${state.fidoAvailable ? `
        <button class="tab ${state.currentTab === 'fido' ? 'active' : ''}" data-tab="fido">
          Security Key
        </button>
      ` : ''}
    </div>
  `;

  const passwordForm = `
    <div class="form-group">
      <label class="form-label">Email</label>
      <input type="email" class="form-input" id="login-email" autocomplete="username" />
    </div>
    <div class="form-group">
      <label class="form-label">Password</label>
      <input type="password" class="form-input" id="login-password" autocomplete="current-password" />
    </div>
    <div id="login-error"></div>
    <button class="btn btn-primary" id="btn-password-login">
      Sign In
    </button>
  `;

  const fidoForm = `
    <div class="form-group">
      <label class="form-label">Email</label>
      <input type="email" class="form-input" id="fido-email" autocomplete="username" />
    </div>
    <p style="font-size: 12px; color: #6b7280; margin-bottom: 16px;">
      Click the button below and follow your browser's prompts to authenticate with your security key.
    </p>
    <div id="fido-error"></div>
    <button class="btn btn-primary" id="btn-fido-login">
      🔑 Use Security Key
    </button>
  `;

  return `
    <div class="section">
      <div class="section-title">Sign In</div>
      ${tabs}
      ${state.currentTab === 'password' ? passwordForm : fidoForm}
      ${state.currentTab === 'password' ? `
        <div class="divider">
          <span>OR</span>
        </div>
        <button class="btn btn-link" id="btn-switch-fido">
          Sign in with security key
        </button>
      ` : ''}
    </div>
    <div class="section">
      <button class="btn btn-secondary" id="btn-change-backend">
        ⚙️ Change Backend URL
      </button>
    </div>
  `;
}

function renderMain() {
  const user = state.session.user;
  
  return `
    <div class="user-info">
      <div class="user-avatar">${user.email.charAt(0).toUpperCase()}</div>
      <div class="user-details">
        <div class="user-email">${escapeHtml(user.email)}</div>
        <div class="user-role">${user.role === 'admin' ? '👑 Admin' : '👤 User'}</div>
      </div>
    </div>

    ${state.currentDomain ? `
      <div class="status">
        <span>🌐</span>
        <span>Showing credentials for <strong>${escapeHtml(state.currentDomain)}</strong></span>
      </div>
    ` : ''}

    <div class="section">
      <div class="section-title">
        Credentials (${state.entries.length})
      </div>
      ${renderCredentialsList()}
    </div>

    <div class="section">
      <button class="btn btn-secondary" id="btn-open-vault" style="margin-bottom: 8px;">
        🔓 Open Full Vault
      </button>
      <button class="btn btn-danger" id="btn-logout">
        🚪 Sign Out
      </button>
    </div>
  `;
}

function renderCredentialsList() {
  if (state.entries.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🔒</div>
        <div class="empty-state-text">
          ${state.currentDomain 
            ? `No credentials saved for ${state.currentDomain}`
            : 'No credentials found'}
        </div>
      </div>
    `;
  }

  return `
    <div class="credentials-list">
      ${state.entries.map(entry => `
        <div class="credential-item" data-entry-id="${entry.id}">
          <div class="credential-title">${escapeHtml(entry.title || 'Untitled')}</div>
          <div class="credential-username">${escapeHtml(entry.username || 'No username')}</div>
          ${entry.url ? `<div class="credential-url">${escapeHtml(entry.url)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    <p style="font-size: 11px; color: #9ca3af; margin-top: 12px; text-align: center;">
      Click an entry to copy password to clipboard
    </p>
  `;
}

function attachEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      state.currentTab = e.target.dataset.tab;
      render();
    });
  });

  // Setup save button
  const setupSaveBtn = document.getElementById('btn-setup-save');
  if (setupSaveBtn) {
    setupSaveBtn.addEventListener('click', handleSetupSave);
  }

  // Login buttons
  const passwordLoginBtn = document.getElementById('btn-password-login');
  if (passwordLoginBtn) {
    passwordLoginBtn.addEventListener('click', handlePasswordLogin);
  }

  const fidoLoginBtn = document.getElementById('btn-fido-login');
  if (fidoLoginBtn) {
    fidoLoginBtn.addEventListener('click', handleFidoLogin);
  }

  const switchFidoBtn = document.getElementById('btn-switch-fido');
  if (switchFidoBtn) {
    switchFidoBtn.addEventListener('click', () => {
      state.currentTab = 'fido';
      render();
    });
  }

  const changeBackendBtn = document.getElementById('btn-change-backend');
  if (changeBackendBtn) {
    changeBackendBtn.addEventListener('click', handleChangeBackend);
  }

  // Main view buttons
  const openVaultBtn = document.getElementById('btn-open-vault');
  if (openVaultBtn) {
    openVaultBtn.addEventListener('click', handleOpenVault);
  }

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Credential items
  document.querySelectorAll('.credential-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const entryId = e.currentTarget.dataset.entryId;
      handleCopyPassword(entryId);
    });
  });

  // Enter key handlers
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const fidoEmailInput = document.getElementById('fido-email');

  if (emailInput && passwordInput) {
    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        handlePasswordLogin(e);
      }
    };
    emailInput.addEventListener('keypress', handleEnter);
    passwordInput.addEventListener('keypress', handleEnter);
  }

  if (fidoEmailInput) {
    fidoEmailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleFidoLogin(e);
      }
    });
  }

  const apiUrlInput = document.getElementById('api-url-input');
  if (apiUrlInput) {
    apiUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSetupSave(e);
      }
    });
  }

  const frontendUrlInput = document.getElementById('frontend-url-input');
  if (frontendUrlInput) {
    frontendUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSetupSave(e);
      }
    });
  }
}

// Event handlers
async function handleSetupSave(event) {
  const apiInput = document.getElementById('api-url-input');
  const frontendInput = document.getElementById('frontend-url-input');
  const errorDiv = document.getElementById('setup-error');
  const btn = event ? event.target : document.getElementById('btn-setup-save');
  const apiUrl = apiInput.value.trim();
  const frontendUrl = frontendInput.value.trim();

  if (!apiUrl) {
    showError(errorDiv, 'Please enter Backend API URL');
    return;
  }

  if (!frontendUrl) {
    showError(errorDiv, 'Please enter Frontend URL');
    return;
  }

  try {
    // Validate URLs
    new URL(apiUrl);
    new URL(frontendUrl);

    // Save to storage
    await chrome.runtime.sendMessage({
      action: 'setApiUrl',
      url: apiUrl,
    });
    
    await chrome.storage.local.set({ frontendUrl });

    state.session = { apiUrl, frontendUrl };
    render();
  } catch (error) {
    showError(errorDiv, 'Invalid URL format');
  }
}

async function handlePasswordLogin(event) {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  const btn = event ? event.target : document.getElementById('btn-password-login');

  if (!email || !password) {
    showError(errorDiv, 'Please enter email and password');
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Signing in...';
    }

    const response = await chrome.runtime.sendMessage({
      action: 'login',
      email,
      password,
    });

    if (response.success) {
      await loadState();
      render();
    } else {
      throw new Error(response.error || 'Login failed');
    }
  } catch (error) {
    showError(errorDiv, error.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  }
}

async function handleFidoLogin(event) {
  const email = document.getElementById('fido-email').value.trim();
  const errorDiv = document.getElementById('fido-error');
  const btn = event ? event.target : document.getElementById('btn-fido-login');

  if (!email) {
    showError(errorDiv, 'Please enter your email');
    return;
  }

  // WebAuthn security restriction: credentials registered on the actual domain
  // cannot be used from chrome-extension:// origin. Open the frontend instead.
  const frontendUrl = state.session.frontendUrl;
  
  if (!frontendUrl) {
    showError(errorDiv, 'Frontend URL not configured. Please update settings.');
    if (btn) {
      btn.disabled = false;
    }
    return;
  }
  
  // Open frontend for FIDO authentication with email pre-filled
  const loginUrl = `${frontendUrl}?fido_login=1&email=${encodeURIComponent(email)}`;
  await chrome.tabs.create({ url: loginUrl });
  
  // Show instructions
  showError(errorDiv, 'Complete FIDO login in the opened tab. The extension will automatically detect your login.');
  
  // Poll for session
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Waiting for login...';
  }
  
  let attempts = 0;
  const maxAttempts = 60; // 60 seconds
  
  const pollInterval = setInterval(async () => {
    attempts++;
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'apiRequest',
        method: 'GET',
        endpoint: '/api/users/me',
      });
      
      if (response.success) {
        // Login successful!
        clearInterval(pollInterval);
        await loadState();
        render();
      }
    } catch (error) {
      // Not logged in yet, continue polling
    }
    
    if (attempts >= maxAttempts) {
      clearInterval(pollInterval);
      showError(errorDiv, 'Login timeout. Please try again.');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🔑 Use Security Key';
      }
    }
  }, 1000);
}

async function handleLogout() {
  try {
    await chrome.runtime.sendMessage({ action: 'logout' });
    state.session = { apiUrl: state.session.apiUrl };
    state.entries = [];
    render();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function handleChangeBackend() {
  // Reset session but keep URLs for easy editing
  const apiUrl = state.session?.apiUrl || '';
  const frontendUrl = state.session?.frontendUrl || '';
  state.session = { apiUrl, frontendUrl };
  render();
}

function handleOpenVault() {
  if (state.session?.apiUrl) {
    // Extract base URL (remove /api suffix if present)
    let baseUrl = state.session.apiUrl;
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4);
    }
    chrome.tabs.create({ url: baseUrl });
  }
}

async function handleCopyPassword(entryId) {
  try {
    const entry = state.entries.find(e => e.id === entryId);
    if (!entry) return;

    let password = entry.password_encrypted;

    // Check if PGP encrypted
    if (password.includes('-----BEGIN PGP MESSAGE-----')) {
      // Show message that password is encrypted
      alert('This password is PGP encrypted. Please open the full vault to decrypt and copy.');
      handleOpenVault();
      return;
    }

    // Copy to clipboard
    await navigator.clipboard.writeText(password);

    // Show feedback
    const item = event.currentTarget;
    const originalBorder = item.style.borderColor;
    item.style.borderColor = '#10b981';
    item.style.background = '#f0fdf4';

    // Show tooltip
    const tooltip = document.createElement('div');
    tooltip.textContent = '✓ Copied to clipboard!';
    tooltip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #111827;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 999999;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    `;
    document.body.appendChild(tooltip);

    setTimeout(() => {
      item.style.borderColor = originalBorder;
      item.style.background = '';
      tooltip.remove();
    }, 1500);

  } catch (error) {
    console.error('Copy error:', error);
    alert('Failed to copy password');
  }
}

function showError(element, message) {
  element.className = 'error-message';
  element.textContent = message;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
