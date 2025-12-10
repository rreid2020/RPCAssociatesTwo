# Troubleshooting 404 Error on Digital Ocean App Platform

## Issue: Getting 404 "page can't be found" error

This usually means one of these issues:

### 1. Check Runtime Logs
- Go to App Platform → Your App → Runtime Logs
- Verify the app is actually running
- Look for: `INFO  Accepting connections at http://localhost:8080` or similar

### 2. Verify Port Configuration
In App Platform settings:
- **Public HTTP Port:** Should be `8080`
- **Internal Port:** Should be `8080` (if there's a separate setting)

### 3. Check Health Checks
- Go to Health Checks section
- If health checks are enabled, they might be failing
- Try disabling health checks temporarily to test
- Or set health check path to `/` with a 200 status code expected

### 4. Verify HTTP Routes
- Go to Network/HTTP Request Routes section
- Ensure there's a route configured
- Route should be: `/` → Service on port `8080`

### 5. Check if App is Actually Running
- Look at the deployment status
- Should show "Active" or "Running"
- If it shows "Failed" or keeps restarting, check logs

### 6. Try Direct Port Access (if possible)
- Some platforms allow direct port access for debugging
- Check if there's a way to test the internal port directly

## Quick Fixes to Try

1. **Disable Health Checks temporarily**
2. **Verify the Run Command is:** `npm start`
3. **Check that serve is actually running** in runtime logs
4. **Verify the dist folder exists** after build (check build logs)



