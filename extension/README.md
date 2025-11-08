# VaultCloud Browser Extensions

Secure browser extensions for VaultCloud password manager with autofill and auto-save capabilities.

## Available Extensions

### Chrome Extension
Located in `chrome/` directory.

**Features:**
- 🔐 Secure password storage and management
- 🔑 Auto-fill login forms on websites
- 💾 Auto-save credentials after successful logins
- 🔒 PGP encryption support
- 🛡️ FIDO2/WebAuthn passwordless authentication
- 🌐 Connect to your own VaultCloud backend

## Quick Start

### Installation

#### Automated Setup (Recommended)

**Windows (PowerShell):**
```powershell
cd extension
.\setup-extension.ps1
```

**Linux/macOS (Bash):**
```bash
cd extension
chmod +x setup-extension.sh
./setup-extension.sh
```

This will:
1. Download the OpenPGP.js library
2. Create placeholder icons
3. Prepare the extension for installation

#### Manual Setup

1. Download OpenPGP.js from https://unpkg.com/openpgp@5.11.0/dist/openpgp.min.js
2. Save it as `chrome/openpgp.min.js`
3. Create icons in `chrome/icons/` directory (16x16, 48x48, 128x128)

### Load Extension in Chrome

1. Open Chrome/Edge/Brave
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `extension/chrome` folder
6. The VaultCloud icon should appear in your browser toolbar

### First-Time Configuration

1. Click the VaultCloud extension icon
2. Enter your VaultCloud backend URL
   - Example: `https://your-vaultcloud.workers.dev`
   - Or: `http://localhost:8787` for local development
3. Click "Save Configuration"
4. Sign in with your credentials

## Usage Guide

### Auto-Fill Passwords

1. Visit a website with a login form
2. Click the 🔑 icon that appears next to password fields
3. Select a saved credential from the menu
4. The form will be filled automatically

### Auto-Save New Credentials

When you successfully log in to a website:

1. A banner will appear in the top-right corner
2. Review the captured username and website
3. Optionally add a custom title
4. Click "Save Password"

The extension will:
- Detect the login form submission
- Capture username and password
- Encrypt with PGP if configured
- Save to your VaultCloud

### View and Manage Passwords

1. Click the extension icon
2. View credentials for the current website
3. Click any credential to copy password to clipboard
4. Click "Open Full Vault" for advanced management

### Security Key (FIDO2) Login

If you have FIDO2 enabled:

1. Click the extension icon
2. Switch to "Security Key" tab
3. Enter your email
4. Click "Use Security Key"
5. Follow your browser's prompts

## Security Features

### PGP Encryption

If your VaultCloud account has PGP encryption enabled:

- **Saving passwords**: Automatically encrypted with your public key
- **Viewing passwords**: Click "Open Full Vault" to decrypt
- **Extension limitation**: Cannot decrypt in extension (by design)

This ensures your private key and passphrase never leave the main application.

### FIDO2/WebAuthn

Passwordless authentication using hardware security keys:

- YubiKey, Titan Security Key, etc.
- Built-in platform authenticators (Windows Hello, Touch ID, etc.)
- Phishing-resistant authentication
- Works across devices

### Data Storage

- **Session tokens**: Stored in browser's local storage
- **Cached entries**: Temporary (5-minute cache)
- **No passwords**: Never stored in plain text locally
- **Backend communication**: All API calls use HTTPS

## Troubleshooting

### Extension Not Appearing

- Check that Developer mode is enabled
- Reload the extension from `chrome://extensions/`
- Check browser console for errors

### Auto-Fill Not Working

- Ensure you're logged in to the extension
- Verify website URL matches saved credentials
- Some sites use non-standard forms (may not be detected)
- Check that the password field is visible

### Auto-Save Banner Not Showing

- Must be logged in to the extension
- Form must be submitted successfully
- Banner appears 1 second after submission
- Only one banner can appear at a time

### Cannot Decrypt Passwords

- PGP-encrypted passwords require the full vault
- Click "Open Full Vault" to access decryption
- You'll need your private key passphrase

### FIDO2 Not Available

- Browser must support WebAuthn
- Website must be served over HTTPS
- You must have a security key registered

## Browser Compatibility

### Fully Supported
- ✅ Google Chrome 88+
- ✅ Microsoft Edge 88+
- ✅ Brave 1.19+

### Limited Support
- ⚠️ Opera (may require manifest tweaks)
- ⚠️ Vivaldi (may require manifest tweaks)

### Not Supported
- ❌ Firefox (requires Manifest V2 - use Firefox extension when available)
- ❌ Safari (requires different format - use Safari extension when available)

## Development

### Project Structure

```
chrome/
├── manifest.json       # Extension manifest (Manifest V3)
├── background.js       # Service worker for API communication
├── content.js          # Content script for form detection
├── popup.html          # Extension popup interface
├── popup.js            # Popup logic and state management
├── openpgp.min.js     # OpenPGP.js library (downloaded)
└── icons/             # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Testing Changes

1. Make changes to source files
2. Go to `chrome://extensions/`
3. Click reload icon on VaultCloud extension
4. Test functionality

### Debugging

- **Background script**: Right-click extension → "Inspect service worker"
- **Popup**: Right-click popup → "Inspect"
- **Content script**: Use DevTools console on any webpage
- **Logs**: Check browser console for error messages

## Permissions Explained

The extension requests the following permissions:

| Permission | Purpose |
|------------|---------|
| `storage` | Store backend URL and session token |
| `activeTab` | Access current tab for form detection |
| `tabs` | Get website URL for credential matching |
| `scripting` | Inject content scripts for auto-fill |
| `webNavigation` | Detect page loads |
| `<all_urls>` | Work on all websites (for auto-fill) |

## Privacy Policy

- **No telemetry**: Extension does not collect usage data
- **No third parties**: All data goes to your VaultCloud backend only
- **No analytics**: No tracking or analytics services
- **Open source**: Full source code available for audit

## Future Plans

- [ ] Firefox extension (Manifest V2)
- [ ] Safari extension
- [ ] Password generator in popup
- [ ] Biometric unlock
- [ ] Multiple vault support
- [ ] Import from other password managers
- [ ] Secure password sharing

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:

1. Check this documentation
2. Review the main VaultCloud README
3. Open an issue on GitHub
4. Contact the maintainers

## License

See LICENSE file in the project root.
