import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 't3zpylpm',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
})


