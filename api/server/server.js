import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { createPool } from './db/pool.js'
import { sendEmail } from './utils/email.js'
import { createLeadsTable, createContactsTable } from './db/migrations.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for React
}))

// CORS for API routes only
app.use('/api', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://rpcassociates.co', 'http://localhost:5173'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check (moved to /api/health for consistency)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Initialize database tables on startup
const pool = createPool()

// Lead capture endpoint
app.post('/api/leads', async (req, res) => {
  console.log('POST /api/leads received:', req.body)
  try {
    const {
      firstName,
      lastName,
      companyName,
      email,
      businessPhone,
      businessType,
      businessOwnerStatus,
      speakToAdvisor,
      marketingConsent,
      resourceName
    } = req.body

    // Validation
    if (!firstName || !lastName || !companyName || !email || !businessPhone || 
        !businessType || !businessOwnerStatus || !marketingConsent || !resourceName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['firstName', 'lastName', 'companyName', 'email', 'businessPhone', 
                   'businessType', 'businessOwnerStatus', 'marketingConsent', 'resourceName']
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    // Check if lead already exists for this email and resource
    const existingLead = await pool.query(
      `SELECT id, created_at FROM leads 
       WHERE email = $1 AND resource_name = $2 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email, resourceName]
    )

    let leadId
    let isNewLead = false

    if (existingLead.rows.length > 0) {
      // Lead already exists - return existing ID
      leadId = existingLead.rows[0].id
      console.log(`Lead already exists for ${email} and ${resourceName} (ID: ${leadId})`)
    } else {
      // Insert new lead into database
      const result = await pool.query(
        `INSERT INTO leads (
          first_name, last_name, company_name, email, business_phone,
          business_type, business_owner_status, speak_to_advisor,
          marketing_consent, resource_name, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING id`,
        [
          firstName,
          lastName,
          companyName,
          email,
          businessPhone,
          businessType,
          businessOwnerStatus,
          speakToAdvisor || false,
          marketingConsent,
          resourceName
        ]
      )
      leadId = result.rows[0].id
      isNewLead = true
      console.log(`New lead created (ID: ${leadId})`)
    }

    // Send email notification only for new leads
    if (isNewLead) {
      try {
        const notificationEmail = process.env.NOTIFICATION_EMAIL || 
          process.env.SHARED_MAILBOX_ADDRESS || 
          'contacts@rpcassociates.co'
        
        console.log('Attempting to send email notification to:', notificationEmail)
        console.log('RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY)
        console.log('EMAIL_FROM:', process.env.EMAIL_FROM)
        
        await sendEmail({
          to: notificationEmail,
          subject: `New Lead: ${resourceName} - ${firstName} ${lastName}`,
          html: `
            <h2>New Lead Submission</h2>
            <p><strong>Resource:</strong> ${resourceName}</p>
            <h3>Contact Information</h3>
            <ul>
              <li><strong>Name:</strong> ${firstName} ${lastName}</li>
              <li><strong>Company:</strong> ${companyName}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Phone:</strong> ${businessPhone}</li>
              <li><strong>Business Type:</strong> ${businessType}</li>
              <li><strong>Business Owner Status:</strong> ${businessOwnerStatus}</li>
              <li><strong>Wants to Speak to Advisor:</strong> ${speakToAdvisor ? 'Yes' : 'No'}</li>
              <li><strong>Marketing Consent:</strong> ${marketingConsent ? 'Yes' : 'No'}</li>
            </ul>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          `
        })
        console.log('✅ Email notification sent successfully')
      } catch (emailError) {
        console.error('❌ Failed to send email notification:', emailError)
        console.error('Email error details:', {
          name: emailError.name,
          message: emailError.message,
          code: emailError.code,
          response: emailError.response
        })
        // Don't fail the request if email fails
      }
    } else {
      console.log('Skipping email notification - lead already exists')
    }

    res.status(201).json({ 
      success: true, 
      message: isNewLead ? 'Lead captured successfully' : 'Access granted (existing lead)',
      id: leadId,
      isNewLead
    })
  } catch (error) {
    console.error('Error processing lead:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    })
    
    // Return more helpful error message for debugging (but don't expose sensitive info)
    const errorMessage = error.message || 'Unknown error occurred'
    const isDatabaseError = error.code && error.code.startsWith('2')
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: isDatabaseError 
        ? 'Database error occurred. Please check server logs.' 
        : errorMessage,
      // Include error code for debugging (safe to expose)
      code: error.code || 'UNKNOWN'
    })
  }
})

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, company, message } = req.body

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'message']
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    // Insert into database
    const result = await pool.query(
      `INSERT INTO contacts (
        name, email, company, message, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      RETURNING id`,
      [name, email, company || null, message]
    )

    const contactId = result.rows[0].id

    // Send email notification
    try {
      const notificationEmail = process.env.NOTIFICATION_EMAIL || 
        process.env.SHARED_MAILBOX_ADDRESS || 
        'contacts@rpcassociates.co'
      
      await sendEmail({
        to: notificationEmail,
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <h3>Contact Information</h3>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            ${company ? `<li><strong>Company:</strong> ${company}</li>` : ''}
          </ul>
          <h3>Message</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        `
      })
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    res.status(201).json({ 
      success: true, 
      message: 'Message sent successfully',
      id: contactId
    })
  } catch (error) {
    console.error('Error processing contact form:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
})

// Initialize database tables
async function initializeDatabase() {
  try {
    console.log('Attempting to connect to database...')
    console.log('DB_HOST:', process.env.DB_HOST)
    console.log('DB_PORT:', process.env.DB_PORT)
    console.log('DB_NAME:', process.env.DB_NAME)
    console.log('DB_USER:', process.env.DB_USER)
    console.log('DB_SSL:', process.env.DB_SSL)
    
    // Test connection first
    const testResult = await pool.query('SELECT NOW()')
    console.log('Database connection successful:', testResult.rows[0])
    
    await createLeadsTable(pool)
    await createContactsTable(pool)
    console.log('Database tables initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      console.error('⚠️  Database connection timeout. Check:')
      console.error('   1. Database credentials are correct')
      console.error('   2. App Platform is added to database trusted sources')
      console.error('   3. Database firewall allows App Platform connections')
    }
    
    // Continue anyway - server will still start, but API calls will fail
    console.warn('⚠️  Server starting without database connection. API endpoints will fail.')
  }
}

// Serve static files from the frontend build (dist folder)
// The dist folder will be copied to api/server/dist during build
// IMPORTANT: This must come AFTER API routes to avoid conflicts
const distPath = path.join(__dirname, 'dist')

// Check if dist folder exists
if (!existsSync(distPath)) {
  console.warn(`Warning: dist folder not found at ${distPath}. Static files will not be served.`)
}

// Serve static files from the frontend build (dist folder)
// Note: express.static only handles GET/HEAD requests, so it won't interfere with POST /api/leads
app.use(express.static(distPath))

// Handle unmatched API routes (for debugging)
app.use('/api', (req, res, next) => {
  console.log(`Unmatched API route: ${req.method} ${req.path}`)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return next()
  }
  res.status(404).json({ 
    error: 'API endpoint not found',
    method: req.method,
    path: req.path,
    availableEndpoints: ['/api/health', '/api/leads', '/api/contact']
  })
})

// Handle client-side routing - serve index.html for all non-API GET routes
app.get('*', (req, res, next) => {
  // Skip API routes (both GET and POST should be handled by API routes above)
  if (req.path.startsWith('/api')) {
    return next()
  }
  // Serve index.html for all other routes (React Router will handle routing)
  if (existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'))
  } else {
    res.status(404).json({ error: 'Frontend not built. Please check build process.' })
  }
})

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Serving API at /api`)
  console.log(`Serving frontend from ${distPath}`)
  await initializeDatabase()
})

export default app
