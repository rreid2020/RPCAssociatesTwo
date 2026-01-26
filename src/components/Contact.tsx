import { FC, FormEvent, useState } from 'react'
import { API_ENDPOINTS } from '../lib/config/api'

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
      const response = await fetch(API_ENDPOINTS.contact, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            company: formData.company,
            message: formData.message,
          })
        }
      )

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', company: '', message: '' })
        // Reset success message after 5 seconds
        setTimeout(() => setSubmitStatus('idle'), 5000)
      } else {
        const data = await response.json().catch(() => ({}))
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
    <section id="contact" className="py-xxl">
      <div className="max-w-[1200px] mx-auto px-md">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl">
          <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-xs">
              <label htmlFor="name" className="font-medium text-text">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="px-3 py-3 border border-border rounded-lg font-sans text-base transition-all focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label htmlFor="email" className="font-medium text-text">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="px-3 py-3 border border-border rounded-lg font-sans text-base transition-all focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label htmlFor="company" className="font-medium text-text">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                className="px-3 py-3 border border-border rounded-lg font-sans text-base transition-all focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary"
                placeholder="Your company name"
                value={formData.company}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label htmlFor="message" className="font-medium text-text">Message</label>
              <textarea
                id="message"
                name="message"
                className="px-3 py-3 border border-border rounded-lg font-sans text-base min-h-[120px] resize-y transition-all focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary"
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
              <div className="p-md rounded-lg mt-sm text-[0.9375rem] bg-green-100 text-green-800 border border-green-300">
                Thank you for your message! We will get back to you soon.
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="p-md rounded-lg mt-sm text-[0.9375rem] bg-red-100 text-red-800 border border-red-300">
                {errorMessage || 'Something went wrong. Please try again or email us directly at info@rpcassociates.ca'}
              </div>
            )}
          </form>
          <div className="bg-white p-xl rounded-xl shadow-sm">
            <h3 className="mb-md">Let's talk</h3>
            <p className="mb-lg">
              Tell me a bit about your business and what you are looking for support with. I will follow up to schedule a short introductory call.
            </p>
            <div className="flex flex-col gap-md">
              <div className="text-[0.9375rem]">
                <span className="font-semibold text-primary mr-xs">Email:</span>
                info@rpcassociates.ca
              </div>
              <div className="text-[0.9375rem]">
                <span className="font-semibold text-primary mr-xs">Location:</span>
                Ottawa, Ontario, Canada · Serving clients across Canada remotely
              </div>
              <div className="text-[0.9375rem]">
                <span className="font-semibold text-primary mr-xs">Typical response time:</span>
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

