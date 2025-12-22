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
    <article className="article-card">
      <Link to={`/articles/${article.slug.current}`} className="article-card__link">
        {imageUrl && article.featuredImage && (
          <div className="article-card__image-wrapper">
            <img
              src={imageUrl}
              alt={article.featuredImage.alt || article.title}
              className="article-card__image"
            />
          </div>
        )}
        <div className="article-card__content">
          <div className="article-card__meta">
            {primaryCategory && (
              <span className="article-card__category">{primaryCategory.title}</span>
            )}
            <span className="article-card__date">{publishedDate}</span>
          </div>
          <h2 className="article-card__title">{article.title}</h2>
          {article.excerpt && (
            <p className="article-card__excerpt">{article.excerpt}</p>
          )}
        </div>
      </Link>
    </article>
  )
}

export default ArticleCard

