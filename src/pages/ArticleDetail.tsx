import { FC, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import PortableText from '../components/PortableText'
import DownloadButton from '../components/DownloadButton'
import RelatedLinks from '../components/RelatedLinks'
import CalendlyButton from '../components/CalendlyButton'
import MarketingPageHero from '../components/MarketingPageHero'
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
        <main className="svc-landing">
          <section className="closing">
            <div className="wrap">
              <h2>Article not found</h2>
              <p className="lede">The requested article does not exist.</p>
              <div className="cta-row">
                <Link to="/articles" className="btn btn-solid">
                  Back to articles
                </Link>
              </div>
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
        <main className="svc-landing">
          <section className="alt">
            <div className="wrap">
              <p className="intro">Loading article…</p>
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
        <main className="svc-landing">
          <section className="closing">
            <div className="wrap">
              <h2>Article not found</h2>
              <p className="lede">{error || 'The requested article does not exist.'}</p>
              <div className="cta-row">
                <Link to="/articles" className="btn btn-solid">
                  Back to articles
                </Link>
              </div>
            </div>
          </section>
        </main>
      </>
    )
  }

  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const primaryCategory = article.categories && article.categories.length > 0
    ? article.categories[0]
    : null

  const imageUrl = article.featuredImage ? urlFor(article.featuredImage)?.width(1200).url() : null
  const ogImageUrl = article.seo?.openGraph?.ogImage
    ? urlFor(article.seo.openGraph.ogImage)?.width(1200).url()
    : imageUrl || undefined

  const twitterImageUrl = article.seo?.twitter?.image
    ? urlFor(article.seo.twitter.image)?.width(1200).url()
    : ogImageUrl || undefined

  const categorySlug = primaryCategory
    ? primaryCategory.slug.current.split('/').pop() || primaryCategory.slug.current
    : null

  return (
    <>
      <SEO
        title={article.seo?.metaTitle || article.title}
        description={article.seo?.metaDescription || article.excerpt}
        keywords={article.seo?.keywords || article.tags}
        canonical={article.seo?.canonicalUrl || `/articles/${article.slug.current}`}
        ogImage={ogImageUrl || undefined}
        ogType={article.seo?.openGraph?.ogType}
        type="article"
        noIndex={article.seo?.noIndex}
        noFollow={article.seo?.noFollow}
        twitterCard={article.seo?.twitter?.card}
        twitterTitle={article.seo?.twitter?.title}
        twitterDescription={article.seo?.twitter?.description}
        twitterImage={twitterImageUrl}
        schemaType={article.seo?.schema?.articleType}
        schemaAuthor={article.seo?.schema?.authorName || article.author?.name}
        schemaPublisher={article.seo?.schema?.publisherName}
        schemaPublisherLogo={article.seo?.schema?.publisherLogo}
        publishedDate={article.publishedAt}
        modifiedDate={article.updatedAt}
      />
      <main>
        <MarketingPageHero
          eyebrow={primaryCategory?.title || 'Articles'}
          title={article.title}
          lede={article.excerpt || `Published ${publishedDate}${article.author ? ` · By ${article.author.name}` : ''}`}
          primary={(
            <Link to="/articles" className="btn btn-primary">
              All articles
            </Link>
          )}
          secondary={
            categorySlug ? (
              <Link to={`/articles/category/${categorySlug}`} className="btn btn-ghost">
                {primaryCategory?.title}
              </Link>
            ) : undefined
          }
          strip={[
            publishedDate,
            ...(article.author ? [`By ${article.author.name}`] : []),
          ]}
        />

        <div className="svc-landing">
          <section className="alt">
            <div className="wrap" style={{ maxWidth: 800 }}>
              {imageUrl && article.featuredImage ? (
                <div className="w-full mb-xl overflow-hidden" style={{ borderRadius: 6 }}>
                  <img
                    src={imageUrl}
                    alt={article.featuredImage.alt || article.title}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-auto block"
                  />
                </div>
              ) : null}

              <div className="mb-xxl">
                <PortableText content={article.body} />
              </div>

              {article.downloads && article.downloads.length > 0 ? (
                <div className="mb-xxl">
                  <h2>Downloads</h2>
                  <div className="flex flex-col gap-md mt-md">
                    {article.downloads.map((download) => (
                      <DownloadButton key={download._key} download={download} />
                    ))}
                  </div>
                </div>
              ) : null}

              {article.relatedLinks && article.relatedLinks.length > 0 ? (
                <RelatedLinks links={article.relatedLinks} />
              ) : null}
            </div>
          </section>

          <section className="closing" id="closing">
            <div className="wrap">
              <h2>Ready to get started?</h2>
              <p className="lede">
                Let&apos;s discuss how we can help with your accounting, consulting, or technology needs.
              </p>
              <div className="cta-row">
                <CalendlyButton text="Book a 30-minute call" className="btn btn-solid" />
                <a href="tel:6138840208" className="btn btn-outline">
                  Call: 613-884-0208
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default ArticleDetail
