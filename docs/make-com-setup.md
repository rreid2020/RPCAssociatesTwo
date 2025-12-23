# Make.com Setup Guide for Social Media Automation

Make.com (formerly Integromat) is a great choice for automating social media posts from Sanity. This guide will walk you through setting it up step-by-step.

## Why Make.com?

- ✅ **Free tier available** - 1,000 operations/month (may be enough)
- ✅ **Easy setup** - Visual workflow builder
- ✅ **Handles OAuth** - Automatically manages LinkedIn/Twitter authentication
- ✅ **Reliable** - Well-established platform
- ✅ **No server needed** - Fully managed

## Cost

- **Free Plan:** $0/month - 1,000 operations/month
- **Core Plan:** $9/month - 10,000 operations/month
- **Pro Plan:** $29/month - 40,000 operations/month

**Note:** Each social media post = 1 operation. So 1,000 operations = ~500 posts to both LinkedIn and Twitter.

## Step-by-Step Setup

### Step 1: Sign Up for Make.com

1. Go to https://make.com
2. Click "Sign up" (free account available)
3. Create your account
4. You'll start with the free tier (1,000 operations/month)

### Step 2: Create a New Scenario

1. In Make.com dashboard, click **"Create a new scenario"**
2. Name it: **"Sanity to Social Media"**
3. Click **"Save"**

### Step 3: Add Webhook Module (Trigger)

1. Click the **"+"** button to add a module
2. Search for **"Webhooks"**
3. Select **"Custom webhook"**
4. Click **"Add"**

**Configure the webhook:**
- **Webhook name:** "Sanity Post Published"
- **Data structure:** Leave as "Automatic" (Make will detect it)
- Click **"Save"**

**Important:** Copy the webhook URL that Make generates - you'll need this for Sanity!

The URL will look like:
```
https://hook.integromat.com/xxxxxxxxxxxxxxxxxxxxx
```

**Note:** You can continue setting up LinkedIn and Twitter modules now, even before configuring Sanity. You'll just use expected field names (like `{{1.title}}`). After you set up the Sanity webhook and test it, you can adjust the field names if needed.

### Step 4: Test the Webhook (Optional but Recommended)

**Option A: Set up Sanity webhook first, then test**
1. Complete Steps 5-8 (LinkedIn and Twitter setup)
2. Set up Sanity webhook (Step 9)
3. Publish a test post in Sanity
4. Check Make.com to see the actual data structure

**Option B: Configure with expected field names**
1. Continue with LinkedIn/Twitter setup using expected field names
2. Set up Sanity webhook later
3. Adjust field names after seeing actual data structure

### Step 5: Add LinkedIn Module

1. Click **"+"** after the webhook module
2. Search for **"LinkedIn"**
3. Select **"LinkedIn"** module
4. Click **"Add"**

**First time setup - Connect LinkedIn:**
1. Click **"Add"** next to "Connection"
2. Click **"Create a connection"**
3. You'll be redirected to LinkedIn to authorize
4. Sign in and authorize Make.com
5. You'll be redirected back to Make.com

**Configure LinkedIn Post:**

**Finding the Right Action:**
- Look for an **"Action"** dropdown field in the LinkedIn module
- Common action names in Make.com LinkedIn module:
  - **"Create a post"** (most common - use this one)
  - "Create a User Text Post"
  - "Create a User Article Post"
  - "Share an article"
- If you see multiple options, choose **"Create a post"** or the one that says it shares text/URLs

**If you don't see an Action dropdown:**
- The module might auto-detect the action
- Look for a **"Content"** field (this is what you need to fill)

**Content Field (Required):**
1. Find the **"Content"** field (large text area, marked with red asterisk if required)
2. Click inside the Content field
3. Look for a **mapping icon** (usually looks like `</>`, `{}`, or a small icon with brackets)
   - It might be on the right side of the field
   - Or at the bottom of the field
   - Or in a toolbar above the field
4. Click the mapping icon to open the data mapper
5. In the mapper, you'll see data from your webhook module
6. Build this template by clicking on fields or typing directly:
   ```
   {{1.title}}
   
   {{1.excerpt}}
   
   Read more: https://rpcassociates.co/articles/{{1.slug.current}}
   ```

**Alternative method (if you can't find mapping icon):**
- Type directly in the Content field
- Use `{{1.title}}` syntax to reference webhook data
- Make.com will auto-suggest available fields as you type `{{1.`
- You can also click on suggested fields to insert them

**Other Fields:**
- **Visibility:** Set to **"Anyone"** or **"Public"** (makes posts public)
- **Media Type:** Leave empty or set to "Article" if available
- **Mentions:** Leave empty (optional)
- Click **"Save"**

**Troubleshooting:**
- **Can't find Content field?** Look for "Text", "Message", or "Post Content" fields
- **Can't find mapping icon?** Type `{{1.` and Make.com will show available fields
- **"Value must not be empty" error?** Make sure you've entered text in the Content field
- **Not sure about field names?** Use `{{1.title}}` for now - you can adjust after testing

### Step 6: Add Twitter Module

1. Click **"+"** after the LinkedIn module
2. Search for **"Twitter"**
3. Select **"Twitter"** module
4. Click **"Add"**

**First time setup - Connect Twitter:**
1. Click **"Add"** next to "Connection"
2. Click **"Create a connection"**
3. You'll be redirected to Twitter/X to authorize
4. Sign in and authorize Make.com
5. You'll be redirected back to Make.com

**Configure Twitter Tweet:**
- **Action:** "Create a tweet"
- **Text:** Click the mapping icon and create this template:
  ```
  {{1.title}} https://rpcassociates.co/articles/{{1.slug.current}}
  ```
  
  **Note:** Twitter has a 280 character limit. If your titles are long, you may want to truncate:
  ```
  {{substring(1.title; 0; 240)}}... https://rpcassociates.co/articles/{{1.slug.current}}
  ```

- Click **"OK"**

### Step 7: Configure Error Handling (Optional but Recommended)

1. Click the **settings icon** (gear) on each module
2. Enable **"Error handling"**
3. Set to **"Ignore errors"** or **"Stop scenario"** (your choice)

This prevents one failed post from stopping the other.

### Step 8: Activate the Scenario

1. Toggle the **"Inactive"** switch to **"Active"** (top right)
2. Your scenario is now live and waiting for webhooks!

### Step 9: Configure Sanity Webhook

**When to do this:**
- You can do this **after** setting up Make.com modules (Steps 5-8) OR
- You can do this **before** to test the webhook and see the actual data structure
- Either way works - you'll just need to adjust field names if they differ

**Setup Steps:**

1. **Go to Sanity Dashboard:**
   - https://www.sanity.io/manage
   - Select your project

2. **Navigate to API → Webhooks:**
   - Click **"Create webhook"**

3. **Configure the webhook:**
   - **Name:** "Make.com Social Media Poster"
   - **URL:** Paste your Make.com webhook URL (from Step 3)
     - Copy it from Make.com webhook module settings
   - **Dataset:** `production` (or your dataset name)
   - **Trigger on:** Check `Create` and `Update`
   - **Filter:** 
     ```
     _type == "post" && defined(publishedAt)
     ```
   - **HTTP method:** `POST`
   - **HTTP Headers:** (optional) Leave empty
   - **Secret:** (optional) Leave empty for now

4. **Click "Save"**

**After setting up Sanity webhook:**
- Publish a test post in Sanity
- Check Make.com webhook module to see the actual data structure
- Adjust field names in LinkedIn/Twitter modules if needed

## Testing

1. **Publish a test post in Sanity:**
   - Go to your Sanity Studio
   - Create or edit a post
   - Set `publishedAt` date
   - Publish

2. **Check Make.com:**
   - Go to your scenario
   - Click **"Operations"** tab
   - You should see a new execution
   - Click it to see details
   - Check if both LinkedIn and Twitter modules executed successfully

3. **Check social media:**
   - LinkedIn: Check your profile for the new post
   - Twitter/X: Check your feed for the new tweet

## Troubleshooting

### Webhook Not Receiving Data

**Check:**
- ✅ Scenario is **Active** in Make.com
- ✅ Webhook URL in Sanity matches Make.com webhook URL
- ✅ Sanity webhook is **Active**
- ✅ Filter in Sanity webhook is correct: `_type == "post" && defined(publishedAt)`

**Debug:**
- In Make.com, check the webhook module - it should show received data
- In Sanity, check webhook delivery logs (if available)

### Posts Not Appearing on Social Media

**Check:**
- ✅ LinkedIn/Twitter connections are authorized
- ✅ Check Make.com execution logs for errors
- ✅ Verify message format is correct
- ✅ Check if you've hit operation limits (free tier: 1,000/month)

**Common Errors:**
- **401 Unauthorized:** Re-authorize LinkedIn/Twitter connection
- **403 Forbidden:** Check API permissions
- **429 Rate Limited:** Too many requests - wait and retry

### Message Format Issues

**Problem:** Posts have wrong format or missing data

**Solution:**
1. Check the webhook data structure in Make.com
2. Adjust the mapping in LinkedIn/Twitter modules
3. Use Make.com's data mapper to see available fields

**Example mapping:**
- If Sanity sends: `{ title: "...", excerpt: "...", slug: { current: "..." } }`
- Use: `{{1.title}}`, `{{1.excerpt}}`, `{{1.slug.current}}`

### Operation Limit Reached

**Problem:** "Operations limit reached" error

**Solution:**
- Free tier: 1,000 operations/month
- Each post = 2 operations (LinkedIn + Twitter)
- So free tier = ~500 posts/month
- Upgrade to Core plan ($9/month) for 10,000 operations

## Advanced Configuration

### Conditional Posting

Only post if certain conditions are met:

1. Add **"Router"** module after webhook
2. Add filter conditions:
   - Only post if `publishedAt` exists
   - Only post if not draft
   - Only post for specific categories

### Scheduled Posting

Delay posts or schedule for later:

1. Add **"Sleep"** module after webhook
2. Set delay (e.g., 5 minutes)
3. Then post to social media

### Multiple Social Platforms

Add more modules:
- Facebook
- Instagram
- Mastodon
- etc.

### Custom Message Formatting

Use Make.com's functions:
- `substring()` - Truncate text
- `replace()` - Replace text
- `concat()` - Combine strings
- `formatDate()` - Format dates

**Example:**
```
{{concat(substring(1.title; 0; 200); "... Read more: "; "https://rpcassociates.co/articles/"; 1.slug.current)}}
```

## Monitoring

### Check Operations Usage

1. Go to Make.com dashboard
2. Click **"Billing"** or **"Usage"**
3. See how many operations you've used
4. Monitor to avoid hitting limits

### Set Up Alerts

1. Go to scenario settings
2. Enable **"Error notifications"**
3. Get email alerts if scenario fails

## Cost Optimization

**Free Tier (1,000 operations/month):**
- Each post = 2 operations (LinkedIn + Twitter)
- = ~500 posts/month
- = ~16 posts/day

**If you need more:**
- Core Plan: $9/month = 10,000 operations = ~5,000 posts/month

## Next Steps

1. ✅ Set up Make.com scenario (Steps 1-8)
2. ✅ Configure Sanity webhook (Step 9)
3. ✅ Test with a published post
4. ✅ Monitor operations usage
5. ✅ Adjust message formatting as needed

## Support Resources

- **Make.com Docs:** https://www.make.com/en/help
- **Make.com Community:** https://community.make.com
- **Sanity Webhooks:** https://www.sanity.io/docs/webhooks

## Quick Reference

**Make.com Webhook URL:** (Copy from Step 3)
```
https://hook.integromat.com/xxxxxxxxxxxxxxxxxxxxx
```

**Sanity Webhook Filter:**
```
_type == "post" && defined(publishedAt)
```

**LinkedIn Message Template:**
```
{{1.title}}

{{1.excerpt}}

Read more: https://rpcassociates.co/articles/{{1.slug.current}}
```

**Twitter Message Template:**
```
{{1.title}} https://rpcassociates.co/articles/{{1.slug.current}}
```

---

That's it! Your social media automation is now set up. Every time you publish a post in Sanity, it will automatically post to LinkedIn and Twitter via Make.com.

