# VaultCloud Chrome Extension - Setup Instructions

## Quick Setup (Manual)

### Step 1: Download OpenPGP.js

1. Open your browser and go to: https://unpkg.com/openpgp@5.11.0/dist/openpgp.min.js
2. Save the file as `openpgp.min.js` in the `extension/chrome/` folder
3. The file should be at: `extension/chrome/openpgp.min.js`

### Step 2: Create Icons

You need to create 3 icon files in `extension/chrome/icons/`:

**Option A: Use the provided SVG**
- Convert `extension/chrome/icons/icon.svg` to PNG using an online tool:
  - https://cloudconvert.com/svg-to-png
  - https://svgtopng.com/
- Create 3 sizes: 16x16, 48x48, and 128x128 pixels
- Save as: `icon16.png`, `icon48.png`, `icon128.png`

**Option B: Create simple colored squares**
- Use any image editor (Paint, GIMP, Photoshop, etc.)
- Create 3 images with purple background (#4f46e5)
- Add white text "V" or "VC" in the center
- Sizes: 16x16, 48x48, and 128x128 pixels
- Save as PNG in `extension/chrome/icons/`

**Option C: Use placeholder (temporary)**
- You can use any 16x16, 48x48, and 128x128 PNG images as placeholders
- Just name them correctly and place in `extension/chrome/icons/`

### Step 3: Install Extension

1. Open Chrome and go to: `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the folder: `F:\Git\VaultCloud\extension\chrome`
5. The VaultCloud extension should appear in your extensions list

### Step 4: Configure Extension

1. Click the VaultCloud icon in your browser toolbar
2. Enter your backend URL:
   - For local development: `http://localhost:8787`
   - For production: `https://your-vaultcloud.workers.dev`
3. Click "Save Configuration"
4. Sign in with your email and password

## That's It!

Your extension is now ready to use. You can:
- Click the 🔑 icon on password fields to autofill
- Submit login forms to get save prompts
- Click the extension icon to view saved credentials

## Troubleshooting

### "Manifest file is missing or unreadable"
- Make sure you selected the `extension/chrome` folder, not the `extension` folder
- Check that `manifest.json` exists in the folder

### Extension icon is blank
- The icons are optional for development
- Extension will still work without custom icons
- Create icons later when needed

### "openpgp is not defined" error
- Download `openpgp.min.js` as described in Step 1
- Make sure it's in the correct location: `extension/chrome/openpgp.min.js`

### Can't connect to backend
- Check the backend URL is correct
- Make sure your VaultCloud backend is running
- For local: Run `npm run dev` in the project root
- Check browser console for detailed error messages

## Files Checklist

Before loading the extension, verify these files exist:

```
extension/chrome/
├── ✅ manifest.json
├── ✅ background.js
├── ✅ content.js
├── ✅ popup.html
├── ✅ popup.js
├── ⬜ openpgp.min.js (download this)
└── icons/
    ├── ⬜ icon16.png (create this)
    ├── ⬜ icon48.png (create this)
    └── ⬜ icon128.png (create this)
```

✅ = Already created
⬜ = Need to add manually

## Quick Links

- Download OpenPGP.js: https://unpkg.com/openpgp@5.11.0/dist/openpgp.min.js
- SVG to PNG converter: https://cloudconvert.com/svg-to-png
- Chrome Extensions page: chrome://extensions/
