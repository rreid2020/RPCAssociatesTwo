# Excel Downloads in Sanity Posts - Setup Guide

This guide explains how to add downloadable Excel files (or other documents) to your Sanity posts.

## Overview

You can now add downloadable files directly to posts in Sanity. When a post has downloads, they'll appear as download buttons on the article page.

## How to Add Downloads to a Post

### Step 1: Open Your Post in Sanity Studio

1. Go to your Sanity Studio
2. Navigate to **Posts**
3. Open or create a post

### Step 2: Add Downloadable Files

1. Scroll to the **"Content"** tab (or group)
2. Find the **"Downloadable Files"** field
3. Click **"Add item"** to add a download

### Step 3: Fill in Download Details

For each download, fill in:

- **File Title** (Required)
  - Example: "Tax Checklist Template"
  - This appears as the heading above the download button

- **Description** (Optional)
  - Example: "Use this checklist to ensure you have all necessary documents for tax filing."
  - Shown below the title

- **File** (Required)
  - Click to upload an Excel file (`.xlsx`, `.xls`)
  - Also supports: PDF, Word docs, CSV
  - Files are stored in Sanity's CDN

- **Button Text** (Optional)
  - Default: "Download"
  - Customize the button text if needed
  - Example: "Download Template", "Get Checklist"

### Step 4: Save and Publish

1. Click **"Save"**
2. **Publish** the post
3. The downloads will appear on the article page automatically

## Example Use Cases

### Tax Template Post
- **Title:** "2025 Tax Filing Checklist"
- **Description:** "Complete checklist of documents needed for 2025 tax filing"
- **File:** `tax-checklist-2025.xlsx`
- **Button Text:** "Download Checklist"

### Budget Template Post
- **Title:** "Monthly Budget Template"
- **Description:** "Excel template to track monthly income and expenses"
- **File:** `monthly-budget-template.xlsx`
- **Button Text:** "Download Template"

### Expense Tracker Post
- **Title:** "Business Expense Tracker"
- **Description:** "Track business expenses throughout the year"
- **File:** `expense-tracker.xlsx`
- **Button Text:** "Get Tracker"

## What Users See

On the article page, downloads appear in a dedicated section:

```
Downloads
─────────────────────────────
Tax Checklist Template
Use this checklist to ensure you have all necessary documents...
File size: 45.2 KB
[Download] ← Button
─────────────────────────────
```

## Supported File Types

- ✅ Excel: `.xlsx`, `.xls`
- ✅ PDF: `.pdf`
- ✅ Word: `.doc`, `.docx`
- ✅ CSV: `.csv`
- ✅ Other documents

## File Size Limits

- Sanity free tier: 10 MB per file
- Sanity paid tiers: Higher limits available
- For very large files, consider using external storage

## Tips

1. **Use descriptive titles** - Help users understand what they're downloading
2. **Add descriptions** - Explain what the file contains or how to use it
3. **Keep files updated** - Re-upload new versions to the same post when files change
4. **Organize by category** - Use post categories to group related templates

## Troubleshooting

### Downloads Not Showing

**Check:**
- ✅ Post is published (not draft)
- ✅ File is uploaded and saved
- ✅ Post has been saved after adding downloads

### File Won't Upload

**Check:**
- ✅ File size is under 10 MB (free tier limit)
- ✅ File type is supported
- ✅ Internet connection is stable

### Download Button Not Working

**Check:**
- ✅ File was successfully uploaded to Sanity
- ✅ Post is published
- ✅ Browser allows downloads (check popup blockers)

## Technical Details

- Files are stored in Sanity's CDN
- Downloads are served via direct links (fast)
- File URLs are automatically generated
- File size is displayed automatically
- Original filename is preserved

## Next Steps

1. Create a post about your templates
2. Add downloadable files using the steps above
3. Publish and test the downloads
4. Share the post with your audience!

For questions or issues, check the Sanity documentation or contact support.

