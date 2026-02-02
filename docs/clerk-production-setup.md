# Clerk Authentication Setup for Production (Digital Ocean)

This guide covers setting up Clerk authentication for the client portal in your Digital Ocean production environment.

## Prerequisites

- A Clerk account (sign up at https://clerk.com)
- Access to your Digital Ocean App Platform dashboard
- Your production domain configured

## Step 1: Configure Your Existing Clerk Application

You're using the **RPCTaxGPT** application on Clerk's Free Plan. This is perfect for getting started!

1. **Access Your Clerk Application:**
   - Go to https://dashboard.clerk.com
   - Select your **RPCTaxGPT** application (romantic-stallion-82.clerk...)

2. **Get Your Publishable Key:**
   - In your Clerk dashboard, go to **API Keys**
   - Copy the **Publishable Key** (will start with `pk_test_...` on the Free Plan)
   - **Note:** On the Free Plan, you'll use `pk_test_...` keys even for production - this is perfectly fine and secure. Production keys (`pk_live_...`) are only available on paid plans.

3. **Configure Allowed Origins:**
   - In your Clerk dashboard, go to **Settings** (left sidebar)
   - Click on **Allowed Origins** (or look for "Frontend API" → "Allowed Origins")
   - Add your production domain(s) one by one:
     - `https://rpcassociates.co`
     - `https://www.rpcassociates.co`
   - Also keep `http://localhost:5173` for local development if it's not already there
   - Click **Add** or **Save** after each domain
   - This ensures Clerk only accepts requests from your authorized domains
   
   **Note:** The "Domains" section you might see is for configuring Clerk's own domain (like romantic-stallion-82.clerk.accounts.dev). You need "Allowed Origins" which is different - it's where you whitelist YOUR website domains.

4. **Configure Redirect URLs:**
   - Go to **Settings** → **Paths**
   - Set **Sign-in redirect URL:** `/portal/dashboard`
   - Set **Sign-up redirect URL:** `/portal/dashboard`
   - Set **After sign-out URL:** `/portal/sign-in`

## Step 2: Add Environment Variable to Digital Ocean

1. **Log in to Digital Ocean:**
   - Go to https://cloud.digitalocean.com
   - Navigate to your App Platform app (the one hosting your marketing site)

2. **Add Environment Variable:**
   - Go to **Settings** → **App-Level Environment Variables**
   - Click **Edit** or **Add Variable**
   - Add the following:
     - **Key:** `VITE_CLERK_PUBLISHABLE_KEY`
     - **Value:** Your Clerk publishable key from RPCTaxGPT app (will be `pk_test_...`)
     - **Scope:** `BUILD_TIME` (required for Vite to include it in the build)
     - Click **Save**
   
   **Important:** The key you're using is likely: `pk_test_cm9tYW50aWMtc3RhbGxpb24tODIuY2xlcmsuYWNjb3VudHMuZGV2JA` (from your local .env file)

3. **Verify Variable Scope:**
   - Make sure `VITE_CLERK_PUBLISHABLE_KEY` is set to **BUILD_TIME** scope
   - This is critical because Vite needs the variable at build time to embed it in the client bundle
   - Runtime variables won't work for Vite environment variables

## Step 3: Update Your Environment Variables File

Your `env-variables-for-digital-ocean.txt` already includes the Clerk key. The value should be:

```bash
# Clerk Authentication (BUILD_TIME scope)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_cm9tYW50aWMtc3RhbGxpb24tODIuY2xlcmsuYWNjb3VudHMuZGV2JA
```

**Note:** Since you're on Clerk's Free Plan, you'll use the `pk_test_...` key for both development and production. This is secure and works perfectly fine. Production keys (`pk_live_...`) are only available on paid Clerk plans.

## Step 4: Redeploy Your Application

After adding the environment variable:

1. **Trigger a New Deployment:**
   - Option A: Push a new commit to your connected branch
   - Option B: Go to **Settings** → **Deployments** → **Create Deployment** → **Deploy Latest Commit**

2. **Monitor the Build:**
   - Watch the build logs to ensure it completes successfully
   - The build should include the Clerk key in the bundle

3. **Verify Deployment:**
   - Once deployed, test the portal:
     - Visit `https://yourdomain.com/portal/sign-in`
     - Try signing up or signing in
     - Verify authentication works correctly

## Step 5: Test Authentication Flow

1. **Test Sign Up:**
   - Go to `/portal/sign-up`
   - Create a test account
   - Verify email if required
   - Should redirect to `/portal/dashboard`

2. **Test Sign In:**
   - Sign out
   - Go to `/portal/sign-in`
   - Sign in with your test account
   - Should redirect to `/portal/dashboard`

3. **Test Protected Routes:**
   - Try accessing `/portal/dashboard` while signed out
   - Should redirect to `/portal/sign-in`
   - After signing in, should access the dashboard

## Step 6: Configure Additional Clerk Settings (Optional)

### Email Templates
- Go to **Settings** → **Email Templates**
- Customize sign-in, sign-up, and password reset emails
- Add your branding

### Social OAuth (Optional)
- Go to **Settings** → **Social Connections**
- Enable Google, GitHub, or other OAuth providers
- Configure redirect URLs

### User Management
- Go to **Users** in Clerk dashboard
- View and manage user accounts
- Set up user metadata if needed

## Troubleshooting

### Authentication Not Working

**Issue: "VITE_CLERK_PUBLISHABLE_KEY is not set"**
- Verify the environment variable is set in Digital Ocean
- Ensure it's set to **BUILD_TIME** scope, not RUN_TIME
- Redeploy the application after adding the variable

**Issue: "Invalid publishable key"**
- Verify you copied the correct key from Clerk dashboard
- Check that the key starts with `pk_test_...` or `pk_live_...`
- Ensure there are no extra spaces or characters

**Issue: "CORS error" or "Origin not allowed"**
- Go to Clerk dashboard → **Settings** → **Domains**
- Add your production domain to allowed origins
- Ensure the domain matches exactly (including https://)

**Issue: "Redirect URL mismatch"**
- Check Clerk dashboard → **Settings** → **Paths**
- Verify redirect URLs match your application routes
- Default should be `/portal/dashboard` for sign-in/sign-up

### Build Issues

**Issue: Build fails after adding environment variable**
- Check build logs for specific errors
- Verify the environment variable name is exactly `VITE_CLERK_PUBLISHABLE_KEY`
- Ensure the value doesn't contain quotes or special characters that need escaping

**Issue: Variable not available in build**
- Confirm the variable scope is set to **BUILD_TIME**
- App-level variables work for all components
- Component-level variables need to be set per component

## Environment Variable Reference

### Required for Production

```bash
# Clerk Authentication (BUILD_TIME scope - required)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your-production-key-here
```

### Optional Clerk Configuration

These can be configured in the Clerk dashboard instead of environment variables:

- Allowed origins (domains)
- Redirect URLs
- Email templates
- OAuth providers

## Security Best Practices

1. **Using Test Keys in Production:**
   - On Clerk's Free Plan, you'll use `pk_test_...` keys for both dev and production
   - This is **perfectly secure** - the "test" label is just a naming convention
   - Production keys (`pk_live_...`) are only available on paid plans ($25+/month)
   - Your `pk_test_...` key is just as secure as a production key

2. **Never Commit Keys:**
   - Keep `.env` files in `.gitignore`
   - Never commit publishable keys to Git
   - Use environment variables in Digital Ocean

3. **Restrict Domains:**
   - Always configure allowed origins in Clerk
   - Only allow your production domains
   - Remove localhost from production allowed origins

4. **Monitor Usage:**
   - Check Clerk dashboard for unusual activity
   - Review user sign-ups and sign-ins
   - Set up alerts if needed

## Cost Considerations

- **Clerk Free Tier:**
  - Up to 10,000 monthly active users (MAU)
  - Unlimited API calls
  - Basic authentication features

- **Clerk Paid Plans:**
  - Start at $25/month for Pro
  - Includes production keys (`pk_live_...`)
  - Additional features and support

## Next Steps

1. ✅ Set up Clerk production application
2. ✅ Add `VITE_CLERK_PUBLISHABLE_KEY` to Digital Ocean (BUILD_TIME scope)
3. ✅ Configure allowed origins in Clerk
4. ✅ Set redirect URLs in Clerk
5. ✅ Redeploy application
6. ✅ Test authentication flow
7. ✅ Monitor user sign-ups

## Support

- **Clerk Documentation:** https://clerk.com/docs
- **Clerk Support:** Available in dashboard
- **Digital Ocean Docs:** https://docs.digitalocean.com/products/app-platform/
