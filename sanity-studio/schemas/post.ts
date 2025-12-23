import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content'},
    {name: 'seo', title: 'SEO'},
    {name: 'meta', title: 'Metadata'},
  ],
  fields: [
    // ----------------------------
    // Content
    // ----------------------------
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      group: 'content',
      rows: 3,
      validation: Rule => Rule.required().max(200)
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      group: 'content',
      options: {
        hotspot: true
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string'
        })
      ],
      description: 'Optional featured image for the article'
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'block'
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string'
            }
          ]
        }
      ],
      validation: Rule => Rule.required()
    }),

    // ----------------------------
    // Metadata
    // ----------------------------
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'meta',
      validation: Rule => Rule.required(),
      initialValue: () => new Date().toISOString()
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      group: 'meta',
      to: [{ type: 'category' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      group: 'meta',
      to: [{ type: 'author' }]
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'meta',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'relatedLinks',
      title: 'Related Links',
      type: 'array',
      group: 'content',
      description: 'Links to other pages on your website or external resources',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Link Title',
              type: 'string',
              description: 'Text to display for the link',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'string',
              description: 'Internal path (e.g., /articles/tax-tips) or external URL (e.g., https://example.com)',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
              description: 'Optional description shown below the link'
            }),
            defineField({
              name: 'isExternal',
              title: 'External Link',
              type: 'boolean',
              description: 'Check if this is an external website link',
              initialValue: false
            })
          ],
          preview: {
            select: {
              title: 'title',
              url: 'url',
              isExternal: 'isExternal'
            },
            prepare({ title, url, isExternal }) {
              return {
                title: title || 'Untitled Link',
                subtitle: isExternal ? `External: ${url}` : `Internal: ${url}`
              }
            }
          }
        }
      ]
    }),
    defineField({
      name: 'downloads',
      title: 'Downloadable Files',
      type: 'array',
      group: 'content',
      description: 'Excel files, PDFs, or other documents that readers can download',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'File Title',
              type: 'string',
              description: 'Display name for the download button (e.g., "Tax Checklist Template")',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
              description: 'Optional description shown below the download button'
            }),
            defineField({
              name: 'file',
              title: 'File',
              type: 'file',
              options: {
                accept: '.xlsx,.xls,.pdf,.doc,.docx,.csv'
              },
              validation: Rule => Rule.required(),
              description: 'Upload Excel, PDF, or other document files'
            }),
            defineField({
              name: 'buttonText',
              title: 'Button Text',
              type: 'string',
              description: 'Text on the download button (default: "Download")',
              initialValue: 'Download'
            })
          ],
          preview: {
            select: {
              title: 'title',
              filename: 'file.asset.originalFilename'
            },
            prepare({ title, filename }) {
              return {
                title: title || filename || 'Untitled Download',
                subtitle: filename ? `File: ${filename}` : 'No file selected'
              }
            }
          }
        }
      ]
    }),

    // ----------------------------
    // SEO
    // ----------------------------
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta title',
          type: 'string',
          description: 'SEO title (recommended: 50-60 characters)',
          validation: (Rule) => Rule.max(60),
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta description',
          type: 'text',
          rows: 3,
          description: 'SEO description (recommended: 150-160 characters)',
          validation: (Rule) => Rule.max(160),
        }),
        defineField({
          name: 'keywords',
          title: 'Keywords',
          type: 'array',
          description: 'SEO keywords (comma-separated or individual tags)',
          of: [{type: 'string'}],
          options: {
            layout: 'tags'
          }
        }),
        defineField({
          name: 'focusKeyword',
          title: 'Focus keyword',
          type: 'string',
          description: 'Primary keyword for this article',
        }),
        defineField({
          name: 'canonicalUrl',
          title: 'Canonical URL',
          type: 'url',
          description: 'Canonical URL to prevent duplicate content issues',
        }),
        defineField({
          name: 'noIndex',
          title: 'No index',
          type: 'boolean',
          initialValue: false,
          description: 'Prevent search engines from indexing this page',
        }),
        defineField({
          name: 'noFollow',
          title: 'No follow',
          type: 'boolean',
          initialValue: false,
          description: 'Tell search engines not to follow links on this page',
        }),
        defineField({
          name: 'openGraph',
          title: 'Open Graph (Facebook/LinkedIn)',
          type: 'object',
          fields: [
            defineField({
              name: 'ogTitle',
              title: 'OG title',
              type: 'string',
              description: 'Title for social sharing (recommended: 40-60 characters)',
              validation: (Rule) => Rule.max(95),
            }),
            defineField({
              name: 'ogDescription',
              title: 'OG description',
              type: 'text',
              rows: 3,
              description: 'Description for social sharing (recommended: 125-200 characters)',
              validation: (Rule) => Rule.max(200),
            }),
            defineField({
              name: 'ogImage',
              title: 'OG image',
              type: 'image',
              description: 'Image for social sharing (recommended: 1200x630px)',
              options: {hotspot: true},
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Alt text',
                  type: 'string',
                  validation: (Rule) => Rule.max(140),
                }),
              ],
            }),
            defineField({
              name: 'ogType',
              title: 'OG type',
              type: 'string',
              description: 'Type of content (article, website, etc.)',
              initialValue: 'article',
              options: {
                list: [
                  {title: 'Article', value: 'article'},
                  {title: 'Website', value: 'website'},
                  {title: 'Blog', value: 'blog'},
                ]
              }
            }),
          ],
        }),
        defineField({
          name: 'twitter',
          title: 'Twitter Card',
          type: 'object',
          fields: [
            defineField({
              name: 'card',
              title: 'Card type',
              type: 'string',
              initialValue: 'summary_large_image',
              options: {
                list: [
                  {title: 'Summary', value: 'summary'},
                  {title: 'Summary Large Image', value: 'summary_large_image'},
                ]
              }
            }),
            defineField({
              name: 'title',
              title: 'Twitter title',
              type: 'string',
              description: 'Title for Twitter (recommended: 70 characters)',
              validation: (Rule) => Rule.max(70),
            }),
            defineField({
              name: 'description',
              title: 'Twitter description',
              type: 'text',
              rows: 2,
              description: 'Description for Twitter (recommended: 200 characters)',
              validation: (Rule) => Rule.max(200),
            }),
            defineField({
              name: 'image',
              title: 'Twitter image',
              type: 'image',
              description: 'Image for Twitter (recommended: 1200x675px)',
              options: {hotspot: true},
            }),
          ],
        }),
        defineField({
          name: 'schema',
          title: 'Structured Data (Schema.org)',
          type: 'object',
          description: 'JSON-LD structured data for rich snippets',
          fields: [
            defineField({
              name: 'articleType',
              title: 'Article type',
              type: 'string',
              initialValue: 'BlogPosting',
              options: {
                list: [
                  {title: 'Blog Posting', value: 'BlogPosting'},
                  {title: 'Article', value: 'Article'},
                  {title: 'News Article', value: 'NewsArticle'},
                  {title: 'Tech Article', value: 'TechArticle'},
                ]
              }
            }),
            defineField({
              name: 'authorName',
              title: 'Author name (for schema)',
              type: 'string',
              description: 'Author name for structured data (if different from author field)',
            }),
            defineField({
              name: 'publisherName',
              title: 'Publisher name',
              type: 'string',
              description: 'Publisher name for structured data',
              initialValue: 'RPC Associates',
            }),
            defineField({
              name: 'publisherLogo',
              title: 'Publisher logo URL',
              type: 'url',
              description: 'URL to publisher logo for structured data',
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category.title',
      media: 'mainImage',
      publishedAt: 'publishedAt'
    },
    prepare({ title, subtitle, media, publishedAt }) {
      return {
        title,
        subtitle: `${subtitle || 'Uncategorized'} • ${publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Draft'}`,
        media
      }
    }
  },
  orderings: [
    {
      title: 'Published Date, Newest',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }]
    },
    {
      title: 'Published Date, Oldest',
      name: 'publishedAtAsc',
      by: [{ field: 'publishedAt', direction: 'asc' }]
    }
  ]
})

