import { StructureBuilder } from 'sanity/structure'

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Posts')
        .child(
          S.documentTypeList('post')
            .title('Posts')
            .filter('_type == "post"')
            .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
        ),
      S.divider(),
      S.listItem()
        .title('Categories')
        .child(
          S.documentTypeList('category')
            .title('Categories')
            .defaultOrdering([{ field: 'order', direction: 'asc' }])
        ),
      S.listItem()
        .title('Authors')
        .child(
          S.documentTypeList('author')
            .title('Authors')
        )
    ])

