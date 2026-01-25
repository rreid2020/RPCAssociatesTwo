# App Platform SSL & Redirect Verification

Since you're using **Digital Ocean App Platform**, SSL certificates are automatically provisioned. Here's how to verify everything is working correctly.

## ✅ SSL Certificates (Automatic)

Your SSL certificates are **already set up** automatically by Digital Ocean App Platform. No action needed!

### Verify SSL is Working:

1. **Visit your site:**
   - `https://rpcassociates.co` - Should show a padlock icon
   - `https://www.rpcassociates.co` - Should also show a padlock icon

2. **Check certificate details:**
   - Click the padlock icon in your browser
   - Verify it's issued by "Let's Encrypt" or "Digital Ocean"
   - Check expiration date (should be ~90 days, auto-renewed)

## 🔄 Redirects (May Need Configuration)

App Platform may not automatically handle all redirects. Check these:

### 1. HTTP to HTTPS Redirect

**Test:** Visit `http://rpcassociates.co` (without https)

**Expected:** Should automatically redirect to `https://rpcassociates.co`

**If not working:** App Platform should handle this automatically, but if it doesn't:
- Check your App Platform settings
- The `CanonicalRedirect` component we added should help with client-side redirects

### 2. WWW to Non-WWW Redirect

**Test:** Visit `https://www.rpcassociates.co`

**Expected:** Should redirect to `https://rpcassociates.co`

**If not working automatically:** You have two options:

#### Option A: Configure in App Platform (Recommended)

1. Go to your App → Settings → Domains
2. Check if there's a "Redirect" or "Primary Domain" setting
3. Set `rpcassociates.co` as the primary domain
4. Enable redirect from www to non-www if available

#### Option B: Handle in Application Code (Already Done)

The `CanonicalRedirect` component we added will handle this client-side:
- It detects www in the URL
- Automatically redirects to non-www version
- This happens in the browser before the page loads

### 3. Query Parameter Cleanup

The `CanonicalRedirect` component also:
- Removes unwanted query parameters from URLs
- Preserves UTM parameters for tracking
- Ensures clean canonical URLs

## 🧪 Testing Checklist

Run these tests to verify everything is working:

### Test 1: HTTPS Access
- [ ] `https://rpcassociates.co` loads correctly
- [ ] Padlock icon shows in browser
- [ ] No SSL warnings

### Test 2: HTTP Redirect
- [ ] `http://rpcassociates.co` redirects to `https://rpcassociates.co`
- [ ] `http://www.rpcassociates.co` redirects to `https://rpcassociates.co`

### Test 3: WWW Redirect
- [ ] `https://www.rpcassociates.co` redirects to `https://rpcassociates.co`
- [ ] Redirect happens quickly (within 1-2 seconds)

### Test 4: Canonical URLs
- [ ] Check page source: `<link rel="canonical" href="https://rpcassociates.co/...">`
- [ ] Canonical URL should be non-www
- [ ] No query parameters in canonical URL

### Test 5: Google Search Console
- [ ] After deployment, wait 24-48 hours
- [ ] Check Google Search Console for redirect issues
- [ ] Request re-indexing for affected pages
- [ ] Use "Validate Fix" button after fixes are deployed

## 🔍 How to Check Current Status

### In Digital Ocean Dashboard:

1. **Go to your App → Settings → Domains**
2. **Check domain status:**
   - Should show "Active" or "Verified" for both domains
   - SSL status should show "Active" or "Valid"

3. **Check DNS records:**
   - Verify CNAME records are correctly configured
   - Both `rpcassociates.co` and `www.rpcassociates.co` should point to App Platform

### Using Browser Developer Tools:

1. **Open browser DevTools (F12)**
2. **Go to Network tab**
3. **Visit your site**
4. **Check redirects:**
   - Look for 301 or 302 status codes
   - Verify redirect URLs are correct

### Using Online Tools:

1. **SSL Checker:**
   - https://www.ssllabs.com/ssltest/analyze.html?d=rpcassociates.co
   - Should show A+ rating

2. **Redirect Checker:**
   - https://httpstatus.io/
   - Test both `http://` and `https://www.` versions

## 🛠️ If Redirects Aren't Working

### Check App Platform Settings:

1. **Go to App → Settings → Domains**
2. **Look for:**
   - "Primary Domain" setting
   - "Redirect" options
   - "Domain Rules" or "Routing Rules"

3. **Contact Digital Ocean Support:**
   - They can configure redirects at the platform level
   - This is more reliable than client-side redirects

### Verify Application Code:

The code we've already added should handle redirects:

1. **`CanonicalRedirect` component** - Handles www and query params
2. **`SEO` component** - Ensures canonical URLs are non-www
3. **`nginx.conf`** - Has redirect rules (though App Platform may not use this)

## 📝 Next Steps

1. **Test all redirects** using the checklist above
2. **Wait 24-48 hours** after deployment
3. **Check Google Search Console** for any remaining issues
4. **Request re-indexing** for pages that had redirect issues
5. **Monitor** for a few days to ensure everything is working

## ✅ Summary

- **SSL Certificates:** ✅ Automatic (already done)
- **HTTP to HTTPS:** ✅ Should be automatic (test to verify)
- **WWW to Non-WWW:** ⚠️ May need App Platform config or handled by `CanonicalRedirect`
- **Canonical URLs:** ✅ Already fixed in code
- **Query Parameters:** ✅ Handled by `CanonicalRedirect` component

Your SSL is set up! Just verify the redirects are working as expected.
