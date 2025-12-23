# Social Media Auto-Poster for Sanity

This serverless function automatically posts to LinkedIn and Twitter/X when content is published in Sanity.

## Setup Instructions

### Option 1: Deploy to Vercel (Recommended - Free)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd api/social-poster
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings → Environment Variables
   - Add all variables from `.env.example`

4. **Get your webhook URL:**
   - After deployment, Vercel will give you a URL like: `https://your-function.vercel.app/api/social-poster`
   - Use this URL in Sanity webhook configuration

### Option 2: Deploy to Netlify Functions

1. **Create `netlify.toml` in project root:**
   ```toml
   [build]
     functions = "api"
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

2. **Rename `index.js` to `social-poster.js` and move to `netlify/functions/`**

3. **Deploy to Netlify:**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

### Option 3: Deploy to Digital Ocean Functions

1. **Install DO Functions CLI:**
   ```bash
   doctl serverless install
   ```

2. **Deploy:**
   ```bash
   doctl serverless deploy api/social-poster
   ```

## Getting API Credentials

### LinkedIn API Setup

1. **Create LinkedIn App:**
   - Go to https://www.linkedin.com/developers/apps
   - Click "Create app"
   - Fill in app details
   - Request "Sign In with LinkedIn using OpenID Connect" permission
   - Request "Marketing Developer Platform" access (for posting)

2. **Get Access Token:**
   - Use OAuth 2.0 flow to get user access token
   - Or use LinkedIn's API to generate a long-lived token
   - Store in `LINKEDIN_ACCESS_TOKEN`

3. **Get Person URN:**
   - Make API call: `GET https://api.linkedin.com/v2/me`
   - Extract the `id` field
   - Store in `LINKEDIN_PERSON_URN`

### Twitter/X API Setup

1. **Create Twitter Developer Account:**
   - Go to https://developer.twitter.com
   - Apply for developer access
   - Create a new app/project

2. **Get API Keys:**
   - Go to your app → Keys and tokens
   - Generate:
     - API Key → `TWITTER_API_KEY`
     - API Secret → `TWITTER_API_SECRET`
     - Access Token → `TWITTER_ACCESS_TOKEN`
     - Access Token Secret → `TWITTER_ACCESS_TOKEN_SECRET`

3. **Enable OAuth 1.0a:**
   - In app settings, enable "OAuth 1.0a" authentication
   - Set callback URL (can be `http://localhost` for testing)

## Configure Sanity Webhook

1. **Go to Sanity Dashboard:**
   - https://www.sanity.io/manage
   - Select your project

2. **Navigate to API → Webhooks:**
   - Click "Create webhook"

3. **Configure Webhook:**
   - **Name:** "Social Media Poster"
   - **URL:** Your deployed function URL (e.g., `https://your-function.vercel.app/api/social-poster`)
   - **Dataset:** `production` (or your dataset)
   - **Trigger on:** `Create`, `Update`
   - **Filter:** `_type == "post" && defined(publishedAt)`
   - **HTTP method:** `POST`
   - **Secret:** (optional) Set a secret and add to `SANITY_WEBHOOK_SECRET`

4. **Save the webhook**

## Testing

1. **Publish a test post in Sanity**
2. **Check the webhook logs:**
   - Vercel: Dashboard → Functions → View logs
   - Netlify: Functions → View logs
3. **Verify posts appear on LinkedIn and Twitter**

## Troubleshooting

### LinkedIn Errors
- **401 Unauthorized:** Check access token is valid and not expired
- **403 Forbidden:** Ensure you have "Marketing Developer Platform" access
- **400 Bad Request:** Check person URN is correct

### Twitter Errors
- **401 Unauthorized:** Verify all API keys and tokens are correct
- **403 Forbidden:** Check app permissions include "Read and Write"
- **429 Rate Limited:** Twitter has rate limits - wait and retry

### Webhook Not Firing
- Check Sanity webhook is active and configured correctly
- Verify filter matches your document type
- Check function logs for errors

## Environment Variables

Create a `.env` file (or set in your hosting platform):

```env
# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token
LINKEDIN_PERSON_URN=your_person_urn

# Twitter/X
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret

# Security
SANITY_WEBHOOK_SECRET=your_webhook_secret
```

## Alternative: Use Zapier/Make (No-Code)

If you prefer a no-code solution:

1. **Zapier:**
   - Create Zap: Sanity (Webhook) → LinkedIn (Create Post)
   - Create Zap: Sanity (Webhook) → Twitter (Create Tweet)

2. **Make (formerly Integromat):**
   - Create scenario: Sanity webhook → LinkedIn post
   - Create scenario: Sanity webhook → Twitter post

These services handle OAuth and API complexity for you.

