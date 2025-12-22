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
    
    // If filtering by category, first get the category to use its _id for more reliable filtering
    let categoryId: string | null = null
    if (categorySlug) {
      const categoryQuery = `*[_type == "category" && slug.current == $categorySlug][0]._id`
      categoryId = await client.fetch<string | null>(categoryQuery, { categorySlug })
      if (!categoryId) {
        console.warn(`[getArticles] Category with slug "${categorySlug}" not found`)
        return []
      }
    }
    
    // Support both 'article' and 'post' types for backward compatibility
    let baseFilter = `(_type == "article" || _type == "post") && defined(publishedAt)`
    
    if (categoryId) {
      // Handle both new (categories array) and old (single category) structures
      // Use category _id for more reliable filtering
      // For new structure: check if categoryId is in the categories array references
      // For old structure: check if category reference matches
      baseFilter += ` && (
        (defined(categories) && count(categories[_ref == $categoryId]) > 0) ||
        (defined(category) && category._ref == $categoryId)
      )`
    }
    
    const query = `*[${baseFilter}] | order(publishedAt desc) [0...$limit] {
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
    if (categoryId) {
      params.categoryId = categoryId
    }
    
    const results = await client.fetch<any[]>(query, params)
    
    // Debug logging
    if (categorySlug) {
      console.log(`[getArticles] Filtering by category: ${categorySlug}`)
      console.log(`[getArticles] Found ${results.length} articles`)
      if (results.length > 0) {
        console.log(`[getArticles] First article categories:`, results[0].categories, results[0].categoryOld)
      }
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
