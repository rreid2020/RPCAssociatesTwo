# Excel File Downloads - Implementation Options

This guide covers different ways to support downloadable Excel files on your website.

## Option 1: Static Excel Files (Simplest)

**Best for:** Pre-made templates, forms, or documents that don't change

### How it works:
- Upload `.xlsx` files to your `public/` folder
- Link to them directly from your website
- Files are served as static assets

### Implementation:

1. **Add Excel files to public folder:**
   ```
   public/
     downloads/
       tax-checklist.xlsx
       expense-tracker.xlsx
       budget-template.xlsx
   ```

2. **Create a download link component:**
   ```tsx
   // src/components/DownloadLink.tsx
   import { FC } from 'react'

   interface DownloadLinkProps {
     href: string
     filename: string
     children: React.ReactNode
     className?: string
   }

   const DownloadLink: FC<DownloadLinkProps> = ({ 
     href, 
     filename, 
     children, 
     className 
   }) => {
     return (
       <a 
         href={href} 
         download={filename}
         className={className}
       >
         {children}
       </a>
     )
   }

   export default DownloadLink
   ```

3. **Use in your pages:**
   ```tsx
   <DownloadLink 
     href="/downloads/tax-checklist.xlsx"
     filename="tax-checklist.xlsx"
     className="btn btn--primary"
   >
     Download Tax Checklist
   </DownloadLink>
   ```

**Pros:**
- ✅ Simplest to implement
- ✅ No dependencies
- ✅ Fast (served as static files)
- ✅ Works offline

**Cons:**
- ❌ Files must be manually updated
- ❌ Can't customize per user
- ❌ Takes up storage space

---

## Option 2: Generate Excel Files Dynamically (Client-Side)

**Best for:** Generating files from user input or data on the page

### How it works:
- Use `xlsx` or `exceljs` library
- Generate Excel file in the browser
- Trigger download automatically

### Implementation:

1. **Install library:**
   ```bash
   npm install xlsx
   npm install --save-dev @types/xlsx
   ```

2. **Create Excel generator utility:**
   ```tsx
   // src/lib/excel/generateExcel.ts
   import * as XLSX from 'xlsx'

   export interface ExcelData {
     sheetName: string
     headers: string[]
     rows: (string | number)[][]
   }

   export function generateExcelFile(
     data: ExcelData[],
     filename: string = 'export.xlsx'
   ) {
     const workbook = XLSX.utils.book_new()

     data.forEach((sheet) => {
       // Create worksheet from array of arrays
       const worksheet = XLSX.utils.aoa_to_sheet([
         sheet.headers,
         ...sheet.rows
       ])

       // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName)
     })

     // Generate Excel file and trigger download
     XLSX.writeFile(workbook, filename)
   }

   // Example usage:
   export function generateTaxReport(data: any) {
     generateExcelFile([
       {
         sheetName: 'Tax Summary',
         headers: ['Category', 'Amount', 'Date'],
         rows: data.map(item => [item.category, item.amount, item.date])
       }
     ], 'tax-report.xlsx')
   }
   ```

3. **Use in component:**
   ```tsx
   // src/components/TaxCalculator.tsx (example)
   import { generateTaxReport } from '../lib/excel/generateExcel'

   const handleDownload = () => {
     const reportData = {
       category: 'Employment Income',
       amount: 50000,
       date: '2025-01-15'
     }
     
     generateTaxReport([reportData])
   }

   <button onClick={handleDownload} className="btn btn--primary">
     Download Excel Report
   </button>
   ```

**Pros:**
- ✅ Generate files on demand
- ✅ Customize based on user data
- ✅ No server needed
- ✅ Real-time generation

**Cons:**
- ❌ Requires JavaScript library
- ❌ Limited by browser memory for large files
- ❌ Can't access server-side data directly

---

## Option 3: Sanity CMS Integration (Recommended for Managed Content)

**Best for:** Files managed by content editors, version control, metadata

### How it works:
- Upload Excel files to Sanity as assets
- Fetch file URLs from Sanity
- Display download links dynamically

### Implementation:

1. **Upload Excel files to Sanity:**
   - Go to Sanity Studio
   - Upload `.xlsx` files as assets
   - Add metadata (title, description, category)

2. **Create Sanity schema for downloads:**
   ```typescript
   // sanity-studio/schemas/download.ts
   import { defineField, defineType } from 'sanity'

   export default defineType({
     name: 'download',
     title: 'Download',
     type: 'document',
     fields: [
       defineField({
         name: 'title',
         title: 'Title',
         type: 'string',
         validation: Rule => Rule.required()
       }),
       defineField({
         name: 'description',
         title: 'Description',
         type: 'text'
       }),
       defineField({
         name: 'file',
         title: 'Excel File',
         type: 'file',
         options: {
           accept: '.xlsx,.xls'
         },
         validation: Rule => Rule.required()
       }),
       defineField({
         name: 'category',
         title: 'Category',
         type: 'string',
         options: {
           list: [
             { title: 'Tax Forms', value: 'tax' },
             { title: 'Templates', value: 'templates' },
             { title: 'Reports', value: 'reports' }
           ]
         }
       }),
       defineField({
         name: 'order',
         title: 'Display Order',
         type: 'number'
       })
     ]
   })
   ```

3. **Create GROQ query:**
   ```typescript
   // src/lib/sanity/queries.ts
   export async function getDownloads(category?: string) {
     const filter = category 
       ? `category == "${category}"`
       : 'true'
     
     const query = `*[_type == "download" && ${filter}] | order(order asc) {
       _id,
       title,
       description,
       category,
       "fileUrl": file.asset->url,
       "filename": file.asset->originalFilename
     }`
     
     return await client.fetch(query)
   }
   ```

4. **Create Downloads page:**
   ```tsx
   // src/pages/Downloads.tsx
   import { FC, useEffect, useState } from 'react'
   import { getDownloads } from '../lib/sanity/queries'

   const Downloads: FC = () => {
     const [downloads, setDownloads] = useState([])

     useEffect(() => {
       getDownloads().then(setDownloads)
     }, [])

     return (
       <div className="downloads">
         <h1>Downloads</h1>
         {downloads.map(download => (
           <div key={download._id} className="download-item">
             <h3>{download.title}</h3>
             <p>{download.description}</p>
             <a 
               href={download.fileUrl} 
               download={download.filename}
               className="btn btn--primary"
             >
               Download {download.filename}
             </a>
           </div>
         ))}
       </div>
     )
   }
   ```

**Pros:**
- ✅ Content editors can manage files
- ✅ Version control
- ✅ Metadata and categorization
- ✅ CDN delivery (fast)
- ✅ No code changes needed to add files

**Cons:**
- ❌ Requires Sanity setup
- ❌ Files stored in Sanity (storage costs)
- ❌ Need to upload files to Sanity

---

## Option 4: Server-Side Generation (Most Flexible)

**Best for:** Large files, database queries, authentication, custom logic

### How it works:
- Create API endpoint (serverless function or backend)
- Generate Excel file on server
- Stream file to user

### Implementation:

1. **Create serverless function:**
   ```typescript
   // api/generate-excel.ts (Vercel/Netlify function)
   import * as XLSX from 'xlsx'

   export default async function handler(req, res) {
     // Get data (from database, API, etc.)
     const data = await fetchDataFromDatabase()
     
     // Generate Excel
     const workbook = XLSX.utils.book_new()
     const worksheet = XLSX.utils.json_to_sheet(data)
     XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
     
     // Generate buffer
     const buffer = XLSX.write(workbook, { 
       type: 'buffer', 
       bookType: 'xlsx' 
     })
     
     // Send file
     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
     res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"')
     res.send(buffer)
   }
   ```

2. **Call from frontend:**
   ```tsx
   const handleDownload = async () => {
     const response = await fetch('/api/generate-excel')
     const blob = await response.blob()
     const url = window.URL.createObjectURL(blob)
     const a = document.createElement('a')
     a.href = url
     a.download = 'report.xlsx'
     a.click()
   }
   ```

**Pros:**
- ✅ Most flexible
- ✅ Can access databases
- ✅ Can add authentication
- ✅ No browser memory limits
- ✅ Can process large datasets

**Cons:**
- ❌ Requires backend/serverless function
- ❌ More complex setup
- ❌ Server costs

---

## Recommendation Matrix

| Use Case | Recommended Option |
|----------|-------------------|
| Pre-made templates/forms | Option 1: Static Files |
| Generate from user input | Option 2: Client-Side Generation |
| Content-managed downloads | Option 3: Sanity Integration |
| Large files, database queries | Option 4: Server-Side Generation |

## Quick Start: Static Files (Easiest)

If you just want to add downloadable Excel files quickly:

1. **Create downloads folder:**
   ```bash
   mkdir public/downloads
   ```

2. **Add your Excel files:**
   - Place `.xlsx` files in `public/downloads/`

3. **Add download link:**
   ```tsx
   <a 
     href="/downloads/your-file.xlsx" 
     download
     className="btn btn--primary"
   >
     Download Excel File
   </a>
   ```

That's it! Files will be available at `https://yourdomain.com/downloads/your-file.xlsx`

## Next Steps

Choose the option that best fits your needs:
- **Simple static files?** → Option 1
- **Generate from data?** → Option 2
- **Content-managed?** → Option 3
- **Complex requirements?** → Option 4

I can help implement any of these options!


