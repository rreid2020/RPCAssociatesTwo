import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createPool } from '../db/pool.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

const pool = createPool()

try {
  const fb = await pool.query(`
    SELECT id, category, subject, message, session_id, status, training_signal, created_at
    FROM taxgpt.feedback
    WHERE subject ILIKE '%Low-confidence%'
    ORDER BY created_at DESC
    LIMIT 3
  `)
  console.log('FEEDBACK:', JSON.stringify(fb.rows, null, 2))

  const sessionId = fb.rows[0]?.session_id
  if (!sessionId) {
    console.log('No session linked')
    process.exit(0)
  }

  const msgs = await pool.query(
    `SELECT role, content, citations, structured_response, risk_level, created_at
     FROM taxgpt.chat_messages
     WHERE session_id = $1::uuid
     ORDER BY created_at ASC`,
    [sessionId]
  )

  for (const row of msgs.rows) {
    console.log('\n--- MESSAGE ---')
    console.log(JSON.stringify({
      role: row.role,
      created_at: row.created_at,
      risk_level: row.risk_level,
      content: row.content?.slice(0, 800),
      confidence: row.structured_response?.confidence,
      citations: row.citations,
      sourceAnalysis: row.structured_response?.sourceAnalysis,
      groupedSources: row.structured_response?.groupedSources
    }, null, 2))
  }
} finally {
  await pool.end()
}
