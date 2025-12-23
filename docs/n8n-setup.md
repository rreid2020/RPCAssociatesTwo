# N8N Setup Guide for Social Media Automation

N8N is an open-source workflow automation tool that's perfect for connecting Sanity to LinkedIn and Twitter. Best of all, it's **completely free** when self-hosted!

## Why N8N?

- ✅ **Unlimited** workflows and executions (no per-execution costs)
- ✅ **Open source** - You own it
- ✅ **Powerful** - More features than Zapier/Make
- ✅ **Self-hosted** - Your data stays on your server
- ✅ **OAuth handling** - Automatically manages social media authentication

**Note:** Self-hosting requires a server (see hosting options below), but you can also use N8N Cloud ($20/month) which includes hosting.

## Hosting Options & Costs

### Option 1: N8N Cloud (Easiest - $20/month)

**Best for:** No server management, quick setup

- ✅ No server setup needed
- ✅ Managed by N8N team
- ✅ Automatic updates
- ✅ Unlimited executions
- ✅ $20/month (includes hosting)

**Setup:** Just sign up at https://n8n.io/cloud

**Total Cost:** $20/month

---

### Option 2: Free/Cheap Cloud Hosting

**Best for:** Cost-conscious users who want self-hosted

#### A. Railway (Free Tier Available)

- **Free tier:** $5 credit/month (usually enough for N8N)
- **Paid:** $5/month for small instance
- **Setup:** One-click N8N deployment
- **Link:** https://railway.app

#### B. Render (Free Tier)

- **Free tier:** Available (with limitations)
- **Paid:** $7/month for always-on
- **Setup:** Deploy from Docker
- **Link:** https://render.com

#### C. Fly.io (Free Tier)

- **Free tier:** 3 shared VMs free
- **Paid:** ~$2-5/month for small instance
- **Setup:** Deploy with Docker
- **Link:** https://fly.io

#### D. Digital Ocean (If you already have a server)

- **Cost:** $0 additional (use existing server)
- **Setup:** Add N8N to your existing DO setup
- **Or:** $6/month for new basic droplet

**Total Cost:** $0-7/month (depending on option)

---

### Option 3: Local Development (Free but Not Production)

**Best for:** Testing only

```bash
npm install n8n -g
n8n start
```

**Limitations:**
- ⚠️ Only runs when your computer is on
- ⚠️ Not accessible from internet (unless you use ngrok)
- ⚠️ Not suitable for production

**Total Cost:** $0 (but not recommended for production)

---

## Installation Instructions

### For N8N Cloud (Recommended if you want managed hosting)

1. Go to https://n8n.io/cloud
2. Sign up ($20/month)
3. Create workflow
4. Done - no server setup needed!

### For Self-Hosted (Railway - Easiest Free Option)

1. **Sign up for Railway:**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy N8N:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Or use Railway's one-click N8N template
   - Railway will auto-detect and deploy

3. **Access N8N:**
   - Railway provides a URL automatically
   - Access your N8N instance

4. **Set up domain (optional):**
   - Railway provides free subdomain
   - Or connect custom domain

### For Self-Hosted (Docker on Your Server)

**Prerequisites:** Server with Docker installed

```bash
# Run N8N
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Access:** http://your-server-ip:5678

**To run in background:**
```bash
docker run -d \
  --name n8n \
  --restart unless-stopped \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### For Digital Ocean App Platform

1. Create new app
2. Use Dockerfile:
   ```dockerfile
   FROM n8nio/n8n
   ```
3. Set port: `5678`
4. Deploy

## Setup Workflow

### Step 1: Create New Workflow

1. Open N8N (http://localhost:5678)
2. Click "New Workflow"
3. Name it: "Sanity to Social Media"

### Step 2: Add Webhook Node (Trigger)

1. Click "+" to add node
2. Search for "Webhook"
3. Select "Webhook" node
4. Configure:
   - **HTTP Method:** POST
   - **Path:** `/sanity-publish` (or any path you want)
   - **Response Mode:** "Respond When Last Node Finishes"
5. Click "Execute Node" to get webhook URL
6. **Copy the webhook URL** - you'll need this for Sanity

### Step 3: Add LinkedIn Node

1. Add new node → Search "LinkedIn"
2. Select "LinkedIn" node
3. Click "Connect Account"
4. **First time:** You'll need to:
   - Create LinkedIn app at https://www.linkedin.com/developers/apps
   - Get API credentials
   - Or use OAuth (N8N handles this)
5. Configure:
   - **Operation:** "Create Post"
   - **Text:** Map from webhook body
   - **Visibility:** "Public"

**Message Template:**
```
{{ $json.title }}

{{ $json.excerpt }}

Read more: https://rpcassociates.co/articles/{{ $json.slug.current }}
```

### Step 4: Add Twitter Node

1. Add new node → Search "Twitter"
2. Select "Twitter" node
3. Click "Connect Account"
4. **First time:** Authorize with Twitter
5. Configure:
   - **Operation:** "Create Tweet"
   - **Text:** Map from webhook body

**Message Template:**
```
{{ $json.title }} https://rpcassociates.co/articles/{{ $json.slug.current }}
```

**Note:** Twitter has 280 character limit. You may want to truncate:
```
{{ $json.title.substring(0, 240) }}... https://rpcassociates.co/articles/{{ $json.slug.current }}
```

### Step 5: Connect Nodes

1. Connect: **Webhook** → **LinkedIn**
2. Connect: **Webhook** → **Twitter**
3. Both will run in parallel

### Step 6: Activate Workflow

1. Toggle "Active" switch (top right)
2. Workflow is now live and waiting for webhooks

## Configure Sanity Webhook

1. **Go to Sanity Dashboard:**
   - https://www.sanity.io/manage
   - Select your project

2. **Navigate to API → Webhooks:**
   - Click "Create webhook"

3. **Configure:**
   - **Name:** "N8N Social Media Poster"
   - **URL:** Your N8N webhook URL (from Step 2)
   - **Dataset:** `production` (or your dataset)
   - **Trigger on:** `Create`, `Update`
   - **Filter:** `_type == "post" && defined(publishedAt)`
   - **HTTP method:** `POST`
   - **Secret:** (optional) Set a secret for security

4. **Save webhook**

## Testing

1. **Publish a test post in Sanity**
2. **Check N8N:**
   - Go to "Executions" tab
   - You should see a new execution
   - Click to see details
3. **Check social media:**
   - LinkedIn and Twitter should have new posts
4. **Debug if needed:**
   - Check execution logs in N8N
   - Verify webhook received data
   - Check node outputs

## Advanced: Error Handling

Add error handling nodes:

1. **Add "IF" node** after each social media node
2. Check if post was successful
3. **Add "Slack" or "Email" node** to notify on errors
4. **Add "Set" node** to format error messages

## Advanced: Conditional Posting

Only post if certain conditions are met:

1. **Add "IF" node** after webhook
2. Check conditions:
   - `{{ $json.seo?.noIndex === false }}` (don't post if no-index)
   - `{{ $json.categories }}` (only post if has category)
3. Connect to LinkedIn/Twitter only if condition passes

## Advanced: Scheduled Posting

Instead of immediate posting, schedule for later:

1. **Add "Schedule Trigger" node**
2. **Add "Wait" node** for delay
3. **Add "Function" node** to check if post should go live
4. Then post to social media

## Security Best Practices

1. **Use webhook secrets:**
   - Set secret in Sanity webhook
   - Verify in N8N webhook node

2. **Restrict N8N access:**
   - Use authentication
   - Don't expose to public internet
   - Use reverse proxy (nginx) with SSL

3. **Environment variables:**
   - Store API keys in N8N credentials
   - Don't hardcode in workflows

## Troubleshooting

### Webhook Not Receiving Data

**Check:**
- ✅ N8N workflow is active
- ✅ Webhook URL is correct in Sanity
- ✅ Sanity webhook is active
- ✅ Check N8N execution logs

### Posts Not Appearing

**Check:**
- ✅ LinkedIn/Twitter nodes executed successfully
- ✅ OAuth tokens are valid
- ✅ Message format is correct
- ✅ Check social media node outputs

### OAuth Errors

**LinkedIn:**
- Ensure app has "Marketing Developer Platform" access
- Regenerate OAuth token
- Check app permissions

**Twitter:**
- Verify API keys are correct
- Check app has "Read and Write" permissions
- Regenerate access tokens

## Production Deployment

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your-secure-password
      - WEBHOOK_URL=https://your-domain.com/
    volumes:
      - ~/.n8n:/home/node/.n8n
```

Run:
```bash
docker-compose up -d
```

### Using Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name n8n.yourdomain.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Cost Comparison (Including Hosting)

| Solution | Software Cost | Hosting Cost | **Total/Month** | Executions |
|----------|---------------|--------------|-----------------|------------|
| **N8N Cloud** | $20 | Included | **$20** | Unlimited |
| **N8N (Railway)** | $0 | $0-5 | **$0-5** | Unlimited |
| **N8N (Render)** | $0 | $0-7 | **$0-7** | Unlimited |
| **N8N (Fly.io)** | $0 | $0-5 | **$0-5** | Unlimited |
| **N8N (DO Droplet)** | $0 | $6 | **$6** | Unlimited |
| Zapier Starter | $20 | N/A | **$20** | 750 |
| Zapier Professional | $50 | N/A | **$50** | 2,000 |
| Make Free | $0 | N/A | **$0** | 1,000 |
| Make Core | $9 | N/A | **$9** | 10,000 |
| Serverless Function | $0 | $0 (Vercel free) | **$0** | Unlimited |

**Best Value Options:**
1. **N8N on Railway/Fly.io** - $0-5/month, unlimited executions
2. **Make Free** - $0/month, 1,000 executions (may be enough)
3. **Serverless Function** - $0/month, unlimited (but requires more setup)

## Next Steps

1. Install N8N (Docker recommended)
2. Create workflow following steps above
3. Configure Sanity webhook
4. Test with a published post
5. Monitor executions and adjust as needed

For more N8N documentation: https://docs.n8n.io

