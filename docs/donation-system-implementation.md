# Donation System Implementation Guide

## Overview

This guide outlines how to implement a donation system for your free resources, allowing users to support your efforts while keeping resources accessible to everyone.

## Payment Processor Options

### Option 1: Stripe (Recommended)

**Pros:**
- ✅ Most popular and trusted
- ✅ Excellent for one-time donations
- ✅ Easy integration with React/Node.js
- ✅ Supports multiple payment methods (cards, Apple Pay, Google Pay)
- ✅ Built-in security (PCI compliant)
- ✅ Good documentation
- ✅ Free to set up, 2.9% + $0.30 per transaction

**Cons:**
- ⚠️ Transaction fees (standard for all processors)
- ⚠️ Requires Stripe account setup

**Cost:** 2.9% + $0.30 per successful transaction

**Setup Time:** 1-2 hours

---

### Option 2: PayPal Donations

**Pros:**
- ✅ Widely recognized
- ✅ Users can donate with PayPal account
- ✅ Simple integration
- ✅ Lower fees for donations (2.2% + $0.30)

**Cons:**
- ⚠️ Less modern UI
- ⚠️ Requires PayPal account

**Cost:** 2.2% + $0.30 per transaction (for donations)

**Setup Time:** 30 minutes - 1 hour

---

### Option 3: Stripe + PayPal (Best Coverage)

**Pros:**
- ✅ Maximum payment options for users
- ✅ Users can choose their preferred method

**Cons:**
- ⚠️ More complex setup
- ⚠️ Two separate integrations

**Cost:** Combined fees from both

---

## Recommended Approach: Stripe

For this implementation guide, we'll use **Stripe** as it offers:
- Best developer experience
- Modern UI components
- Excellent React integration
- Comprehensive documentation

## Implementation Plan

### Phase 1: Database Schema

Create a `donations` table to track donations:

```sql
CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CAD',
  donor_name VARCHAR(255),
  donor_email VARCHAR(255),
  donor_message TEXT,
  resource_name VARCHAR(255), -- Optional: link to resource
  payment_intent_id VARCHAR(255) UNIQUE, -- Stripe payment intent ID
  status VARCHAR(50) NOT NULL, -- 'pending', 'succeeded', 'failed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_donations_email ON donations(donor_email);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);
```

### Phase 2: UI Components

#### 2.1 Donation Button Component

Create a reusable donation button that can be placed:
- On resource detail pages (after download)
- On thank you pages
- In the footer
- On a dedicated "Support Us" page

**Suggested Locations:**
1. **Resource Detail Page** - After successful download
2. **Thank You Page** - After form submission
3. **Footer** - Small "Support Us" link
4. **Dedicated Page** - `/support` or `/donate`

#### 2.2 Donation Modal/Form

A modal that appears when user clicks "Donate" with:
- Suggested amounts ($5, $10, $25, $50, Custom)
- Optional name and email fields
- Optional message field
- Stripe payment form
- Thank you message after successful donation

### Phase 3: API Endpoints

#### 3.1 Create Payment Intent
```
POST /api/donations/create-intent
Body: { amount, currency, donorName, donorEmail, resourceName }
Returns: { clientSecret } // For Stripe
```

#### 3.2 Confirm Payment
```
POST /api/donations/confirm
Body: { paymentIntentId }
Returns: { success, donationId }
```

#### 3.3 Webhook Handler (Stripe)
```
POST /api/donations/webhook
Handles: payment_intent.succeeded, payment_intent.failed
```

### Phase 4: Email Notifications

Send emails for:
- **To Donor:** Thank you email with receipt
- **To You:** Notification of new donation

## Detailed Implementation Steps

### Step 1: Install Stripe Dependencies

```bash
cd api/server
npm install stripe
```

```bash
# Frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Step 2: Environment Variables

Add to Digital Ocean (RUN_TIME scope):
```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_... (for webhook verification)
```

Add to frontend (BUILD_TIME scope):
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Step 3: Database Migration

Add donation table creation to `api/server/db/migrations.js`

### Step 4: Create Donation Component

Create `src/components/DonationButton.tsx` with:
- Button to open donation modal
- Modal with Stripe Elements
- Suggested donation amounts
- Form fields (name, email, message - all optional)
- Payment processing

### Step 5: Create API Endpoints

Add to `api/server/server.js`:
- `/api/donations/create-intent` - Create Stripe payment intent
- `/api/donations/confirm` - Confirm payment and save to database
- `/api/donations/webhook` - Handle Stripe webhooks

### Step 6: Add Donation Button to Resource Pages

Add donation button to `ResourceDetail.tsx`:
- Show after successful download
- Or in a "Support Our Work" section

### Step 7: Email Notifications

Send thank you email to donor and notification to you when donation succeeds.

## UI/UX Recommendations

### Placement Options

1. **After Download (Recommended)**
   ```
   [Download Button]
   
   "Enjoying this resource? Consider supporting our work!"
   [Donate $5] [Donate $10] [Donate $25] [Custom Amount]
   ```

2. **In Thank You Section**
   ```
   "Thank you for downloading! If this resource helped you, 
   consider making a donation to support our work."
   [Donate Button]
   ```

3. **Footer Link**
   ```
   "Support Our Work" → Links to /support page
   ```

4. **Dedicated Support Page**
   - `/support` or `/donate`
   - Full page with donation form
   - Explain how donations help
   - Show impact/transparency

### Suggested Donation Amounts

- $5 - "Buy us a coffee"
- $10 - "Support our work"
- $25 - "Help us create more resources"
- $50 - "Major supporter"
- Custom amount

### Messaging

**Keep it friendly and optional:**
- "Resources are free, but donations help us create more!"
- "Enjoying this resource? Consider supporting our work!"
- "Your donation helps us create more free resources for small businesses"

**Avoid:**
- Making it feel required
- Guilt-tripping
- Being too pushy

## Security Considerations

1. **Never store card details** - Stripe handles this
2. **Verify webhooks** - Use Stripe webhook signatures
3. **Validate amounts** - Server-side validation
4. **Rate limiting** - Prevent abuse
5. **HTTPS only** - Required for Stripe

## Legal Considerations

1. **Receipts** - Stripe automatically generates receipts
2. **Tax receipts** - If you're a registered charity, provide tax receipts
3. **Terms** - Update Terms of Service to mention donations
4. **Privacy** - Donor information handling

## Analytics & Tracking

Track:
- Number of donations
- Average donation amount
- Donation rate (donations / downloads)
- Most popular resources for donations
- Donor retention

## Cost Estimate

**Stripe Fees:**
- 2.9% + $0.30 per transaction
- Example: $10 donation = $0.59 fee, you receive $9.41

**No monthly fees** - Only pay per transaction

## Next Steps

1. **Choose payment processor** (recommend Stripe)
2. **Set up Stripe account** and get API keys
3. **Create database migration** for donations table
4. **Build donation component** (React + Stripe Elements)
5. **Create API endpoints** for payment processing
6. **Add donation buttons** to resource pages
7. **Set up email notifications**
8. **Test thoroughly** with Stripe test mode
9. **Deploy and monitor**

## Example Implementation Files

Would you like me to create:
1. Database migration for donations table
2. DonationButton React component
3. API endpoints for Stripe integration
4. Email templates for donation notifications

Let me know which parts you'd like me to implement first!
