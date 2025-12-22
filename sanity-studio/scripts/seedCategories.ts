/**
 * Seed script to create default categories
 * Run with: npx ts-node scripts/seedCategories.ts
 * 
 * Requires SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET env vars
 */

import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || ''
})

const defaultCategories = [
  {
    _type: 'category',
    title: 'Canadian Tax',
    slug: { current: 'canadian-tax' },
    description: 'Articles about Canadian tax planning, compliance, and updates',
    order: 1
  },
  {
    _type: 'category',
    title: 'Accounting',
    slug: { current: 'accounting' },
    description: 'Accounting best practices, tips, and industry insights',
    order: 2
  },
  {
    _type: 'category',
    title: 'Technology',
    slug: { current: 'technology' },
    description: 'Technology solutions, tools, and digital transformation',
    order: 3
  }
]

async function seedCategories() {
  console.log('Checking for existing categories...')
  
  for (const category of defaultCategories) {
    try {
      // Check if category already exists
      const existing = await client.fetch(
        `*[_type == "category" && slug.current == $slug][0]`,
        { slug: category.slug.current }
      )

      if (existing) {
        console.log(`✓ Category "${category.title}" already exists`)
      } else {
        const result = await client.create(category)
        console.log(`✓ Created category: "${category.title}" (${result._id})`)
      }
    } catch (error) {
      console.error(`✗ Error processing category "${category.title}":`, error)
    }
  }

  console.log('\nSeed complete!')
}

seedCategories().catch(console.error)

