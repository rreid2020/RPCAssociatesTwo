import dotenv from 'dotenv'
import { createPool } from '../db/pool.js'
import { createLeadsTable, createContactsTable } from '../db/migrations.js'

dotenv.config()

async function migrate() {
  const pool = createPool()
  
  try {
    console.log('Starting database migration...')
    
    await createLeadsTable(pool)
    await createContactsTable(pool)
    
    console.log('✅ Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
