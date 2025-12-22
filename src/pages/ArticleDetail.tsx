import { FC, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import PortableText from '../components/PortableText'
import { getArticleBySlug } from '../lib/sanity/queries'
import { SanityArticle } from '../lib/sanity/types'
import { urlFor } from '../lib/sanity/image'

const ArticleDetail: FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<SanityArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchArticle() {
      if (!slug) return
      
      try {
        setLoading(true)
        const articleData = await getArticleBySlug(slug)
        if (!articleData) {
          setError('Article not found')
        } else {
          setArticle(articleData)
          setError(null)
        }
      } catch (err) {
        setError('Failed to load article. Please try again later.')
        console.error('Error fetching article:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
  }, [slug])

  if (!slug) {
    return (
      <>
        <SEO title="Article Not Found" canonical="/articles" />
        <main>
          <section className="section">
            <div className="container">
              <h1>Article Not Found</h1>
              <p>The requested article does not exist.</p>
              <Link to="/articles" className="btn btn--primary" style={{ marginTop: 'var(--spacing-md)' }}>
                Back to Articles
              </Link>
            </div>
          </section>
        </main>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <SEO title="Loading..." canonical="/articles" />
        <main>
          <section className="section">
            <div className="container">
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
                <p>Loading article...</p>
              </div>
            </div>
          </section>
        </main>
      </>
    )
  }

  if (error || !article) {
    return (
      <>
        <SEO title="Article Not Found" canonical="/articles" />
        <main>
          <section className="section">
            <div className="container">
              <h1>Article Not Found</h1>
              <p>{error || 'The requested article does not exist.'}</p>
              <Link to="/articles" className="btn btn--primary" style={{ marginTop: 'var(--spacing-md)' }}>
                Back to Articles
              </Link>
            </div>
          </section>
        </main>
      </>
    )
  }

  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const primaryCategory = article.categories && article.categories.length > 0 
    ? article.categories[0] 
    : null

  const imageUrl = article.featuredImage ? urlFor(article.featuredImage)?.width(1200).url() : null
  const ogImageUrl = article.seo?.openGraph?.ogImage 
    ? urlFor(article.seo.openGraph.ogImage)?.width(1200).url()
    : imageUrl || undefined

  return (
    <>
      <SEO
        title={article.seo?.metaTitle || article.title}
        description={article.seo?.metaDescription || article.excerpt}
        canonical={article.seo?.canonicalUrl || `/articles/${article.slug.current}`}
        ogImage={ogImageUrl || undefined}
        type="article"
        noIndex={article.seo?.noIndex}
      />
      <main>
        <article className="article-detail">
          <section className="section">
            <div className="container">
              <div className="article-detail__header">
                <Link to="/articles" className="article-detail__back-link">
                  ← Back to Articles
                </Link>
                
                <div className="article-detail__meta">
                  {primaryCategory && (() => {
                    // Ensure we only use the slug part, not any path that might be included
                    const slug = primaryCategory.slug.current.split('/').pop() || primaryCategory.slug.current
                    return (
                      <Link
                        to={`/articles/category/${slug}`}
                        className="article-detail__category"
                      >
                        {primaryCategory.title}
                      </Link>
                    )
                  })()}
                  <span className="article-detail__date">{publishedDate}</span>
                  {article.author && (
                    <span className="article-detail__author">By {article.author.name}</span>
                  )}
                </div>

                <h1 className="article-detail__title">{article.title}</h1>
                
                {article.excerpt && (
                  <p className="article-detail__excerpt">{article.excerpt}</p>
                )}
              </div>

              {imageUrl && article.featuredImage && (
                <div className="article-detail__image-wrapper">
                  <img
                    src={imageUrl}
                    alt={article.featuredImage.alt || article.title}
                    className="article-detail__image"
                  />
                </div>
              )}

              <div className="article-detail__content">
                <PortableText content={article.body} />
              </div>

              <div className="article-detail__cta">
                <h2 className="article-detail__cta-title">Ready to Get Started?</h2>
                <p className="article-detail__cta-description">
                  Let's discuss how we can help with your accounting, consulting, or technology needs.
                </p>
                <div className="article-detail__cta-buttons">
                  <a href="/#contact" className="btn btn--primary">
                    Book a Consultation
                  </a>
                  <a href="tel:6138840208" className="btn btn--secondary">
                    Call: 613-884-0208
                  </a>
                </div>
              </div>
            </div>
          </section>
        </article>
      </main>
    </>
  )
}

export default ArticleDetail

