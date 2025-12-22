import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'
import { structure } from './desk/structure'

export default defineConfig({
  name: 'default',
  title: 'RPC Associates CMS',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  basePath: '/studio',
  plugins: [
    structureTool({ structure }),
    visionTool()
  ],
  schema: {
    types: schemaTypes
  }
})

