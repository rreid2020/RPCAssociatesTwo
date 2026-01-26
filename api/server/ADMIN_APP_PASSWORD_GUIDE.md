# Creating App Passwords in Microsoft 365 Admin Portal

As an administrator, you can create App Passwords for users. Here's where to find it:

## Method 1: Through User's Authentication Methods (Recommended)

1. **Go to Microsoft 365 Admin Center:**
   - https://admin.microsoft.com

2. **Navigate to Users:**
   - Left sidebar → **Users** → **Active users**
   - Or: **Users** → **Active users**

3. **Select the User:**
   - Find and click on `roger.reid@rpcassociates.co`

4. **Go to Account Tab:**
   - Click the **Account** tab (or look for authentication settings)

5. **Authentication Methods:**
   - Look for **"Authentication methods"** or **"Security info"**
   - Click **"Manage authentication methods"** or **"Manage security info"**

6. **Create App Password:**
   - Scroll down to find **"App passwords"** section
   - Click **"Create app password"** or **"Add app password"**
   - Name it: "RPC Associates API"
   - Copy the generated password

## Method 2: Through Azure AD (Entra ID)

1. **Go to Azure Portal:**
   - https://portal.azure.com

2. **Navigate to Azure Active Directory:**
   - Search for "Azure Active Directory" or "Microsoft Entra ID"
   - Click on it

3. **Go to Users:**
   - Left sidebar → **Users**
   - Search for `roger.reid@rpcassociates.co`
   - Click on the user

4. **Authentication Methods:**
   - Left sidebar → **Authentication methods**
   - Look for **"App passwords"** or **"Passwordless phone sign-in"**
   - Click **"Add app password"** or **"Create app password"**

## Method 3: Through Microsoft 365 Security Center

1. **Go to Microsoft 365 Security Center:**
   - https://security.microsoft.com

2. **Navigate to Users:**
   - Left sidebar → **Users** → **Active users**
   - Or search for the user

3. **User Details:**
   - Click on `roger.reid@rpcassociates.co`
   - Look for **"Authentication methods"** or **"Security info"**

4. **App Passwords:**
   - Find the **"App passwords"** section
   - Create a new app password

## If You Don't See App Passwords Option

### Check Organization Settings:

1. **Go to Azure AD:**
   - https://portal.azure.com → Azure Active Directory

2. **Security Settings:**
   - Left sidebar → **Security** → **Authentication methods**
   - Or: **Users** → **User settings**

3. **Enable App Passwords:**
   - Look for **"App passwords"** or **"Legacy authentication"**
   - Ensure it's enabled for your organization

### Alternative: Check User's MFA Status

1. **In Admin Center:**
   - Users → Active users → Select user
   - Check **"Multi-factor authentication status"**

2. **If MFA is not enabled:**
   - You might not need App Passwords
   - Try using the regular password directly

3. **If MFA is enabled:**
   - App Passwords should be available
   - If not visible, you may need to enable it in Azure AD policies

## Quick Alternative: PowerShell

If you can't find it in the UI, you can use PowerShell:

```powershell
# Connect to Exchange Online
Connect-ExchangeOnline

# Check if user has MFA enabled
Get-MsolUser -UserPrincipalName roger.reid@rpcassociates.co | Select-Object StrongAuthenticationMethods

# Note: App passwords are typically created by the user themselves
# But as admin, you can reset their MFA or create a service account
```

## Recommended: Create a Service Account Instead

Since you're the admin, the easiest solution might be to:

1. **Create a new user account:**
   - Name: `api@rpcassociates.co` or `noreply@rpcassociates.co`
   - No MFA required (or MFA disabled)
   - Grant access to `contacts@rpcassociates.co` shared mailbox

2. **Use this account for SMTP:**
   ```env
   SMTP_USER=api@rpcassociates.co
   SMTP_PASSWORD=password-for-api-account
   ```

This avoids App Password complexity entirely!
