# VaultCloud Extension Icons

## ⚡ Quick Start (EASIEST METHOD)

1. **Open** `generate-icons.html` in your browser (double-click the file)
2. **Click** the download buttons for each icon
3. **Save** all 3 files to this folder with exact names:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

That's it! The extension will now load properly.

---

## Required Icons

- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Alternative Methods

### Method 1: Use the HTML Generator (Recommended)
- Open `generate-icons.html` in any browser
- Icons are generated automatically
- Click download buttons to save

### Method 2: Convert SVG
- Use `icon.svg` in this folder
- Convert at: https://svgtopng.com/
- Create 3 sizes: 16x16, 48x48, 128x128

### Method 3: Use Any Image Editor
- Create 3 PNG files with purple background (#4f46e5)
- Add white text "V" or "VC"
- Sizes: 16x16, 48x48, 128x128

### Method 4: Use ImageMagick (if installed)
```bash
convert -size 128x128 xc:#4f46e5 -gravity center -pointsize 80 -fill white -annotate +0+0 "VC" icon128.png
convert -size 48x48 xc:#4f46e5 -gravity center -pointsize 30 -fill white -annotate +0+0 "VC" icon48.png
convert -size 16x16 xc:#4f46e5 -gravity center -pointsize 10 -fill white -annotate +0+0 "V" icon16.png
```

## Troubleshooting

**Error: "Could not load icon 'icons/icon16.png'"**
- Make sure all 3 icon files exist in this folder
- Check the filenames are exactly: `icon16.png`, `icon48.png`, `icon128.png`
- Files must be PNG format
- Files must be in the `extension/chrome/icons/` folder

## Design Recommendations

- Use consistent color scheme (purple/indigo #4f46e5)
- Include lock or key symbol for security
- Ensure good contrast for visibility
- Keep simple and recognizable at small sizes
