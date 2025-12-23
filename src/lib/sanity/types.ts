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
  parent?: SanityCategory
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
  ogType?: string
}

export interface SanityTwitter {
  card?: string
  title?: string
  description?: string
  image?: SanityImage
}

export interface SanitySchema {
  articleType?: string
  authorName?: string
  publisherName?: string
  publisherLogo?: string
}

export interface SanitySEO {
  metaTitle?: string
  metaDescription?: string
  keywords?: string[]
  focusKeyword?: string
  canonicalUrl?: string
  noIndex?: boolean
  noFollow?: boolean
  openGraph?: SanityOpenGraph
  twitter?: SanityTwitter
  schema?: SanitySchema
}

export interface SanityFileAsset {
  _id: string
  url: string
  originalFilename?: string
  size?: number
  mimeType?: string
}

export interface SanityFile {
  _type: 'file'
  asset: SanityFileAsset | {
    _ref: string
    _type: 'reference'
  }
}

export interface SanityDownload {
  _key: string
  title: string
  description?: string
  file: {
    asset: SanityFileAsset
  }
  buttonText?: string
}

export interface SanityRelatedLink {
  _key: string
  title: string
  url: string
  description?: string
  isExternal?: boolean
}

export interface SanityArticle {
  _id: string
  _type: 'article' | 'post' // Support both types
  title: string
  slug: {
    current: string
  }
  publishedAt: string
  updatedAt?: string
  excerpt?: string
  categories?: SanityCategory[]
  category?: SanityCategory // Legacy single category field
  tags?: string[]
  featuredImage?: SanityImage
  mainImage?: SanityImage // Legacy field name
  body: any[] // Portable Text
  seo?: SanitySEO
  author?: SanityAuthor
  downloads?: SanityDownload[] // Downloadable files
  relatedLinks?: SanityRelatedLink[] // Related/internal links
}

