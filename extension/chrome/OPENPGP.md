# OpenPGP Library for VaultCloud Extension

This directory needs the OpenPGP.js library for encrypting passwords.

## Installation

Download the latest OpenPGP.js from:
https://github.com/openpgpjs/openpgpjs/releases

Or use CDN version (recommended for production):

```bash
# Download the minified version
curl -o openpgp.min.js https://unpkg.com/openpgp@5.11.0/dist/openpgp.min.js
```

## Manual Download

1. Go to https://unpkg.com/openpgp@5.11.0/dist/openpgp.min.js
2. Save the file as `openpgp.min.js` in this directory
3. The extension will load it automatically

## Note

The `openpgp.min.js` file should be placed in the `extension/chrome/` directory (same level as manifest.json) for the extension to work properly.

## File Size

The OpenPGP.js library is approximately 300-500KB minified. This is necessary for:
- RSA encryption/decryption
- Key management
- Secure password storage

## Security

OpenPGP.js is a well-established, audited library for implementing OpenPGP in JavaScript. It's used by many security-focused applications including:
- ProtonMail
- Mailvelope
- FlowCrypt
