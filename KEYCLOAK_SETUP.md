# Keycloak Setup Guide

This guide will help you configure Keycloak authentication for the RPC Associates website.

## Prerequisites

- Keycloak server installed and running
- Access to Keycloak admin console

## Configuration Steps

### 1. Create a Realm

1. Log in to Keycloak Admin Console
2. Click "Create Realm"
3. Name it `rpc-associates` (or update the config file)
4. Click "Create"

### 2. Create a Client

1. In your realm, go to "Clients" → "Create client"
2. Set Client ID: `rpc-associates-web`
3. Set Client protocol: `openid-connect`
4. Click "Next"
5. Enable:
   - Client authentication: `OFF` (for public client)
   - Authorization: `OFF`
   - Standard flow: `ON`
   - Direct access grants: `ON`
   - Valid redirect URIs: Add your website URLs:
     - `http://localhost:5173/*` (for development)
     - `https://rpcassociates.co/*` (for production)
   - Web origins: Add:
     - `http://localhost:5173`
     - `https://rpcassociates.co`
6. Click "Save"

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_KEYCLOAK_URL=https://keycloak.yourdomain.com
VITE_KEYCLOAK_REALM=rpc-associates
VITE_KEYCLOAK_CLIENT_ID=rpc-associates-web
```

Or update `src/config/keycloak.ts` directly with your values.

### 4. Create Users (Optional)

1. Go to "Users" → "Add user"
2. Fill in user details
3. Go to "Credentials" tab
4. Set a password
5. Toggle "Temporary" to OFF if you want permanent password

### 5. Create Roles (Optional)

1. Go to "Realm roles" → "Create role"
2. Create roles like:
   - `client`
   - `admin`
   - `accountant`

### 6. Assign Roles to Users

1. Go to "Users" → Select a user
2. Go to "Role mapping" tab
3. Click "Assign role"
4. Select roles to assign

## Testing

1. Start your development server: `npm run dev`
2. Navigate to `/client-portal` or click "Login" in the header
3. You should be redirected to Keycloak login page
4. After login, you'll be redirected back to the client portal

## Production Deployment

1. Update environment variables in your deployment platform (Digital Ocean App Platform)
2. Ensure Keycloak server is accessible from your production domain
3. Update redirect URIs in Keycloak client configuration
4. Test authentication flow in production

## Troubleshooting

### CORS Issues
- Ensure Web origins are correctly configured in Keycloak client
- Check that your Keycloak server allows requests from your domain

### Redirect URI Mismatch
- Verify redirect URIs in Keycloak client match exactly (including trailing slashes)
- Check that the redirect URI includes the full path

### Token Issues
- Check browser console for errors
- Verify Keycloak server is accessible
- Ensure client ID and realm are correct

## Security Notes

- Use HTTPS in production
- Keep Keycloak server updated
- Use strong passwords for admin accounts
- Consider enabling 2FA for admin users
- Regularly review user access and roles

