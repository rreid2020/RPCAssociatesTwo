import { SanityCategory, SanityArticle } from './types'
import { client, isSanityConfigured } from './client'

export async function getCategories(): Promise<SanityCategory[]> {
  if (!isSanityConfigured()) {
    console.warn('Sanity is not configured. Returning empty categories.')
    return []
  }
  
  try {
    const query = `*[_type == "category"] | order(order asc, title asc) {
      _id,
      _type,
      title,
      slug,
      description,
      order
    }`
    
    return await client.fetch<SanityCategory[]>(query)
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    throw new Error(`Failed to fetch categories: ${error?.message || 'Unknown error'}`)
  }
}

export interface GetArticlesOptions {
  limit?: number
  categorySlug?: string
}

export async function getArticles(options: GetArticlesOptions = {}): Promise<SanityArticle[]> {
  if (!isSanityConfigured()) {
    console.warn('Sanity is not configured. Returning empty articles.')
    return []
  }
  
  try {
    const { limit = 20, categorySlug } = options
    
    let query = `*[_type == "article" && defined(publishedAt)]`
    
    if (categorySlug) {
      query += ` && defined(categories) && count(categories[@->slug.current == $categorySlug]) > 0`
    }
    
    query += ` | order(publishedAt desc) [0...$limit] {
      _id,
      _type,
      title,
      slug,
      publishedAt,
      updatedAt,
      excerpt,
      categories[]-> {
        _id,
        _type,
        title,
        slug,
        description
      },
      tags,
      featuredImage {
        _type,
        asset,
        alt
      },
      seo {
        metaTitle,
        metaDescription,
        canonicalUrl,
        noIndex,
        openGraph {
          ogTitle,
          ogDescription,
          ogImage {
            _type,
            asset,
            alt
          }
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
      }
    }`
    
    const params: any = { limit }
    if (categorySlug) {
      params.categorySlug = categorySlug
    }
    
    return await client.fetch<SanityArticle[]>(query, params)
  } catch (error: any) {
    console.error('Error fetching articles:', error)
    throw new Error(`Failed to fetch articles: ${error?.message || 'Unknown error'}`)
  }
}

// Legacy function name for backward compatibility
export const getPosts = getArticles

export async function getArticleBySlug(slug: string): Promise<SanityArticle | null> {
  if (!isSanityConfigured()) {
    console.warn('Sanity is not configured. Returning null.')
    return null
  }
  
  try {
    const query = `*[_type == "article" && slug.current == $slug && defined(publishedAt)][0] {
      _id,
      _type,
      title,
      slug,
      publishedAt,
      updatedAt,
      excerpt,
      categories[]-> {
        _id,
        _type,
        title,
        slug,
        description
      },
      tags,
      featuredImage {
        _type,
        asset,
        alt
      },
      body,
      seo {
        metaTitle,
        metaDescription,
        canonicalUrl,
        noIndex,
        openGraph {
          ogTitle,
          ogDescription,
          ogImage {
            _type,
            asset,
            alt
          }
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
      }
    }`
    
    return await client.fetch<SanityArticle | null>(query, { slug })
  } catch (error: any) {
    console.error('Error fetching article by slug:', error)
    throw new Error(`Failed to fetch article: ${error?.message || 'Unknown error'}`)
  }
}

// Legacy function name for backward compatibility
export const getPostBySlug = getArticleBySlug

export async function getCategoryBySlug(slug: string): Promise<SanityCategory | null> {
  if (!isSanityConfigured()) {
    console.warn('Sanity is not configured. Returning null.')
    return null
  }
  
  try {
    const query = `*[_type == "category" && slug.current == $slug][0] {
      _id,
      _type,
      title,
      slug,
      description,
      order
    }`
    
    return await client.fetch<SanityCategory | null>(query, { slug })
  } catch (error: any) {
    console.error('Error fetching category by slug:', error)
    throw new Error(`Failed to fetch category: ${error?.message || 'Unknown error'}`)
  }
}
