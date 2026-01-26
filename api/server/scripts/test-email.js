import dotenv from 'dotenv'
import { sendEmail } from '../utils/email.js'

dotenv.config()

async function testEmail() {
  try {
    console.log('Testing email configuration...')
    console.log(`SMTP Host: ${process.env.SMTP_HOST}`)
    console.log(`SMTP Port: ${process.env.SMTP_PORT}`)
    console.log(`SMTP User: ${process.env.SMTP_USER}`)
    console.log(`Notification Email: ${process.env.NOTIFICATION_EMAIL}`)
    console.log('\nSending test email...')

    await sendEmail({
      to: process.env.NOTIFICATION_EMAIL || 'contacts@rpcassociates.co',
      subject: 'Test Email from RPC Associates API',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from the RPC Associates API server.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
      `
    })

    console.log('✅ Test email sent successfully!')
    console.log(`Check your inbox at: ${process.env.NOTIFICATION_EMAIL || 'contacts@rpcassociates.co'}`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message)
    
    if (error.code === 'EAUTH') {
      console.error('\n   → Authentication failed. Check your SMTP_USER and SMTP_PASSWORD')
      console.error('   → For Office 365, you may need an App Password if MFA is enabled')
    } else if (error.code === 'ECONNECTION') {
      console.error('\n   → Connection failed. Check your SMTP_HOST and SMTP_PORT')
      console.error('   → For Office 365, try: smtp.office365.com:587')
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n   → Connection timeout. Check your firewall/network settings')
    }
    
    process.exit(1)
  }
}

testEmail()
