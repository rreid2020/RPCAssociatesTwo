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
  const embeddings = await embedTaxgptTexts([text])
  return embeddings[0]
}

export async function embedTaxgptTexts (texts) {
  const inputs = (texts || []).map((value) => String(value || '').trim()).filter(Boolean)
  if (inputs.length === 0) {
    throw new Error('At least one text input is required for embedding')
  }
  const client = getOpenAIClient()
  const model = getEmbedModel()
  const response = await client.embeddings.create({
    model,
    input: inputs
  })
  const rows = (response.data || []).slice().sort((a, b) => a.index - b.index)
  if (rows.length !== inputs.length) {
    throw new Error('OpenAI returned an unexpected embedding count')
  }
  return rows.map((row) => {
    if (!Array.isArray(row.embedding) || row.embedding.length === 0) {
      throw new Error('OpenAI returned an empty embedding')
    }
    return row.embedding
  })
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
