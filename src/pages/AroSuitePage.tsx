import { FC, FormEvent, useState } from 'react'
import SEO from '../components/SEO'
import { API_ENDPOINTS } from '../lib/config/api'
import { parseFormApiJson } from '../lib/formApiResponse'

const ARO_SUITE_APP_URL = 'https://arosuite.axiomft.ca'

const frameworks = ['PSAS (PS 3280)', 'ASPE 3110', 'IFRS / IFRIC 1', 'ASC 410-20'] as const

const frameworkRows = [
  {
    framework: 'PSAS — PS 3280',
    rateBasis:
      'Entity-specific rate reflecting the risks of the liability, or undiscounted where permitted',
    ratePerLayer: 'No — single current rate',
  },
  {
    framework: 'IFRS — IAS 37 / IFRIC 1',
    rateBasis:
      'Pre-tax rate reflecting the time value of money and the risks specific to the liability',
    ratePerLayer: 'No — single current rate',
  },
  {
    framework: 'ASPE 3110',
    rateBasis:
      'Current market risk-free rate for maturities matching the expected cash flows',
    ratePerLayer: 'Yes — rate locked onto each layer',
  },
  {
    framework: 'US GAAP — ASC 410-20',
    rateBasis: 'Credit-adjusted risk-free rate',
    ratePerLayer: 'Yes — rate locked onto each layer',
  },
] as const

const stages = [
  {
    title: 'Set up',
    body:
      'The reporting unit, its fiscal calendar, its framework, the chart of accounts and the posting rules — and the opening register, locked as the conversion snapshot so transition can never quietly drift.',
    tags: ['Unit settings', 'Chart of accounts', 'Posting rules', 'Periods & close', 'Opening register'],
  },
  {
    title: 'Prepare',
    body:
      'Load the master TCA listing and scope it. Every asset is In scope, Scoped out with a recorded reason, or Undecided — and Undecided is a number on the dashboard until someone resolves it. Load a new extract and only the new rows need scoping.',
    tags: ['ARO scoping'],
  },
  {
    title: 'Measure',
    body:
      'The obligation register, the layer structure the framework calls for, and an event ledger that records every movement as it happens rather than reconstructing it at year end.',
    tags: ['ARO register', 'Layers & framework', 'Event ledger'],
  },
  {
    title: 'Close',
    body:
      'Month-end posting, year-end revaluation for inflation and rates, settlements, journals and batches, and a GL reconciliation — run on a close calendar rather than in a scramble.',
    tags: [
      'Close calendar',
      'Month-end posting',
      'Year-end revaluation',
      'Settlements',
      'Journals',
      'Journal batches',
      'GL reconciliation',
    ],
  },
  {
    title: 'Report',
    body:
      'The roll-forward, the comparatives, the sensitivity analysis, and the disclosure note generated from the closing population. The year-end lock will not complete until the note exists.',
    tags: ['Roll-forward & disclosure', 'Comparatives', 'Sensitivity'],
  },
  {
    title: 'Assure',
    body:
      'Freeze the evidence, sample and tickmark it, export a completeness pack, and sign off. The pack carries a measurement stamp hashed from the register, assumptions, curve and policy — change one figure and the signature is invalid, and the product says so rather than letting a stale signature stand.',
    tags: ['Evidence & freeze', 'Sampling & tickmarks', 'Completeness pack', 'Review & sign-off'],
  },
] as const

const workbookRisks = [
  {
    title: 'Nothing records who changed the estimate',
    body:
      'A broken link, a dragged formula or a hard-coded rate is a misstatement waiting for a year-end. “Last modified by” on a shared drive is not a change log, and it is the first thing an auditor asks for.',
  },
  {
    title: 'The tie-out checks itself',
    body:
      'When the roll-forward is built from the same journals it is meant to verify, it always foots. A tie-out that cannot fail is not a control. ARO Suite derives the two independently, so the check means something.',
  },
  {
    title: 'Transition mechanics no workbook can defend',
    body:
      'Retroactive, modified retroactive and prospective adoption each produce a different opening adjustment — and fully amortized assets, unrecognized assets and assets no longer in productive use are each treated differently again. Every branch has to be evidenced consistently across the whole register.',
  },
  {
    title: 'The mid-market gap',
    body:
      'ARO modules inside enterprise ERPs are priced and scoped for enterprises. You should not need a seven-figure IT project to comply with a single handbook section. ARO Suite takes the export you already run, and hands back Excel with the formulas intact.',
  },
] as const

const fitPoints = [
  {
    title: 'No integration project',
    body:
      'Your export goes in. A tangible capital asset register or trial balance from Sage, Dynamics, NetSuite, QuickBooks Enterprise, Vadim, Diamond, or anything else that writes a file. There is a template to export against, and loading an updated extract only asks you to scope what is new.',
  },
  {
    title: 'Excel comes out',
    body:
      'With the formulas live, not a locked PDF. Your auditor can trace every figure back through the model and your team keeps working in the tool they already use.',
  },
  {
    title: 'SaaS or on-premise',
    body:
      'Where data residency is a procurement requirement rather than a preference, the whole thing runs inside your environment.',
  },
  {
    title: 'Multi-entity from the start',
    body:
      'Reporting units carry their own year end, currency and framework, on a shared chart of accounts — with a client portal, roles and an immutable change log for firms running this across an engagement base.',
  },
] as const

const rollForwardRows: Array<{ line: string; amount: string; emphasize?: boolean }> = [
  { line: 'Opening balance', amount: '4,182,600' },
  { line: 'New ARO', amount: '316,000' },
  { line: 'Accretion', amount: '154,760' },
  { line: 'Change of estimate — cost', amount: '211,400' },
  { line: 'Change of estimate — term', amount: '77,000' },
  { line: 'Settlements', amount: '(212,300)' },
  { line: 'Closing balance', amount: '4,729,460', emphasize: true },
]

const frameworkOptions = [
  'PSAS — PS 3280',
  'ASPE 3110',
  'IFRS — IAS 37 / IFRIC 1',
  'US GAAP — ASC 410-20',
  'More than one',
  'Not sure yet',
] as const

const interestOptions = [
  'The PS 3280 scoping checklist',
  'A 15-minute design partner session',
  'Early access when we open it up',
] as const

const keywords = [
  'ARO Suite',
  'asset retirement obligation',
  'PS 3280',
  'ASPE 3110',
  'IFRIC 1',
  'ASC 410-20',
  'decommissioning liability',
  'ARO software',
  'Canadian ARO accounting',
]

const AroSuitePage: FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    framework: '',
    interest: '',
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.organization,
          message: [
            'ARO Suite design partner request',
            `Framework in force: ${formData.framework || 'Not specified'}`,
            `What they want: ${formData.interest || 'Not specified'}`,
          ].join('\n'),
        }),
      })

      const data = await parseFormApiJson<{
        success?: boolean
        error?: string
        message?: string
      }>(response)

      if (response.ok && data.success) {
        setSubmitStatus('success')
        setFormData({
          name: '',
          email: '',
          organization: '',
          framework: '',
          interest: '',
        })
      } else {
        setSubmitStatus('error')
        setErrorMessage(data.error || data.message || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Network error. Please check your connection and try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SEO
        title="ARO Suite | Asset Retirement Obligation Software"
        description="Own the ARO process end to end — one asset register, four reporting frameworks, measurement, close, roll-forward, disclosure, and audit evidence. Built by Canadian CPAs."
        canonical="/products/aro-suite"
        keywords={keywords}
        ogType="website"
      />
      <main className="aro-suite-page bg-[#f7f8f9] text-[#0b1f17]">
        {/* Product bar */}
        <div className="border-b border-[#d8ddd9] bg-white">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-md py-4">
            <div className="text-lg font-semibold tracking-tight text-[#0b1f17]">ARO Suite</div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6b64]">
              · Pre-release · Design partner program open
            </p>
          </div>
        </div>

        {/* Hero */}
        <section className="border-b border-[#d8ddd9] bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-0 px-md lg:grid-cols-[180px_minmax(0,1fr)_340px]">
            <aside className="border-b border-[#d8ddd9] py-xl lg:border-b-0 lg:border-r lg:pr-lg">
              <p className="mb-md text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f6b64]">
                Frameworks
              </p>
              <ul className="m-0 list-none space-y-3 p-0">
                {frameworks.map((item) => (
                  <li key={item} className="text-sm font-medium text-[#0b1f17]">
                    {item}
                  </li>
                ))}
              </ul>
            </aside>

            <div className="border-b border-[#d8ddd9] py-xl lg:border-b-0 lg:border-r lg:px-xl">
              <p className="mb-md text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f6b64]">
                Asset retirement obligations
              </p>
              <h1 className="mb-md text-4xl font-bold leading-tight text-[#0b1f17] lg:text-5xl">
                Own the ARO process, end to end.
              </h1>
              <p className="mb-md text-base leading-relaxed text-[#3d4a43] lg:text-lg">
                One asset register, four reporting frameworks, and an engine that knows the
                difference between them. ASPE and US GAAP lock a rate onto every layer; IFRS and
                PSAS carry a single current rate. Get that wrong and every figure downstream is
                wrong with it.
              </p>
              <p className="mb-lg text-base leading-relaxed text-[#3d4a43]">
                Scoping, measurement, close, roll-forward, disclosure note and the audit file — in
                one place. Built by Canadian CPAs who have signed off on these balances.
              </p>
              <div className="mb-lg flex flex-wrap gap-3">
                <a href="#design-partner" className="btn inline-flex bg-[#0b1f17] text-white hover:bg-[#16352a]">
                  Request a design partner session
                </a>
                <a
                  href="#design-partner"
                  className="btn inline-flex border-2 border-[#0b1f17] bg-transparent text-[#0b1f17] hover:bg-[#0b1f17] hover:text-white"
                >
                  Get the PS 3280 scoping checklist
                </a>
                <a
                  href={ARO_SUITE_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn inline-flex border border-[#c5c8cc] bg-white text-[#0b1f17] hover:border-[#0b1f17]"
                >
                  Open ARO Suite
                </a>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6b64]">
                CPA · CMA · CGAP · MBA · Canadian-built
              </p>
            </div>

            <aside className="py-xl lg:pl-lg">
              <div className="rounded-lg border border-[#d8ddd9] bg-white p-md shadow-sm">
                <div className="mb-sm flex items-start justify-between gap-3">
                  <div>
                    <h2 className="m-0 text-base font-semibold text-[#0b1f17]">
                      Roll-forward of asset retirement obligations
                    </h2>
                    <p className="mt-1 text-xs text-[#5f6b64]">
                      Year ended March 31 · PSAS (PS 3280)
                    </p>
                  </div>
                  <span className="shrink-0 rounded bg-[#eef1ef] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#5f6b64]">
                    Illustrative
                  </span>
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#d8ddd9] text-left text-[11px] uppercase tracking-wider text-[#5f6b64]">
                      <th className="py-2 font-semibold">Line</th>
                      <th className="py-2 text-right font-semibold">$</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rollForwardRows.map((row) => (
                      <tr
                        key={row.line}
                        className={`border-b border-[#ecefeb] ${row.emphasize ? 'font-semibold' : ''}`}
                      >
                        <td className="py-2.5 pr-3 text-[#0b1f17]">{row.line}</td>
                        <td className="py-2.5 text-right tabular-nums text-[#0b1f17]">{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-md text-[11px] leading-relaxed text-[#5f6b64]">
                  Foots to the cent, and independently derived. The roll-forward is computed from
                  the event ledger, not from the journals — so the check that a batch&apos;s net
                  movement equals closing less opening is actually falsifiable. Measurement stamp
                  sha256:… hashed from the register, the assumptions, the curve and the policy.
                  Figures are illustrative and do not represent any client or entity.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* 01 Framework engine */}
        <section className="border-b border-[#d8ddd9] bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f6b64]">01</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b1f17]">
                The framework engine
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-bold text-[#0b1f17] lg:text-4xl">
                The difference between the four standards is not cosmetic. It is the model.
              </h2>
              <p className="mb-lg max-w-3xl text-base leading-relaxed text-[#3d4a43]">
                Most ARO tooling implements one framework and paints the others on. The measurement
                mechanics genuinely diverge, and the divergence compounds every year you carry the
                balance forward.
              </p>
              <p className="mb-md text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6b64]">
                How each framework measures · Summary — the Handbook governs
              </p>
              <div className="overflow-x-auto rounded-lg border border-[#d8ddd9]">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead className="bg-[#f7f8f9]">
                    <tr className="text-left text-[11px] uppercase tracking-wider text-[#5f6b64]">
                      <th className="px-4 py-3 font-semibold">Framework</th>
                      <th className="px-4 py-3 font-semibold">Discount rate basis</th>
                      <th className="px-4 py-3 font-semibold">Rate per layer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frameworkRows.map((row) => (
                      <tr key={row.framework} className="border-t border-[#ecefeb] align-top">
                        <td className="px-4 py-3 font-medium text-[#0b1f17]">{row.framework}</td>
                        <td className="px-4 py-3 text-[#3d4a43]">{row.rateBasis}</td>
                        <td className="px-4 py-3 text-[#3d4a43]">{row.ratePerLayer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-lg max-w-3xl text-base leading-relaxed text-[#3d4a43]">
                Change the framework on a unit and the engine remeasures it. Layered frameworks keep
                every historical rate on its own cost increment; single-rate frameworks reprice the
                whole obligation and present the layers as a record of when the obligation arose.
                Revisions, downward revisions, inflation treatment and unwinding presentation follow
                the framework in force, not a global setting.
              </p>
            </div>
          </div>
        </section>

        {/* 02 What it covers */}
        <section className="border-b border-[#d8ddd9] bg-[#f7f8f9]">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f6b64]">02</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b1f17]">
                What it covers
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-bold text-[#0b1f17] lg:text-4xl">
                Six stages, from the PP&amp;E extract to the partner&apos;s signature.
              </h2>
              <p className="mb-xl max-w-3xl text-base leading-relaxed text-[#3d4a43]">
                Not a calculator bolted onto a spreadsheet. The whole process, in the order a
                reporting team actually works it, with each stage gating the next.
              </p>
              <div className="grid gap-md md:grid-cols-2">
                {stages.map((stage) => (
                  <article key={stage.title} className="rounded-lg border border-[#d8ddd9] bg-white p-md">
                    <h3 className="mb-sm text-xl font-semibold text-[#0b1f17]">{stage.title}</h3>
                    <p className="mb-md text-sm leading-relaxed text-[#3d4a43]">{stage.body}</p>
                    <p className="m-0 text-xs leading-relaxed text-[#5f6b64]">{stage.tags.join(' · ')}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 03 Why not the workbook */}
        <section className="border-b border-[#d8ddd9] bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f6b64]">03</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b1f17]">
                Why not the workbook
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-bold text-[#0b1f17] lg:text-4xl">
                Excel gets the arithmetic right. It cannot produce the evidence.
              </h2>
              <p className="mb-xl max-w-3xl text-base leading-relaxed text-[#3d4a43]">
                ARO is one of the few balances where the calculation, the evidence and the disclosure
                all have to survive an auditor asking “show me how you got here” three years after
                the person who built the model left.
              </p>
              <div className="grid gap-md md:grid-cols-2">
                {workbookRisks.map((risk, index) => (
                  <article key={risk.title} className="border-t border-[#d8ddd9] pt-md">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6b64]">
                      Risk {index + 1}
                    </p>
                    <h3 className="mb-sm text-xl font-semibold text-[#0b1f17]">{risk.title}</h3>
                    <p className="m-0 text-sm leading-relaxed text-[#3d4a43]">{risk.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 04 How it fits */}
        <section className="border-b border-[#d8ddd9] bg-[#f7f8f9]">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f6b64]">04</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b1f17]">
                How it fits
              </p>
            </div>
            <div>
              <h2 className="mb-xl text-3xl font-bold text-[#0b1f17] lg:text-4xl">
                No integration project, and it can run inside your building.
              </h2>
              <div className="grid gap-lg md:grid-cols-2">
                {fitPoints.map((point) => (
                  <article key={point.title}>
                    <h3 className="mb-sm text-xl font-semibold text-[#0b1f17]">{point.title}</h3>
                    <p className="m-0 text-sm leading-relaxed text-[#3d4a43]">{point.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 05 Who is building it */}
        <section className="border-b border-[#d8ddd9] bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f6b64]">05</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b1f17]">
                Who is building it
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-bold text-[#0b1f17] lg:text-4xl">
                Built by auditors. Designed for controllers.
              </h2>
              <p className="mb-xl max-w-3xl text-base leading-relaxed text-[#3d4a43]">
                A boutique firm, not a venture-funded platform team. You will talk to the people
                writing the measurement engine.
              </p>
              <div className="grid gap-md md:grid-cols-2">
                <article className="rounded-lg border border-[#d8ddd9] p-md">
                  <h3 className="mb-1 text-xl font-semibold text-[#0b1f17]">Roger Reid</h3>
                  <p className="mb-md text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6b64]">
                    CPA · CMA · CGAP
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-[#3d4a43]">
                    Public sector accounting, government audit, and the engagements that put Axiom
                    in front of PS 3280 adoption and ARO measurement work.
                  </p>
                </article>
                <article className="rounded-lg border border-[#d8ddd9] p-md">
                  <h3 className="mb-1 text-xl font-semibold text-[#0b1f17]">
                    Axiom Financial &amp; Technology
                  </h3>
                  <p className="mb-md text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6b64]">
                    Accounting · Advisory · Automation · Intelligence
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-[#3d4a43]">
                    Corporate financial infrastructure, internal controls, and software-led audit
                    assurance — the same practice that delivers ICFM/ICFR and client portal systems.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* 06 Design partner */}
        <section id="design-partner" className="border-b border-[#d8ddd9] bg-[#0b1f17] text-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">06</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
                Design partner program
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-bold lg:text-4xl">
                We are looking for three to five design partners.
              </h2>
              <p className="mb-xl max-w-3xl text-base leading-relaxed text-white/80">
                Not a pilot you pay for. Fifteen minutes where you pressure-test the engine against
                your own scoping and transition decisions, and we build against what an actual audit
                file needs. Design partners keep permanent, unrestricted access to the compliance
                frameworks that come out of it.
              </p>

              <form className="grid max-w-2xl gap-md" onSubmit={handleSubmit}>
                <div className="grid gap-md sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">Name</span>
                    <input
                      required
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-white placeholder:text-white/40 focus:border-white focus:outline-none"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">Work email</span>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-white placeholder:text-white/40 focus:border-white focus:outline-none"
                      placeholder="you@organization.ca"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Organization</span>
                  <input
                    required
                    name="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-white placeholder:text-white/40 focus:border-white focus:outline-none"
                    placeholder="Municipality, Crown corp, firm, or company"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Framework in force</span>
                  <select
                    required
                    name="framework"
                    value={formData.framework}
                    onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                    className="rounded-lg border border-white/20 bg-[#0b1f17] px-3 py-3 text-white focus:border-white focus:outline-none"
                  >
                    <option value="">Select a framework</option>
                    {frameworkOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">What you want</span>
                  <select
                    required
                    name="interest"
                    value={formData.interest}
                    onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                    className="rounded-lg border border-white/20 bg-[#0b1f17] px-3 py-3 text-white focus:border-white focus:outline-none"
                  >
                    <option value="">Select an option</option>
                    {interestOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn inline-flex bg-white text-[#0b1f17] hover:bg-[#eef1ef] disabled:opacity-60"
                  >
                    {isSubmitting ? 'Sending…' : 'Send request'}
                  </button>
                  {submitStatus === 'success' && (
                    <p className="m-0 text-sm text-emerald-200">Request sent. We will follow up shortly.</p>
                  )}
                  {submitStatus === 'error' && (
                    <p className="m-0 text-sm text-red-200">{errorMessage}</p>
                  )}
                </div>
                <p className="m-0 text-xs text-white/60">
                  No newsletter. We will use this to send you the checklist and, if you asked for
                  one, to find fifteen minutes.
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* 07 Free resource */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f6b64]">07</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b1f17]">
                Free resource
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-bold text-[#0b1f17] lg:text-4xl">
                The PS 3280 audit-readiness and asset scoping checklist.
              </h2>
              <p className="mb-lg max-w-3xl text-base leading-relaxed text-[#3d4a43]">
                Request it below — no newsletter. The source-of-obligation test, the asset classes
                where obligations hide, the transition decision record, the discount rate provenance
                test, and a self-audit of the workbook against what an auditor will actually ask for.
              </p>
              <p className="mb-lg max-w-3xl text-base leading-relaxed text-[#3d4a43]">
                It is the same scoping logic the product implements — useful whether or not you ever
                open ARO Suite.
              </p>
              <a href="#design-partner" className="btn inline-flex bg-[#0b1f17] text-white hover:bg-[#16352a]">
                Request the checklist
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default AroSuitePage
