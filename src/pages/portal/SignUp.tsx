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

  const handleOAuthSignUp = async (strategy: 'oauth_github' | 'oauth_google') => {
    if (!isLoaded) {
      setError('Authentication system is not ready. Please try again.')
      return
    }

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: '/portal/dashboard',
        redirectUrlComplete: '/portal/dashboard',
      })
    } catch (err: any) {
      console.error('OAuth sign up error:', err)
      setError(err.errors?.[0]?.message || 'Failed to sign up. Please try again.')
    }
  }

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

            {/* Social Login Options */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => handleOAuthSignUp('oauth_github')}
                disabled={isLoading || !isLoaded}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-md shadow-sm bg-white text-text hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Continue with GitHub
              </button>
              <button
                type="button"
                onClick={() => handleOAuthSignUp('oauth_google')}
                disabled={isLoading || !isLoaded}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-md shadow-sm bg-white text-text hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-text-light">or</span>
              </div>
            </div>

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
