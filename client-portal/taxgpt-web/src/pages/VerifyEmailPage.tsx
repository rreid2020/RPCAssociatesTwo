import { useState, useEffect } from 'react';
import { useSignUp, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmailPage() {
  const { signUp, isLoaded } = useSignUp();
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // If user is already verified, save profile data and redirect
  useEffect(() => {
    if (user && signUp.status === 'complete') {
      // Save profile data that was stored during sign-up
      const pendingProfileData = sessionStorage.getItem('pendingProfileData');
      if (pendingProfileData) {
        try {
          const { userType, employeeCount } = JSON.parse(pendingProfileData);
          
          // Save to localStorage (primary storage)
          const localProfileKey = `user_profile_${user.id}`;
          localStorage.setItem(localProfileKey, JSON.stringify({
            userType,
            employeeCount,
          }));
          
          // Don't try to update Clerk metadata - it's blocked client-side
          sessionStorage.removeItem('pendingProfileData');
          navigate('/');
        } catch (err) {
          console.error('Failed to parse profile data:', err);
          sessionStorage.removeItem('pendingProfileData');
          navigate('/');
        }
      } else {
        navigate('/');
      }
    }
  }, [user, signUp.status, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        // The useEffect will handle saving profile data and redirecting
        // Just wait for the user object to be available
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.errors?.[0]?.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      alert('Verification code sent! Please check your email.');
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to resend code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center mb-2">RPCTaxGPT</h1>
          <h2 className="text-2xl font-semibold text-center text-gray-900">Verify your email</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a verification code to your email address
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-sm border border-gray-200" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Verification code <span className="text-red-500">*</span>
            </label>
            <input
              id="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
            />
            <p className="mt-2 text-xs text-gray-500">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Didn't receive the code? Resend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
