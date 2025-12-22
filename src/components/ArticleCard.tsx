import { FC } from 'react'
import { Link } from 'react-router-dom'
import { SanityPost } from '../lib/sanity/types'
import { urlFor } from '../lib/sanity/image'

interface ArticleCardProps {
  post: SanityPost
}

const ArticleCard: FC<ArticleCardProps> = ({ post }) => {
  const imageUrl = urlFor(post.mainImage)?.width(600).height(400).url()
  const publishedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <article className="article-card">
      <Link to={`/articles/${post.slug.current}`} className="article-card__link">
        {imageUrl && (
          <div className="article-card__image-wrapper">
            <img
              src={imageUrl}
              alt={post.mainImage.alt || post.title}
              className="article-card__image"
            />
          </div>
        )}
        <div className="article-card__content">
          <div className="article-card__meta">
            <span className="article-card__category">{post.category.title}</span>
            <span className="article-card__date">{publishedDate}</span>
          </div>
          <h2 className="article-card__title">{post.title}</h2>
          {post.excerpt && (
            <p className="article-card__excerpt">{post.excerpt}</p>
          )}
        </div>
      </Link>
    </article>
  )
}

export default ArticleCard

