# Disabling MFA for SMTP Authentication

You can temporarily disable MFA for your account to use regular password authentication for SMTP.

## Steps to Disable MFA

### Method 1: Microsoft 365 Admin Center

1. **Go to Microsoft 365 Admin Center:**
   - https://admin.microsoft.com

2. **Navigate to Users:**
   - Left sidebar → **Users** → **Active users**

3. **Select Your Account:**
   - Find and click on `roger.reid@rpcassociates.co`

4. **Multi-factor Authentication:**
   - Look for **"Multi-factor authentication"** section or button
   - Or click the **"..."** (three dots) menu → **"Multi-factor authentication"**

5. **Disable MFA:**
   - You'll see a list of users with MFA status
   - Find `roger.reid@rpcassociates.co`
   - Select the user
   - Click **"Disable"** or **"Disable multi-factor authentication"**
   - Confirm the action

### Method 2: Azure AD (Entra ID)

1. **Go to Azure Portal:**
   - https://portal.azure.com

2. **Navigate to Azure Active Directory:**
   - Search for "Azure Active Directory" or "Microsoft Entra ID"

3. **Go to Users:**
   - Left sidebar → **Users**
   - Search for `roger.reid@rpcassociates.co`
   - Click on the user

4. **Authentication Methods:**
   - Left sidebar → **Authentication methods**
   - Find **"Microsoft Authenticator"** or other MFA methods
   - Click **"Disable"** or **"Delete"** for each method

### Method 3: Per-User MFA Settings

1. **In Admin Center:**
   - Go to **Users** → **Active users**
   - Click on `roger.reid@rpcassociates.co`
   - Look for **"Manage multi-factor authentication"** or **"MFA status"**

2. **Disable:**
   - Change status from **"Enabled"** to **"Disabled"**
   - Save changes

## After Disabling MFA

1. **Wait a few minutes** for changes to propagate

2. **Test SMTP authentication:**
   ```bash
   cd api/server
   npm run test-email
   ```

3. **If it works:**
   - Your regular password should now work for SMTP
   - You can keep MFA disabled, or...

4. **Re-enable MFA (Optional):**
   - If you want MFA back for security, you can re-enable it later
   - But you'll need to use App Password or service account for SMTP

## Security Considerations

**Important Notes:**
- Disabling MFA reduces security for your account
- Consider using a service account instead (but that requires a license)
- Or use SendGrid (free, no MFA issues)
- If you disable MFA, make sure your password is strong

## Alternative: Conditional Access Policy

Instead of disabling MFA globally, you could:
1. Create a Conditional Access policy
2. Exclude SMTP authentication from MFA requirement
3. Keep MFA enabled for other logins

This is more complex but more secure.

## Testing

After disabling MFA, test with your current password:

```bash
cd api/server
npm run test-email
```

If successful, you're all set! If not, check:
- Password is correct
- SMTP AUTH is enabled for your account
- Wait a few minutes for changes to propagate
