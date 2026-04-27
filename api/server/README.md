# RPC Associates API Server

Backend API server for handling form submissions and storing data in PostgreSQL.

## Setup

### 1. Install Dependencies

```bash
cd api/server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- **Database**: PostgreSQL connection details
- **Email**: SMTP or SendGrid configuration
- **NOTIFICATION_EMAIL**: Inbox for lead + contact notifications (e.g. `contact@axiomft.ca`); also set **EMAIL_FROM** (e.g. `noreply@axiomft.ca` via Resend)

### 3. Initialize Database

The server will automatically create the necessary tables on startup. Alternatively, you can run:

```bash
npm run migrate
```

### 4. Run the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## API Endpoints

### POST /api/leads
Capture lead information from resource download forms.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp",
  "email": "john@acme.com",
  "businessPhone": "(555) 123-4567",
  "businessType": "professional-services",
  "businessOwnerStatus": "business-owner",
  "speakToAdvisor": true,
  "marketingConsent": true,
  "resourceName": "Cash Flow Statement Template"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead captured successfully",
  "id": 123
}
```

### POST /api/contact
Handle contact form submissions.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "company": "Tech Inc",
  "message": "I'm interested in your services..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "id": 456
}
```

### GET /health
Health check endpoint.

## Database Schema

### leads Table
- `id` (SERIAL PRIMARY KEY)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `company_name` (VARCHAR)
- `email` (VARCHAR)
- `business_phone` (VARCHAR)
- `business_type` (VARCHAR)
- `business_owner_status` (VARCHAR)
- `speak_to_advisor` (BOOLEAN)
- `marketing_consent` (BOOLEAN)
- `resource_name` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### contacts Table
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `email` (VARCHAR)
- `company` (VARCHAR, nullable)
- `message` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Email Configuration

### Option 1: Gmail SMTP
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASSWORD`

### Option 2: SendGrid
1. Sign up at https://sendgrid.com
2. Create an API key
3. Set `SENDGRID_API_KEY` in `.env`

### Option 3: Other SMTP
Configure any SMTP server using the `SMTP_*` variables.

## Deployment

### Digital Ocean App Platform

1. Add the API as a service in your `app.yaml`:
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
      # ... other env vars
```

2. Add a PostgreSQL database component:
```yaml
databases:
  - name: db
    engine: PG
    version: "15"
```

### Docker

Create a `Dockerfile` in `api/server`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Variables

See `.env.example` for all available configuration options. Highlights:

### Client portal file repository (DO Spaces / S3)

Uploads are **not** sent through the Express app body: the API returns a **presigned PUT URL** and the **browser** uploads the file to your Space. You must set **`DO_SPACES_ENDPOINT`**, **`DO_SPACES_BUCKET`**, **`DO_SPACES_KEY`**, and **`DO_SPACES_SECRET`** on the API. After restart, the log should show: `[portal files] Object storage: configured (bucket: …)`.

You also need **CORS** on the Space: allow the origins where users use the app (e.g. `https://…`, `http://localhost:5173` for local dev) and allow methods **PUT**, **GET**, **HEAD**. Without CORS, the `fetch(PUT)` in the browser fails; the new UI shows a specific error. See the long comment in `api/server/.env.example` for a sample CORS JSON.

`CLERK_SECRET_KEY` is required in production for `/api/portal/…` to accept tokens.

Database, email, and the rest: see `.env.example`.
