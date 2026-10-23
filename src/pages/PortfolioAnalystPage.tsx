import { FC } from 'react'
import SEO from '../components/SEO'
import MarketingPageHero from '../components/MarketingPageHero'

const PORTFOLIO_ANALYST_APP_URL = 'https://portfolioanalyst.axiomft.ca'

const sources = [
  'Wealthsimple',
  'Questrade',
  'Interactive Brokers',
  'CSV & Excel',
  'Managed account balances',
] as const

const views = [
  {
    title: 'Allocation',
    body:
      'Where the money actually sits — by holding, account, sector, country and currency — with every account and broker rolled into one picture.',
    tags: ['By holding', 'By account', 'By sector', 'By country', 'By currency'],
  },
  {
    title: 'Gain and loss',
    body:
      'Market value against what you paid, position by position and in total, with today’s move alongside so a red day is put in proportion.',
    tags: ['Book cost', 'Unrealized P/L', 'Day change'],
  },
  {
    title: 'Accounts',
    body:
      'Each TFSA, RRSP, FHSA and non-registered account on its own line: value, weight, return and the dividend income it throws off.',
    tags: ['Registered', 'Non-registered', 'Managed'],
  },
  {
    title: 'Performance and risk',
    body:
      'Your portfolio against a benchmark you choose — XIC, XEQT, SPY or QQQ — with volatility, beta, maximum drawdown and the correlations between your holdings.',
    tags: ['Benchmarks', 'Volatility', 'Beta', 'Drawdown', 'Correlation'],
  },
  {
    title: 'Dividends',
    body:
      'Trailing twelve-month dividends per share, yield, and the annual income each position and account is on pace to pay.',
    tags: ['Yield', 'Annual income', 'By account'],
  },
  {
    title: 'Positions',
    body:
      'The full ledger, with Excel-style sorting and filtering on every column, so you can answer your own question instead of waiting for a report.',
    tags: ['Sort', 'Filter', 'Totals'],
  },
] as const

const placementRows = [
  {
    holding: 'US dividend payers',
    account: 'TFSA, FHSA, RESP, RDSP',
    effect: 'The 15% US withholding tax is lost; the account cannot recover it',
  },
  {
    holding: 'US-listed shares',
    account: 'RRSP, RRIF, LIRA',
    effect: 'Generally exempt from US withholding under the Canada–US tax treaty',
  },
  {
    holding: 'Eligible Canadian dividends',
    account: 'Non-registered',
    effect: 'The only account where the dividend tax credit applies',
  },
] as const

const analystPoints = [
  {
    title: 'It reads your portfolio, not a generic one',
    body:
      'The analysis starts from your holdings, your accounts and your risk figures, and can look up fundamentals, analyst ratings and recent news on the positions that matter.',
  },
  {
    title: 'Ask the follow-up',
    body:
      'Push back, ask why, or ask what changes if you add new cash. Save the analysis and download it when you want to keep a record.',
  },
  {
    title: 'Your choice of model',
    body:
      'Pick from several leading AI models. The answer is clearly labelled as AI-generated wherever it appears.',
  },
  {
    title: 'Information, not advice',
    body:
      'The analyst explains and questions. It does not tell you what to buy, and it is not a substitute for a licensed advisor who knows your full situation.',
  },
] as const

const intakePoints = [
  {
    title: 'Import what your broker exports',
    body:
      'Drop in the CSV or Excel file from Wealthsimple, Questrade or Interactive Brokers and the columns are recognized for you. Anything else can be pasted straight into the holdings grid.',
  },
  {
    title: 'Or connect read-only',
    body:
      'Link a brokerage through SnapTrade and load holdings without retyping them. The connection reads positions; it cannot place trades or move money.',
  },
  {
    title: 'Managed accounts count too',
    body:
      'A robo-advisor or managed account whose holdings you cannot see still belongs in your net worth. Enter its balance and it is included in your totals and allocation.',
  },
  {
    title: 'One portfolio or all of them',
    body:
      'Keep separate portfolios — yours, a spouse’s, a corporation’s — and switch between them, or view all of them combined.',
  },
] as const

const rebalanceRows: Array<{ group: string; now: string; target: string; trade: string }> = [
  { group: 'Canadian equity', now: '41%', target: '35%', trade: '—' },
  { group: 'US equity', now: '33%', target: '40%', trade: 'Buy 9,400' },
  { group: 'International', now: '14%', target: '15%', trade: 'Buy 1,350' },
  { group: 'Fixed income', now: '12%', target: '10%', trade: '—' },
]

const allocationRows: Array<{ account: string; value: string; weight: string; emphasize?: boolean }> = [
  { account: 'TFSA', value: '96,400', weight: '28.7%' },
  { account: 'RRSP', value: '142,150', weight: '42.3%' },
  { account: 'Non-registered', value: '58,900', weight: '17.5%' },
  { account: 'Managed (balance only)', value: '38,550', weight: '11.5%' },
  { account: 'Total', value: '336,000', weight: '100.0%', emphasize: true },
]

const keywords = [
  'Portfolio Analyst',
  'portfolio tracker Canada',
  'TFSA RRSP portfolio',
  'Wealthsimple portfolio analysis',
  'Questrade portfolio tracker',
  'asset allocation',
  'portfolio rebalancing calculator',
  'AI portfolio analysis',
]

const PortfolioAnalystPage: FC = () => {
  return (
    <>
      <SEO
        title="Portfolio Analyst | Portfolio Dashboard for Canadians"
        description="See every account in one place — allocation, gain and loss, risk against a benchmark, dividends and TFSA/RRSP placement — with a rebalancer and an AI analyst. Read-only; it never trades."
        canonical="/products/portfolio-analyst"
        keywords={keywords}
        ogType="website"
        schemaSoftware={{
          name: 'Portfolio Analyst',
          description:
            'Investment portfolio dashboard for Canadian investors: allocation, performance and risk, dividends, account placement hints, a rebalancing calculator and an AI analyst across TFSA, RRSP and non-registered accounts.',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web',
          offersUrl: PORTFOLIO_ANALYST_APP_URL,
          offersPrice: '0',
          offersCurrency: 'CAD',
        }}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Products', path: '/products/portfolio-analyst' },
          { name: 'Portfolio Analyst', path: '/products/portfolio-analyst' },
        ]}
      />
      <main className="bg-white text-text-body">
        <MarketingPageHero
          eyebrow="Investment portfolios"
          title="Every account. One clear picture."
          lede="Bring in your TFSA, RRSP and non-registered holdings from any broker, and see allocation, gain and loss, risk, dividends and account placement in one place — in Canadian or US dollars."
          primary={(
            <a
              href={PORTFOLIO_ANALYST_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Open Portfolio Analyst
            </a>
          )}
          secondary={(
            <a href="#dashboard" className="btn btn-ghost">
              See what it shows
            </a>
          )}
          strip={['Read-only · never trades', 'CAD & USD', 'Built for Canadian accounts']}
        />

        {/* Hero detail: sources + illustrative allocation */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-[1180px] gap-0 px-md lg:grid-cols-[180px_minmax(0,1fr)_340px]">
            <aside className="border-b border-border py-xl lg:border-b-0 lg:border-r lg:pr-lg">
              <p className="eyebrow mb-md">Brings in</p>
              <ul className="m-0 list-none space-y-3 p-0">
                {sources.map((item) => (
                  <li key={item} className="text-sm font-medium text-text">
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-lg flex flex-wrap gap-3">
                <a
                  href={PORTFOLIO_ANALYST_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-solid"
                >
                  Open Portfolio Analyst
                </a>
              </div>
            </aside>

            <div className="border-b border-border py-xl lg:border-b-0 lg:border-r lg:px-xl">
              <p className="mb-md text-base leading-relaxed text-text-body lg:text-lg">
                Most investors have money at two or three brokers, across four or five account types,
                and no single screen that adds it up. Brokerage apps show one account at a time;
                spreadsheets go stale the day after you build them.
              </p>
              <p className="mb-0 text-base leading-relaxed text-text-body">
                Sign in with the same Axiom account you use for our other products.
              </p>
            </div>

            <aside className="py-xl lg:pl-lg">
              <div className="rounded border border-border bg-white p-md shadow-sm">
                <div className="mb-sm flex items-start justify-between gap-3">
                  <div>
                    <h2 className="m-0 text-base font-semibold text-primary">
                      Allocation by account
                    </h2>
                    <p className="mt-1 mb-0 text-xs text-text-light">
                      All portfolios · CAD
                    </p>
                  </div>
                  <span className="shrink-0 rounded bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-light">
                    Illustrative
                  </span>
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-text-light">
                      <th className="py-2 font-semibold">Account</th>
                      <th className="py-2 text-right font-semibold">$</th>
                      <th className="py-2 text-right font-semibold">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocationRows.map((row) => (
                      <tr
                        key={row.account}
                        className={`border-b border-border/70 ${row.emphasize ? 'font-semibold' : ''}`}
                      >
                        <td className="py-2.5 pr-3 text-text">{row.account}</td>
                        <td className="py-2.5 text-right tabular-nums text-text">{row.value}</td>
                        <td className="py-2.5 pl-3 text-right tabular-nums text-text">{row.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-md mb-0 text-[11px] leading-relaxed text-text-light">
                  Figures are illustrative and do not represent any client or investor.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* 01 The dashboard */}
        <section id="dashboard" className="border-b border-border bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-2">01</p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                The dashboard
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-semibold text-primary lg:text-4xl">
                Six views of the same money, priced live.
              </h2>
              <p className="mb-xl max-w-3xl text-base leading-relaxed text-text-body">
                Prices and exchange rates are refreshed when you open it, and every figure can be
                reported in Canadian or US dollars. Look at one portfolio, or all of them at once.
              </p>
              <div className="grid gap-md md:grid-cols-2">
                {views.map((view) => (
                  <article key={view.title} className="rounded border border-border bg-white p-md">
                    <h3 className="mb-sm text-xl font-semibold text-primary">{view.title}</h3>
                    <p className="mb-md text-sm leading-relaxed text-text-body">{view.body}</p>
                    <p className="m-0 text-xs leading-relaxed text-text-light">{view.tags.join(' · ')}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 02 Account placement */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-2">02</p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Account placement
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-semibold text-primary lg:text-4xl">
                The same holding can cost more in the wrong account.
              </h2>
              <p className="mb-lg max-w-3xl text-base leading-relaxed text-text-body">
                Portfolio Analyst knows which of your accounts are registered, and points out
                holdings that a well-established Canadian tax rule says may be better placed
                elsewhere — with the dollar amount at stake.
              </p>
              <p className="mb-md text-[11px] font-semibold uppercase tracking-[0.14em] text-text-light">
                The rules it checks · Summary — general rules, not tax advice
              </p>
              <div className="overflow-x-auto rounded border border-border">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead className="bg-white">
                    <tr className="text-left text-[11px] uppercase tracking-wider text-text-light">
                      <th className="px-4 py-3 font-semibold">Holding</th>
                      <th className="px-4 py-3 font-semibold">Account</th>
                      <th className="px-4 py-3 font-semibold">Effect</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {placementRows.map((row) => (
                      <tr key={row.holding} className="border-t border-border align-top">
                        <td className="px-4 py-3 font-medium text-text">{row.holding}</td>
                        <td className="px-4 py-3 text-text-body">{row.account}</td>
                        <td className="px-4 py-3 text-text-body">{row.effect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-lg mb-0 max-w-3xl text-base leading-relaxed text-text-body">
                The hints are deliberately narrow. Contribution room, your marginal rate and your
                plans for the money all matter, so check your own situation before moving anything.
              </p>
            </div>
          </div>
        </section>

        {/* 03 AI analyst */}
        <section className="border-b border-border bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-2">03</p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                The AI analyst
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-semibold text-primary lg:text-4xl">
                A second opinion that has read every line of your portfolio.
              </h2>
              <p className="mb-xl max-w-3xl text-base leading-relaxed text-text-body">
                Ask for a review of concentration, risk, income and what has been driving returns,
                and get a written analysis built from the same figures the dashboard shows.
              </p>
              <div className="grid gap-md md:grid-cols-2">
                {analystPoints.map((point, index) => (
                  <article key={point.title} className="border-t border-border pt-md">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-light">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <h3 className="mb-sm text-xl font-semibold text-primary">{point.title}</h3>
                    <p className="m-0 text-sm leading-relaxed text-text-body">{point.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 04 Getting holdings in */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-2">04</p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Getting holdings in
              </p>
            </div>
            <div>
              <h2 className="mb-xl text-3xl font-semibold text-primary lg:text-4xl">
                Minutes to set up, and nothing to retype.
              </h2>
              <div className="grid gap-lg md:grid-cols-2">
                {intakePoints.map((point) => (
                  <article key={point.title}>
                    <h3 className="mb-sm text-xl font-semibold text-primary">{point.title}</h3>
                    <p className="m-0 text-sm leading-relaxed text-text-body">{point.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 05 Rebalancer */}
        <section className="border-b border-border bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-2">05</p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                The rebalancer
              </p>
            </div>
            <div className="grid gap-xl lg:grid-cols-[minmax(0,1fr)_340px]">
              <div>
                <h2 className="mb-md text-3xl font-semibold text-primary lg:text-4xl">
                  Set your targets. Get the trades.
                </h2>
                <p className="mb-md max-w-3xl text-base leading-relaxed text-text-body">
                  Set target weights by holding, sector or currency, then see the buys and sells that
                  close the gap — account by account, in shares and dollars.
                </p>
                <p className="mb-0 max-w-3xl text-base leading-relaxed text-text-body">
                  Adding new cash? Rebalance with buys only, so nothing is sold and no gain is
                  triggered. Fractional shares are supported where your broker allows them. You place
                  the trades yourself — Portfolio Analyst never does.
                </p>
              </div>
              <div className="rounded border border-border bg-white p-md shadow-sm">
                <div className="mb-sm flex items-start justify-between gap-3">
                  <div>
                    <h3 className="m-0 text-base font-semibold text-primary">Buy-only, with $10,750 new cash</h3>
                    <p className="mt-1 mb-0 text-xs text-text-light">Your targets · CAD</p>
                  </div>
                  <span className="shrink-0 rounded bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-light">
                    Illustrative
                  </span>
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-text-light">
                      <th className="py-2 font-semibold">Group</th>
                      <th className="py-2 text-right font-semibold">Now</th>
                      <th className="py-2 text-right font-semibold">Target</th>
                      <th className="py-2 text-right font-semibold">Trade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rebalanceRows.map((row) => (
                      <tr key={row.group} className="border-b border-border/70">
                        <td className="py-2.5 pr-3 text-text">{row.group}</td>
                        <td className="py-2.5 text-right tabular-nums text-text">{row.now}</td>
                        <td className="py-2.5 text-right tabular-nums text-text">{row.target}</td>
                        <td className="py-2.5 pl-3 text-right tabular-nums text-text">{row.trade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 06 Who is building it */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="eyebrow mb-2">06</p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Who is building it
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-semibold text-primary lg:text-4xl">
                Built by accountants who read the fine print.
              </h2>
              <p className="mb-xl max-w-3xl text-base leading-relaxed text-text-body">
                The same practice behind ARO Suite and our client systems. The brokerage connection
                is read-only, and the app never places a trade.
              </p>
              <div className="grid gap-md md:grid-cols-2">
                <article className="rounded border border-border bg-white p-md">
                  <h3 className="mb-1 text-xl font-semibold text-primary">Roger Reid</h3>
                  <p className="mb-md text-[11px] font-semibold uppercase tracking-[0.14em] text-text-light">
                    CPA · CMA · CGAP
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-text-body">
                    Public sector accounting, government audit and financial systems, applied to the
                    question every investor eventually asks: what do I actually own?
                  </p>
                </article>
                <article className="rounded border border-border bg-white p-md">
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

        {/* 07 Get started */}
        <section className="bg-primary text-white">
          <div className="mx-auto grid max-w-[1180px] gap-xl px-md py-xxl lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#e0a877]">
                07
              </p>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
                Get started
              </p>
            </div>
            <div>
              <h2 className="mb-md text-3xl font-semibold text-white lg:text-4xl">
                See your whole portfolio in the next ten minutes.
              </h2>
              <p className="mb-xl max-w-3xl text-base leading-relaxed text-white/80">
                Sign in with your Axiom account, create a portfolio, and import a file or connect a
                broker. A guided walkthrough takes you through each step.
              </p>
              <a
                href={PORTFOLIO_ANALYST_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-solid"
              >
                Open Portfolio Analyst
              </a>
              <p className="mt-lg mb-0 max-w-3xl text-xs leading-relaxed text-white/60">
                Portfolio Analyst provides information and analysis tools only. It is not investment,
                tax or financial advice, and it does not place trades. Consider speaking with a
                licensed advisor before making investment decisions.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default PortfolioAnalystPage
