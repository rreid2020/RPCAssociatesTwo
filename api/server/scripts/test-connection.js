import dotenv from 'dotenv'
import { createPool } from '../db/pool.js'

dotenv.config()

async function testConnection() {
  const pool = createPool()
  
  try {
    console.log('Testing database connection...')
    console.log(`Host: ${process.env.DB_HOST}`)
    console.log(`Port: ${process.env.DB_PORT}`)
    console.log(`Database: ${process.env.DB_NAME}`)
    console.log(`User: ${process.env.DB_USER}`)
    console.log(`SSL: ${process.env.DB_SSL}`)
    
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
      console.error('   → Check that DB_HOST is correct')
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   → Check that DB_PORT is correct and database is accessible')
    } else if (error.code === '28P01') {
      console.error('   → Check that DB_USER and DB_PASSWORD are correct')
    } else if (error.code === '3D000') {
      console.error('   → Check that DB_NAME exists')
    }
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testConnection()
