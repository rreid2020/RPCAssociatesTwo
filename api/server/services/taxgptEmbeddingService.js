import OpenAI from 'openai'

export function getEmbedModel () {
  return process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small'
}

function getOpenAIClient () {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for TaxGPT retrieval')
  }
  return new OpenAI({ apiKey })
}

export async function embedTaxgptQuery (text) {
  const client = getOpenAIClient()
  const model = getEmbedModel()
  const response = await client.embeddings.create({
    model,
    input: text
  })
  const embedding = response.data?.[0]?.embedding
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('OpenAI returned an empty embedding')
  }
  return embedding
}

export function formatEmbeddingVector (values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Invalid embedding vector')
  }
  const nums = values.map((value) => Number(value))
  if (nums.some((value) => !Number.isFinite(value))) {
    throw new Error('Invalid embedding vector values')
  }
  return `[${nums.join(',')}]`
}
