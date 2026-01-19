# Calendly Integration Setup Guide

## Overview

The website now includes Calendly integration for appointment booking. All "Book a Consultation" buttons will open a Calendly popup widget when clicked.

## Setup Steps

### 1. Get Your Calendly URL

1. Log in to your Calendly account: https://calendly.com
2. Go to your event type (e.g., "Consultation", "Discovery Call", etc.)
3. Click on the event type
4. Copy the event URL (format: `https://calendly.com/your-username/event-type`)
   - Example: `https://calendly.com/roger-reid/consultation`

### 2. Configure the Calendly URL

You have two options:

#### Option A: Environment Variable (Recommended for Production)

1. Create or update `.env` file in the root directory:
   ```bash
   VITE_CALENDLY_URL=https://calendly.com/your-username/event-type
   ```

2. Replace `your-username/event-type` with your actual Calendly URL path

#### Option B: Direct Configuration

1. Open `src/config/calendly.ts`
2. Update the `CALENDLY_URL` constant:
   ```typescript
   export const CALENDLY_URL = 'https://calendly.com/your-username/event-type'
   ```

### 3. Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Click any "Book a Consultation" button on the website
3. The Calendly popup should open with your scheduling page

### 4. Deploy

After configuration:

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Add Calendly integration for appointment booking"
   git push
   ```

2. If using environment variables, make sure to add `VITE_CALENDLY_URL` to your deployment platform (Digital Ocean, Vercel, etc.)

## Where Calendly Buttons Appear

The Calendly integration is used in the following locations:

1. **Header** - "Book a Consultation" button (desktop navigation)
2. **Hero Section** - "Schedule a Free Consultation" button (homepage)
3. **Article Detail Pages** - "Book a Consultation" button (after article content)
4. **Tax Calculator Page** - "Book a Consultation" button (at the bottom)

## Customization

### Change Button Text

You can customize the button text by passing a `text` prop:

```tsx
<CalendlyButton text="Schedule a Call" />
```

### Change Button Style

You can customize the button style by passing a `className` prop:

```tsx
<CalendlyButton className="btn btn--secondary" />
```

### Prefill User Information

You can prefill the Calendly form with user information:

```tsx
<CalendlyButton 
  prefill={{
    name: "John Doe",
    email: "john@example.com"
  }}
/>
```

## Troubleshooting

### Calendly Popup Doesn't Open

1. Check that your Calendly URL is correct in `src/config/calendly.ts`
2. Verify the Calendly script is loading (check browser console)
3. Make sure your Calendly event type is published and active

### Environment Variable Not Working

1. Make sure the variable name is `VITE_CALENDLY_URL` (must start with `VITE_`)
2. Restart the development server after adding the variable
3. For production, add the variable to your deployment platform's environment settings

### Script Loading Issues

The Calendly script loads automatically when needed. If you see errors:
1. Check your internet connection
2. Verify Calendly's servers are accessible
3. Check browser console for specific error messages

## Additional Resources

- [Calendly Documentation](https://help.calendly.com/hc/en-us)
- [Calendly Widget API](https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDM4-calendly-api)
- [Calendly Embed Options](https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview)
