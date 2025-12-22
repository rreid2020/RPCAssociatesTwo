# Sanity.io CMS Integration Guide

This guide explains how to set up and use Sanity.io as the content management system for the Articles section of the RPC Associates website.

## Overview

The website uses Sanity.io as a headless CMS to manage blog articles. Content editors can create and manage articles through Sanity Studio, and the website fetches and displays this content dynamically.

## Prerequisites

- Node.js 18+ installed
- A Sanity.io account (sign up at https://sanity.io)
- A Sanity project created

## Initial Setup

### 1. Install Dependencies

**Main Website:**
```bash
npm install
```

**Sanity Studio:**
```bash
cd sanity-studio
npm install
```

### 2. Create Sanity Project

1. Go to https://sanity.io/manage
2. Create a new project
3. Note your Project ID (found in project settings)

### 3. Configure Environment Variables

Create a `.env` file in the repository root:

```env
VITE_SANITY_PROJECT_ID=your-project-id
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-01-01
VITE_SANITY_USE_CDN=true
```

For Sanity Studio, create `sanity-studio/.env`:

```env
SANITY_STUDIO_PROJECT_ID=your-project-id
SANITY_STUDIO_DATASET=production
```

### 4. Seed Default Categories

After setting up your Sanity project, run the seed script to create the default categories:

```bash
cd sanity-studio
# Set SANITY_API_TOKEN if needed (for write access)
npx ts-node scripts/seedCategories.ts
```

Or manually create these categories in Sanity Studio:
- **Canadian Tax** (slug: `canadian-tax`)
- **Accounting** (slug: `accounting`)
- **Technology** (slug: `technology`)

## Running Locally

### Sanity Studio

To run the content management interface:

```bash
cd sanity-studio
npm run dev
```

Access Sanity Studio at: http://localhost:3333

### Website

To run the main website:

```bash
npm run dev
```

Access the website at: http://localhost:5173

## How to Publish a Post

### Step 1: Open Sanity Studio

1. Navigate to http://localhost:3333 (or your deployed Studio URL)
2. Log in with your Sanity account

### Step 2: Create a New Post

1. Click **"Posts"** in the left sidebar
2. Click **"Create new"** button
3. Fill in the required fields:
   - **Title**: The article title
   - **Slug**: Auto-generated from title (can be edited)
   - **Published At**: Set the publication date
   - **Excerpt**: A short summary (max 200 characters)
   - **Category**: Select from existing categories
   - **Main Image**: Upload and add alt text
   - **Body**: Write your article content using the rich text editor

### Step 3: Add Optional Fields

- **SEO**: Custom meta title, description, and OG image (optional)
- **Author**: Link to an author profile (optional)
- **Canonical URL**: Override default canonical URL if needed

### Step 4: Publish

1. Click **"Publish"** in the top right
2. The article will appear on the website immediately

### Step 5: Verify

1. Visit http://localhost:5173/articles (or your live site)
2. Your new article should appear in the list
3. Click to view the full article

## Content Structure

### Post Schema

- **title** (required): Article title
- **slug** (required): URL-friendly identifier
- **publishedAt** (required): Publication date
- **excerpt** (required): Short summary
- **category** (required): Reference to a category
- **mainImage** (required): Featured image with alt text
- **body** (required): Article content (Portable Text)
- **seo** (optional): SEO metadata
- **author** (optional): Author reference
- **canonicalUrl** (optional): Custom canonical URL

### Category Schema

- **title** (required): Category name
- **slug** (required): URL-friendly identifier
- **description** (optional): Category description
- **order** (optional): Display order

### Author Schema

- **name** (required): Author name
- **role** (optional): Job title/role
- **image** (optional): Author photo
- **bio** (optional): Author biography

## Routes

- `/articles` - Articles index page (all articles)
- `/articles/category/:categorySlug` - Category listing page
- `/articles/:slug` - Individual article detail page

## Environment Variables Reference

### Frontend (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SANITY_PROJECT_ID` | Your Sanity project ID | `abc123xyz` |
| `VITE_SANITY_DATASET` | Dataset name | `production` |
| `VITE_SANITY_API_VERSION` | API version date | `2024-01-01` |
| `VITE_SANITY_USE_CDN` | Use CDN for images | `true` |

### Sanity Studio (`sanity-studio/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `SANITY_STUDIO_PROJECT_ID` | Your Sanity project ID | `abc123xyz` |
| `SANITY_STUDIO_DATASET` | Dataset name | `production` |
| `SANITY_API_TOKEN` | Write token (if needed) | `sk...` |

## Deployment

### Deploy Sanity Studio

```bash
cd sanity-studio
npm run build
npm run deploy
```

This deploys Studio to `https://your-project.sanity.studio`

### Deploy Website

The website reads from Sanity's public API, so no special configuration is needed. Just ensure your environment variables are set in your hosting environment.

## Troubleshooting

### Articles Not Appearing

1. Check that posts have a `publishedAt` date set
2. Verify environment variables are correct
3. Check browser console for errors
4. Verify your Sanity project ID matches in both `.env` files

### Images Not Loading

1. Ensure `VITE_SANITY_USE_CDN=true` in `.env`
2. Check that images are uploaded to Sanity (not just referenced)
3. Verify image asset references in Sanity Studio

### Studio Not Connecting

1. Verify `SANITY_STUDIO_PROJECT_ID` in `sanity-studio/.env`
2. Check that you're logged into the correct Sanity account
3. Ensure the project exists in your Sanity account

## Support

For Sanity.io documentation, visit: https://www.sanity.io/docs

For issues with this integration, check the repository or contact the development team.

