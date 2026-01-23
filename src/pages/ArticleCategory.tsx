import { FC, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
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

  const categoryTitle = category ? category.title : categorySlug ? categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Category'
  const categoryName = category?.title || (categorySlug ? categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'expert')
  const categoryDescription = category?.description || `Browse our collection of ${categoryName} articles covering accounting, tax planning, and business consulting. Expert insights and practical advice from RPC Associates, serving businesses across Canada.`
  const canonicalUrl = `https://rpcassociates.co/articles/category/${categorySlug}`

  return (
    <>
      <SEO
        title={`${categoryTitle} Articles | RPC Associates`}
        description={categoryDescription}
        keywords={category?.title?.toLowerCase().includes('tax') || categorySlug?.toLowerCase().includes('tax') 
          ? `Canadian Income Tax, ${category?.title || categorySlug}, tax articles, tax advice, tax planning, Ottawa tax services, Ottawa accountant, Canadian tax information`
          : `${category?.title || categorySlug}, accounting articles, business advice, Canadian Income Tax, Ottawa accountant, Ottawa accounting services, financial consulting, business consulting Canada`}
        canonical={`/articles/category/${categorySlug}`}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${categoryTitle} Articles`,
            description: categoryDescription,
            url: canonicalUrl,
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: articles.length,
              itemListElement: articles.map((article, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'Article',
                  '@id': `https://rpcassociates.co/articles/${article.slug.current}`,
                  name: article.title,
                  description: article.excerpt || article.seo?.metaDescription,
                  url: `https://rpcassociates.co/articles/${article.slug.current}`
                }
              }))
            },
            publisher: {
              '@type': 'Organization',
              name: 'RPC Associates',
              url: 'https://rpcassociates.co'
            }
          })}
        </script>
      </Helmet>
      <main>
        <section className="py-xxl">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <h1 className="mb-md">
                {categoryTitle} Articles
              </h1>
              {category?.description ? (
                <p className="text-lg text-text-light mb-md">{category.description}</p>
              ) : (
                <p className="text-lg text-text-light mb-md">
                  Browse our collection of articles covering {categoryName}. 
                  Find expert insights, practical advice, and the latest information on accounting, tax planning, and business consulting.
                </p>
              )}
              <p className="text-base text-text-light">
                RPC Associates provides professional accounting, consulting, and tech solutions for businesses across Canada. 
                Our articles offer valuable insights to help you make informed financial decisions.
              </p>
            </div>

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

            {loading && (
              <div className="text-center py-xl">
                <p className="text-text-light">Loading articles...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-xl">
                <div className="bg-red-50 border border-red-200 rounded-lg p-lg max-w-[600px] mx-auto">
                  <p className="text-red-800 font-semibold mb-sm">Error Loading Articles</p>
                  <p className="text-red-600">{error}</p>
                  <Link to="/articles" className="btn btn--primary mt-md inline-block">
                    View All Articles
                  </Link>
                </div>
              </div>
            )}

            {!loading && !error && (
              <>
                {articles.length === 0 ? (
                  <div className="text-center py-xl">
                    <div className="max-w-[600px] mx-auto">
                      <h2 className="text-2xl font-semibold text-primary mb-md">No Articles Yet</h2>
                      <p className="text-lg text-text-light mb-md">
                        We're currently working on adding articles to this category. Check back soon for expert insights, 
                        practical advice, and valuable information about {category?.title?.toLowerCase() || categorySlug?.replace(/-/g, ' ') || 'this topic'}.
                      </p>
                      <p className="text-base text-text-light mb-lg">
                        In the meantime, explore our other resources and articles to help with your accounting, tax planning, 
                        and business consulting needs.
                      </p>
                      <div className="flex gap-md justify-center flex-wrap">
                        <Link to="/articles" className="btn btn--primary">
                          View All Articles
                        </Link>
                        <Link to="/resources" className="btn btn--secondary">
                          Browse Resources
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-base text-text-light mb-lg">
                      Showing {articles.length} article{articles.length !== 1 ? 's' : ''} in this category.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                      {articles.map((article) => (
                        <ArticleCard key={article._id} article={article} />
                      ))}
                    </div>
                  </>
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

