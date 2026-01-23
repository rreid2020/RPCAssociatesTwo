# Digital Ocean Spaces Structure - Public Resources & Client Portal

This guide outlines the recommended structure for your Digital Ocean Space to support both public resource downloads and private client portal file uploads/downloads.

## Recommended Folder Structure

```
rpc-associates-space/
├── public/
│   ├── resources/
│   │   ├── guides/
│   │   │   └── CFI-Financial-Ratios-Guide.pdf
│   │   ├── excel-templates/
│   │   │   └── large-template.xlsx
│   │   └── calculators/
│   │       └── (future calculator data files)
│   └── assets/
│       └── (public marketing assets if needed)
│
└── private/
    └── clients/
        ├── {client-id}/
        │   ├── uploads/
        │   │   ├── 2025/
        │   │   │   ├── tax-documents/
        │   │   │   ├── receipts/
        │   │   │   └── financial-statements/
        │   │   └── 2024/
        │   └── downloads/
        │       ├── reports/
        │       ├── tax-returns/
        │       └── financial-statements/
        └── shared/
            └── (files shared across multiple clients)
```

## Access Control Strategy

### Option 1: Single Space with Folder-Level Permissions (Recommended)

**Structure:**
- One Space: `rpc-associates-space`
- Public folder: Accessible via public URLs
- Private folder: Requires authentication/signed URLs

**Implementation:**
1. **Public Resources:**
   - Set Space to "Public" for file listing
   - Public files accessible via direct URLs
   - No authentication required

2. **Client Portal Files:**
   - Use **signed URLs** (time-limited, secure)
   - Generate URLs server-side with Digital Ocean API
   - URLs expire after set time (e.g., 1 hour, 24 hours)

**Pros:**
- ✅ Single Space to manage
- ✅ Lower cost (one Space)
- ✅ Easier to organize
- ✅ Can use CDN for both public and private

**Cons:**
- ⚠️ Need to implement signed URL generation
- ⚠️ More complex access control logic

### Option 2: Two Separate Spaces

**Structure:**
- Space 1: `rpc-associates-public` (public resources)
- Space 2: `rpc-associates-private` (client files)

**Implementation:**
1. **Public Space:**
   - Public access
   - Direct URLs
   - CDN enabled

2. **Private Space:**
   - Restricted access
   - Signed URLs only
   - Additional security policies

**Pros:**
- ✅ Clear separation of concerns
- ✅ Easier to manage permissions
- ✅ Can have different CDN settings

**Cons:**
- ❌ Two Spaces to manage
- ❌ Slightly higher cost (~$10/month vs $5/month)
- ❌ More complex setup

## Recommended: Option 1 (Single Space)

For your use case, **Option 1 is recommended** because:
- You're starting with public resources
- Client portal is future work
- Single Space is simpler to manage
- Cost-effective
- Can always split later if needed

## Detailed Folder Structure

### Public Resources (`/public/resources/`)

```
public/resources/
├── guides/
│   ├── CFI-Financial-Ratios-Guide.pdf
│   ├── tax-planning-guide-2025.pdf
│   └── business-setup-guide.pdf
│
├── excel-templates/
│   ├── cash-flow-statement-template.xlsx
│   ├── budget-calculator.xlsx
│   └── expense-tracker.xlsx
│
└── calculators/
    └── (data files for online calculators)
```

**URL Format:**
```
https://rpc-associates-space.nyc3.digitaloceanspaces.com/public/resources/guides/CFI-Financial-Ratios-Guide.pdf
```

### Client Portal Files (`/private/clients/`)

```
private/clients/
├── {client-id-1}/
│   ├── uploads/
│   │   ├── 2025/
│   │   │   ├── tax-documents/
│   │   │   │   ├── T4-2024.pdf
│   │   │   │   └── receipts-2024.pdf
│   │   │   ├── receipts/
│   │   │   │   └── business-expenses/
│   │   │   └── financial-statements/
│   │   └── 2024/
│   │       └── ...
│   └── downloads/
│       ├── reports/
│       │   └── financial-review-2025.pdf
│       ├── tax-returns/
│       │   └── return-2024.pdf
│       └── financial-statements/
│           └── statements-2024.pdf
│
├── {client-id-2}/
│   └── ...
│
└── shared/
    └── (templates, forms shared with all clients)
```

**URL Format (Signed):**
```
https://rpc-associates-space.nyc3.digitaloceanspaces.com/private/clients/{client-id}/uploads/2025/tax-documents/T4-2024.pdf?X-Amz-Algorithm=...&X-Amz-Expires=3600&...
```

## Implementation Guide

### Step 1: Create the Space

1. **Create Space:**
   - Name: `rpc-associates-space`
   - Region: `nyc3` (or closest to your users)
   - Enable CDN: ✅ Yes

2. **Initial Setup:**
   - File Listing: **Public** (for public resources)
   - CORS: Configure if needed for client uploads

### Step 2: Set Up Folder Structure

Create folders via Digital Ocean web interface or API:

```
public/
  resources/
    guides/
    excel-templates/
    calculators/
private/
  clients/
```

### Step 3: Upload Public Resources

1. Upload files to `public/resources/guides/`
2. Files are immediately accessible via public URLs
3. No authentication needed

### Step 4: Implement Client Portal (Future)

When implementing client portal:

1. **File Upload:**
   - Client uploads via your application
   - Your backend receives file
   - Upload to `private/clients/{client-id}/uploads/{year}/`
   - Store file metadata in your database

2. **File Download:**
   - Client requests file
   - Your backend generates signed URL
   - Return signed URL to client
   - Client downloads directly from Space

3. **Access Control:**
   - Verify client authentication
   - Check client has permission for file
   - Generate signed URL with expiration
   - Log access for audit trail

## Code Examples

### Public Resource URL (Direct)

```typescript
// src/pages/Resources.tsx
const guides: Resource[] = [
  {
    title: 'CFI Financial Ratios Guide',
    description: 'Comprehensive guide...',
    link: 'https://rpc-associates-space.nyc3.digitaloceanspaces.com/public/resources/guides/CFI-Financial-Ratios-Guide.pdf',
    category: 'Guide',
    isDownload: true,
    fileSize: '46 MB'
  }
]
```

### Client Portal File Access (Signed URL)

```typescript
// Backend API endpoint (future implementation)
import AWS from 'aws-sdk'

const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com')
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET
})

// Generate signed URL for client file
app.get('/api/client/files/:fileId', authenticateClient, async (req, res) => {
  const { fileId } = req.params
  const clientId = req.user.clientId
  
  // Verify client has access to this file
  const file = await getFileFromDatabase(fileId, clientId)
  if (!file) {
    return res.status(403).json({ error: 'Access denied' })
  }
  
  // Generate signed URL (expires in 1 hour)
  const url = s3.getSignedUrl('getObject', {
    Bucket: 'rpc-associates-space',
    Key: `private/clients/${clientId}/downloads/${file.path}`,
    Expires: 3600 // 1 hour
  })
  
  res.json({ downloadUrl: url })
})
```

## Security Best Practices

1. **Public Resources:**
   - ✅ Safe to be public (guides, templates)
   - ✅ No sensitive information
   - ✅ Direct URLs are fine

2. **Client Files:**
   - 🔒 Always use signed URLs
   - 🔒 Verify client authentication
   - 🔒 Check file ownership/permissions
   - 🔒 Set appropriate expiration times
   - 🔒 Log all access attempts
   - 🔒 Encrypt sensitive files if needed

3. **File Upload:**
   - 🔒 Validate file types
   - 🔒 Scan for viruses/malware
   - 🔒 Limit file sizes
   - 🔒 Sanitize filenames
   - 🔒 Store metadata in database

## Cost Considerations

**Single Space (Recommended):**
- Storage: $5/month for 250GB
- Bandwidth: $0.01/GB (first 1TB free)
- **Total: ~$5-10/month**

**Two Spaces:**
- Storage: $10/month for 500GB total
- Bandwidth: Same pricing
- **Total: ~$10-20/month**

## Migration Path

1. **Phase 1 (Now):** Set up Space with public resources
2. **Phase 2 (Future):** Add private folder structure
3. **Phase 3 (Future):** Implement client portal with signed URLs
4. **Phase 4 (If Needed):** Split into two Spaces if complexity grows

## Quick Start Checklist

- [ ] Create Digital Ocean Space: `rpc-associates-space`
- [ ] Enable CDN
- [ ] Create folder structure (public/resources/, private/clients/)
- [ ] Upload public resources to `public/resources/guides/`
- [ ] Update Resources page with public URLs
- [ ] (Future) Set up backend API for signed URLs
- [ ] (Future) Implement client authentication
- [ ] (Future) Add file upload functionality

## Summary

**Recommended Structure:**
- **Single Space:** `rpc-associates-space`
- **Public folder:** `/public/resources/` (guides, templates)
- **Private folder:** `/private/clients/{client-id}/` (client files)
- **Access:** Public URLs for resources, signed URLs for client files

This structure gives you:
- ✅ Clear organization
- ✅ Scalability for future client portal
- ✅ Cost-effective solution
- ✅ Easy to manage
- ✅ Secure client file access
