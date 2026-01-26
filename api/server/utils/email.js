import nodemailer from 'nodemailer'

/**
 * Create email transporter based on environment variables
 */
function createTransporter() {
  // Option 1: SMTP (Microsoft Exchange/Office 365, Gmail, SendGrid, etc.)
  if (process.env.SMTP_HOST) {
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    }

    // Additional TLS options for Microsoft Exchange/Office 365
    if (process.env.SMTP_HOST.includes('office365.com') || 
        process.env.SMTP_HOST.includes('outlook.com') ||
        process.env.SMTP_HOST.includes('exchange')) {
      config.tls = {
        ciphers: 'SSLv3',
        rejectUnauthorized: false, // May be needed for some Exchange configurations
      }
    }

    return nodemailer.createTransport(config)
  }

  // Option 2: Gmail OAuth2 (if using Gmail)
  if (process.env.GMAIL_CLIENT_ID) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      },
    })
  }

  // Option 3: SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  }

  // Fallback: Use SMTP with default settings
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} options.text - Plain text email body (optional)
 */
export async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter()

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"RPC Associates" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    return info
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}
