import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Display order (lower numbers appear first)'
    }),
    defineField({
      name: 'parent',
      title: 'Parent Category',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'Optional parent category. Leave empty for top-level categories.',
      validation: Rule => Rule.custom((parent, context) => {
        // Prevent a category from being its own parent
        if (parent && context?.document?._id && parent._ref === context.document._id) {
          return 'A category cannot be its own parent'
        }
        return true
      })
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      parent: 'parent.title'
    },
    prepare({ title, subtitle, parent }) {
      return {
        title,
        subtitle: parent ? `${parent} → ${subtitle || title}` : subtitle || 'Top-level category'
      }
    }
  },
  orderings: [
    {
      title: 'Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }]
    }
  ]
})

