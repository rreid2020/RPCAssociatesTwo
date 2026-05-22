import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createPool, getDatabaseConnectionSummary } from '../db/pool.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const apiEnvPath = path.resolve(__dirname, '../.env')

dotenv.config({ path: apiEnvPath })

async function testConnection() {
  const pool = createPool()
  
  try {
    const summary = getDatabaseConnectionSummary()
    console.log('Testing database connection...')
    console.log(`Mode: ${summary.mode}`)
    console.log(`Host: ${summary.host}`)
    console.log(`Port: ${summary.port}`)
    console.log(`Database: ${summary.database}`)
    console.log(`User: ${summary.user}`)
    console.log(`SSL: ${summary.ssl}`)
    
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version')
    
    console.log('✅ Database connection successful!')
    console.log('Current time:', result.rows[0].current_time)
    console.log('PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1])
    
    // Test table creation
    console.log('\nTesting table creation...')
    const { createLeadsTable, createContactsTable } = await import('../db/migrations.js')
    await createLeadsTable(pool)
    await createContactsTable(pool)
    console.log('✅ Tables created/verified successfully!')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    if (error.code === 'ENOTFOUND') {
      console.error('   → Check that DATABASE_URL host is correct')
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   → Check that DATABASE_URL port is correct and database is accessible')
    } else if (error.code === '28P01') {
      console.error('   → Check DATABASE_URL username/password credentials')
    } else if (error.code === '3D000') {
      console.error('   → Check that the DATABASE_URL database exists')
    }
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testConnection()
