# Free Email Service Alternatives

Since SendGrid's free tier is limited, here are other free options:

## Option 1: Resend (Recommended - Best Free Tier)

- **Free tier:** 3,000 emails/month (100/day)
- **No credit card required**
- **Good deliverability**
- **Simple API**

### Setup:
1. Sign up: https://resend.com
2. Get API key
3. Update `.env`:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```

### Code Update Needed:
We'd need to add Resend support to `api/server/utils/email.js`

## Option 2: Brevo (formerly Sendinblue)

- **Free tier:** 300 emails/day (9,000/month)
- **No credit card required**
- **Good for small businesses**

### Setup:
1. Sign up: https://www.brevo.com
2. Get SMTP credentials
3. Update `.env`:
   ```env
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=your-email@brevo.com
   SMTP_PASSWORD=your-smtp-key
   ```

## Option 3: Amazon SES (Very Cheap, Almost Free)

- **Pricing:** $0.10 per 1,000 emails (essentially free for low volume)
- **Requires:** AWS account setup
- **Best for:** Production use

### Setup:
1. Create AWS account
2. Verify domain in SES
3. Get SMTP credentials
4. Use SMTP settings (already supported in our code)

## Option 4: Mailgun

- **Free tier:** 5,000 emails/month for 3 months, then paid
- **Not truly free long-term**

## Option 5: Fix Exchange (Best Long-term)

Since you already have Exchange set up, fixing the Conditional Access issue is the best solution:
- **Cost:** $0 (you already pay for Exchange)
- **No third-party dependency**
- **Full control**

## Recommendation

**Short-term:** Use **Resend** (3,000 emails/month free, no credit card)
**Long-term:** Fix **Exchange** Conditional Access policies (free, you already have it)

Would you like me to:
1. Add Resend support to the code?
2. Help fix the Exchange Conditional Access issue?
3. Set up Brevo SMTP (easiest - just update .env)?
