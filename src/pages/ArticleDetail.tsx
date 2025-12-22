import { FC, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import PortableText from '../components/PortableText'
import { getPostBySlug } from '../lib/sanity/queries'
import { SanityPost } from '../lib/sanity/types'
import { urlFor } from '../lib/sanity/image'

const ArticleDetail: FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<SanityPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return
      
      try {
        setLoading(true)
        const postData = await getPostBySlug(slug)
        if (!postData) {
          setError('Article not found')
        } else {
          setPost(postData)
          setError(null)
        }
      } catch (err) {
        setError('Failed to load article. Please try again later.')
        console.error('Error fetching article:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
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

  if (error || !post) {
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

  const publishedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const imageUrl = urlFor(post.mainImage)?.width(1200).url()
  const ogImageUrl = post.seo?.ogImage 
    ? urlFor(post.seo.ogImage)?.width(1200).url()
    : imageUrl

  return (
    <>
      <SEO
        title={post.seo?.metaTitle || post.title}
        description={post.seo?.metaDescription || post.excerpt}
        canonical={post.canonicalUrl || `/articles/${post.slug.current}`}
        ogImage={ogImageUrl || undefined}
        type="article"
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
                  <Link
                    to={`/articles/category/${post.category.slug.current}`}
                    className="article-detail__category"
                  >
                    {post.category.title}
                  </Link>
                  <span className="article-detail__date">{publishedDate}</span>
                  {post.author && (
                    <span className="article-detail__author">By {post.author.name}</span>
                  )}
                </div>

                <h1 className="article-detail__title">{post.title}</h1>
                
                {post.excerpt && (
                  <p className="article-detail__excerpt">{post.excerpt}</p>
                )}
              </div>

              {imageUrl && (
                <div className="article-detail__image-wrapper">
                  <img
                    src={imageUrl}
                    alt={post.mainImage.alt || post.title}
                    className="article-detail__image"
                  />
                </div>
              )}

              <div className="article-detail__content">
                <PortableText content={post.body} />
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

