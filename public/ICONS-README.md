# WekangTrading Icon Assets

## Required Icon Files

Based on the Wekang Trading logo (motorcycle with money, speed theme), you need to generate these icon files:

### Favicon Files (Required)
- ✅ `favicon.svg` - Already exists, update with logo
- 🔴 `favicon.ico` - 16x16, 32x32, 48x48 multi-size
- 🔴 `favicon-16x16.png` - 16x16 PNG
- 🔴 `favicon-32x32.png` - 32x32 PNG

### Apple Touch Icon (Required for iOS)
- 🔴 `apple-touch-icon.png` - 180x180 PNG

### Android Chrome Icons (Required for PWA)
- 🔴 `android-chrome-192x192.png` - 192x192 PNG
- 🔴 `android-chrome-512x512.png` - 512x512 PNG

### Open Graph Image (Required for social sharing)
- 🔴 `og-image.png` - 1200x630 PNG

## Branding Colors (From Logo)

### Primary Colors
- **Red**: `#dc2626` (Red 600) - Primary brand color
- **Orange**: `#f97316` (Orange 500) - Energy, speed
- **Yellow**: `#fbbf24` (Amber 400) - Money, gold
- **Black**: `#000000` - Background, text
- **White**: `#ffffff` - Text on dark

### Theme Usage
- **Primary Action**: Red (#dc2626)
- **Highlights**: Orange (#f97316)
- **Success/Money**: Yellow/Gold (#fbbf24)
- **Background**: Black (#000000)
- **Text**: White on dark, Black on light

## Icon Design Guidelines

1. **Main Element**: Motorcycle rider (speed, movement)
2. **Secondary Element**: Money/cash flying (profits, success)
3. **Style**: Dynamic, energetic, fast-paced
4. **Colors**: Red, orange, yellow gradient with black background
5. **Typography**: Bold "wekang" in white/silver, "TRADING" in yellow/gold

## How to Generate Icons

### Option 1: Using Online Tools
1. Go to https://realfavicongenerator.net/
2. Upload the Wekang Trading logo
3. Configure:
   - iOS: 180x180 apple-touch-icon
   - Android: 192x192 and 512x512
   - Favicon: 32x32, 16x16, and .ico
4. Download and extract to `/public` folder

### Option 2: Using ImageMagick (Command Line)
```bash
# From high-res logo (e.g., 1024x1024)
convert logo.png -resize 16x16 favicon-16x16.png
convert logo.png -resize 32x32 favicon-32x32.png
convert logo.png -resize 180x180 apple-touch-icon.png
convert logo.png -resize 192x192 android-chrome-192x192.png
convert logo.png -resize 512x512 android-chrome-512x512.png
convert logo.png -resize 1200x630 og-image.png

# Create .ico with multiple sizes
convert logo.png -resize 16x16 -resize 32x32 -resize 48x48 favicon.ico
```

### Option 3: Using Design Software
- **Figma/Photoshop/Illustrator**:
  1. Open logo in vector format
  2. Export at each required size
  3. Use PNG-24 with transparency for app icons
  4. Use transparent background for favicon

## Current Status

- ✅ `site.webmanifest` - Created with Wekang branding
- ✅ `app/layout.tsx` - Updated with new theme colors and metadata
- ✅ Theme colors configured (Red #dc2626)
- 🔴 Icon files need to be generated from logo

## Next Steps

1. Generate all icon files from the Wekang Trading logo
2. Place files in `/public` directory
3. Test on different devices:
   - iOS Safari (apple-touch-icon)
   - Android Chrome (PWA icons)
   - Desktop browsers (favicons)
4. Verify theme colors match branding

---

**Brand Identity**: Fast 🏍️ Money 💰 Speed ⚡ Success 🎯
