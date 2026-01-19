# Internal Links in Sanity Posts - Setup Guide

This guide explains how to add links to other pages on your website within Sanity posts.

## Two Ways to Add Links

### Method 1: Inline Links in Post Body (Easiest)

You can add links directly in the post body content:

1. **In Sanity Studio:**
   - While editing the post body
   - Select the text you want to link
   - Click the link icon in the toolbar
   - Enter the URL

2. **For Internal Links:**
   - Use paths starting with `/`
   - Examples:
     - `/articles/tax-tips` - Links to another article
     - `/resources` - Links to resources page
     - `/resources/canadian-personal-income-tax-calculator` - Links to tax calculator
     - `/#contact` - Links to contact section on home page

3. **For External Links:**
   - Use full URLs starting with `http://` or `https://`
   - Example: `https://www.canada.ca`

**What Happens:**
- Internal links (starting with `/`) use React Router for smooth navigation
- External links open in a new tab with security attributes
- External links show a ↗ icon

### Method 2: Related Links Section (Dedicated Section)

Add a dedicated "Related Links" section that appears after the post content:

1. **In Sanity Studio:**
   - Open your post
   - Go to the **"Content"** tab
   - Find **"Related Links"**
   - Click **"Add item"**

2. **Fill in Link Details:**
   - **Link Title** (Required)
     - Example: "Tax Calculator"
     - This is the text that appears
   
   - **URL** (Required)
     - Internal: `/resources/canadian-personal-income-tax-calculator`
     - External: `https://www.canada.ca`
   
   - **Description** (Optional)
     - Example: "Calculate your estimated taxes for 2025"
     - Shown below the link title
   
   - **External Link** (Checkbox)
     - Check if linking to an external website
     - Automatically detected if URL starts with `http`

3. **Save and Publish**

**What Users See:**
A styled "Related Links" section appears after the post content with:
- Link title (clickable)
- Description (if provided)
- External link indicator (↗) for external links

## Examples

### Example 1: Link to Tax Calculator

**In Post Body:**
- Select text: "Use our tax calculator"
- Link to: `/resources/canadian-personal-income-tax-calculator`

**Or in Related Links:**
- Title: "Tax Calculator"
- URL: `/resources/canadian-personal-income-tax-calculator`
- Description: "Calculate your estimated taxes for 2025"

### Example 2: Link to Another Article

**In Post Body:**
- Select text: "Read our tax tips article"
- Link to: `/articles/tax-planning-tips`

**Or in Related Links:**
- Title: "Tax Planning Tips"
- URL: `/articles/tax-planning-tips`
- Description: "Learn strategies to minimize your tax burden"

### Example 3: Link to Home Page Section

**In Post Body:**
- Select text: "Contact us"
- Link to: `/#contact`

### Example 4: External Link

**In Post Body:**
- Select text: "CRA website"
- Link to: `https://www.canada.ca/en/revenue-agency.html`

**Or in Related Links:**
- Title: "CRA Website"
- URL: `https://www.canada.ca/en/revenue-agency.html`
- Description: "Official Canada Revenue Agency website"
- External Link: ✓ (checked)

## Available Internal Links

### Main Pages:
- `/` - Home page
- `/articles` - Articles index
- `/resources` - Resources page
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/sitemap` - Site map

### Resources:
- `/resources/canadian-personal-income-tax-calculator` - Tax calculator

### Articles:
- `/articles/[slug]` - Any article by slug
- `/articles/category/canadian-tax` - Canadian Tax category
- `/articles/category/accounting` - Accounting category
- `/articles/category/technology` - Technology category

### Home Page Sections (with hash):
- `/#services` - Services section
- `/#why` - Why Hire an Accountant section
- `/#about` - About section
- `/#remote` - Remote Services section
- `/#contact` - Contact section

## Best Practices

1. **Use Descriptive Link Text**
   - ✅ Good: "Read our tax planning guide"
   - ❌ Bad: "Click here"

2. **Link to Relevant Content**
   - Link to articles that expand on the topic
   - Link to related resources or tools
   - Link to relevant sections of your website

3. **Use Related Links Section For:**
   - Important resources mentioned in the post
   - Related articles
   - Tools or calculators
   - External authoritative sources

4. **Use Inline Links For:**
   - References within the text
   - Citations
   - Natural flow of content

## Technical Details

- **Internal Links:** Use React Router's `Link` component (smooth navigation, no page reload)
- **External Links:** Use regular `<a>` tags with `target="_blank"` and security attributes
- **Link Detection:** Automatically detects internal vs external based on URL format
- **Styling:** Internal and external links have different visual styles

## Troubleshooting

### Link Not Working

**Check:**
- ✅ URL is correct (no typos)
- ✅ Internal links start with `/`
- ✅ External links start with `http://` or `https://`
- ✅ Post is published (not draft)

### Link Opens in New Tab When It Shouldn't

- Internal links (starting with `/`) should NOT open in new tab
- If they do, check the URL format
- Make sure it starts with `/` not `http://`

### Related Links Not Showing

**Check:**
- ✅ Links are added in Sanity
- ✅ Post is saved and published
- ✅ At least one link is added

## Next Steps

1. Add links to your posts using either method
2. Test the links after publishing
3. Update links as your site structure changes
4. Use Related Links section for important resources

For questions or issues, check the Sanity documentation or contact support.


