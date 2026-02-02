# Clerk Authentication Setup

The client portal uses Clerk for authentication. To enable authentication, you need to set up a Clerk account and configure the environment variable.

## Steps

1. **Create a Clerk Account**
   - Go to https://clerk.com and sign up
   - Create a new application
   - Copy your Publishable Key

2. **Set Environment Variable**
   - Create a `.env` file in the project root (if it doesn't exist)
   - Add the following line:
     ```
     VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
     ```
   - Replace `pk_test_...` with your actual Clerk Publishable Key

3. **Restart Dev Server**
   - Stop your dev server (Ctrl+C)
   - Run `npm run dev` again

## Portal Routes

- `/portal/sign-in` - Sign in page
- `/portal/sign-up` - Sign up page
- `/portal/dashboard` - Dashboard (protected)
- `/portal/taxgpt` - TaxGPT (protected)
- `/portal/files` - File Repository (protected)
- `/portal/working-papers` - Working Papers (protected)
- `/portal/integrations` - Integrations (protected)

All portal routes except sign-in/sign-up require authentication. Users will be redirected to sign-in if not authenticated.

## Note

If `VITE_CLERK_PUBLISHABLE_KEY` is not set, the portal will still work but authentication will be disabled. You'll see a warning in the console.
