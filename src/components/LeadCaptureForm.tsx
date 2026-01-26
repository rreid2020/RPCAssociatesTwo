import { FC, useState, FormEvent } from 'react'
import { API_ENDPOINTS } from '../lib/config/api'
import { markResourceAsAccessed } from '../lib/utils/leadCapture'

interface LeadCaptureFormProps {
  resourceName: string
  onSuccess: () => void
  className?: string
}

interface FormData {
  firstName: string
  lastName: string
  companyName: string
  email: string
  businessPhone: string
  businessType: string
  businessOwnerStatus: string
  speakToAdvisor: boolean
  marketingConsent: boolean
}

const LeadCaptureForm: FC<LeadCaptureFormProps> = ({
  resourceName,
  onSuccess,
  className = '',
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    businessPhone: '',
    businessType: '',
    businessOwnerStatus: '',
    speakToAdvisor: false,
    marketingConsent: false,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.businessPhone.trim()) {
      newErrors.businessPhone = 'Business phone is required'
    }
    if (!formData.businessType) {
      newErrors.businessType = 'Please select a business type'
    }
    if (!formData.businessOwnerStatus) {
      newErrors.businessOwnerStatus = 'Please select your status'
    }
    if (!formData.marketingConsent) {
      newErrors.marketingConsent = 'Marketing consent is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Submit to API
      const response = await fetch(API_ENDPOINTS.leads, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
          email: formData.email,
          businessPhone: formData.businessPhone,
          businessType: formData.businessType,
          businessOwnerStatus: formData.businessOwnerStatus,
          speakToAdvisor: formData.speakToAdvisor,
          marketingConsent: formData.marketingConsent,
          resourceName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to submit form')
      }

      // Mark resource as accessed in localStorage (for client-side tracking)
      markResourceAsAccessed(resourceName)

      // Call success callback
      onSuccess()
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors({ 
        email: error instanceof Error ? error.message : 'An error occurred. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="bg-white rounded-xl shadow-sm border border-border p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
          Get your free {resourceName} now.
        </h2>
        <p className="text-text-light mb-6">
          Enter your information below to access this resource.
        </p>

        <div className="space-y-4">
          {/* First Name and Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-text mb-1"
              >
                FIRST NAME <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.firstName ? 'border-red-500' : 'border-border'
                }`}
                placeholder="First Name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-text mb-1"
              >
                LAST NAME <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.lastName ? 'border-red-500' : 'border-border'
                }`}
                placeholder="Last Name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-text mb-1"
            >
              YOUR COMPANY NAME <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.companyName ? 'border-red-500' : 'border-border'
              }`}
              placeholder="Company Name"
            />
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>
            )}
          </div>

          {/* Email and Business Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text mb-1"
              >
                EMAIL <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-border'
                }`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="businessPhone"
                className="block text-sm font-medium text-text mb-1"
              >
                BUSINESS PHONE <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="businessPhone"
                value={formData.businessPhone}
                onChange={(e) => handleChange('businessPhone', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.businessPhone ? 'border-red-500' : 'border-border'
                }`}
                placeholder="(555) 123-4567"
              />
              {errors.businessPhone && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.businessPhone}
                </p>
              )}
            </div>
          </div>

          {/* Business Type */}
          <div>
            <label
              htmlFor="businessType"
              className="block text-sm font-medium text-text mb-1"
            >
              WHAT BEST DESCRIBES YOUR BUSINESS?{' '}
              <span className="text-red-500">*</span>
            </label>
            <select
              id="businessType"
              value={formData.businessType}
              onChange={(e) => handleChange('businessType', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white ${
                errors.businessType ? 'border-red-500' : 'border-border'
              }`}
            >
              <option value="">Please Select</option>
              <option value="retail">Retail</option>
              <option value="professional-services">Professional Services</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="construction">Construction</option>
              <option value="technology">Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="hospitality">Hospitality</option>
              <option value="real-estate">Real Estate</option>
              <option value="other">Other</option>
            </select>
            {errors.businessType && (
              <p className="mt-1 text-sm text-red-500">{errors.businessType}</p>
            )}
          </div>

          {/* Business Owner Status */}
          <div>
            <label
              htmlFor="businessOwnerStatus"
              className="block text-sm font-medium text-text mb-1"
            >
              ARE YOU A BUSINESS OWNER OR SELF-EMPLOYED?{' '}
              <span className="text-red-500">*</span>
            </label>
            <select
              id="businessOwnerStatus"
              value={formData.businessOwnerStatus}
              onChange={(e) =>
                handleChange('businessOwnerStatus', e.target.value)
              }
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white ${
                errors.businessOwnerStatus ? 'border-red-500' : 'border-border'
              }`}
            >
              <option value="">Please Select</option>
              <option value="business-owner">Business Owner</option>
              <option value="self-employed">Self-Employed</option>
              <option value="both">Both</option>
              <option value="neither">Neither</option>
            </select>
            {errors.businessOwnerStatus && (
              <p className="mt-1 text-sm text-red-500">
                {errors.businessOwnerStatus}
              </p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={formData.speakToAdvisor}
                onChange={(e) =>
                  handleChange('speakToAdvisor', e.target.checked)
                }
                className="mt-1 mr-3 w-4 h-4 text-primary border-border rounded focus:ring-primary"
              />
              <span className="text-sm text-text">
                WOULD YOU LIKE TO SPEAK TO A TAX ADVISOR?
              </span>
            </label>

            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={formData.marketingConsent}
                onChange={(e) =>
                  handleChange('marketingConsent', e.target.checked)
                }
                className="mt-1 mr-3 w-4 h-4 text-primary border-border rounded focus:ring-primary"
                required
              />
              <span className="text-sm text-text">
                I GIVE MY CONSENT TO RECEIVE MARKETING COMMUNICATIONS FROM RPC
                ASSOCIATES <span className="text-red-500">*</span>
              </span>
            </label>
            {errors.marketingConsent && (
              <p className="mt-1 text-sm text-red-500">
                {errors.marketingConsent}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn btn--primary py-3 px-6 text-base font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : 'GET MY FREE RESOURCE'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default LeadCaptureForm
