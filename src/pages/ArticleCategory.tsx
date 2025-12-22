import { FC, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import ArticleCard from '../components/ArticleCard'
import { getArticles, getCategoryBySlug, getCategories } from '../lib/sanity/queries'
import { SanityArticle, SanityCategory } from '../lib/sanity/types'

const ArticleCategory: FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const [articles, setArticles] = useState<SanityArticle[]>([])
  const [category, setCategory] = useState<SanityCategory | null>(null)
  const [categories, setCategories] = useState<SanityCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!categorySlug) return
      
      // Clean up the category slug in case it has path segments
      const cleanSlug = categorySlug.split('/').pop() || categorySlug
      console.log('[ArticleCategory] Original slug:', categorySlug, 'Cleaned slug:', cleanSlug)
      
      try {
        setLoading(true)
        setError(null)
        const [articlesData, categoryData, categoriesData] = await Promise.all([
          getArticles({ limit: 20, categorySlug: cleanSlug }),
          getCategoryBySlug(cleanSlug),
          getCategories()
        ])
        
        console.log('[ArticleCategory] Articles found:', articlesData.length)
        console.log('[ArticleCategory] Category data:', categoryData)
        
        setArticles(articlesData)
        setCategory(categoryData)
        setCategories(categoriesData)
        
        if (!categoryData) {
          setError(`Category "${cleanSlug}" not found.`)
        } else if (articlesData.length === 0) {
          // Show a message but don't set error - this is a valid state
          console.log('[ArticleCategory] No articles found for category:', cleanSlug)
        }
      } catch (err: any) {
        const errorMessage = err?.message || 'Unknown error'
        console.error('[ArticleCategory] Error fetching category articles:', err)
        console.error('[ArticleCategory] Category slug:', cleanSlug)
        setError(`Failed to load articles: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [categorySlug])

  if (!categorySlug) {
    return (
      <>
        <SEO title="Category Not Found" canonical="/articles" />
        <main>
          <section className="section">
            <div className="container">
              <h1>Category Not Found</h1>
              <p>The requested category does not exist.</p>
            </div>
          </section>
        </main>
      </>
    )
  }

  return (
    <>
      <SEO
        title={category ? `${category.title} Articles` : 'Category'}
        description={category?.description || `Articles in the ${category?.title || categorySlug} category`}
        canonical={`/articles/category/${categorySlug}`}
      />
      <main>
        <section className="section">
          <div className="container">
            <div className="section__header">
              <h1 className="section__title">
                {category ? category.title : 'Category'}
              </h1>
              {category?.description && (
                <p className="section__subtitle">{category.description}</p>
              )}
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
                {categories.length > 0 && (() => {
                  // Clean the current category slug for comparison
                  const currentSlug = categorySlug ? categorySlug.split('/').pop() || categorySlug : ''
                  return (
                    <div className="articles__categories">
                      <Link
                        to="/articles"
                        className="articles__category-link"
                      >
                        All
                      </Link>
                      {categories.map((cat) => {
                        // Ensure we only use the slug part, not any path that might be included
                        const slug = cat.slug.current.split('/').pop() || cat.slug.current
                        const isActive = currentSlug === slug
                        return (
                          <Link
                            key={cat._id}
                            to={`/articles/category/${slug}`}
                            className={`articles__category-link ${isActive ? 'articles__category-link--active' : ''}`}
                          >
                            {cat.title}
                          </Link>
                        )
                      })}
                    </div>
                  )
                })()}

                {articles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
                    <p>No articles found in this category. Check back soon for new content!</p>
                    <Link to="/articles" className="btn btn--primary" style={{ marginTop: 'var(--spacing-md)' }}>
                      View All Articles
                    </Link>
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

export default ArticleCategory

