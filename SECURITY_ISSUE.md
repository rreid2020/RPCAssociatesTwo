# Security Issue: Unauthorized Redirect to bedpage.com

## Problem
Your website is redirecting to bedpage.com, which is NOT in your codebase. This indicates a security issue at the infrastructure level.

## Immediate Actions Required

### 1. Check DNS Settings
- Log into your domain registrar (where you manage rpcassociates.co)
- Verify DNS A records point to your Digital Ocean droplet IP
- Check for any CNAME records that might be redirecting
- Look for any DNS hijacking or unauthorized changes

### 2. Check Digital Ocean App Platform
- Log into Digital Ocean dashboard
- Go to your App Platform app
- Check the deployed files match your repository
- Verify no custom scripts or redirects were added
- Check environment variables for any suspicious entries

### 3. Check Browser Cache
- Clear browser cache completely
- Try in incognito/private mode
- Try a different browser
- Try from a different network/device

### 4. Verify Deployed Files
- SSH into your server (if possible)
- Check the actual deployed files in the dist/ folder
- Compare with your repository
- Look for any injected scripts

### 5. Check for Compromised Hosting
- Review Digital Ocean access logs
- Check for unauthorized access
- Verify no one else has access to your account
- Check for any suspicious activity

## What to Check

### DNS Records Should Be:
```
Type: A
Name: @ (or rpcassociates.co)
Value: [Your Digital Ocean IP]
TTL: 3600 (or default)
```

### If Using Subdomain:
```
Type: A
Name: www
Value: [Your Digital Ocean IP]
```

## Next Steps

1. **Immediately change all passwords:**
   - Domain registrar account
   - Digital Ocean account
   - GitHub account
   - Email account

2. **Enable 2FA** on all accounts

3. **Contact Digital Ocean Support** if you find unauthorized changes

4. **Check your domain registrar** for unauthorized access

5. **Review access logs** for suspicious activity

## Prevention

- Enable 2FA on all accounts
- Use strong, unique passwords
- Regularly review DNS settings
- Monitor for unauthorized changes
- Keep all software updated
- Review access logs regularly

## If Issue Persists

1. Take screenshots of the redirect
2. Document when it started happening
3. Contact Digital Ocean support with details
4. Consider temporarily taking the site offline until resolved



