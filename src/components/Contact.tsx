import { FC, FormEvent, useState } from 'react'

const Contact: FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('https://formspree.io/f/xanrbgnz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          message: formData.message,
          _subject: 'New Contact Form Submission from RPC Associates Website'
        })
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', company: '', message: '' })
        // Reset success message after 5 seconds
        setTimeout(() => setSubmitStatus('idle'), 5000)
      } else {
        const data = await response.json()
        setSubmitStatus('error')
        setErrorMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <section id="contact" className="section">
      <div className="container">
        <div className="contact__container">
          <form className="contact__form" onSubmit={handleSubmit}>
            <div className="contact__field">
              <label htmlFor="name" className="contact__label">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="contact__input"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="contact__field">
              <label htmlFor="email" className="contact__label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="contact__input"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="contact__field">
              <label htmlFor="company" className="contact__label">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                className="contact__input"
                placeholder="Your company name"
                value={formData.company}
                onChange={handleChange}
              />
            </div>
            <div className="contact__field">
              <label htmlFor="message" className="contact__label">Message</label>
              <textarea
                id="message"
                name="message"
                className="contact__textarea"
                placeholder="Tell us about your business and what you're looking for support with..."
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send message'}
            </button>
            {submitStatus === 'success' && (
              <div className="contact__message contact__message--success">
                Thank you for your message! We will get back to you soon.
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="contact__message contact__message--error">
                {errorMessage || 'Something went wrong. Please try again or email us directly at info@rpcassociates.ca'}
              </div>
            )}
          </form>
          <div className="contact__details">
            <h3>Let's talk</h3>
            <p>
              Tell me a bit about your business and what you are looking for support with. I will follow up to schedule a short introductory call.
            </p>
            <div className="contact__info">
              <div className="contact__info-item">
                <span className="contact__info-label">Email:</span>
                info@rpcassociates.ca
              </div>
              <div className="contact__info-item">
                <span className="contact__info-label">Service area:</span>
                Based in Canada · Serving clients remotely
              </div>
              <div className="contact__info-item">
                <span className="contact__info-label">Typical response time:</span>
                Usually within 1–2 business days
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact

