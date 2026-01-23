# Large Files Deployment Guide - Digital Ocean Spaces

For files larger than 20MB (like PDF guides, large Excel files, etc.), use Digital Ocean Spaces instead of storing them in the repository.

> **Note:** If you plan to use the same Space for client portal file uploads/downloads in the future, see `docs/digital-ocean-spaces-structure.md` for recommended folder structure and organization.

## Why Digital Ocean Spaces?

- ✅ **No file size limits** (unlike GitHub's 100MB limit)
- ✅ **CDN delivery** (faster downloads worldwide)
- ✅ **No build size impact** (keeps your repository lean)
- ✅ **Can update files without redeploying** (just upload new version)
- ✅ **Cost-effective** (~$5/month for 250GB storage + 1TB transfer)

## Setup Instructions

### Step 1: Create a Digital Ocean Space

1. **Log in to Digital Ocean:**
   - Go to https://cloud.digitalocean.com
   - Navigate to **Spaces** in the left menu

2. **Create a New Space:**
   - Click **"Create a Spaces Bucket"**
   - **Name:** `rpc-associates-downloads` (or your preferred name)
   - **Region:** Choose closest to your users (e.g., `nyc3` for North America)
   - **Enable CDN:** ✅ Yes (recommended for faster delivery)
   - Click **"Create a Spaces Bucket"**

### Step 2: Configure File Access

1. **Make Files Public:**
   - Go to your Space
   - Click **"Settings"** tab
   - Under **"File Listing"**, set to **"Public"** (if you want direct links)
   - Or use **"Restricted"** with signed URLs (more secure)

2. **Upload Your File:**
   - Click **"Upload"** button
   - Drag and drop or select your file (e.g., `CFI-Financial-Ratios-Guide.pdf`)
   - Wait for upload to complete

3. **Get the File URL:**
   - Click on the uploaded file
   - Copy the **Public URL** (looks like: `https://rpc-associates-downloads.nyc3.digitaloceanspaces.com/CFI-Financial-Ratios-Guide.pdf`)

### Step 3: Update Your Code

Use the external URL in your Resources page:

```typescript
// src/pages/Resources.tsx
const guides: Resource[] = [
  {
    title: 'CFI Financial Ratios Guide',
    description: 'Comprehensive guide to financial ratios and analysis...',
    link: 'https://rpc-associates-downloads.nyc3.digitaloceanspaces.com/CFI-Financial-Ratios-Guide.pdf',
    category: 'Guide',
    isDownload: true,
    fileSize: '46 MB'
  }
]
```

## Alternative: Signed URLs (More Secure)

If you want to restrict access or track downloads:

1. **Keep Space as "Restricted"**
2. **Use Digital Ocean API** to generate signed URLs
3. **Create a backend endpoint** that generates signed URLs on demand

## File Organization in Spaces

Organize files in folders:

```
rpc-associates-downloads/
  guides/
    CFI-Financial-Ratios-Guide.pdf
    tax-planning-guide.pdf
  excel-templates/
    large-template.xlsx
  reports/
    sample-report.pdf
```

URL format: `https://your-space.region.digitaloceanspaces.com/guides/CFI-Financial-Ratios-Guide.pdf`

## Cost Estimate

- **Storage:** $5/month for 250GB
- **Bandwidth:** $0.01/GB (first 1TB free with Spaces)
- **Total:** ~$5-10/month for typical usage

## Best Practices

1. **File Naming:**
   - Use lowercase with hyphens: `cfi-financial-ratios-guide.pdf`
   - Include version/year if applicable: `guide-2025.pdf`

2. **Organization:**
   - Group by category (guides, templates, reports)
   - Use consistent naming conventions

3. **CDN:**
   - Always enable CDN for faster delivery
   - Files are cached globally

4. **Updates:**
   - Upload new version with same name to replace
   - Or use versioned names: `guide-v2.pdf`

## Quick Start Checklist

- [ ] Create Digital Ocean Space
- [ ] Enable CDN
- [ ] Upload large file(s)
- [ ] Copy public URL(s)
- [ ] Update Resources page with external URL(s)
- [ ] Test download link
- [ ] Deploy

## Example: Adding CFI Financial Ratios Guide

1. **Upload to Spaces:**
   - File: `CFI-Financial-Ratios-Guide.pdf`
   - URL: `https://rpc-associates-downloads.nyc3.digitaloceanspaces.com/CFI-Financial-Ratios-Guide.pdf`

2. **Add to Resources:**
   ```typescript
   {
     title: 'CFI Financial Ratios Guide',
     description: 'Comprehensive guide covering key financial ratios, their calculations, and how to interpret them for business analysis and decision-making.',
     link: 'https://rpc-associates-downloads.nyc3.digitaloceanspaces.com/CFI-Financial-Ratios-Guide.pdf',
     category: 'Guide',
     isDownload: true,
     fileSize: '46 MB'
   }
   ```

That's it! The file will be served from Digital Ocean's CDN, not from your repository.
