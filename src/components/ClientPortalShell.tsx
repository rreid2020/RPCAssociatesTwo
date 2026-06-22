import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth, useUser, useClerk } from '@clerk/clerk-react'
import { useFeatureAccess } from '../lib/subscriptions/hooks'
import AxiomWordmark from './AxiomWordmark'
import { useAccountAuthorization } from '../platform/permissions/AccountAuthorizationProvider'
import { useAccountContext } from '../platform/account/AccountContextProvider'
import { buildNavigationSections, type NavigationItem } from '../platform/navigation/navigationRegistry'
import { getOnboardingStatus } from '../lib/onboarding/state'
import { useOpsAccess } from '../modules/ops/hooks/useOpsAccess'

interface ClientPortalShellProps {
  children: ReactNode
  wideContent?: boolean
}

const ClientPortalShell: FC<ClientPortalShellProps> = ({ children, wideContent = false }) => {
  const rolloutBypassEnabled = import.meta.env.VITE_FORCE_ENTERPRISE_ACCESS !== 'false'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user } = useUser()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { signOut } = useClerk()
  const { permissions } = useAccountAuthorization()
  const { isStaff } = useOpsAccess()
  const { account } = useAccountContext()
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const handleSignOut = useCallback(() => {
    const ts = Date.now()
    const redirectUrl = `${window.location.origin}/portal/sign-in?fresh=${ts}`
    void signOut({ redirectUrl })
  }, [signOut])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setOnboardingComplete(false)
      return
    }
    let cancelled = false
    const resolveOnboarding = async () => {
      if (account?.profileOnboardingCompletedAt) {
        if (!cancelled) setOnboardingComplete(true)
        return
      }
      try {
        const onboarding = await getOnboardingStatus(getToken)
        if (!cancelled) setOnboardingComplete(!onboarding.required)
      } catch {
        if (!cancelled) setOnboardingComplete(false)
      }
    }
    void resolveOnboarding()
    return () => {
      cancelled = true
    }
  }, [account?.profileOnboardingCompletedAt, getToken, isLoaded, isSignedIn])

  const workspaceType = account?.businessType === 'firm'
    ? 'firm'
    : account?.businessType === 'individual'
      ? 'individual'
      : account?.businessType
        ? 'business'
        : null

  const workingPapers = useFeatureAccess('workingPapers')
  const integrations = useFeatureAccess('integrations')

  const navigationSections = useMemo(() => (
    buildNavigationSections({
      workspaceType,
      profileBusinessType: account?.profileBusinessType || null,
      workspaceRole: account?.role || null,
      onboardingComplete,
      features: { workingPapers, integrations },
      permissions,
      isStaff
    })
  ), [account?.profileBusinessType, account?.role, integrations, isStaff, onboardingComplete, permissions, workspaceType, workingPapers])

  const iconColors: Record<string, string> = {
    dashboard: 'text-sky-600',
    chartBar: 'text-fuchsia-600',
    calculator: 'text-violet-600',
    sparkles: 'text-violet-500',
    document: 'text-blue-600',
    clipboardList: 'text-blue-500',
    plus: 'text-emerald-600',
    exchange: 'text-cyan-600',
    magic: 'text-amber-500',
    trend: 'text-indigo-600',
    shield: 'text-rose-600',
    terminal: 'text-slate-600',
    ledger: 'text-orange-600',
    building: 'text-stone-600',
    workspace: 'text-teal-600',
    userPlus: 'text-green-600',
    users: 'text-purple-600',
    key: 'text-yellow-700',
    calendar: 'text-orange-500',
    clipboardCheck: 'text-lime-600',
    filePlus: 'text-emerald-700',
    plug: 'text-sky-700',
    folder: 'text-amber-600',
    creditCard: 'text-pink-600',
    lock: 'text-red-600',
    server: 'text-slate-700'
  }

  const iconForKey = (iconKey: string, active: boolean) => {
    const iconClass = active ? 'text-white' : (iconColors[iconKey] || 'text-blue-600')
    const icons: Record<string, JSX.Element> = {
      dashboard: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>,
      chartBar: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      calculator: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h3M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm2 2v2m4-2v2" /></svg>,
      sparkles: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l2.5 5 5.5 2.5-5.5 2.5L12 18l-2.5-5-5.5-2.5 5.5-2.5L12 3z" /></svg>,
      document: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      clipboardList: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
      plus: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
      exchange: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0l-4 4m4-4l4 4m6 8v4m0 0l4-4m-4 4l-4-4" /></svg>,
      magic: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3v6l3-2 3 2v-6c0-1.657-1.343-3-3-3zm0 0V5m-7 6h2m10 0h2" /></svg>,
      trend: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
      shield: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
      terminal: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      ledger: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      building: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
      workspace: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5m10 0H7" /></svg>,
      userPlus: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
      users: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      key: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
      calendar: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-12 9h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" /></svg>,
      clipboardCheck: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
      filePlus: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      plug: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
      folder: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>,
      creditCard: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
      lock: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a5 5 0 00-10 0v2m-2 0h14a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8a1 1 0 011-1z" /></svg>,
      server: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
    }
    return <span className={iconClass}>{icons[iconKey] || icons.document}</span>
  }

  const isLocked = (item: NavigationItem) => {
    if (rolloutBypassEnabled) return false
    if (item.requiredFeature === 'workingPapers' && !workingPapers) return true
    if (item.requiredFeature === 'integrations' && !integrations) return true
    if (item.requiredPermission && !permissions.includes(item.requiredPermission)) return true
    return false
  }

  const isActive = (item: NavigationItem) => {
    const [normalizedPath, queryString = ''] = item.to.split('?')
    if (normalizedPath === '/portal/dashboard') {
      return location.pathname === '/portal/dashboard'
    }
    let pathMatches = false
    if (item.activeWhen === 'exact') {
      pathMatches = location.pathname === normalizedPath
    } else if (item.activeWhen === 'child') {
      pathMatches = location.pathname.startsWith(`${normalizedPath}/`)
    } else if (normalizedPath === '/portal/accounting/company-profile') {
      pathMatches = location.pathname === '/portal/accounting/company-profile'
    } else {
      pathMatches = location.pathname === normalizedPath || location.pathname.startsWith(`${normalizedPath}/`)
    }
    if (!pathMatches) return false
    if (!queryString) return true
    const expectedParams = new URLSearchParams(queryString)
    const currentParams = new URLSearchParams(location.search)
    for (const [key, value] of expectedParams.entries()) {
      if (currentParams.get(key) !== value) return false
    }
    return true
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <AxiomWordmark size="sm" line3="Client Portal" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-text-light hover:bg-background"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigationSections.map((section) => (
              <div key={section.id} className="pt-1">
                {section.label && (
                  <div className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold text-primary-dark ${section.depth === 1 ? 'ml-6' : ''}`}>
                    <span aria-hidden>{iconForKey(section.iconKey || 'sparkles', false)}</span>
                    <span>{section.label}</span>
                  </div>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item)
                    const itemDepth = item.depth ?? section.depth ?? 0
                    return (
                      <Link
                        key={`${section.id}-${item.label}-${item.to}`}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 rounded-md text-sm font-medium transition-colors ${
                          itemDepth === 2 ? 'ml-10 px-3 py-1.5' : itemDepth === 1 ? 'ml-6 px-3 py-1.5' : 'px-3 py-2'
                        } ${
                          active ? 'bg-primary-dark text-white' : 'text-text hover:bg-background hover:text-primary-dark'
                        } ${isLocked(item) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        onClickCapture={(e) => {
                          if (isLocked(item)) e.preventDefault()
                        }}
                      >
                        {iconForKey(item.iconKey, active)}
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            active ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {isLocked(item) && (
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">Premium</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-border space-y-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-dark hover:bg-background rounded-md transition-colors text-left"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-light hover:text-primary-dark hover:bg-background rounded-md transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Website
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-text-light hover:bg-background"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                className="p-2 rounded-md text-text-light hover:bg-background"
                aria-label="Notifications (coming soon)"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="flex items-center gap-2 sm:gap-3 border-l border-border pl-3 sm:pl-4">
                <Link
                  to="/portal/profile"
                  className="flex items-center gap-2 min-w-0 rounded-md px-1 py-1 hover:bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  aria-label="View your profile"
                >
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || user.emailAddresses?.[0]?.emailAddress || 'Account'}
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-primary-dark flex items-center justify-center text-white text-sm font-semibold">
                      {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="hidden md:block text-sm text-text truncate max-w-[14rem] hover:text-primary-dark">
                    {user?.fullName || user?.emailAddresses?.[0]?.emailAddress || 'User'}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-primary-dark hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  aria-label="Sign out of the client portal"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="py-6 sm:py-8">
          <div className={wideContent ? 'w-full px-4 sm:px-6 lg:px-8 xl:px-10' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default ClientPortalShell
