/**
 * VaultCloud Extension - Background Service Worker
 * Handles API communication, session management, and cross-context messaging
 */

const STORAGE_KEYS = {
  API_URL: 'vaultcloud_api_url',
  TOKEN: 'vaultcloud_token',
  USER: 'vaultcloud_user',
  SESSION: 'vaultcloud_session',
  PGP_PUBLIC_KEY: 'vaultcloud_pgp_public',
  ENTRIES_CACHE: 'vaultcloud_entries_cache',
  CACHE_TIMESTAMP: 'vaultcloud_cache_timestamp',
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class VaultCloudAPI {
  constructor() {
    this.apiUrl = null;
    this.token = null;
    this.init();
  }

  async init() {
    const data = await chrome.storage.local.get([
      STORAGE_KEYS.API_URL,
      STORAGE_KEYS.TOKEN
    ]);
    this.apiUrl = data[STORAGE_KEYS.API_URL];
    this.token = data[STORAGE_KEYS.TOKEN];
  }

  async setApiUrl(url) {
    this.apiUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    await chrome.storage.local.set({ [STORAGE_KEYS.API_URL]: this.apiUrl });
  }

  async setToken(token) {
    this.token = token;
    if (token) {
      await chrome.storage.local.set({ [STORAGE_KEYS.TOKEN]: token });
    } else {
      await chrome.storage.local.remove(STORAGE_KEYS.TOKEN);
    }
  }

  async request(endpoint, options = {}) {
    if (!this.apiUrl) {
      throw new Error('API URL not configured');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.apiUrl}/api${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'An error occurred');
    }

    return data.data;
  }

  // Auth endpoints
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await this.setToken(response.token);
    await chrome.storage.local.set({ [STORAGE_KEYS.USER]: response.user });
    return response;
  }

  async loginWithFido(challengeId, credential) {
    const response = await this.request('/fido/authenticate/credential', {
      method: 'POST',
      body: JSON.stringify({ challengeId, credential }),
    });
    await this.setToken(response.token);
    await chrome.storage.local.set({ [STORAGE_KEYS.USER]: response.user });
    return response;
  }

  async getFidoChallenge(email) {
    return await this.request('/fido/authenticate/challenge', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    await this.setToken(null);
    await chrome.storage.local.remove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.SESSION,
      STORAGE_KEYS.ENTRIES_CACHE,
      STORAGE_KEYS.CACHE_TIMESTAMP,
    ]);
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  // Vault entries
  async getEntries() {
    return await this.request('/entries');
  }

  async getEntry(id) {
    return await this.request(`/entries/${id}`);
  }

  async createEntry(entry) {
    const result = await this.request('/entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
    await this.invalidateCache();
    return result;
  }

  async updateEntry(id, entry) {
    const result = await this.request(`/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    });
    await this.invalidateCache();
    return result;
  }

  async deleteEntry(id) {
    const result = await this.request(`/entries/${id}`, {
      method: 'DELETE',
    });
    await this.invalidateCache();
    return result;
  }

  // PGP
  async getPgpPublicKey() {
    return await this.request('/pgp/public-key');
  }

  // Cache management
  async getCachedEntries() {
    const data = await chrome.storage.local.get([
      STORAGE_KEYS.ENTRIES_CACHE,
      STORAGE_KEYS.CACHE_TIMESTAMP,
    ]);

    const timestamp = data[STORAGE_KEYS.CACHE_TIMESTAMP];
    const entries = data[STORAGE_KEYS.ENTRIES_CACHE];

    if (!timestamp || !entries || Date.now() - timestamp > CACHE_DURATION) {
      return null;
    }

    return entries;
  }

  async setCachedEntries(entries) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.ENTRIES_CACHE]: entries,
      [STORAGE_KEYS.CACHE_TIMESTAMP]: Date.now(),
    });
  }

  async invalidateCache() {
    await chrome.storage.local.remove([
      STORAGE_KEYS.ENTRIES_CACHE,
      STORAGE_KEYS.CACHE_TIMESTAMP,
    ]);
  }
}

const api = new VaultCloudAPI();

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'setApiUrl':
          await api.setApiUrl(request.url);
          sendResponse({ success: true });
          break;

        case 'getApiUrl':
          const data = await chrome.storage.local.get(STORAGE_KEYS.API_URL);
          sendResponse({ success: true, url: data[STORAGE_KEYS.API_URL] });
          break;

        case 'login':
          const loginResult = await api.login(request.email, request.password);
          sendResponse({ success: true, data: loginResult });
          break;

        case 'getFidoChallenge':
          const challenge = await api.getFidoChallenge(request.email);
          sendResponse({ success: true, data: challenge });
          break;

        case 'loginWithFido':
          const fidoResult = await api.loginWithFido(request.challengeId, request.credential);
          sendResponse({ success: true, data: fidoResult });
          break;

        case 'logout':
          await api.logout();
          sendResponse({ success: true });
          break;

        case 'getSession':
          const session = await chrome.storage.local.get([
            STORAGE_KEYS.TOKEN,
            STORAGE_KEYS.USER,
            STORAGE_KEYS.API_URL,
          ]);
          sendResponse({
            success: true,
            session: {
              token: session[STORAGE_KEYS.TOKEN],
              user: session[STORAGE_KEYS.USER],
              apiUrl: session[STORAGE_KEYS.API_URL],
            },
          });
          break;

        case 'getEntries':
          let entries = await api.getCachedEntries();
          if (!entries) {
            entries = await api.getEntries();
            await api.setCachedEntries(entries);
          }
          sendResponse({ success: true, data: entries });
          break;

        case 'getEntriesForDomain':
          let allEntries = await api.getCachedEntries();
          if (!allEntries) {
            allEntries = await api.getEntries();
            await api.setCachedEntries(allEntries);
          }
          const domain = request.domain;
          const filtered = allEntries.filter(entry => {
            if (!entry.url) return false;
            try {
              const entryUrl = new URL(entry.url.startsWith('http') ? entry.url : `https://${entry.url}`);
              return entryUrl.hostname.includes(domain) || domain.includes(entryUrl.hostname);
            } catch {
              return entry.url.includes(domain);
            }
          });
          sendResponse({ success: true, data: filtered });
          break;

        case 'createEntry':
          const newEntry = await api.createEntry(request.entry);
          sendResponse({ success: true, data: newEntry });
          break;

        case 'getPgpPublicKey':
          const pgpData = await api.getPgpPublicKey();
          if (pgpData.publicKey) {
            await chrome.storage.local.set({
              [STORAGE_KEYS.PGP_PUBLIC_KEY]: pgpData.publicKey,
            });
          }
          sendResponse({ success: true, data: pgpData });
          break;

        case 'getStoredPgpKey':
          const stored = await chrome.storage.local.get(STORAGE_KEYS.PGP_PUBLIC_KEY);
          sendResponse({ success: true, publicKey: stored[STORAGE_KEYS.PGP_PUBLIC_KEY] });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  return true; // Keep message channel open for async response
});

// Listen for navigation events to inject content script
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        files: ['content.js'],
      });
    } catch (e) {
      // Ignore errors for restricted pages
    }
  }
});

console.log('VaultCloud extension background service worker initialized');
