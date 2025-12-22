import { FC, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import ArticleCard from '../components/ArticleCard'
import { getArticles, getCategories } from '../lib/sanity/queries'
import { SanityArticle, SanityCategory } from '../lib/sanity/types'

const Articles: FC = () => {
  const [articles, setArticles] = useState<SanityArticle[]>([])
  const [categories, setCategories] = useState<SanityCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [articlesData, categoriesData] = await Promise.all([
          getArticles({ limit: 12 }),
          getCategories()
        ])
        setArticles(articlesData)
        setCategories(categoriesData)
        setError(null)
      } catch (err: any) {
        const errorMessage = err?.message || 'Unknown error'
        console.error('Error fetching articles:', err)
        console.error('Error details:', {
          message: errorMessage,
          projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
          dataset: import.meta.env.VITE_SANITY_DATASET,
          hasProjectId: !!import.meta.env.VITE_SANITY_PROJECT_ID
        })
        setError(`Failed to load articles: ${errorMessage}. Please check your Sanity configuration.`)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <>
      <SEO
        title="Articles"
        description="Insights, tips, and updates on accounting, consulting, and technology from RPC Associates. Stay informed with expert articles and industry news."
        canonical="/articles"
      />
      <main>
        <section className="section">
          <div className="container">
            <div className="section__header">
              <h1 className="section__title">Articles</h1>
              <p className="section__subtitle">
                Insights, tips, and updates on accounting, consulting, and technology.
              </p>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
                <p>Loading articles...</p>
              </div>
            )}

            {error && (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0', color: '#dc3545' }}>
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                {categories.length > 0 && (
                  <div className="articles__categories">
                    <Link
                      to="/articles"
                      className="articles__category-link articles__category-link--active"
                    >
                      All
                    </Link>
                    {categories.map((category) => {
                      // Ensure we only use the slug part, not any path that might be included
                      const slug = category.slug.current.split('/').pop() || category.slug.current
                      return (
                        <Link
                          key={category._id}
                          to={`/articles/category/${slug}`}
                          className="articles__category-link"
                        >
                          {category.title}
                        </Link>
                      )
                    })}
                  </div>
                )}

                {articles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
                    <p>No articles found. Check back soon for new content!</p>
                  </div>
                ) : (
                  <div className="articles__grid">
                    {articles.map((article) => (
                      <ArticleCard key={article._id} article={article} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

export default Articles
