import { FC } from 'react'
import { Link } from 'react-router-dom'
import { SanityArticle } from '../lib/sanity/types'
import { urlFor } from '../lib/sanity/image'

interface ArticleCardProps {
  article: SanityArticle
}

const ArticleCard: FC<ArticleCardProps> = ({ article }) => {
  const imageUrl = article.featuredImage ? urlFor(article.featuredImage)?.width(600).height(400).url() : null
  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  // Get first category or default
  const primaryCategory = article.categories && article.categories.length > 0 
    ? article.categories[0] 
    : null

  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <Link to={`/articles/${article.slug.current}`} className="no-underline text-inherit block">
        {imageUrl && article.featuredImage && (
          <div className="w-full h-[200px] overflow-hidden bg-background">
            <img
              src={imageUrl}
              alt={article.featuredImage.alt || article.title}
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          </div>
        )}
        <div className="p-md">
          <div className="flex gap-sm items-center mb-sm text-sm text-text-light flex-wrap">
            {primaryCategory && (
              <span className="bg-primary text-white px-xs py-1 rounded font-medium">{primaryCategory.title}</span>
            )}
            <span className="text-text-light">{publishedDate}</span>
          </div>
          <h2 className="text-xl font-semibold text-primary mb-xs leading-tight">{article.title}</h2>
          {article.excerpt && (
            <p className="text-text-light text-[0.9375rem] leading-relaxed m-0">{article.excerpt}</p>
          )}
        </div>
      </Link>
    </article>
  )
}

export default ArticleCard

