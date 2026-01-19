# Favicon Setup Guide

## Current Setup

The website uses the RPC Associates logo as the favicon. The favicon is configured in `index.html` with multiple formats for better browser and Google compatibility.

## Favicon Files Needed

To ensure Google displays your logo correctly, you need to create the following favicon files in the `public/` directory:

1. **favicon.svg** - Already exists (SVG format, scalable)
2. **favicon-32x32.png** - 32x32 pixel PNG (standard favicon size)
3. **favicon-16x16.png** - 16x16 pixel PNG (small favicon)
4. **apple-touch-icon.png** - 180x180 pixel PNG (for iOS devices)
5. **favicon-192x192.png** - 192x192 pixel PNG (for Android)
6. **favicon-512x512.png** - 512x512 pixel PNG (for Android)

## How to Create Favicon Files

### Option 1: Using Your Logo File

If you have your RPC Associates logo as a PNG or other image format:

1. Use an online favicon generator like:
   - https://realfavicongenerator.net/
   - https://favicon.io/
   - https://www.favicon-generator.org/

2. Upload your logo file
3. Generate all required sizes
4. Download and place all files in the `public/` directory

### Option 2: Convert Current SVG

If you want to use the current SVG logo:

1. Open `public/favicon.svg` or `src/assets/rpc-logo.svg`
2. Use a tool like:
   - https://cloudconvert.com/svg-to-png
   - Adobe Illustrator
   - Inkscape (free)

3. Export at the following sizes:
   - 16x16px → `favicon-16x16.png`
   - 32x32px → `favicon-32x32.png`
   - 180x180px → `apple-touch-icon.png`
   - 192x192px → `favicon-192x192.png`
   - 512x512px → `favicon-512x512.png`

## After Adding Files

1. Rebuild the site: `npm run build`
2. Deploy to production
3. Clear Google's cache:
   - Use Google Search Console: https://search.google.com/search-console
   - Request indexing for your homepage
   - Or use: https://www.google.com/webmasters/tools/removals

## Testing

After deployment, test your favicon:
- Visit: https://realfavicongenerator.net/favicon_checker?site=https://rpcassociates.co
- Check in browser: View page source and look for favicon links
- Check in Google: Search for your site and see if the favicon appears

## Notes

- Google may take a few days to update the favicon in search results
- The favicon should be square and work well at small sizes
- Use your actual company logo, not just "RPC" text if possible
- Ensure the logo is recognizable at 16x16 pixels
