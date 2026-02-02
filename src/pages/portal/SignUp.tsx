import { FC, useState } from 'react'
import { useSignUp } from '@clerk/clerk-react'
import { useNavigate, Link } from 'react-router-dom'
import SEO from '../../components/SEO'
import rpcLogo from '../../assets/rpc-logo.svg'

const SignUp: FC = () => {
  const { signUp, isLoaded } = useSignUp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password || !firstName || !lastName) {
      setError('Please fill in all required fields')
      return
    }

    if (!isLoaded) {
      setError('Authentication system is not ready. Please try again.')
      return
    }

    setIsLoading(true)

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      })

      if (result.status === 'complete') {
        navigate('/portal/dashboard')
      } else {
        // Email verification required
        navigate('/portal/verify-email')
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SEO
        title="Sign Up | Client Portal"
        description="Create an account to access the RPC Associates Client Portal"
        canonical="/portal/sign-up"
      />
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={rpcLogo} alt="RPC Associates" className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Create Account</h1>
            <p className="text-text-light">Get started with the client portal</p>
          </div>

          <div className="bg-white p-8 rounded-lg border border-border shadow-sm">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-text mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-text mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-text-light">Must be at least 8 characters</p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isLoaded}
                className="w-full btn btn--primary"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-light">
                Already have an account?{' '}
                <Link to="/portal/sign-in" className="text-primary-dark font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-text-light hover:text-primary-dark">
              ← Back to website
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default SignUp
