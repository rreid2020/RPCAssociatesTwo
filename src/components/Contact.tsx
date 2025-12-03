import { FC, FormEvent, useState } from 'react'

const Contact: FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // TODO: Hook up to backend or form service
    // For now, just log to console
    alert('Thank you for your message! We will get back to you soon.')
    setFormData({ name: '', email: '', company: '', message: '' })
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
            <button type="submit" className="btn btn--primary">
              Send message
            </button>
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

