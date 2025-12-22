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
    
    console.log('[getArticles] Options:', { limit, categorySlug })
    
    // Support both 'article' and 'post' types for backward compatibility
    let filter = `(_type == "article" || _type == "post") && defined(publishedAt)`
    
    // If filtering by category, check both old (single category) and new (categories array) structures
    if (categorySlug) {
      // Clean the slug in case it has path segments
      const cleanSlug = categorySlug.split('/').pop() || categorySlug
      console.log('[getArticles] Filtering by category slug:', cleanSlug)
      
      // Use count() to check if any category in the array matches the slug
      filter += ` && (
        (defined(category) && category->slug.current == $categorySlug) ||
        (defined(categories) && count(categories[@->slug.current == $categorySlug]) > 0)
      )`
    }
    
    console.log('[getArticles] Query filter:', filter)
    
    const query = `*[${filter}] | order(publishedAt desc) [0...$limit] {
      _id,
      _type,
      title,
      slug,
      publishedAt,
      updatedAt,
      excerpt,
      // New structure: categories array
      categories[]-> {
        _id,
        _type,
        title,
        slug,
        description
      },
      // Old structure: single category (convert to array)
      "categoryOld": category-> {
        _id,
        _type,
        title,
        slug,
        description
      },
      tags,
      // New structure: featuredImage
      featuredImage {
        _type,
        asset,
        alt
      },
      // Old structure: mainImage (map to featuredImage)
      "mainImageOld": mainImage {
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
        },
        // Old structure: ogImage at root level
        "ogImageOld": ogImage {
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
      }
    }`
    
    const params: any = { limit }
    if (categorySlug) {
      // Use cleaned slug for the query
      params.categorySlug = categorySlug.split('/').pop() || categorySlug
    }
    
    console.log('[getArticles] Query params:', params)
    const results = await client.fetch<any[]>(query, params)
    console.log('[getArticles] Results count:', results.length)
    
    // Debug: Check what categories the articles actually have
    if (categorySlug && results.length === 0) {
      const debugQuery = `*[(_type == "article" || _type == "post") && defined(publishedAt)][0...5] {
        _id,
        title,
        "oldCategory": category->slug.current,
        "newCategories": categories[]->slug.current
      }`
      const debugResults = await client.fetch<any[]>(debugQuery)
      console.log('[getArticles] Debug - Sample articles and their categories:', debugResults)
    }
    
    // Normalize the results to the new structure
    return results.map((item) => {
      // Use categories array if available, otherwise convert single category to array
      const categories = item.categories && item.categories.length > 0
        ? item.categories
        : item.categoryOld
          ? [item.categoryOld]
          : []
      
      // Use featuredImage if available, otherwise use mainImage
      const featuredImage = item.featuredImage || item.mainImageOld
      
      // Normalize SEO structure
      const seo = item.seo ? {
        ...item.seo,
        openGraph: item.seo.openGraph || (item.seo.ogImageOld ? {
          ogImage: item.seo.ogImageOld
        } : undefined)
      } : undefined
      
      return {
        ...item,
        _type: 'article' as const, // Normalize type
        categories: categories.length > 0 ? categories : undefined,
        featuredImage,
        seo
      } as SanityArticle
    })
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
    // Support both 'article' and 'post' types for backward compatibility
    const query = `*[(_type == "article" || _type == "post") && slug.current == $slug && defined(publishedAt)][0] {
      _id,
      _type,
      title,
      slug,
      publishedAt,
      updatedAt,
      excerpt,
      // New structure: categories array
      categories[]-> {
        _id,
        _type,
        title,
        slug,
        description
      },
      // Old structure: single category (convert to array)
      "categoryOld": category-> {
        _id,
        _type,
        title,
        slug,
        description
      },
      tags,
      // New structure: featuredImage
      featuredImage {
        _type,
        asset,
        alt
      },
      // Old structure: mainImage (map to featuredImage)
      "mainImageOld": mainImage {
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
        },
        // Old structure: ogImage at root level
        "ogImageOld": ogImage {
          _type,
          asset,
          alt
        }
      },
      // Old structure: canonicalUrl at root level
      "canonicalUrlOld": canonicalUrl,
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
    
    const result = await client.fetch<any | null>(query, { slug })
    
    if (!result) return null
    
    // Normalize the result to the new structure
    const categories = result.categories && result.categories.length > 0
      ? result.categories
      : result.categoryOld
        ? [result.categoryOld]
        : []
    
    const featuredImage = result.featuredImage || result.mainImageOld
    
    const seo = result.seo ? {
      ...result.seo,
      canonicalUrl: result.seo.canonicalUrl || result.canonicalUrlOld,
      openGraph: result.seo.openGraph || (result.seo.ogImageOld ? {
        ogImage: result.seo.ogImageOld
      } : undefined)
    } : result.canonicalUrlOld ? {
      canonicalUrl: result.canonicalUrlOld
    } : undefined
    
    return {
      ...result,
      _type: 'article' as const, // Normalize type
      categories: categories.length > 0 ? categories : undefined,
      featuredImage,
      seo
    } as SanityArticle
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
    // Clean the slug in case it has path segments
    const cleanSlug = slug.split('/').pop() || slug
    console.log('[getCategoryBySlug] Looking for category with slug:', cleanSlug)
    
    // First, let's see what categories exist
    const allCategoriesQuery = `*[_type == "category"] {
      _id,
      title,
      "slug": slug.current
    }`
    const allCategories = await client.fetch<any[]>(allCategoriesQuery)
    console.log('[getCategoryBySlug] All categories in Sanity:', allCategories)
    
    const query = `*[_type == "category" && slug.current == $slug][0] {
      _id,
      _type,
      title,
      slug,
      description,
      order
    }`
    
    const result = await client.fetch<SanityCategory | null>(query, { slug: cleanSlug })
    console.log('[getCategoryBySlug] Found category:', result)
    return result
  } catch (error: any) {
    console.error('Error fetching category by slug:', error)
    throw new Error(`Failed to fetch category: ${error?.message || 'Unknown error'}`)
  }
}
