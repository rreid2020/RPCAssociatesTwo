import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

type ServiceAccess = 'free' | 'paid';
type ServiceAudience = 'business' | 'individual' | 'both';

type PortalService = {
  id: string;
  name: string;
  description: string;
  path: string;
  access: ServiceAccess;
  audience: ServiceAudience;
  group: 'free' | 'premium';
};

const SERVICES: PortalService[] = [
  {
    id: 'taxgpt-chat',
    name: 'TaxGPT Chat',
    description: 'Ask tax questions and get AI-assisted guidance with sources.',
    path: '/portal/taxgpt',
    access: 'free',
    audience: 'both',
    group: 'free',
  },
  {
    id: 'taxgpt-research',
    name: 'Tax Research',
    description: 'Get expert-level answers to complex tax questions and regulations.',
    path: '/portal/taxgpt?view=research',
    access: 'free',
    audience: 'both',
    group: 'free',
  },
  {
    id: 'taxgpt-docs',
    name: 'Document Management & Analysis',
    description: 'Securely upload and analyze business tax documents with insights.',
    path: '/portal/taxgpt?view=docs',
    access: 'paid',
    audience: 'business',
    group: 'premium',
  },
  {
    id: 'taxgpt-writer',
    name: 'Tax Writer',
    description: 'Draft professional tax communications and IRS responses.',
    path: '/portal/taxgpt?view=writer',
    access: 'paid',
    audience: 'business',
    group: 'premium',
  },
  {
    id: 'taxgpt-updates',
    name: 'Stay Updated on Tax Laws',
    description: 'Get updates on new regulations and legislative changes.',
    path: '/portal/taxgpt?view=updates',
    access: 'paid',
    audience: 'business',
    group: 'premium',
  },
  {
    id: 'taxgpt-reporting',
    name: 'Tax Calculations & Reporting',
    description: 'Automate complex tax calculations and reporting workflows.',
    path: '/portal/taxgpt?view=reporting',
    access: 'paid',
    audience: 'business',
    group: 'premium',
  },
  {
    id: 'taxgpt-deductions',
    name: 'Deduction Discovery',
    description: 'Find every eligible tax deduction for your personal situation.',
    path: '/portal/taxgpt?view=deductions',
    access: 'paid',
    audience: 'individual',
    group: 'premium',
  },
  {
    id: 'taxgpt-audit',
    name: 'Audit Risk Minimization',
    description: 'Stay compliant with real-time updates and reduce audit risk.',
    path: '/portal/taxgpt?view=audit',
    access: 'paid',
    audience: 'individual',
    group: 'premium',
  },
  {
    id: 'taxgpt-forms',
    name: 'Tax Form Guidance',
    description: 'Step-by-step assistance for essential tax forms.',
    path: '/forms',
    access: 'paid',
    audience: 'individual',
    group: 'premium',
  },
  {
    id: 'taxgpt-personal-calc',
    name: 'Tax Calculations',
    description: 'Accurately calculate personal taxes without guesswork.',
    path: '/portal/taxgpt?view=calculations',
    access: 'paid',
    audience: 'individual',
    group: 'premium',
  },
];

export default function PortalDashboard() {
  const { user } = useUser();

  const subscribedServices = useMemo(() => {
    const metadata = user?.publicMetadata as Record<string, unknown> | undefined;
    const raw = metadata?.services || metadata?.paidServices;
    if (Array.isArray(raw)) {
      return raw.map((value) => String(value).toLowerCase());
    }
    return [];
  }, [user]);

  const canAccess = (service: PortalService) => {
    if (service.access === 'free') return true;
    return subscribedServices.includes(service.id.toLowerCase());
  };

  const freeServices = SERVICES.filter((service) => service.group === 'free');
  const premiumBusiness = SERVICES.filter(
    (service) => service.group === 'premium' && service.audience === 'business'
  );
  const premiumIndividual = SERVICES.filter(
    (service) => service.group === 'premium' && service.audience === 'individual'
  );

  return (
    <div className="space-y-8">
      <section className="rounded-md border border-[#e0e0e0] bg-[#ffffff] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Welcome back</p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {user?.fullName || 'Client'}’s dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Track your services and jump into the tools you need most.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/portal/taxgpt"
              className="rounded-md bg-[#183956] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1f4d73]"
            >
              Launch TaxGPT
            </Link>
            <button
              disabled
              className="cursor-not-allowed rounded-md border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-400"
            >
              Upload files
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-[#e0e0e0] bg-[#ffffff] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">Active</p>
          <p className="mt-1 text-sm text-slate-500">All free services enabled</p>
        </div>
        <div className="rounded-md border border-[#e0e0e0] bg-[#ffffff] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Paid services</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {subscribedServices.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">Subscriptions linked to your account</p>
        </div>
        <div className="rounded-md border border-[#e0e0e0] bg-[#ffffff] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Support</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">Priority</p>
          <p className="mt-1 text-sm text-slate-500">We reply within 1 business day</p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">TaxGPT services</h3>
            <p className="text-sm text-slate-500">
              Basic chat and tax research are free. Premium services unlock with a subscription.
            </p>
          </div>
          <span className="rounded-md bg-[#f9f7f6] px-3 py-1 text-xs font-medium text-[#666666]">
            {SERVICES.length} services
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[#666666]">
              Free services
            </h4>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {freeServices.map((service) => {
                const allowed = canAccess(service);
                return (
                  <div
                    key={service.id}
                    className="rounded-md border border-[#e0e0e0] bg-[#ffffff] p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{service.name}</h4>
                        <p className="mt-1 text-sm text-slate-600">{service.description}</p>
                      </div>
                      <span className="rounded-md bg-[#f9f7f6] px-3 py-1 text-xs font-medium text-[#183956]">
                        Free
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      {allowed ? (
                        <Link
                          to={service.path}
                          className="rounded-md bg-[#183956] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f4d73]"
                        >
                          Open
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="cursor-not-allowed rounded-md bg-[#f9f7f6] px-4 py-2 text-sm font-semibold text-[#666666]"
                        >
                          Locked
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[#666666]">
              Premium • Business
            </h4>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {premiumBusiness.map((service) => {
                const allowed = canAccess(service);
                return (
                  <div
                    key={service.id}
                    className="rounded-md border border-[#e0e0e0] bg-[#ffffff] p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{service.name}</h4>
                        <p className="mt-1 text-sm text-slate-600">{service.description}</p>
                      </div>
                      <span className="rounded-md bg-[#f9f7f6] px-3 py-1 text-xs font-medium text-[#183956]">
                        Premium
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      {allowed ? (
                        <Link
                          to={service.path}
                          className="rounded-md bg-[#183956] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f4d73]"
                        >
                          Open
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="cursor-not-allowed rounded-md bg-[#f9f7f6] px-4 py-2 text-sm font-semibold text-[#666666]"
                        >
                          Locked
                        </button>
                      )}
                      {!allowed && <span className="text-xs text-[#666666]">Subscribe to unlock</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[#666666]">
              Premium • Personal
            </h4>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {premiumIndividual.map((service) => {
                const allowed = canAccess(service);
                return (
                  <div
                    key={service.id}
                    className="rounded-md border border-[#e0e0e0] bg-[#ffffff] p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{service.name}</h4>
                        <p className="mt-1 text-sm text-slate-600">{service.description}</p>
                      </div>
                      <span className="rounded-md bg-[#f9f7f6] px-3 py-1 text-xs font-medium text-[#183956]">
                        Premium
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      {allowed ? (
                        <Link
                          to={service.path}
                          className="rounded-md bg-[#183956] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f4d73]"
                        >
                          Open
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="cursor-not-allowed rounded-md bg-[#f9f7f6] px-4 py-2 text-sm font-semibold text-[#666666]"
                        >
                          Locked
                        </button>
                      )}
                      {!allowed && <span className="text-xs text-[#666666]">Subscribe to unlock</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
