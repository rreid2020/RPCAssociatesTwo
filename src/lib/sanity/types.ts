export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  alt?: string
}

export interface SanityCategory {
  _id: string
  _type: 'category'
  title: string
  slug: {
    current: string
  }
  description?: string
  order?: number
}

export interface SanityAuthor {
  _id: string
  _type: 'author'
  name: string
  role?: string
  image?: SanityImage
  bio?: string
}

export interface SanityOpenGraph {
  ogTitle?: string
  ogDescription?: string
  ogImage?: SanityImage
}

export interface SanitySEO {
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  noIndex?: boolean
  openGraph?: SanityOpenGraph
}

export interface SanityArticle {
  _id: string
  _type: 'article'
  title: string
  slug: {
    current: string
  }
  publishedAt: string
  updatedAt?: string
  excerpt?: string
  categories?: SanityCategory[]
  tags?: string[]
  featuredImage?: SanityImage
  body: any[] // Portable Text
  seo?: SanitySEO
  author?: SanityAuthor
}

