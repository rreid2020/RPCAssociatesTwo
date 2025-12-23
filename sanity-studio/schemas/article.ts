import {defineType, defineField, defineArrayMember} from 'sanity'

export default defineType({
  name: 'article',
  title: 'Article',
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
      title: 'Title (H1)',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input: string) =>
          input
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      description: 'Short summary used in article listings and previews.',
      type: 'text',
      group: 'content',
      rows: 3,
      validation: (Rule) => Rule.max(280),
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      group: 'content',
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
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({type: 'image', options: {hotspot: true}}),
      ],
      validation: (Rule) => Rule.required(),
    }),

    // ----------------------------
    // Metadata
    // ----------------------------
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'meta',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated at',
      type: 'datetime',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      group: 'meta',
      to: [{type: 'author'}],
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'meta',
      of: [{type: 'reference', to: [{type: 'category'}]}],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'meta',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
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
      subtitle: 'seo.metaTitle',
      media: 'featuredImage',
    },
    prepare(selection) {
      const {title, subtitle, media} = selection
      return {
        title,
        subtitle: subtitle ? `SEO: ${subtitle}` : 'No SEO meta title set',
        media,
      }
    },
  },
})

