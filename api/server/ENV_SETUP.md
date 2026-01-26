# Environment Variables Setup

## ✅ Database Configuration (COMPLETE)

Your PostgreSQL database credentials have been configured and tested successfully:

```
DB_HOST=db-postgresql-tor1-60715-do-user-20752759-0.e.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=defaultdb
DB_USER=doadmin
DB_PASSWORD=your-database-password
DB_SSL=true
```

**Note:** The actual password is stored in `api/server/.env` (which is in `.gitignore` and not committed to Git).

## ⚠️ Email Configuration Required

**You still need to configure email settings** in `api/server/.env` before the server can send notifications:

### Option 1: Microsoft Exchange/Office 365 (Your Current Setup)

Since you have Microsoft Exchange with a **shared mailbox**, use these settings:

**Important for Shared Mailboxes:**
- You cannot authenticate directly to a shared mailbox
- You need to authenticate as a **user account** that has access to the shared mailbox
- The email will be sent **from** the shared mailbox address, but authenticated with the user account

1. **Update `api/server/.env`:**
   ```env
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_SECURE=false
   # Use a user account that has access to the shared mailbox (not the shared mailbox itself)
   SMTP_USER=your-user-account@rpcassociates.co
   SMTP_PASSWORD=your-user-account-password
   # The shared mailbox address (where emails will appear to come from)
   SHARED_MAILBOX_ADDRESS=contacts@rpcassociates.co
   ```

   **Example:**
   - If your personal account is `roger@rpcassociates.co` and it has access to the `contacts@rpcassociates.co` shared mailbox:
   ```env
   SMTP_USER=roger@rpcassociates.co
   SMTP_PASSWORD=your-password
   SHARED_MAILBOX_ADDRESS=contacts@rpcassociates.co
   ```

2. **If you have Multi-Factor Authentication (MFA) enabled:**
   - You may need to create an App Password in Office 365
   - Go to: https://account.microsoft.com/security
   - Under "App passwords", create a new app password
   - Use that app password instead of your regular password

3. **Alternative hosts** (if `smtp.office365.com` doesn't work):
   - `smtp-mail.outlook.com` (for Outlook.com/Office 365)
   - Your Exchange server hostname (if using on-premises Exchange)

4. **For on-premises Exchange:**
   ```env
   SMTP_HOST=your-exchange-server.domain.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-user-account@domain.com
   SMTP_PASSWORD=your-password
   SHARED_MAILBOX_ADDRESS=contacts@rpcassociates.co
   ```

### Option 2: Gmail SMTP (Alternative)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "RPC Associates API"
   - Copy the generated password
3. Update `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password-here
   ```

### Option 3: SendGrid (Optional - Only if you want a separate email service)

1. Sign up at https://sendgrid.com
2. Create an API key with "Mail Send" permissions
3. Update `.env`:
   ```env
   SENDGRID_API_KEY=your-sendgrid-api-key
   ```

### Option 3: Other SMTP Service

Configure any SMTP service:
```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
```

## Testing the Connection

After configuring email, test the database connection:

```bash
cd api/server
npm install
npm run test-connection
```

This will:
- Test the database connection
- Create the necessary tables
- Verify everything is working

## Starting the Server

Once email is configured:

```bash
cd api/server
npm install
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## Security Note

⚠️ **IMPORTANT**: The `.env` file is in `.gitignore` and will NOT be committed to Git. This is correct for security.

For production deployment, set these environment variables in your hosting platform (Digital Ocean App Platform, etc.) rather than using a `.env` file.
