import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import MarketingPageHero from '../components/MarketingPageHero'

// Where the ProjectCost app runs. Update when it moves to its own subdomain (e.g. projectcost.axiomft.ca).
const PROJECTCOST_APP_URL = 'https://project-cost-hlls.vercel.app'
const SIGN_UP_URL = `${PROJECTCOST_APP_URL}/sign-up`

const sources = [
  'QuickBooks Online',
  'Sage 50 & Sage 300',
  'Xero',
  'QuickBooks Desktop',
  'Field time apps',
  'CSV & Excel',
] as const

const wipRows: Array<{ project: string; pct: string; overUnder: string; emphasize?: boolean }> = [
  { project: '2401 Riverside MOB', pct: '62.4%', overUnder: '(48,200)' },
  { project: '2407 Lakeshore reno', pct: '88.1%', overUnder: '12,650' },
  { project: 'Shop expansion (capital)', pct: '—', overUnder: '—' },
  { project: 'Lot 12 spec home (for sale)', pct: '—', overUnder: '—' },
  { project: 'Contracts total', pct: '', overUnder: '(35,550)', emphasize: true },
]

const gaps = [
  {
    gap: 'Projects are tied to customers',
    answer:
      'Customer contracts, capital projects and builds for sale. Costs find their project by the customer, class, location or account your books already use, or are assigned in ProjectCost.',
  },
  {
    gap: 'Actuals, but no live budget or forecast',
    answer:
      'Original budget plus approved change orders, actuals from your books and your estimate to complete, by cost code. Fade and overruns are flagged while there is still time to act.',
  },
  {
    gap: 'Change orders live in email',
    answer:
      'One log of pending, approved and rejected changes. Approving a change revises the contract, the cost budget and the schedule of values together.',
  },
  {
    gap: 'No percentage-of-completion or WIP schedule',
    answer:
      'Cost-to-cost % complete, earned revenue, over and under billings and loss provisions, with each month saved as a snapshot for the surety, the bank and the auditor.',
  },
  {
    gap: 'Holdback handled with workarounds',
    answer:
      'Progress billing against a schedule of values, with holdback retained, tax on the net amount and holdback receivable tracked on every job.',
  },
  {
    gap: 'Labour reaches the job without its burden',
    answer:
      'Hours × pay rate × (1 + burden), so CPP, EI, WSIB, EHT and benefits land on the job, with the burden entry drafted.',
  },
  {
    gap: 'Uncoded costs quietly drop off the job',
    answer:
      'Anything without a project or cost code waits in an Unassigned costs queue, with what the source said shown for context. Assignments survive every re-sync.',
  },
  {
    gap: 'Capital and inventory entries are booked by hand',
    answer:
      'Reclass to construction in progress or work in process, capitalization in the in-service month, units completed to finished goods and units sold to cost of goods sold — drafted and balanced.',
  },
  {
    gap: 'Job profit stops at gross margin',
    answer:
      'An overhead rate built from your Profit and Loss, applied on labour cost, labour hours or direct cost. A management view that never touches the WIP schedule.',
  },
] as const

const projectKinds = [
  {
    title: 'Customer contracts',
    body:
      'Fixed-price and cost-plus work for a client: budget, change orders, progress billing with holdback, and percentage-of-completion revenue on the WIP schedule.',
    tags: ['Contract value', 'Change orders', 'Holdback', 'WIP'],
  },
  {
    title: 'Capital projects',
    body:
      'Work you build for your own use — a shop, a warehouse addition, equipment. Costs build up in construction in progress and move to a fixed asset on the in-service date.',
    tags: ['No customer', 'Construction in progress', 'Capitalization'],
  },
  {
    title: 'Builds for sale',
    body:
      'Homes, units or products built to sell. Costs sit in work in process, move to finished goods as units complete, and to cost of goods sold as they sell.',
    tags: ['Units', 'Work in process', 'Finished goods', 'COGS'],
  },
] as const

const closeRows: Array<{ account: string; debit: string; credit: string }> = [
  { account: 'Costs & est. earnings in excess of billings', debit: '48,200', credit: '' },
  { account: 'Billings in excess of costs & est. earnings', debit: '', credit: '12,650' },
  { account: 'Contract revenue — WIP adjustment', debit: '', credit: '35,550' },
]

const steps = [
  {
    title: 'Connect or upload',
    body:
      'Connect QuickBooks Online, or upload CSV and Excel exports from Sage, Xero, your field time app or your own workbooks. Columns are matched for you, and nothing is saved until you confirm.',
  },
  {
    title: 'Set up projects and budgets',
    body:
      'Create customer contracts, capital projects and builds for sale, with contract values and budgets by cost code — entered directly or imported.',
  },
  {
    title: 'Bring in costs and time',
    body:
      'Bills, expenses, cheques, journal lines and hours. Re-importing updates lines instead of duplicating them.',
  },
  {
    title: 'Assign what is left',
    body:
      'Work through Unassigned costs: pick a project and cost code, or mark time as not project work. Your choices are kept on the next sync.',
  },
  {
    title: 'Close the month',
    body:
      'Review the WIP schedule, book the drafted entries, save the snapshot and download the reports. Every figure drills down to the transaction or spreadsheet row behind it.',
  },
] as const

const notDo = [
  {
    title: 'It does not replace your accounting system',
    body:
      'QuickBooks, Sage, Xero or whatever you use stays your general ledger. ProjectCost reads from it and drafts entries for you to book there.',
  },
  {
    title: 'It is not payroll or a time clock',
    body:
      'Hours come from your ledger or field time app, or are entered in ProjectCost; pay rates and burden are set per employee.',
  },
  {
    title: 'It does not second-guess your estimates',
    body:
      'Budgets, estimates to complete and contract values are management’s. It applies them consistently and shows the consequences.',
  },
  {
    title: 'It is not an estimating or scheduling tool',
    body: 'It starts when the budget exists and follows the money from there.',
  },
] as const

const faq = [
  {
    question: 'Which accounting systems does it work with?',
    answer:
      'QuickBooks Online connects directly. Sage 50, Sage 300, Xero, QuickBooks Desktop and anything else that exports CSV or Excel works through imports, and you can mix sources.',
  },
  {
    question: 'Does it write back to my accounting system?',
    answer:
      'No. It drafts journal entries with a [ProjectCost] memo for you to book. With QuickBooks connected, the memo stops the next sync from counting them twice.',
  },
  {
    question: 'What accounting basis does the WIP schedule use?',
    answer:
      'Percentage of completion on a cost-to-cost basis, with projected losses recognized in full as soon as they are known, consistent with ASPE 3400 and IFRS 15.',
  },
  {
    question: 'How is sales tax handled?',
    answer:
      'In Canada, recoverable GST/HST on purchases (input tax credits) is kept out of job cost. In the US, sales tax paid is part of the cost.',
  },
  {
    question: 'Which reports can I download?',
    answer:
      'The WIP schedule (current or any saved month), the month’s journal entries, job cost by project and cost code, and cost and time detail for any date range — viewable in the app and downloadable as Excel.',
  },
  {
    question: 'Can several people and companies use it?',
    answer:
      'Yes. Each company has its own workspace with admins and members, and one person can belong to several companies — useful for bookkeepers and accountants serving clients.',
  },
] as const

const keywords = [
  'ProjectCost',
  'job costing software Canada',
  'WIP schedule',
  'percentage of completion',
  'construction accounting QuickBooks',
  'progress billing holdback',
  'capital project accounting',
  'construction in progress',
]

const ProjectCostPage: FC = () => {
  return (
    <>
      <SEO
        title="ProjectCost | Job Costing & WIP for Your Accounting System"
        description="Budgets, change orders, progress billing with holdback, a surety-format WIP schedule and month-end entries — on top of QuickBooks, Sage, Xero or spreadsheets. 14-day free trial."
        canonical="/products/projectcost"
        keywords={keywords}
        ogType="website"
        schemaSoftware={{
          name: 'ProjectCost',
          description:
            'Project accounting for contractors, capital projects and builds for sale: budgets and forecasts by cost code, change orders, progress billing with holdback, percentage-of-completion WIP schedule, burdened labour, overhead allocation and drafted month-end journal entries, on top of QuickBooks, Sage, Xero or spreadsheets.',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offersUrl: SIGN_UP_URL,
          offersPrice: '0',
          offersCurrency: 'CAD',
        }}
        schemaFaq={faq.map((item) => ({ question: item.question, answer: item.answer }))}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Products', path: '/products/projectcost' },
          { name: 'ProjectCost', path: '/products/projectcost' },
        ]}
      />
      <main className="bg-white text-text-body">
        <MarketingPageHero
          eyebrow="Project accounting"
          title="Know where every project stands."
          lede="The project layer your accounting system is missing: budgets, change orders, progress billing, WIP and month-end entries for customer contracts, capital projects and builds for sale — built from the books you already keep."
          primary={(
            <a href={SIGN_UP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Start your 14-day free trial
            </a>
          )}
          secondary={(
            <a href="#gaps" className="btn btn-ghost">
              See what it does
            </a>
          )}
          strip={['QuickBooks, Sage, Xero or spreadsheets', 'Surety-format WIP', 'Canada & US']}
        />

        {/* Hero detail: sources + illustrative WIP */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-[1180px] gap-0 px-md lg:grid-cols-[180px_minmax(0,1fr)_340px]">
            <aside className="border-b border-border py-xl lg:border-b-0 lg:border-r lg:pr-lg">
              <p className="eyebrow mb-md">Works with</p>
              <ul className="m-0 list-none space-y-3 p-0">
                {sources.map((item) => (
                  <li key={item} className="text-sm font-medium text-text">
                    {item}
                  </li>
                ))}
              </ul>
              {/* .svc-landing scopes the site's button styles */}
              <div className="svc-landing mt-lg flex flex-wrap gap-3">
                <a href={SIGN_UP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-solid">
                  Start free trial
                </a>
              </div>
            </aside>

            <div className="border-b border-border py-xl lg:border-b-0 lg:border-r lg:px-xl">
              <p className="mb-md text-base leading-relaxed text-text-body lg:text-lg">
                A general ledger records what was invoiced and what was paid out. Running projects
                takes more than that: what each job should cost, what it will cost, how much revenue
                it has earned, and whether billing is ahead or behind.
              </p>
              <p className="mb-0 text-base leading-relaxed text-text-body">
                ProjectCost doesn&rsquo;t replace your accounting system. It finishes the job.
              </p>
            </div>

            <aside className="py-xl lg:pl-lg">
              <div className="rounded border border-border bg-white p-md shadow-sm">
                <div className="mb-sm flex items-start justify-between gap-3">
                  <div>
                    <h2 className="m-0 text-base font-semibold text-primary">WIP schedule</h2>
                    <p className="mt-1 mb-0 text-xs text-text-light">Period ending Sep 30 · CAD</p>
                  </div>
                  <span className="shrink-0 rounded bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-light">
                    Illustrative
                  </span>
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-text-light">
                      <th className="py-2 font-semibold">Project</th>
                      <th className="py-2 text-right font-semibold">% done</th>
                      <th className="py-2 text-right font-semibold">Over/(under)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wipRows.map((row) => (
                      <tr key={row.project} className={`border-b border-border/70 ${row.emphasize ? 'font-semibold' : ''}`}>
                        <td className="py-2.5 pr-3 text-text">{row.project}</td>
                        <td className="py-2.5 text-right tabular-nums text-text">{row.pct}</td>
                        <td className="py-2.5 pl-3 text-right tabular-nums text-text">{row.overUnder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-md mb-0 text-[11px] leading-relaxed text-text-light">
                  Figures are illustrative and do not represent any client.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* 01 The gaps */}
        <section id="gaps" className="border-b border-border bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-2">01</p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                The gaps it closes
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-semibold text-primary lg:text-4xl">
                Your books know what you spent. They don&rsquo;t know where the project stands.
              </h2>
              <p className="mb-lg max-w-3xl text-base leading-relaxed text-text-body">
                Most general ledgers stop at transactions tagged to a customer. Everything a
                project-based business needs after that ends up in month-end spreadsheets.
              </p>
              <div className="overflow-x-auto rounded border border-border">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead className="bg-white">
                    <tr className="text-left text-[11px] uppercase tracking-wider text-text-light">
                      <th className="px-4 py-3 font-semibold">Where ledgers fall short</th>
                      <th className="px-4 py-3 font-semibold">What ProjectCost does</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {gaps.map((row) => (
                      <tr key={row.gap} className="border-t border-border align-top">
                        <td className="w-[34%] px-4 py-3 font-medium text-text">{row.gap}</td>
                        <td className="px-4 py-3 text-text-body">{row.answer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 02 Three kinds of project */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-2">02</p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Three kinds of project
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-semibold text-primary lg:text-4xl">
                Not every project has a customer.
              </h2>
              <p className="mb-xl max-w-3xl text-base leading-relaxed text-text-body">
                The warehouse addition you build for yourself and the units you build to sell carry
                real costs too. Each kind gets the accounting it needs.
              </p>
              <div className="grid gap-md md:grid-cols-3">
                {projectKinds.map((kind) => (
                  <article key={kind.title} className="rounded border border-border bg-white p-md">
                    <h3 className="mb-sm text-xl font-semibold text-primary">{kind.title}</h3>
                    <p className="mb-md text-sm leading-relaxed text-text-body">{kind.body}</p>
                    <p className="m-0 text-xs leading-relaxed text-text-light">{kind.tags.join(' · ')}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 03 Month-end */}
        <section className="border-b border-border bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-2">03</p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Month-end
              </p>
            </div>
            <div className="grid gap-xl lg:grid-cols-[minmax(0,1fr)_340px]">
              <div>
                <h2 className="mb-md text-3xl font-semibold text-primary lg:text-4xl">
                  The WIP schedule and the entries, ready to book.
                </h2>
                <p className="mb-md max-w-3xl text-base leading-relaxed text-text-body">
                  Every month ProjectCost works out earned revenue, over and under billings and loss
                  provisions, drafts the adjusting entry, and saves the schedule as a snapshot your
                  surety, bank and auditor can rely on.
                </p>
                <p className="mb-0 max-w-3xl text-base leading-relaxed text-text-body">
                  Download the WIP schedule, the journal entries, job cost by cost code and cost and
                  time detail as Excel. Every number traces back to the QuickBooks transaction or
                  spreadsheet row it came from.
                </p>
              </div>
              <div className="rounded border border-border bg-white p-md shadow-sm">
                <div className="mb-sm flex items-start justify-between gap-3">
                  <div>
                    <h3 className="m-0 text-base font-semibold text-primary">WIP adjusting entry</h3>
                    <p className="mt-1 mb-0 text-xs text-text-light">Auto-reverses on the 1st · CAD</p>
                  </div>
                  <span className="shrink-0 rounded bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-light">
                    Illustrative
                  </span>
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-text-light">
                      <th className="py-2 font-semibold">Account</th>
                      <th className="py-2 text-right font-semibold">Dr</th>
                      <th className="py-2 text-right font-semibold">Cr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closeRows.map((row) => (
                      <tr key={row.account} className="border-b border-border/70 align-top">
                        <td className={`py-2.5 pr-3 text-text ${row.credit ? 'pl-3' : ''}`}>{row.account}</td>
                        <td className="py-2.5 text-right tabular-nums text-text">{row.debit}</td>
                        <td className="py-2.5 pl-3 text-right tabular-nums text-text">{row.credit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 04 How it works */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-2">04</p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                How it works
              </p>
            </div>
            <div>
              <h2 className="mb-xl text-3xl font-semibold text-primary lg:text-4xl">
                From your books to a closed month, with a guide at every step.
              </h2>
              <div className="grid gap-md md:grid-cols-2">
                {steps.map((step, index) => (
                  <article key={step.title} className="border-t border-border pt-md">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-light">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <h3 className="mb-sm text-xl font-semibold text-primary">{step.title}</h3>
                    <p className="m-0 text-sm leading-relaxed text-text-body">{step.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 05 What it doesn't do */}
        <section className="border-b border-border bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-2">05</p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                What it doesn&rsquo;t do
              </p>
            </div>
            <div>
              <h2 className="mb-xl text-3xl font-semibold text-primary lg:text-4xl">
                A clear scope, on purpose.
              </h2>
              <div className="grid gap-lg md:grid-cols-2">
                {notDo.map((point) => (
                  <article key={point.title}>
                    <h3 className="mb-sm text-xl font-semibold text-primary">{point.title}</h3>
                    <p className="m-0 text-sm leading-relaxed text-text-body">{point.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 06 Questions */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-2">06</p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Questions
              </p>
            </div>
            <div>
              <h2 className="mb-xl text-3xl font-semibold text-primary lg:text-4xl">
                What people ask first.
              </h2>
              <div className="grid gap-md md:grid-cols-2">
                {faq.map((item) => (
                  <article key={item.question} className="rounded border border-border bg-white p-md">
                    <h3 className="mb-sm text-lg font-semibold text-primary">{item.question}</h3>
                    <p className="m-0 text-sm leading-relaxed text-text-body">{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 07 Who is building it */}
        <section className="border-b border-border bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-2">07</p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Who is building it
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-semibold text-primary lg:text-4xl">
                Built by accountants who close the books.
              </h2>
              <p className="mb-xl max-w-3xl text-base leading-relaxed text-text-body">
                The same practice behind ARO Suite and Portfolio Analyst. The WIP schedule follows
                the standards your auditor works to, and nothing is posted to your books without you.
              </p>
              <div className="grid gap-md md:grid-cols-2">
                <article className="rounded border border-border bg-background p-md">
                  <h3 className="mb-1 text-xl font-semibold text-primary">Roger Reid</h3>
                  <p className="mb-md text-[11px] font-semibold uppercase tracking-[0.14em] text-text-light">
                    CPA · CMA · CGAP
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-text-body">
                    Public sector accounting, government audit and financial systems, applied to the
                    month-end every project-based business rebuilds in spreadsheets.
                  </p>
                </article>
                <article className="rounded border border-border bg-background p-md">
                  <h3 className="mb-1 text-xl font-semibold text-primary">
                    Axiom Financial &amp; Technology
                  </h3>
                  <p className="mb-md text-[11px] font-semibold uppercase tracking-[0.14em] text-text-light">
                    Accounting · Advisory · Automation · Intelligence
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-text-body">
                    Corporate financial infrastructure, internal controls and software built for the
                    way accountants actually work.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* 08 Get started */}
        <section className="bg-primary text-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#e0a877]">
                08
              </p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
                Get started
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-semibold text-white lg:text-4xl">
                Close your next month with a real WIP schedule.
              </h2>
              <p className="mb-xl max-w-3xl text-base leading-relaxed text-white/80">
                Fourteen days free, no card required. Connect QuickBooks or upload your exports, and
                a guided walkthrough takes you from setup to your first month-end. Monthly or annual
                plans after that.
              </p>
              <div className="svc-landing flex flex-wrap gap-3">
                <a href={SIGN_UP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Start your free trial
                </a>
                <Link to="/book-consultation" className="btn btn-ghost">
                  Book a demo
                </Link>
              </div>
              <p className="mt-lg mb-0 max-w-3xl text-xs leading-relaxed text-white/60">
                ProjectCost prepares schedules and draft entries from the data you provide. Estimates,
                contract values and the entries you book remain management&rsquo;s responsibility.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default ProjectCostPage
