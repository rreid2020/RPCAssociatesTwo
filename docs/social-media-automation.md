# Social Media Automation Setup

This guide explains how to automatically post to LinkedIn and Twitter/X when content is published in Sanity.

## Overview

When you publish a post in Sanity, a webhook triggers a serverless function that:
1. Receives the published post data
2. Formats messages for LinkedIn and Twitter
3. Posts to both platforms automatically

## Architecture

```
Sanity CMS → Webhook → Serverless Function → LinkedIn API
                                    ↓
                              Twitter/X API
```

## Quick Start Options

### Option 1: N8N (Recommended - Unlimited Executions)

**Pros:**
- ✅ Unlimited workflows and executions
- ✅ Open source
- ✅ More powerful than Zapier/Make
- ✅ Can run on free/cheap hosting ($0-7/month)
- ✅ Or use managed N8N Cloud ($20/month)
- ✅ Handles OAuth automatically

**Cons:**
- ⚠️ Requires hosting (free tiers available on Railway/Render/Fly.io)
- ⚠️ Slightly more technical than Zapier (if self-hosting)

**Hosting Options:**
- **N8N Cloud:** $20/month (managed, easiest)
- **Railway:** $0-5/month (free tier available)
- **Render:** $0-7/month (free tier available)
- **Fly.io:** $0-5/month (free tier available)

**Setup:**
1. Choose hosting (N8N Cloud or self-hosted)
2. Create workflow with Webhook → LinkedIn → Twitter nodes
3. Connect social media accounts via OAuth
4. Configure Sanity webhook to trigger N8N

**See:** `docs/n8n-setup.md` for detailed N8N setup

**Cost:** $0-20/month depending on hosting choice

---

### Option 2: Serverless Function (Full Control)

**Pros:**
- Full control over posting logic
- Customizable messages
- Free tier available (Vercel, Netlify)

**Cons:**
- Requires API setup
- Need to manage OAuth tokens

**See:** `api/social-poster/README.md` for setup instructions

### Option 3: Zapier (No-Code)

**Pros:**
- No coding required
- Handles OAuth automatically
- Easy to set up

**Cons:**
- Monthly cost ($20+/month)
- Less customization

**Setup:**
1. Go to https://zapier.com
2. Create account
3. Create Zap: "Sanity" → "LinkedIn" (Create Post)
4. Create Zap: "Sanity" → "Twitter" (Create Tweet)
5. Connect your Sanity project
6. Configure message templates

### Option 4: Make.com (Recommended - Free Tier)

**Pros:**
- ✅ Free tier available (1,000 operations/month)
- ✅ Easy visual workflow builder
- ✅ Handles OAuth automatically
- ✅ More flexible than Zapier
- ✅ Better for complex workflows

**Cons:**
- ⚠️ Free tier limited to 1,000 operations/month
- ⚠️ Slightly steeper learning curve than Zapier

**Setup:**
1. Go to https://make.com
2. Create scenario
3. Add Webhook module (trigger)
4. Add LinkedIn module (Create post)
5. Add Twitter module (Create tweet)
6. Connect accounts via OAuth
7. Map fields from webhook
8. Activate scenario
9. Configure Sanity webhook

**See:** `docs/make-com-setup.md` for detailed step-by-step guide

**Cost:** $0/month (free tier) or $9/month (Core plan)

## Recommended: Serverless Function Setup

### Step 1: Get API Credentials

#### LinkedIn
1. Create app at https://www.linkedin.com/developers/apps
2. Request "Marketing Developer Platform" access
3. Generate OAuth token
4. Get your Person URN via API

#### Twitter/X
1. Apply at https://developer.twitter.com
2. Create app/project
3. Generate API keys and tokens
4. Enable OAuth 1.0a

### Step 2: Deploy Function

Choose a platform:

- **Vercel** (Recommended): Free, easy deployment
- **Netlify Functions**: Free tier available
- **Digital Ocean Functions**: If you're already using DO
- **AWS Lambda**: Enterprise option

### Step 3: Configure Sanity Webhook

1. Sanity Dashboard → API → Webhooks
2. Create webhook pointing to your function URL
3. Set filter: `_type == "post" && defined(publishedAt)`
4. Test with a published post

## Message Formatting

The function automatically formats messages:

**LinkedIn:**
- Title + Excerpt + URL
- Max 3000 characters

**Twitter/X:**
- Title (truncated) + URL
- Max 280 characters (URL counts as 23)

## Customization

Edit `api/social-poster/index.js` to:
- Change message format
- Add hashtags
- Include images
- Add conditional logic
- Post to additional platforms

## Troubleshooting

### Posts Not Appearing
- Check function logs
- Verify API credentials
- Check webhook is firing in Sanity
- Verify OAuth tokens aren't expired

### Rate Limits
- LinkedIn: ~100 posts/day
- Twitter: ~300 tweets/day (varies by account type)

### Error Messages
- **401:** Invalid or expired token
- **403:** Missing permissions
- **429:** Rate limited - wait and retry

## Security Best Practices

1. **Never commit API keys to Git**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Use webhook secrets**
   - Set `SANITY_WEBHOOK_SECRET`
   - Verify in function

3. **Rotate tokens regularly**
   - LinkedIn tokens expire
   - Twitter tokens are long-lived but should be rotated

4. **Limit function access**
   - Use platform authentication
   - Whitelist Sanity IPs if possible

## Cost Estimate

**Serverless Function:**
- Vercel: Free (100GB bandwidth/month)
- Netlify: Free (125k requests/month)
- AWS Lambda: ~$0.20 per million requests

**Zapier:**
- Starter: $20/month (750 tasks)
- Professional: $50/month (2,000 tasks)

**Make:**
- Free: 1,000 operations/month
- Core: $9/month (10,000 operations)

## Next Steps

1. Choose your preferred option
2. Set up API credentials
3. Deploy function (if using serverless)
4. Configure Sanity webhook
5. Test with a published post
6. Monitor and adjust as needed

For detailed setup instructions, see `api/social-poster/README.md`.

