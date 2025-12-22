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

export interface SanitySEO {
  metaTitle?: string
  metaDescription?: string
  ogImage?: SanityImage
}

export interface SanityPost {
  _id: string
  _type: 'post'
  title: string
  slug: {
    current: string
  }
  publishedAt: string
  excerpt: string
  category: SanityCategory
  mainImage?: SanityImage
  body: any[] // Portable Text
  seo?: SanitySEO
  author?: SanityAuthor
  canonicalUrl?: string
}

