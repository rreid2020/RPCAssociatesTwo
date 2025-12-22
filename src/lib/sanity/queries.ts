import { SanityCategory, SanityPost } from './types'
import { client, isSanityConfigured } from './client'

export async function getCategories(): Promise<SanityCategory[]> {
  if (!isSanityConfigured()) {
    console.warn('Sanity is not configured. Returning empty categories.')
    return []
  }
  const query = `*[_type == "category"] | order(order asc, title asc) {
    _id,
    _type,
    title,
    slug,
    description,
    order
  }`
  
  return await client.fetch<SanityCategory[]>(query)
}

export interface GetPostsOptions {
  limit?: number
  categorySlug?: string
}

export async function getPosts(options: GetPostsOptions = {}): Promise<SanityPost[]> {
  if (!isSanityConfigured()) {
    console.warn('Sanity is not configured. Returning empty posts.')
    return []
  }
  
  const { limit = 20, categorySlug } = options
  
  let query = `*[_type == "post" && defined(publishedAt)]`
  
  if (categorySlug) {
    query += ` && category->slug.current == $categorySlug`
  }
  
  query += ` | order(publishedAt desc) [0...$limit] {
    _id,
    _type,
    title,
    slug,
    publishedAt,
    excerpt,
    category-> {
      _id,
      _type,
      title,
      slug,
      description
    },
    mainImage {
      _type,
      asset,
      alt
    },
    seo {
      metaTitle,
      metaDescription,
      ogImage {
        _type,
        asset,
        alt
      }
    },
    author-> {
      _id,
      _type,
      name,
      role,
      image {
        _type,
        asset,
        alt
      },
      bio
    },
    canonicalUrl
  }`
  
  const params: any = { limit }
  if (categorySlug) {
    params.categorySlug = categorySlug
  }
  
  return await client.fetch<SanityPost[]>(query, params)
}

export async function getPostBySlug(slug: string): Promise<SanityPost | null> {
  if (!isSanityConfigured()) {
    console.warn('Sanity is not configured. Returning null.')
    return null
  }
  
  const query = `*[_type == "post" && slug.current == $slug && defined(publishedAt)][0] {
    _id,
    _type,
    title,
    slug,
    publishedAt,
    excerpt,
    category-> {
      _id,
      _type,
      title,
      slug,
      description
    },
    mainImage {
      _type,
      asset,
      alt
    },
    body,
    seo {
      metaTitle,
      metaDescription,
      ogImage {
        _type,
        asset,
        alt
      }
    },
    author-> {
      _id,
      _type,
      name,
      role,
      image {
        _type,
        asset,
        alt
      },
      bio
    },
    canonicalUrl
  }`
  
  return await client.fetch<SanityPost | null>(query, { slug })
}

export async function getCategoryBySlug(slug: string): Promise<SanityCategory | null> {
  if (!isSanityConfigured()) {
    console.warn('Sanity is not configured. Returning null.')
    return null
  }
  
  const query = `*[_type == "category" && slug.current == $slug][0] {
    _id,
    _type,
    title,
    slug,
    description,
    order
  }`
  
  return await client.fetch<SanityCategory | null>(query, { slug })
}

