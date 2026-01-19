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
        keywords="accounting articles, tax tips, business advice, financial insights, Canadian Income Tax, tax planning, accounting advice, business consulting, Ottawa accountant, Ottawa tax advice"
        canonical="/articles"
      />
      <main>
        <section className="py-xxl">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <h1 className="mb-md">Articles</h1>
              <p className="text-lg text-text-light">
                Insights, tips, and updates on accounting, consulting, and technology.
              </p>
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
                {categories.length > 0 && (
                  <div className="flex gap-sm flex-wrap mb-xl pb-md border-b border-border">
                    <Link
                      to="/articles"
                      className="px-md py-xs rounded-lg bg-primary text-white no-underline border border-primary transition-all text-[0.9375rem] hover:bg-primary-dark"
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
                          className="px-md py-xs rounded-lg bg-white text-text no-underline border border-border transition-all text-[0.9375rem] hover:bg-primary hover:text-white hover:border-primary"
                        >
                          {category.title}
                        </Link>
                      )
                    })}
                  </div>
                )}

                {articles.length === 0 ? (
                  <div className="text-center py-xl">
                    <p>No articles found. Check back soon for new content!</p>
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

export default Articles
