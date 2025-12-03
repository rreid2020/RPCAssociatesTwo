# Quick Deploy to Digital Ocean App Platform

## Prerequisites Checklist
- [ ] Digital Ocean account (sign up at https://www.digitalocean.com)
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] Credit card on file (for account verification)

## 5-Minute Deployment

### Step 1: Push Your Code (if not already done)
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create App in Digital Ocean

1. Go to: https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select your repository and branch (`main`)

### Step 3: Configure Build Settings

When Digital Ocean asks for build settings, use these:

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Run Command:** `npx serve -s dist -l 8080`
- **HTTP Port:** `8080`

**OR** if it auto-detects as a static site:
- Just verify the output directory is `dist`

### Step 4: Deploy

1. Click **"Next"** or **"Create Resources"**
2. Wait 2-5 minutes for build to complete
3. Your site will be live at: `https://your-app-name-xxxxx.ondigitalocean.app`

### Step 5: Test

Visit your live URL and verify everything works!

## That's It! 🎉

Your site is now live. For detailed instructions, custom domains, and troubleshooting, see `APP_PLATFORM_DEPLOY.md`.

