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

### Option 1: Gmail SMTP (Recommended for Testing)

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

### Option 2: SendGrid (Recommended for Production)

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
