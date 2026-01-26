# API Server Setup Guide

This guide explains how to set up and deploy the backend API server for handling form submissions.

## Overview

The API server handles:
- **Lead Capture Forms**: Stores lead information when users download resources
- **Contact Forms**: Stores contact form submissions
- **Email Notifications**: Sends email to contacts@rpcassociates.co when forms are submitted

## Prerequisites

- PostgreSQL database (Digital Ocean Managed Database recommended)
- Node.js 18+ installed (for local development)
- Email service (Gmail, SendGrid, or other SMTP)

## Local Development Setup

### 1. Install Dependencies

```bash
cd api/server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in `api/server/`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=false

# Email (Gmail SMTP example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Email Settings
EMAIL_FROM="RPC Associates <noreply@rpcassociates.co>"
NOTIFICATION_EMAIL=contacts@rpcassociates.co

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://rpcassociates.co
```

### 3. Gmail Setup (if using Gmail)

1. Enable 2-factor authentication on your Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app password for "Mail"
4. Use this app password in `SMTP_PASSWORD` (not your regular password)

### 4. Run the Server

```bash
npm run dev
```

The server will:
- Start on port 3000
- Automatically create database tables on startup
- Be ready to receive API requests

### 5. Test the API

**Test Lead Endpoint:**
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Test Corp",
    "email": "john@test.com",
    "businessPhone": "555-1234",
    "businessType": "professional-services",
    "businessOwnerStatus": "business-owner",
    "speakToAdvisor": true,
    "marketingConsent": true,
    "resourceName": "Cash Flow Template"
  }'
```

**Test Contact Endpoint:**
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@test.com",
    "company": "Tech Inc",
    "message": "Test message"
  }'
```

## Database Setup

### Create Tables Manually (if needed)

The server automatically creates tables on startup, but you can also run:

```bash
cd api/server
npm run migrate
```

Or connect to PostgreSQL and run:

```sql
-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  business_phone VARCHAR(50) NOT NULL,
  business_type VARCHAR(100) NOT NULL,
  business_owner_status VARCHAR(100) NOT NULL,
  speak_to_advisor BOOLEAN DEFAULT FALSE,
  marketing_consent BOOLEAN NOT NULL,
  resource_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_resource_name ON leads(resource_name);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);
```

## Deployment Options

### Option 1: Digital Ocean App Platform (Recommended)

1. **Add API Service to `app.yaml`:**

```yaml
services:
  - name: api
    github:
      repo: your-username/your-repo
      branch: main
      deploy_on_push: true
    source_dir: api/server
    build_command: npm install
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 3000
    routes:
      - path: /api
    envs:
      - key: DB_HOST
        value: ${db.HOSTNAME}
      - key: DB_NAME
        value: ${db.DATABASE}
      - key: DB_USER
        value: ${db.USERNAME}
      - key: DB_PASSWORD
        value: ${db.PASSWORD}
      - key: DB_PORT
        value: ${db.PORT}
      - key: DB_SSL
        value: "true"
      - key: SMTP_HOST
        value: smtp.gmail.com
      - key: SMTP_PORT
        value: "587"
      - key: SMTP_USER
        value: your-email@gmail.com
      - key: SMTP_PASSWORD
        value: your-app-password
      - key: EMAIL_FROM
        value: "RPC Associates <noreply@rpcassociates.co>"
      - key: NOTIFICATION_EMAIL
        value: contacts@rpcassociates.co
      - key: ALLOWED_ORIGINS
        value: https://rpcassociates.co,https://www.rpcassociates.co

databases:
  - name: db
    engine: PG
    version: "15"
```

2. **Update Frontend Environment Variable:**

In your Digital Ocean App Platform settings for the web service, add:
```
VITE_API_BASE_URL=https://your-api-service.ondigitalocean.app
```

### Option 2: Docker on Droplet

1. **Build Docker Image:**
```bash
cd api/server
docker build -t rpc-api .
```

2. **Run Container:**
```bash
docker run -d \
  --name rpc-api \
  -p 3000:3000 \
  --env-file .env \
  rpc-api
```

3. **Update Nginx to Proxy API Requests:**

Add to `nginx.conf`:
```nginx
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Option 3: Separate API Server

Deploy the API server as a separate service and update `VITE_API_BASE_URL` in your frontend to point to it.

## Frontend Configuration

Update your frontend `.env` or environment variables:

```env
VITE_API_BASE_URL=https://your-api-url.com
```

Or for local development:
```env
VITE_API_BASE_URL=http://localhost:3000
```

## Email Service Options

### Gmail SMTP (Free)
- Use app password (not regular password)
- Limited to 500 emails/day

### SendGrid (Recommended for Production)
- Free tier: 100 emails/day
- Paid: $15/month for 40,000 emails
- More reliable for production

### Other SMTP Services
- Mailgun
- AWS SES
- Postmark

## Troubleshooting

### Database Connection Issues
- Verify database credentials
- Check firewall rules allow connections
- Ensure SSL is configured correctly

### Email Not Sending
- Verify SMTP credentials
- Check spam folder
- Test with a simple email client first
- Check email service limits

### CORS Errors
- Ensure `ALLOWED_ORIGINS` includes your frontend URL
- Check that API server is running
- Verify frontend is using correct API URL

## Monitoring

Check logs:
```bash
# If using Docker
docker logs rpc-api

# If using Digital Ocean App Platform
# Check logs in the App Platform dashboard
```

## Security Notes

- Never commit `.env` files to Git
- Use environment variables in production
- Enable SSL for database connections in production
- Use strong passwords for database
- Consider rate limiting for production
- Use HTTPS for API endpoints in production
