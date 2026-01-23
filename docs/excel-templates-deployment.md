# Excel Calculator Templates - Deployment Guide

## Recommended Approach: Static Files in `public/` Folder

**Best for:** Pre-made Excel calculator templates that don't change frequently

### Why This Approach?

1. ✅ **Simplest to deploy** - Files are included in the build
2. ✅ **Fast delivery** - Served directly from your Digital Ocean server/CDN
3. ✅ **No additional costs** - No extra storage or API calls
4. ✅ **Works with your current setup** - No infrastructure changes needed
5. ✅ **Easy to version control** - Files are in your Git repo

### File Size Considerations

- **Small files (< 5MB):** Perfect for `public/` folder
- **Medium files (5-20MB):** Still fine, but consider compression
- **Large files (> 20MB):** Consider Digital Ocean Spaces (object storage)

## Implementation Steps

### Step 1: Create Downloads Directory

```bash
mkdir -p public/downloads/excel-templates
```

### Step 2: Add Your Excel Files

Place your `.xlsx` files in `public/downloads/excel-templates/`:

```
public/
  downloads/
    excel-templates/
      tax-calculator-2025.xlsx
      budget-calculator.xlsx
      expense-tracker.xlsx
      cash-flow-forecast.xlsx
```

### Step 3: Update Resources Page

The Resources page will automatically include these files. Here's how to add them:

```typescript
// src/pages/Resources.tsx
const resources: Resource[] = [
  {
    title: 'Canadian Personal Income Tax Calculator',
    description: 'Calculate your estimated Canadian income tax for 2025...',
    link: '/resources/canadian-personal-income-tax-calculator',
    category: 'Calculator'
  },
  {
    title: '2025 Tax Calculator Template',
    description: 'Excel template for calculating your 2025 Canadian income tax. Includes federal and provincial calculations.',
    link: '/downloads/excel-templates/tax-calculator-2025.xlsx',
    category: 'Excel Template',
    isDownload: true
  },
  {
    title: 'Budget Calculator Template',
    description: 'Track your monthly income and expenses with this comprehensive Excel budget template.',
    link: '/downloads/excel-templates/budget-calculator.xlsx',
    category: 'Excel Template',
    isDownload: true
  }
]
```

### Step 4: Deploy to Digital Ocean

When you deploy, the files in `public/` are automatically copied to `dist/` during build:

```bash
npm run build  # Files from public/ are copied to dist/
```

The files will be available at:
- `https://rpcassociates.co/downloads/excel-templates/tax-calculator-2025.xlsx`

## Alternative: Digital Ocean Spaces (For Large Files)

If you have large files (> 20MB) or want to reduce build size:

### Setup Digital Ocean Spaces

1. **Create a Space:**
   - Go to Digital Ocean → Spaces
   - Create a new Space (e.g., `rpc-associates-downloads`)
   - Choose a region close to your users
   - Enable CDN for faster delivery

2. **Upload Files:**
   - Upload Excel files to the Space
   - Make files public (or use signed URLs)

3. **Update Links:**
   ```typescript
   const fileUrl = 'https://rpc-associates-downloads.nyc3.digitaloceanspaces.com/tax-calculator-2025.xlsx'
   ```

**Pros:**
- ✅ No build size impact
- ✅ CDN delivery (faster)
- ✅ Can update files without redeploying
- ✅ Better for large files

**Cons:**
- ❌ Additional service to manage
- ❌ Small monthly cost (~$5/month)
- ❌ Need to manage file URLs separately

## Recommended Structure

```
public/
  downloads/
    excel-templates/
      tax/
        tax-calculator-2025.xlsx
        tax-deduction-tracker.xlsx
      budgeting/
        budget-calculator.xlsx
        cash-flow-forecast.xlsx
      business/
        expense-tracker.xlsx
        invoice-template.xlsx
```

## Nginx Configuration (Already Handled)

Your current `nginx.conf` already serves static files correctly. Files in `public/` are automatically available.

## Best Practices

1. **File Naming:**
   - Use lowercase with hyphens: `tax-calculator-2025.xlsx`
   - Include year if applicable: `budget-2025.xlsx`
   - Be descriptive: `expense-tracker.xlsx` not `et.xlsx`

2. **File Organization:**
   - Group by category in subfolders
   - Keep file names consistent

3. **Version Control:**
   - Commit Excel files to Git
   - Use descriptive commit messages when updating templates

4. **SEO:**
   - Add descriptions to Resources page
   - Include relevant keywords
   - Consider adding structured data for downloads

## Next Steps

1. Create the `public/downloads/excel-templates/` directory
2. Add your Excel files
3. Update the Resources page to include download links
4. Test locally: `npm run dev` and visit `/downloads/excel-templates/your-file.xlsx`
5. Deploy: Files will be automatically included in the build
