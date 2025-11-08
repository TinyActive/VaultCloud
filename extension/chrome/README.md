# VaultCloud Chrome Extension

> ⚠️ WARNING: This extension is not yet fully functional and is currently under development

A secure browser extension for VaultCloud password manager with autofill and auto-save capabilities.


## Features

- 🔐 **Secure Password Storage**: Store and manage passwords securely
- 🔑 **Auto-Fill**: Automatically fill login forms on websites
- 💾 **Auto-Save**: Detect successful logins and offer to save credentials
- 🔒 **PGP Encryption**: Support for PGP-encrypted passwords
- 🛡️ **FIDO2/WebAuthn**: Passwordless authentication with security keys
- 🌐 **Multi-Instance**: Connect to your own VaultCloud backend

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `extension/chrome` folder from this project

### First-Time Setup

1. Click the VaultCloud extension icon in your browser
2. Enter your VaultCloud backend URL (e.g., `https://your-vaultcloud.workers.dev`)
3. Click "Save Configuration"
4. Sign in with your email and password or security key

## Usage

### Auto-Fill Passwords

1. Navigate to a website with a login form
2. Click the 🔑 icon that appears next to password fields
3. Select the credential you want to use
4. The form will be filled automatically

### Auto-Save New Credentials

1. Fill out a login form on any website
2. Submit the form
3. After successful login, a banner will appear asking if you want to save the credentials
4. Optionally edit the title
5. Click "Save Password" to store in VaultCloud

### Security Key Authentication (FIDO2)

If your VaultCloud account has FIDO2 enabled:

1. Click the extension icon
2. Switch to the "Security Key" tab
3. Enter your email
4. Click "Use Security Key"
5. Follow your browser's prompts to authenticate

### PGP Encryption

If your VaultCloud account uses PGP encryption:

- Newly saved passwords will be automatically encrypted with your public key
- To decrypt and view passwords, use the full VaultCloud web interface
- The extension will indicate when a password is encrypted

## Privacy & Security

- **No Third-Party Services**: All data is stored on your VaultCloud backend
- **Local Storage**: Only session tokens are stored locally
- **Encrypted Passwords**: Supports PGP encryption for sensitive data
- **Minimal Permissions**: Only requests necessary browser permissions
- **Open Source**: Full source code available for audit

## Permissions Explained

- `storage`: Store backend URL and session token
- `activeTab`: Access current tab to detect and fill login forms
- `tabs`: Get current website URL for credential matching
- `scripting`: Inject content scripts for auto-fill functionality
- `webNavigation`: Detect page loads for form detection
- `<all_urls>`: Allow extension to work on all websites

## Configuration

### Backend URL

The extension needs your VaultCloud backend URL to connect. This should be the base URL of your Cloudflare Workers deployment (e.g., `https://your-vaultcloud.workers.dev`).

To change the backend URL:
1. Open the extension popup
2. Click "Sign Out" (if logged in)
3. Click "Change Backend URL"
4. Enter the new URL

## Troubleshooting

### Auto-fill not working

- Make sure you're logged in to the extension
- Check that the website URL matches saved credentials
- Some websites use non-standard login forms that may not be detected

### Auto-save not showing

- Ensure you're submitting the form (not using Enter on password field)
- The banner appears 1 second after form submission
- Check that you're logged in to the extension

### Can't decrypt passwords

- PGP-encrypted passwords can only be decrypted in the full web interface
- You'll need your private key and passphrase
- The extension will show "ENCRYPTED" for PGP-protected passwords

### FIDO2 not available

- Make sure your browser supports WebAuthn
- Check that you've registered a security key in VaultCloud
- Ensure your website is served over HTTPS

## Development

### Project Structure

```
extension/chrome/
├── manifest.json          # Extension manifest
├── background.js          # Service worker (API communication)
├── content.js            # Content script (form detection, auto-fill)
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── openpgp.min.js        # OpenPGP library (for encryption)
└── icons/                # Extension icons
```

### Building

No build step required - this is a vanilla JavaScript extension.

### Testing

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the reload icon on the VaultCloud extension
4. Test your changes

## License

See the LICENSE file in the project root.

## Support

For issues, questions, or contributions, please visit the main VaultCloud repository.
