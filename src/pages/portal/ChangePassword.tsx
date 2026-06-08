import { FC, FormEvent, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import SEO from '../../components/SEO'
import AxiomWordmark from '../../components/AxiomWordmark'
import { portalFetch } from '../../lib/portalApi'

const ChangePassword: FC = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (newPassword.length < 12) {
      setError('New password must be at least 12 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    if (!user) {
      setError('Your account is still loading. Try again in a moment.')
      return
    }

    setIsLoading(true)
    try {
      await user.updatePassword({
        currentPassword,
        newPassword
      })
      await portalFetch('/v1/accounting/auth/complete-password-change', getToken, { method: 'POST' })
      await user.reload()
      navigate('/portal/post-auth', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : 'Could not update your password. Check your current password and try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return <p className="p-4 text-sm text-text-light">Loading...</p>
  }

  if (!isSignedIn) {
    navigate('/portal/sign-in?next=/portal/change-password', { replace: true })
    return null
  }

  return (
    <>
      <SEO
        title="Change Password | Client Portal"
        description="Set a new password for your Axiom client portal account"
        canonical="/portal/change-password"
      />
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <AxiomWordmark size="lg" centered blendOnBackground className="mb-4" />
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Change your password</h1>
            <p className="text-text-light">
              Your administrator created your account with a temporary password. Set a new password before continuing.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg border border-border shadow-sm">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={(event) => { void onSubmit(event) }} className="space-y-4">
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-text mb-1">
                  Current temporary password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => { setCurrentPassword(event.target.value) }}
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-text mb-1">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => { setNewPassword(event.target.value) }}
                  required
                  minLength={12}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-text mb-1">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => { setConfirmPassword(event.target.value) }}
                  required
                  minLength={12}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn--primary"
              >
                {isLoading ? 'Saving...' : 'Save new password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default ChangePassword
