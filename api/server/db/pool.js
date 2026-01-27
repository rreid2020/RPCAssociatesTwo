import pg from 'pg'
const { Pool } = pg

export function createPool() {
  const sslConfig = process.env.DB_SSL === 'true' 
    ? { 
        rejectUnauthorized: false, // Required for Digital Ocean managed databases
        sslmode: 'require'
      } 
    : false

  return new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: sslConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000, // Increased timeout for managed database connections
    // Additional options for better connection handling
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  })
}
