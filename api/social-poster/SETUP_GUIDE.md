# Quick Setup Guide: Social Media Auto-Posting

## Choose Your Approach

### 🆓 Option 1: N8N (Best Value - Unlimited Executions)

**Best for:** Unlimited workflows, full control, cost-effective

**Pros:**
- ✅ Unlimited workflows and executions
- ✅ Open source
- ✅ More powerful than Zapier/Make
- ✅ Can run on free/cheap hosting ($0-7/month)
- ✅ Or use managed N8N Cloud ($20/month)

**Cons:**
- ⚠️ Requires hosting (free tiers available)
- ⚠️ Slightly more technical setup (if self-hosting)

**Hosting Options:**
- **N8N Cloud:** $20/month (managed, easiest)
- **Railway:** $0-5/month (free tier available)
- **Render:** $0-7/month (free tier available)
- **Fly.io:** $0-5/month (free tier available)

**Setup Steps:**

1. **Choose hosting:**
   - **Self-hosted:** Run on your own server/VPS (free)
   - **Cloud:** N8N Cloud ($20/month) - easier but paid
   - **Docker:** One-command deployment

2. **Install N8N:**
   ```bash
   # Option A: Docker (easiest)
   docker run -it --rm \
     --name n8n \
     -p 5678:5678 \
     -v ~/.n8n:/home/node/.n8n \
     n8nio/n8n
   
   # Option B: npm
   npm install n8n -g
   n8n start
   ```

3. **Access N8N:**
   - Open http://localhost:5678
   - Create account (first user is admin)

4. **Create Workflow:**
   - Click "New Workflow"
   - Add nodes:
     - **Webhook** (trigger) → Configure as "POST"
     - **LinkedIn** → "Create Post"
     - **Twitter** → "Create Tweet"
   - Connect nodes: Webhook → LinkedIn, Webhook → Twitter

5. **Configure Nodes:**
   - **Webhook:** Copy the webhook URL
   - **LinkedIn:** Connect your LinkedIn account (OAuth)
   - **Twitter:** Connect your Twitter account (OAuth)

6. **Activate Workflow:**
   - Toggle "Active" switch
   - Copy webhook URL

7. **Configure Sanity Webhook:**
   - Sanity Dashboard → API → Webhooks
   - Create webhook pointing to N8N webhook URL
   - Filter: `_type == "post" && defined(publishedAt)`

**Cost:** 
- Self-hosted on Railway/Fly.io: **$0-5/month** (free tiers available)
- N8N Cloud: **$20/month** (managed, unlimited executions)

**Recommended for:** Users who want unlimited automation without monthly fees

---

### 🚀 Option 2: Zapier (Easiest - 5 minutes)

**Best for:** Quick setup, no coding

1. **Sign up for Zapier:** https://zapier.com (free trial)
2. **Create Zap 1 - LinkedIn:**
   - Trigger: "Webhooks by Zapier" → "Catch Hook"
   - Action: "LinkedIn" → "Create Post"
   - Connect your LinkedIn account
   - Map fields: Title, Description, URL
3. **Create Zap 2 - Twitter:**
   - Trigger: "Webhooks by Zapier" → "Catch Hook"  
   - Action: "Twitter" → "Create Tweet"
   - Connect your Twitter account
   - Map fields: Message (Title + URL)
4. **Get webhook URLs from Zapier**
5. **Configure Sanity webhook:**
   - Go to Sanity Dashboard → API → Webhooks
   - Create webhook pointing to Zapier URL
   - Filter: `_type == "post" && defined(publishedAt)`

**Cost:** $20/month (Starter plan)

---

### ⚡ Option 3: Make.com (Recommended - Free Tier Available)

**Best for:** Easy setup, free tier, visual workflow builder

**Quick Setup:**
1. **Sign up for Make:** https://make.com (free tier: 1,000 operations/month)
2. **Create Scenario:**
   - Module 1: "Webhooks" → "Custom webhook"
   - Module 2: "LinkedIn" → "Create a post"
   - Module 3: "Twitter" → "Create a tweet"
3. **Connect accounts:** Authorize LinkedIn and Twitter (OAuth handled automatically)
4. **Map fields:** Use data from webhook to format messages
5. **Activate scenario**
6. **Configure Sanity webhook** pointing to Make.com webhook URL

**Cost:** 
- Free: 1,000 operations/month (≈500 posts to both platforms)
- Core: $9/month for 10,000 operations (≈5,000 posts)

**See:** `docs/make-com-setup.md` for detailed step-by-step guide

---

### 💻 Option 4: Serverless Function (Most Control)

**Best for:** Full customization, free hosting

#### Prerequisites:
- Node.js knowledge
- API credentials for LinkedIn and Twitter

#### Step 1: Get API Credentials

**LinkedIn:**
1. Go to https://www.linkedin.com/developers/apps
2. Create app
3. Request "Marketing Developer Platform" access
4. Generate OAuth token (use LinkedIn's OAuth flow)
5. Get Person URN: `GET https://api.linkedin.com/v2/me`

**Twitter:**
1. Apply at https://developer.twitter.com
2. Create app/project
3. Generate API keys and tokens
4. Enable OAuth 1.0a

#### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to function directory
cd api/social-poster

# Install dependencies
npm install

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Go to: Project Settings → Environment Variables
```

#### Step 3: Configure Sanity Webhook

1. Sanity Dashboard → API → Webhooks
2. Create webhook:
   - URL: Your Vercel function URL
   - Filter: `_type == "post" && defined(publishedAt)`
   - Secret: (optional) Set and add to Vercel env vars

**Cost:** Free (Vercel free tier)

---

## Testing

1. **Publish a test post in Sanity**
2. **Check your social media accounts** - posts should appear within seconds
3. **Check logs:**
   - Zapier: Dashboard → Task History
   - Make: Scenarios → Execution history
   - Vercel: Dashboard → Functions → Logs

---

## Troubleshooting

### Posts Not Appearing

**Check:**
- ✅ Webhook is active in Sanity
- ✅ API credentials are correct
- ✅ OAuth tokens aren't expired
- ✅ Function/logs show no errors
- ✅ Social media accounts are connected

### Common Errors

**401 Unauthorized:**
- Token expired or invalid
- Regenerate OAuth token

**403 Forbidden:**
- Missing API permissions
- Request access to Marketing Developer Platform (LinkedIn)

**429 Rate Limited:**
- Too many requests
- Wait and retry

---

## Recommendation

**Best for most users:** **Make.com** - Free tier available, easy setup, handles OAuth automatically

**Best value (unlimited):** **N8N** (self-hosted) - Free hosting options, unlimited executions

**Fastest setup:** **Zapier** - Easiest but $20/month

**For developers:** **Serverless function** - Full control, free hosting, but requires API setup

**Comparison:**

| Feature | N8N (Self-hosted) | N8N Cloud | Zapier | Make | Serverless Function |
|---------|-------------------|-----------|--------|------|---------------------|
| Software Cost | FREE | $20/mo | $20/mo | $9/mo | FREE |
| Hosting Cost | $0-7/mo | Included | N/A | N/A | FREE (Vercel) |
| **Total Cost** | **$0-7/mo** | **$20/mo** | **$20/mo** | **$9/mo** | **FREE** |
| Setup Time | 15-30 min | 5 min | 5 min | 10 min | 30-60 min |
| Executions | Unlimited | Unlimited | 750/mo | 1K-10K/mo | Unlimited |
| Customization | High | High | Medium | High | Very High |
| OAuth Handling | Automatic | Automatic | Automatic | Automatic | Manual |
| Self-hosted | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes |

---

## Next Steps

1. Choose your preferred option
2. Follow the setup steps above
3. Test with a published post
4. Monitor and adjust message formatting as needed

For detailed documentation, see:
- `README.md` - Full serverless function setup
- `docs/social-media-automation.md` - Complete guide

