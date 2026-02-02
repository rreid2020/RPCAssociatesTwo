import { useState, useEffect } from 'react';
import { useSignUp, useUser } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import SignUpFeaturesPanel from '../components/SignUpFeaturesPanel';

type UserType = 'business' | 'individual' | null;
type EmployeeCount = '1-10' | '11-50' | '51-250' | '251+' | null;

export default function CustomSignUpPage() {
  const { signUp, isLoaded } = useSignUp();
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState<UserType>(null);
  const [employeeCount, setEmployeeCount] = useState<EmployeeCount>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Clear any existing sign-up session on mount to prevent "session already exists" errors
  useEffect(() => {
    if (isLoaded && signUp && signUp.status !== 'missing') {
      // Reset the sign-up object to clear any existing session
      signUp.reset().catch((err) => {
        console.warn('Failed to reset sign-up session on mount:', err);
      });
    }
  }, [isLoaded, signUp]);

  // If user is already signed in, redirect to chat
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // If user is already signed in, don't render the form
  if (user) {
    return null;
  }

  const handleOAuthSignUp = async (strategy: 'oauth_github' | 'oauth_google') => {
    if (!isLoaded) {
      setError('Authentication system is not ready. Please try again.');
      return;
    }

    try {
      // Reset any existing sign-up session first
      if (signUp.status !== 'missing') {
        await signUp.reset();
      }
    } catch (err) {
      console.warn('Failed to reset sign-up session:', err);
      // Continue anyway
    }

    // For OAuth, we'll collect profile data after sign-up completes
    // Set a flag to indicate OAuth sign-up is in progress
    sessionStorage.setItem('oauthSignUpInProgress', 'true');

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: '/',
        redirectUrlComplete: '/',
      });
    } catch (err: any) {
      console.error('OAuth sign up error:', err);
      sessionStorage.removeItem('oauthSignUpInProgress');
      setError(err.errors?.[0]?.message || 'Failed to sign up. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (!userType) {
      setError('Please select what best describes you');
      return;
    }

    if (userType === 'business' && !employeeCount) {
      setError('Please select how many employees you have');
      return;
    }

    if (!isLoaded) {
      setError('Authentication system is not ready. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Reset any existing sign-up session first to prevent "session already exists" errors
      if (signUp.status !== 'missing') {
        await signUp.reset();
      }

      // Check if user already exists by trying to create account
      // If email exists, Clerk will return an error we can handle
      const result = await signUp.create({
        emailAddress: email,
        password: password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Save profile data to localStorage (will be saved after email verification)
      sessionStorage.setItem('pendingProfileData', JSON.stringify({
        userType,
        employeeCount,
      }));

      // Navigate to verification page
      navigate('/verify-email');
    } catch (err: any) {
      console.error('Sign up error:', err);
      console.error('Full error details:', err.errors || err.message || err);
      
      // Get detailed error message
      let errorMessage = 'Failed to create account. Please try again.';
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const errorDetails = err.errors.map((e: any) => {
          // Check for common error types
          if (e.code === 'form_identifier_exists' || e.message?.includes('already exists') || e.message?.includes('session')) {
            return 'An account with this email already exists. Please sign in instead.';
          }
          return e.message || e.longMessage || JSON.stringify(e);
        });
        errorMessage = errorDetails.join(', ');
      } else if (err.message) {
        if (err.message.includes('already exists') || err.message.includes('session')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Features */}
      <SignUpFeaturesPanel userType={userType} />

      {/* Right Panel - Sign Up Form */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Show logo/title on mobile */}
          <div className="lg:hidden">
            <h1 className="text-3xl font-bold text-center mb-2">RPCTaxGPT</h1>
            <h2 className="text-2xl font-semibold text-center text-gray-900">Create your account</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              to continue to RPCTaxGPT
            </p>
          </div>

          {/* Desktop title */}
          <div className="hidden lg:block">
            <h1 className="text-3xl font-bold text-center mb-2">RPCTaxGPT</h1>
            <h2 className="text-2xl font-semibold text-center text-gray-900">Create your account</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              to continue to RPCTaxGPT
            </p>
          </div>

          <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-sm border border-gray-200" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Social Login Options */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleOAuthSignUp('oauth_github')}
              disabled={isLoading || !isLoaded}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First name <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last name <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* What best describes you? */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What best describes you? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => {
                  setUserType('business');
                  if (userType !== 'business') {
                    setEmployeeCount(null);
                  }
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  userType === 'business'
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">Businesses</div>
                <div className="text-sm text-gray-600">Internal Finance or Ops Teams</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserType('individual');
                  setEmployeeCount(null);
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  userType === 'individual'
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">Individuals</div>
                <div className="text-sm text-gray-600">Self-filers or Gig workers</div>
              </button>
            </div>
          </div>

          {/* How many employees? (only show for businesses) */}
          {userType === 'business' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How many employees do you have? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['1-10', '11-50', '51-250', '251+'] as const).map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setEmployeeCount(count)}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      employeeCount === count
                        ? 'border-yellow-400 bg-yellow-50 font-semibold'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {count === '251+' ? 'More than 251 employees' : `${count} employees`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isLoaded}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'CONTINUE'}
          </button>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Have an account?{' '}
              <Link to="/sign-in" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}
