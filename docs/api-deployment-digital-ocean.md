# API Server Deployment on Digital Ocean App Platform

## Quick Summary

After deploying the API server, you need to add this environment variable to your **web service** (frontend):

```
VITE_API_BASE_URL=https://rpcassociates.co
```

**Why?** Because the API service is configured with the route `/api`, so it will be accessible at `https://rpcassociates.co/api/leads` and `https://rpcassociates.co/api/contact`.

## Step-by-Step Instructions

### 1. Update `.do/app.yaml`

The `app.yaml` file has been updated to include:
- **Web service** (your frontend) - already configured
- **API service** (new) - handles form submissions

### 2. Deploy to Digital Ocean

1. **Commit and push the updated `app.yaml`:**
   ```bash
   git add .do/app.yaml
   git commit -m "Add API service to app.yaml"
   git push origin main
   ```

2. **Digital Ocean will automatically detect the changes** and deploy both services.

### 3. Add Environment Variable to Web Service

After deployment, add the environment variable to your **web service**:

1. Go to Digital Ocean App Platform dashboard
2. Click on your app
3. Go to **Settings** → **App-Level Environment Variables** (or **Component Settings** → **web** → **Environment Variables**)
4. Click **Edit**
5. Add a new variable:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://rpcassociates.co`
6. Click **Save**
7. The app will automatically rebuild with the new environment variable

### 4. Verify API is Working

Once deployed, test the API:

1. **Health Check:**
   - Visit: `https://rpcassociates.co/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Test Form Submission:**
   - Fill out a lead capture form on your site
   - Check that:
     - Data is saved to PostgreSQL database
     - Email is sent to `contacts@rpcassociates.co` via Resend

## How It Works

### API Service Configuration

The API service is configured with:
- **Route:** `/api` - This means all API requests go to `https://rpcassociates.co/api/*`
- **Port:** `3000` - Internal port (not exposed publicly)
- **Database:** Connected to your Digital Ocean Managed PostgreSQL database
- **Email:** Configured with Resend API key

### Frontend Configuration

The frontend uses:
- **VITE_API_BASE_URL:** `https://rpcassociates.co`
- **API Endpoints:**
  - Leads: `https://rpcassociates.co/api/leads`
  - Contact: `https://rpcassociates.co/api/contact`

## Environment Variables Summary

### Web Service (Frontend) - Add These:
```
VITE_SANITY_PROJECT_ID=your-project-id
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-01-01
VITE_SANITY_USE_CDN=true
VITE_API_BASE_URL=https://rpcassociates.co  ← ADD THIS
```

### API Service - Already Configured in app.yaml:
- Database credentials (PostgreSQL)
- Resend API key
- Email settings
- CORS origins

## Troubleshooting

### API Not Working?

1. **Check API service is running:**
   - Go to App Platform → Your App → Components
   - Verify "api" service shows as "Running"

2. **Check API logs:**
   - Go to App Platform → Your App → Runtime Logs
   - Select "api" component
   - Look for errors

3. **Test API endpoint:**
   - Visit: `https://rpcassociates.co/api/health`
   - Should return JSON with status

### Form Still Shows "Failed to Fetch"?

1. **Verify environment variable is set:**
   - Check that `VITE_API_BASE_URL` is set in web service
   - Value should be `https://rpcassociates.co` (no trailing slash)

2. **Check CORS:**
   - Verify `ALLOWED_ORIGINS` in API service includes `https://rpcassociates.co`

3. **Rebuild frontend:**
   - After adding `VITE_API_BASE_URL`, the frontend needs to rebuild
   - Digital Ocean should do this automatically, but you can trigger a manual rebuild

## Alternative: Separate API App

If you prefer to deploy the API as a **separate app** (not a service in the same app):

1. Create a new app in Digital Ocean App Platform
2. Point it to the same repository
3. Set `source_dir: api/server`
4. It will get its own URL like `https://rpc-api-abc123.ondigitalocean.app`
5. Then set `VITE_API_BASE_URL=https://rpc-api-abc123.ondigitalocean.app`

But using the same app with multiple services is simpler and more cost-effective.
