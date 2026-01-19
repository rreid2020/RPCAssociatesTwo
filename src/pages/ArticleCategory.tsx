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
          <section className="py-xxl">
            <div className="max-w-[1200px] mx-auto px-md">
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
        <section className="py-xxl">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <h1 className="mb-md">
                {category ? category.title : 'Category'}
              </h1>
              {category?.description && (
                <p className="text-lg text-text-light">{category.description}</p>
              )}
            </div>

            {loading && (
              <div className="text-center py-xl">
                <p>Loading articles...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-xl text-red-600">
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                {categories.length > 0 && (() => {
                  // Clean the current category slug for comparison
                  const currentSlug = categorySlug ? categorySlug.split('/').pop() || categorySlug : ''
                  return (
                    <div className="flex gap-sm flex-wrap mb-xl pb-md border-b border-border">
                      <Link
                        to="/articles"
                        className="px-md py-xs rounded-lg bg-white text-text no-underline border border-border transition-all text-[0.9375rem] hover:bg-primary hover:text-white hover:border-primary"
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
                            className={`px-md py-xs rounded-lg no-underline border transition-all text-[0.9375rem] ${
                              isActive 
                                ? 'bg-primary text-white border-primary' 
                                : 'bg-white text-text border-border hover:bg-primary hover:text-white hover:border-primary'
                            }`}
                          >
                            {cat.title}
                          </Link>
                        )
                      })}
                    </div>
                  )
                })()}

                {articles.length === 0 ? (
                  <div className="text-center py-xl">
                    <p>No articles found in this category. Check back soon for new content!</p>
                    <Link to="/articles" className="btn btn--primary mt-md">
                      View All Articles
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mt-lg">
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

