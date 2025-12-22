import { FC, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import ArticleCard from '../components/ArticleCard'
import { getPosts, getCategoryBySlug } from '../lib/sanity/queries'
import { SanityPost, SanityCategory } from '../lib/sanity/types'

const ArticleCategory: FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const [posts, setPosts] = useState<SanityPost[]>([])
  const [category, setCategory] = useState<SanityCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!categorySlug) return
      
      try {
        setLoading(true)
        const [postsData, categoryData] = await Promise.all([
          getPosts({ limit: 20, categorySlug }),
          getCategoryBySlug(categorySlug)
        ])
        setPosts(postsData)
        setCategory(categoryData)
        setError(null)
      } catch (err) {
        setError('Failed to load articles. Please try again later.')
        console.error('Error fetching category articles:', err)
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
                {posts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
                    <p>No articles found in this category. Check back soon for new content!</p>
                    <Link to="/articles" className="btn btn--primary" style={{ marginTop: 'var(--spacing-md)' }}>
                      View All Articles
                    </Link>
                  </div>
                ) : (
                  <div className="articles__grid">
                    {posts.map((post) => (
                      <ArticleCard key={post._id} post={post} />
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

