# Combined Server Deployment (Frontend + API)

## Overview

Instead of deploying the frontend and API as separate services, we've combined them into a **single service** that:

1. **Serves the frontend** (React app) as static files
2. **Handles API requests** at `/api/*` routes
3. **Runs on one server** (port 3000)

This is simpler, more cost-effective, and easier to manage!

## How It Works

### Build Process

1. **Build the frontend:** `npm run build` creates the `dist/` folder
2. **Copy dist to API server:** `cp -r dist api/server/dist` copies the built files
3. **Start the API server:** The Express server serves both:
   - Static files from `api/server/dist/` for the frontend
   - API routes at `/api/*` for form submissions

### Server Configuration

The API server (`api/server/server.js`) now:
- Serves static files from `../dist/` (relative to `api/server/`)
- Handles API routes: `/api/leads`, `/api/contact`, `/api/health`
- Serves `index.html` for all non-API routes (React Router handles client-side routing)

### Frontend Configuration

The frontend uses **relative URLs** for API calls:
- `/api/leads` instead of `https://rpcassociates.co/api/leads`
- `/api/contact` instead of `https://rpcassociates.co/api/contact`

This works because the API is on the same server as the frontend!

## Environment Variables

### In Digital Ocean App Platform

You only need **ONE service** now. Add these environment variables:

**For Build Time (Frontend):**
- `VITE_SANITY_PROJECT_ID` - Your Sanity project ID
- `VITE_SANITY_DATASET` - Your Sanity dataset (e.g., `production`)
- `VITE_SANITY_API_VERSION` - API version (e.g., `2024-01-01`)
- `VITE_SANITY_USE_CDN` - Use CDN (e.g., `true`)
- `VITE_API_BASE_URL` - Set to empty string `""` (uses same origin)

**For Runtime (API Server):**
- `NODE_ENV` - `production`
- `PORT` - `3000`
- `DB_HOST` - Your PostgreSQL host
- `DB_PORT` - Your PostgreSQL port
- `DB_NAME` - Your database name
- `DB_USER` - Your database user
- `DB_PASSWORD` - Your database password
- `DB_SSL` - `true`
- `RESEND_API_KEY` - Your Resend API key
- `EMAIL_FROM` - `"RPC Associates <contacts@rpcassociates.co>"`
- `NOTIFICATION_EMAIL` - `contacts@rpcassociates.co`
- `ALLOWED_ORIGINS` - `https://rpcassociates.co,https://www.rpcassociates.co`

## Benefits

✅ **Simpler:** One service instead of two  
✅ **Cheaper:** Only pay for one service instance  
✅ **No CORS issues:** Frontend and API on same origin  
✅ **Easier to manage:** One set of environment variables  
✅ **Faster:** No network latency between frontend and API  

## Deployment Steps

1. **Update `.do/app.yaml`** (already done)
2. **Commit and push** to trigger deployment
3. **Add environment variables** in Digital Ocean App Platform:
   - Go to your app → Settings → Environment Variables
   - Add all the variables listed above
4. **Deploy!** Digital Ocean will:
   - Build the frontend
   - Copy `dist/` to `api/server/dist/`
   - Start the API server (which serves both frontend and API)

## Testing

After deployment:

1. **Test frontend:** Visit `https://rpcassociates.co` - should load normally
2. **Test API health:** Visit `https://rpcassociates.co/api/health` - should return JSON
3. **Test form submission:** Submit a lead capture form - should save to database and send email

## Troubleshooting

### Frontend not loading?
- Check that `dist/` folder was copied to `api/server/dist/`
- Check server logs in Digital Ocean dashboard

### API not working?
- Check that environment variables are set correctly
- Check server logs for database connection errors
- Verify `/api/health` endpoint returns JSON

### Forms showing "Failed to fetch"?
- Check that `VITE_API_BASE_URL` is set to empty string `""`
- Verify API server is running (check `/api/health`)
- Check browser console for CORS errors (shouldn't happen with same origin)
