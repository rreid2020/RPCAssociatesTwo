# Deploy to Digital Ocean App Platform - Step by Step

This guide will walk you through deploying your RPC Associates website to Digital Ocean App Platform (Option 1).

## Prerequisites

- A Digital Ocean account (sign up at https://www.digitalocean.com)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- A credit card on file (App Platform has a free tier, but requires a card)

## Step 1: Prepare Your Code

1. **Make sure your code is ready:**
   ```bash
   # Test the build locally first
   npm run build
   ```

2. **Commit and push to Git:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

## Step 2: Create App in Digital Ocean

1. **Log in to Digital Ocean:**
   - Go to https://cloud.digitalocean.com
   - Sign in or create an account

2. **Navigate to App Platform:**
   - Click "Create" in the top right
   - Select "Apps"
   - Or go directly to https://cloud.digitalocean.com/apps

3. **Connect Your Repository:**
   - Click "GitHub", "GitLab", or "Bitbucket" (depending on where your code is)
   - Authorize Digital Ocean to access your repositories
   - Select your repository
   - Select the branch (usually `main` or `master`)
   - Click "Next"

## Step 3: Configure Build Settings

Digital Ocean should auto-detect your app type, but verify these settings:

1. **App Type:**
   - Should detect as "Web Service" or "Static Site"
   - If it detects as "Web Service", that's fine - we'll configure it correctly

2. **Build Settings:**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Run Command:** `npx serve -s dist -l 8080`
   - **HTTP Port:** `8080`

3. **If you see "Edit Plan" or "Resources":**
   - Select the **Basic** plan
   - Choose the smallest instance size (Basic - $5/month or Starter - $0/month if available)
   - For a static site, the smallest size is usually sufficient

4. **Environment Variables (Optional):**
   - Add `NODE_ENV=production` if not already set
   - Add any other environment variables you need

5. **Click "Next"** or "Create Resources"

## Step 4: Review and Deploy

1. **Review your configuration:**
   - Check the app name (you can change it)
   - Verify build settings
   - Review the plan and pricing

2. **Click "Create Resources"** or "Deploy"

3. **Wait for deployment:**
   - Digital Ocean will:
     - Install dependencies (`npm install`)
     - Build your app (`npm run build`)
     - Start the server
   - This usually takes 2-5 minutes
   - You can watch the build logs in real-time

## Step 5: Access Your Site

1. **Once deployment completes:**
   - Your app will be live at: `https://your-app-name-xxxxx.ondigitalocean.app`
   - The URL is shown in the App Platform dashboard

2. **Test your site:**
   - Click the "Live App" link in the dashboard
   - Or visit the URL directly
   - Verify all pages and functionality work

## Step 6: Add Custom Domain (Optional)

1. **In the App Platform dashboard:**
   - Go to "Settings" → "Domains"
   - Click "Add Domain"

2. **Enter your domain:**
   - Type your domain name (e.g., `rpcassociates.com`)
   - Click "Add Domain"

3. **Update DNS Records:**
   - Digital Ocean will show you the DNS records to add
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add a CNAME record:
     - **Type:** CNAME
     - **Name:** @ (or your subdomain)
     - **Value:** The value provided by Digital Ocean
   - Wait for DNS propagation (5 minutes to 48 hours, usually 15-30 minutes)

4. **SSL Certificate:**
   - Digital Ocean automatically provisions SSL certificates via Let's Encrypt
   - Once DNS propagates, your site will be available at `https://yourdomain.com`

## Step 7: Automatic Deployments

App Platform automatically deploys when you push to your connected branch:

1. **Make changes to your code:**
   ```bash
   git add .
   git commit -m "Update content"
   git push origin main
   ```

2. **Digital Ocean will automatically:**
   - Detect the push
   - Start a new build
   - Deploy the updated version
   - You'll see the deployment in the "Activity" tab

## Managing Your App

### View Logs
- Go to your app in the dashboard
- Click "Runtime Logs" to see application logs
- Click "Build Logs" to see build output

### Environment Variables
- Go to "Settings" → "App-Level Environment Variables"
- Add, edit, or remove variables
- Changes require a redeploy

### Scaling
- Go to "Settings" → "App Spec" or "Components"
- Adjust instance count or size
- Changes apply on next deployment

### Rollback
- Go to "Activity" tab
- Find a previous successful deployment
- Click "Rollback" to revert to that version

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Check that all dependencies are in `package.json`
- Verify `npm install` completes successfully
- Check build logs for specific errors

**Error: "Build command failed"**
- Test build locally: `npm run build`
- Check for TypeScript errors: `npm run build`
- Review build logs in App Platform

### Site Not Loading

**404 Errors:**
- Verify the "Output Directory" is set to `dist`
- Check that `dist` folder is created during build
- Ensure `index.html` exists in `dist`

**Blank Page:**
- Check browser console for errors
- Verify all assets are loading
- Check runtime logs in App Platform

### Logo Not Showing

- Ensure `src/assets/rpc-logo.png` exists
- Check that the file is committed to Git
- Verify the import path in `Header.tsx`

## Cost Estimate

- **Starter Plan:** $0/month (limited resources, good for testing)
- **Basic Plan:** $5-12/month (recommended for production)
- **Custom Domain:** Free (included)
- **SSL Certificate:** Free (automatic via Let's Encrypt)

## Next Steps

1. ✅ Deploy to App Platform
2. ✅ Test your live site
3. ✅ Add custom domain (optional)
4. ✅ Set up monitoring (optional)
5. ✅ Configure backups (optional, in Settings)

## Support

- **Digital Ocean Docs:** https://docs.digitalocean.com/products/app-platform/
- **Community:** https://www.digitalocean.com/community
- **Support:** Available in your Digital Ocean dashboard

---

**Quick Deploy Checklist:**
- [ ] Code pushed to Git repository
- [ ] Digital Ocean account created
- [ ] App created in App Platform
- [ ] Repository connected
- [ ] Build settings configured (Build: `npm run build`, Output: `dist`, Run: `npx serve -s dist -l 8080`)
- [ ] App deployed successfully
- [ ] Site tested and working
- [ ] Custom domain added (optional)

