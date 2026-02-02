import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import rpcLogo from '../assets/rpc-logo.svg';

const navItems = [
  { to: '/portal', label: 'Dashboard', icon: 'grid' },
  { to: '/portal/taxgpt', label: 'TaxGPT', icon: 'spark' },
  { to: '/portal/files', label: 'File Repository', icon: 'folder', disabled: true },
  { to: '/portal/working-papers', label: 'Working Papers', icon: 'clipboard', disabled: true },
  { to: '/portal/integrations', label: 'Integrations', icon: 'plug', disabled: true },
];

const taxgptSections = [
  {
    title: 'TaxGPT',
    items: [
      { id: 'taxgpt-research', label: 'Tax Research Chat', to: '/portal/taxgpt?view=research', icon: 'chat' },
    ],
  },
  {
    title: 'TaxGPT Premium • Business',
    items: [
      { id: 'taxgpt-docs', label: 'Document Management & Analysis', to: '/portal/taxgpt?view=docs', icon: 'docs' },
      { id: 'taxgpt-writer', label: 'Tax Writer', to: '/portal/taxgpt?view=writer', icon: 'writer' },
      { id: 'taxgpt-updates', label: 'Stay Updated on Tax Laws', to: '/portal/taxgpt?view=updates', icon: 'updates' },
      { id: 'taxgpt-reporting', label: 'Tax Calculations & Reporting', to: '/portal/taxgpt?view=reporting', icon: 'reporting' },
    ],
  },
  {
    title: 'TaxGPT Premium • Personal',
    items: [
      { id: 'taxgpt-deductions', label: 'Deduction Discovery', to: '/portal/taxgpt?view=deductions', icon: 'deductions' },
      { id: 'taxgpt-audit', label: 'Audit Risk Minimization', to: '/portal/taxgpt?view=audit', icon: 'audit' },
      { id: 'taxgpt-forms', label: 'Tax Form Guidance', to: '/forms', icon: 'forms' },
      { id: 'taxgpt-personal-calc', label: 'Tax Calculations', to: '/portal/taxgpt?view=calculations', icon: 'calculator' },
    ],
  },
];

const iconMap: Record<string, JSX.Element> = {
  grid: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  ),
  spark: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 3l2.5 5 5.5 2.5-5.5 2.5L12 18l-2.5-5-5.5-2.5 5.5-2.5L12 3z" />
    </svg>
  ),
  upload: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 16V6m0 0l-4 4m4-4l4 4M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
    </svg>
  ),
  folder: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  ),
  clipboard: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 4h6m-6 0a2 2 0 00-2 2v1h10V6a2 2 0 00-2-2m-6 0v1m-3 4h12v9a2 2 0 01-2 2H7a2 2 0 01-2-2V9z" />
    </svg>
  ),
  plug: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 7v4m6-4v4M7 11h10m-5 0v6m0 0a4 4 0 01-4 4h-1m5-4a4 4 0 004 4h1" />
    </svg>
  ),
  docs: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  writer: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3zM4 20h16" />
    </svg>
  ),
  updates: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-4-8" />
    </svg>
  ),
  reporting: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  deductions: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 5h8m-8 5h5M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
    </svg>
  ),
  audit: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3 7-7 9-4-2-7-4-7-9V7l7-4z" />
    </svg>
  ),
  forms: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10" />
    </svg>
  ),
  calculator: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM8 7h8M8 11h3M13 11h3M8 15h3M13 15h3" />
    </svg>
  ),
  chat: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-7 6l2.5-2H18a3 3 0 003-3V7a3 3 0 00-3-3H6a3 3 0 00-3 3v9a3 3 0 003 3h2z" />
    </svg>
  ),
};

const FORMS_MODULE_ENABLED = import.meta.env.VITE_FORMS_MODULE_ENABLED !== 'false';

export default function PortalLayout() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isTaxgptRoute =
    location.pathname.startsWith('/portal/taxgpt') || location.pathname.startsWith('/forms');
  const [taxgptOpen, setTaxgptOpen] = useState(isTaxgptRoute);
  const [taxgptBusinessOpen, setTaxgptBusinessOpen] = useState(isTaxgptRoute);
  const [taxgptPersonalOpen, setTaxgptPersonalOpen] = useState(isTaxgptRoute);
  const subscribedServices = useMemo(() => {
    const metadata = user?.publicMetadata as Record<string, unknown> | undefined;
    const raw = metadata?.services || metadata?.paidServices;
    if (Array.isArray(raw)) {
      return raw.map((value) => String(value).toLowerCase());
    }
    return [];
  }, [user]);

  const canAccess = (serviceId: string) => {
    if (serviceId === 'taxgpt-forms' && FORMS_MODULE_ENABLED) return true;
    if (serviceId === 'taxgpt-chat' || serviceId === 'taxgpt-research') return true;
    return subscribedServices.includes(serviceId.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-[#f9f7f6] text-[#333333]">
      <header className="sticky top-0 z-30 border-b border-[#e0e0e0] bg-[#ffffff]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <img src={rpcLogo} alt="RPC Associates" className="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold text-[#183956]">RPC Associates</p>
              <p className="text-xs text-[#666666]">Accounting • Consulting • Tech Solutions</p>
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-3 rounded-md border border-[#e0e0e0] bg-[#ffffff] px-2 py-1.5 text-sm font-medium text-[#333333] shadow-sm hover:bg-[#f9f7f6]"
            >
              <span className="sr-only">Open user menu</span>
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || 'User'}
                  className="h-8 w-8 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#183956] text-xs font-semibold text-white">
                  {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="hidden text-sm text-slate-700 md:block">
                {user?.fullName || 'Client'}
              </span>
              <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.188l3.71-3.96a.75.75 0 111.08 1.04l-4.24 4.53a.75.75 0 01-1.08 0l-4.24-4.53a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-30 mt-3 w-56 origin-top-right rounded-md border border-[#e0e0e0] bg-[#ffffff] py-2 shadow-lg">
                  <div className="px-4 py-2">
                    <p className="text-sm font-semibold text-[#333333]">
                      {user?.fullName || 'Client'}
                    </p>
                    <p className="text-xs text-[#666666]">
                      {user?.emailAddresses?.[0]?.emailAddress || ''}
                    </p>
                  </div>
                  <div className="my-2 border-t border-[#e0e0e0]" />
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm text-[#333333] hover:bg-[#f9f7f6]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile settings
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    onClick={() => signOut({ redirectUrl: '/sign-in' })}
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-8">
        <aside className="hidden w-80 flex-shrink-0 flex-col rounded-md border border-[#e0e0e0] bg-[#ffffff] p-4 shadow-sm lg:flex">
          <nav className="space-y-1">
            {navItems.map((item) => {
              if (item.to === '/portal/taxgpt') {
                return (
                  <div key={item.to} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setTaxgptOpen((open) => !open)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                        isTaxgptRoute
                          ? 'bg-[#183956] text-white shadow'
                          : 'text-[#333333] hover:bg-[#f9f7f6]'
                      }`}
                    >
                      {iconMap[item.icon]}
                      <span className="flex-1 text-left">{item.label}</span>
                      <svg
                        className={`h-4 w-4 text-current transition-transform ${taxgptOpen ? 'rotate-90' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 4a1 1 0 011.707-.707l6 6a1 1 0 010 1.414l-6 6A1 1 0 016 16V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {taxgptOpen && (
                      <div className="space-y-3 pl-3">
                        {taxgptSections.map((section) => {
                          const isMainSection = section.title === 'TaxGPT';
                          const isBusinessSection = section.title === 'TaxGPT Premium • Business';
                          const isPersonalSection = section.title === 'TaxGPT Premium • Personal';
                          const isSectionOpen = isMainSection
                            ? true
                            : isBusinessSection
                              ? taxgptBusinessOpen
                              : taxgptPersonalOpen;
                          const toggleSection = () => {
                            if (isMainSection) return;
                            if (isBusinessSection) {
                              setTaxgptBusinessOpen((open) => !open);
                            } else {
                              setTaxgptPersonalOpen((open) => !open);
                            }
                          };

                          return (
                            <div key={section.title} className="space-y-2">
                              {isMainSection ? (
                                <div className="space-y-1">
                                  {section.items.map((subItem) => {
                                    const allowed = canAccess(subItem.id);
                                    if (!allowed) {
                                      return (
                                        <span
                                          key={subItem.id}
                                          className="flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-[#666666]"
                                        >
                                          {subItem.icon && (
                                            <span className="text-[#666666]">{iconMap[subItem.icon]}</span>
                                          )}
                                          <span>{subItem.label}</span>
                                        </span>
                                      );
                                    }
                                    return (
                                      <NavLink
                                        key={subItem.id}
                                        to={subItem.to}
                                    className={() =>
                                      'flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-[#333333] hover:bg-[#f9f7f6]'
                                    }
                                      >
                                    {() => (
                                          <>
                                            {subItem.icon && (
                                          <span className="text-[#666666]">
                                                {iconMap[subItem.icon]}
                                              </span>
                                            )}
                                            <span>{subItem.label}</span>
                                          </>
                                        )}
                                      </NavLink>
                                    );
                                  })}
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={toggleSection}
                                    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-semibold transition ${
                                      isSectionOpen
                                        ? 'bg-[#183956] text-white'
                                        : 'text-[#333333] hover:bg-[#f9f7f6]'
                                    }`}
                                  >
                                    <span className="flex-1 text-left">
                                      {section.title}
                                      <span
                                        className={`ml-2 text-[10px] font-medium uppercase ${
                                          isSectionOpen ? 'text-white/80' : 'text-[#666666]'
                                        }`}
                                      >
                                        Coming Soon
                                      </span>
                                    </span>
                                    <svg
                                      className={`h-3.5 w-3.5 text-current transition-transform ${
                                        isSectionOpen ? 'rotate-90' : ''
                                      }`}
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M6 4a1 1 0 011.707-.707l6 6a1 1 0 010 1.414l-6 6A1 1 0 016 16V4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                  {isSectionOpen && (
                                    <div className="space-y-1 pl-2">
                                      {section.items.map((subItem) => {
                                        const allowed = canAccess(subItem.id);
                                        if (!allowed) {
                                          return (
                                            <span
                                              key={subItem.id}
                                              className="flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-[#666666]"
                                            >
                                              {subItem.icon && (
                                                <span className="text-[#666666]">{iconMap[subItem.icon]}</span>
                                              )}
                                              <span>{subItem.label}</span>
                                            </span>
                                          );
                                        }
                                        return (
                                          <NavLink
                                            key={subItem.id}
                                            to={subItem.to}
                                            className={({ isActive }) =>
                                              `flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium transition ${
                                                isActive
                                                  ? 'bg-[#183956] text-white'
                                                  : 'text-[#333333] hover:bg-[#f9f7f6]'
                                              }`
                                            }
                                          >
                                            {({ isActive }) => (
                                              <>
                                                {subItem.icon && (
                                                  <span className={isActive ? 'text-white' : 'text-[#666666]'}>
                                                    {iconMap[subItem.icon]}
                                                  </span>
                                                )}
                                                <span>{subItem.label}</span>
                                              </>
                                            )}
                                          </NavLink>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              if (item.disabled) {
                return (
                  <span
                    key={item.to}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#666666]"
                  >
                    {iconMap[item.icon]}
                    {item.label}
                  </span>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/portal'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-[#183956] text-white shadow'
                        : 'text-[#333333] hover:bg-[#f9f7f6]'
                    }`
                  }
                >
                  {iconMap[item.icon]}
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
