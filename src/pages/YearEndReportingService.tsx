import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'

const keywords = [
  'year-end reporting',
  'year-end financials',
  'compilation engagement',
  'CSRS 4200',
  'working papers',
  'fixed fee year-end',
  'Ottawa accountant',
  'Canadian year-end',
  'compiled financial statements',
  'CPA year-end',
]

const problemPairs = [
  {
    problemTitle: 'You find out the price after the work is done',
    problemBody:
      'Year-end engagement letters typically say fees are based on time spent. The work starts in February and the invoice arrives in June. Two firms quoting the same engagement cannot be compared, because neither has quoted — and the only number you\'ll ever see is the one that has already been incurred.',
    answerTitle: 'The fee is on this page, and fixed before we start',
    answerBody:
      'Three tiers, each with a published price and a defined deliverable list. You agree the number in writing before we open the file, and it does not move because the bookkeeping turned out to be worse than either of us expected. That risk is ours to carry.',
  },
  {
    problemTitle: 'You wait, and nobody will commit to a date',
    problemBody:
      'Records go in early in the year; statements come back months later — after the filing was handled with an estimate, after the lender asked twice, after the numbers stopped being useful for any decision. The cause is capacity: every client of every firm has a year-end, and quiet ones get queued behind loud ones.',
    answerTitle: 'A delivery date in the engagement letter',
    answerBody: [
      'Twenty business days for a Compilation engagement, twenty-five for Reporting, thirty-five for Assurance-Ready — counted from the day we confirm in writing that your records are complete. If we miss it for a reason within our control, your fee is reduced by 10% for every full five business days, to a maximum of 25%.',
      'What counts as complete records is listed in the engagement letter, and we confirm it within three business days of receiving your file. So the clock starts on a date you can point to, and you never spend a month waiting to discover something was missing.',
    ],
  },
  {
    problemTitle: 'The statements are a by-product of the tax return',
    problemBody:
      'Most year-end files are assembled to support a filing, not to tell the owner anything. You receive a balance sheet, an income statement, and no explanation of why gross margin moved four points or why working capital tightened. The one time each year someone qualified reviews your whole business is spent producing a return.',
    answerTitle: 'The numbers come with the reading of them',
    answerBody:
      'Every engagement includes comparatives, movement analysis and written commentary on what changed and why — written so it stands on its own, without needing us in the room to interpret it. If the year-end doesn\'t tell you something you didn\'t already know, it was an expensive filing exercise.',
  },
  {
    problemTitle: 'The same adjustments, every single year',
    problemBody:
      'If the same dozen correcting entries are booked at every year-end, something upstream is broken — and no one\'s incentive is to fix it. The adjustments are billable; the fix is not. So the bookkeeping stays wrong, the year-end stays expensive, and your interim numbers are never worth acting on.',
    answerTitle: 'We report the causes, not just the entries',
    answerBody:
      'Adjustments come back as a list of root causes with what it would take to stop each one recurring. Reducing next year\'s adjustment count is an explicit objective. Where the fix is a systems or process change, that\'s one of our core service lines — not an upsell attached to your year-end.',
  },
  {
    problemTitle: 'The working papers stay with the firm',
    problemBody:
      'Ask your current accountant for the year-end working paper file and you will usually receive the statements and a polite explanation. The schedules behind the numbers — the ones an auditor, a lender, a buyer or your next firm will ask for — are treated as the firm\'s property. Switching then costs you a rebuilt year of history.',
    answerTitle: 'The file is yours, delivered with the statements',
    answerBody:
      'Working papers, supporting schedules, the adjusting entries with their explanations and the year-end checklist — handed over in a form you can give to anyone, including a firm that isn\'t us. We would rather keep clients because leaving is easy and they choose not to.',
  },
  {
    problemTitle: 'Nobody checked which level of service you actually need',
    problemBody:
      'Compilation, review and audit are three different engagements at three different price points, and which one you need is usually dictated by a lender\'s agreement, a funder\'s contract, your articles or your bylaws — not by preference. Businesses routinely buy assurance they don\'t need, or hand a lender a compilation that doesn\'t satisfy the covenant and have to pay twice.',
    answerTitle: 'We read the requirement before we quote',
    answerBody:
      'Send us the lender agreement, funding agreement or bylaw clause and we\'ll tell you what it actually requires. If that\'s assurance, we don\'t sell it to you — independence rules prevent us from auditing financial information we prepared. We build the file to that standard and work with your auditor instead.',
  },
] as const

const everyYearEndIncludes = [
  'Year-end adjusting entries — accruals, deferrals, amortization, cut-off — each with a written explanation',
  'Reconciliation of all balance sheet accounts to supporting documentation',
  'A complete working paper file, indexed and cross-referenced to the statements',
  'Compiled financial statements with comparatives, issued with a compilation engagement report under CSRS 4200 and a note setting out the basis of accounting applied',
  'Trial balance and journal entries delivered back to your bookkeeping system',
  'The year-end file packaged for your tax preparer',
  'A list of the adjustments made, with the upstream cause of each',
] as const

const guarantees = [
  {
    title: 'The fee is fixed',
    body: 'The price we agree is the price you pay, whatever we find in the records. Discovering that the bookkeeping is in worse shape than expected is our risk to carry, not a reason to reprice you mid-engagement.',
  },
  {
    title: 'The date is committed',
    body: '20, 25 or 35 business days by tier, from our written confirmation that your records are complete. Deliver late for a reason within our control and your fee drops 10% for each full five business days, capped at 25% — applied to the invoice automatically, without you having to ask for it.',
  },
  {
    title: 'The working papers are yours',
    body: 'The full file — schedules, reconciliations, adjusting entries and the year-end checklist — is delivered to you with the statements, in a portable format, with no charge and no conversation required if you later hand it to another firm.',
  },
] as const

const tiers = [
  {
    name: 'Compilation',
    price: '$2,400',
    unit: 'per year-end, fixed',
    turn: 'Delivered in 20 business days',
    who: 'Owner-managed corporation, single entity, no external reporting obligation. Typically under roughly $1M in revenue.',
    featured: false,
    items: [
      { text: 'Everything in the year-end file', carry: false },
      { text: 'Compiled financial statements with prior-year comparatives, under CSRS 4200', carry: false },
      { text: 'Working paper file delivered to you', carry: false },
      { text: 'Year-end package for your tax preparer', carry: false },
      { text: 'Adjustment list with causes', carry: false },
    ],
  },
  {
    name: 'Reporting',
    price: '$4,900',
    unit: 'per year-end, fixed',
    turn: 'Delivered in 25 business days',
    who: 'Roughly $1M–$10M. Real working capital cycles, inventory or WIP, a lender or a board that expects to be told something.',
    featured: true,
    items: [
      { text: 'Everything in Compilation', carry: true },
      { text: 'Management reporting pack: margin, working capital, ratio and trend analysis', carry: false },
      { text: 'Written commentary on what moved and why', carry: false },
      { text: 'Lender or covenant schedules prepared to the agreement\'s definitions', carry: false },
    ],
  },
  {
    name: 'Assurance-Ready',
    price: '$8,900',
    unit: 'per year-end, fixed',
    turn: 'Delivered in 35 business days',
    who: 'Not-for-profits and charities with a funder- or bylaw-mandated audit, multi-entity groups, and companies heading into an audit, a review, or a transaction.',
    featured: false,
    items: [
      { text: 'Everything in Reporting', carry: true },
      { text: 'File prepared to audit standard, indexed to a standard audit request list', carry: false },
      { text: 'Direct liaison with your auditor, including query response', carry: false },
      { text: 'Fund, program or restricted-contribution schedules for not-for-profits', carry: false },
      { text: 'Multi-entity consolidation', carry: false },
      { text: 'Board- or funder-ready presentation of results', carry: false },
    ],
  },
] as const

const notIncluded = [
  {
    strong: 'Audit, review, or any assurance engagement.',
    rest: ' Professional independence rules prevent us from providing assurance on financial information we prepared. We build the file to that standard and work with your auditor.',
  },
  {
    strong: 'Corporate and personal tax return preparation and filing.',
    rest: ' We prepare the year-end file your tax preparer works from, and we\'ll coordinate directly with them.',
  },
  {
    strong: 'Day-to-day bookkeeping and transaction entry.',
    rest: ' We work alongside your existing bookkeeper rather than replacing them.',
  },
  {
    strong: 'Rebuilding periods that were never recorded.',
    rest: ' Quoted as separate catch-up work, approved before it starts.',
  },
  { strong: null, rest: 'Formal business valuations and fairness opinions' },
  { strong: null, rest: 'Legal advice, and investment or securities advice' },
  { strong: null, rest: 'Representation in CRA disputes or appeals' },
  { strong: null, rest: 'Payroll processing and remittance administration' },
] as const

const poorFit = [
  'Anyone who wants one firm to both prepare the statements and audit them. That isn\'t a service we can provide, and a firm that offers it should be asked how.',
  'Businesses shopping purely on the lowest available number. There are cheaper year-ends. They generally do not come with a date, a working paper file, or anyone reading the results to you.',
  'Owners who need the filing produced and have no intention of changing anything based on what it shows. A tier-one compilation will do that job for less than we charge.',
  'Entities whose records for the year do not meaningfully exist yet. That\'s a bookkeeping catch-up project first — we\'ll say so, and we can scope it.',
  'Anyone who needs statements in under 20 business days because a deadline has already been missed. We can occasionally accommodate it, but not under the guarantee — and we\'ll say so rather than accept the engagement and hope.',
] as const

const faqs = [
  {
    q: 'Why do you publish prices when almost nobody else does?',
    a: [
      'Because a year-end is a defined piece of work with a defined output, and pricing it by the hour transfers the entire risk of an unknown file onto the client who can least assess it. We\'ve done enough of them to know what they take. Publishing the number also means you can compare us to anyone before you ever speak to us — which is the point.',
    ],
  },
  {
    q: 'What\'s the difference between a compilation, a review and an audit — and which do I need?',
    a: [
      'A compilation assembles financial information into statement form from information you provide, under CSRS 4200; no assurance is expressed on it. A review provides limited assurance, based largely on enquiry and analysis. An audit provides reasonable assurance and involves testing evidence independently. They cost roughly in that order.',
      'Which one you need is almost never a preference — it\'s written into your lender\'s agreement, your funding agreement, your bylaws, or incorporating legislation. Send us the clause and we\'ll read it before quoting. A large number of businesses are paying for assurance nothing requires them to have.',
    ],
  },
  {
    q: 'Do the statements come with a compilation engagement report?',
    a: [
      'Yes. We issue a compilation engagement report under CSRS 4200 — the standard that replaced the old Notice to Reader — together with a note describing the basis of accounting the statements were prepared on. Lenders, funders and prospective buyers increasingly ask for both by name, and a set of statements arriving without them is worth less than it looks.',
      'The report expresses no assurance. That is precisely what separates it from a review or an audit report, and it is stated on the face of the report so nobody downstream is confused about what they\'re holding.',
    ],
  },
  {
    q: 'Our lender asks for reviewed or audited statements. Can you provide those?',
    a: [
      'Not on financial information we prepared — independence rules exist precisely to stop a firm providing assurance on its own work. What we do is prepare the file to that standard, index it against a standard audit request list, and deal with your auditor\'s queries directly so your team isn\'t the bottleneck. In practice that shortens the assurance engagement and usually reduces its cost.',
    ],
  },
  {
    q: 'We\'re a not-for-profit with a funder-mandated audit. What do you actually do for us?',
    a: [
      'The Assurance-Ready tier. We prepare the year-end file to audit standard, build the fund, program and restricted-contribution schedules your funders and your auditor will ask for, handle audit queries, and produce a version of the results your board can read without a finance background. The audit itself is performed by your auditor.',
    ],
  },
  {
    q: 'Do I have to leave my current accountant or bookkeeper?',
    a: [
      'No. Many clients keep their bookkeeper — we work alongside them and hand back the adjusting entries so the books agree to the statements. If your current firm also prepares your tax returns, we\'ll package the year-end file for them and coordinate directly. You\'re not required to move anything else to us, now or later.',
    ],
  },
  {
    q: 'What counts as "complete records"?',
    a: [
      'It\'s listed explicitly in the engagement letter, so the delivery date can\'t be reset on a technicality. Broadly: bookkeeping posted through year-end, bank and credit card statements for every account, loan and lease documents, the capital asset listing, inventory or WIP counts where applicable, payroll year-end filings, and access to your accounting system.',
      'We confirm in writing within three business days of receiving your file whether it is complete, and the delivery clock runs from that confirmation. After that, a query left open for more than three business days pauses the clock day for day — and nothing else does.',
    ],
  },
  {
    q: 'What happens if you miss the date?',
    a: [
      'Your fee is reduced by 10% for every full five business days, to a maximum of 25%, and it comes off the invoice without you having to ask for it or argue about it.',
      'It applies to delays within our control. It does not apply to time spent waiting on your answers, an inventory count, a bank or legal confirmation, an actuarial report, a prior firm releasing your file, or your auditor\'s calendar — those pause the clock instead, which is fairer to both of us than pretending we control them.',
      'The fee reduction is the entire remedy. We don\'t take on liability for what happens downstream of a late file: filing penalties and interest belong to the filer, and we are not your filer.',
    ],
  },
  {
    q: 'What if our books are a mess?',
    a: [
      'The fee doesn\'t change. Messy records are the normal case, not the exception, and pricing for the normal case is the whole reason we can publish a number. The one boundary is periods that were never recorded at all — that\'s catch-up bookkeeping, quoted separately and approved before it starts.',
    ],
  },
  {
    q: 'Can you do a prior year we never finished?',
    a: [
      'Yes, and it\'s common. Prior years are quoted separately, typically from $1,800 a year, and we\'d normally work forward from the earliest open year so the opening balances carry properly. Filing the associated returns remains with your tax preparer.',
    ],
  },
  {
    q: 'How early should we engage you?',
    a: [
      'Before your year-end closes, if you can. Cut-off, inventory counts, accrual support and capital asset documentation are far cheaper to get right in the moment than to reconstruct in March. Engaging afterwards is entirely workable — it just means more of the work is archaeology.',
    ],
  },
  {
    q: 'Are you actually in Ottawa?',
    a: [
      'Yes. Axiom Financial & Technology is an Ottawa firm. Year-end work is done remotely for clients across Canada, and nothing about the engagement requires you to be nearby. If you are local and would rather go through the results in person, we\'re happy to.',
    ],
  },
] as const

const YearEndReportingService: FC = () => {
  return (
    <>
      <SEO
        title="Year-End Reporting | Published Fee, Committed Date | Axiom"
        description="Year-end adjustments, working papers and compiled financial statements for Canadian businesses and not-for-profits. Published fixed fee, a delivery date in the engagement letter, and a working paper file you keep."
        canonical="/services/year-end-reporting"
        keywords={keywords}
        ogType="website"
        schemaService={{
          name: 'Year-End Financials & Reporting',
          description:
            'Published fixed-fee year-end reporting with a committed delivery date and working papers you keep. Compilation, Reporting, and Assurance-Ready tiers.',
          provider: 'Axiom',
          areaServed: ['CA', 'CA-ON', 'Ottawa'],
          serviceType: 'Year-End Reporting',
        }}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
          { name: 'Year-End Reporting', path: '/services/year-end-reporting' },
        ]}
      />

      <main className="svc-landing">
        <section className="hero" id="hero">
          <div className="wrap">
            <p className="eyebrow">Year-End Reporting</p>
            <h1>You don&apos;t know the price. You don&apos;t know the date. And the statements arrive too late to use.</h1>
            <p className="lede">
              Year-end is the one professional service most Canadian businesses buy without a price,
              without a delivery date, and without ever seeing the working papers that support the
              numbers. <strong>We publish all three.</strong>
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#pricing">
                See scope and pricing
              </a>
              <CalendlyButton text="Book a 30-minute call" className="btn btn-ghost" />
            </div>
            <p className="strip">
              <b>Published fixed fee</b>
              {' '}
              &nbsp;&middot;&nbsp;
              {' '}
              <b>Guaranteed delivery date</b>
              {' '}
              &nbsp;&middot;&nbsp;
              {' '}
              <b>Working papers are yours to keep</b>
            </p>
          </div>
        </section>

        <section id="problems">
          <div className="wrap">
            <p className="eyebrow">What usually goes wrong</p>
            <h2>The work isn&apos;t the problem. The way it&apos;s sold and delivered is.</h2>
            <p className="intro">
              Compiling a year-end is well-defined professional work with a well-understood output.
              What fails around it is commercial: the fee, the timeline, the usefulness of what you
              receive, and what you&apos;re allowed to keep. Six things go wrong repeatedly. Here is each
              one, and what we do instead.
            </p>
            <div className="pairs">
              {problemPairs.map((pair) => (
                <div className="pairrow" key={pair.problemTitle}>
                  <div className="side-problem">
                    <p className="label label-problem">The problem</p>
                    <h3>{pair.problemTitle}</h3>
                    <p>{pair.problemBody}</p>
                  </div>
                  <div className="side-do">
                    <p className="label label-do">What we do</p>
                    <h3>{pair.answerTitle}</h3>
                    {Array.isArray(pair.answerBody) ? (
                      pair.answerBody.map((para) => <p key={para.slice(0, 48)}>{para}</p>)
                    ) : (
                      <p>{pair.answerBody}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="alt" id="included">
          <div className="wrap">
            <p className="eyebrow">What every engagement includes</p>
            <h2>The year-end file</h2>
            <p className="intro">
              Every tier below is built on the same core. The tiers differ in the complexity they
              absorb and the reporting they produce — not in whether the underlying work is done
              properly.
            </p>
            <div className="offer">
              <div className="offer-main">
                <h3>In every year-end, at every tier</h3>
                <ul className="checklist">
                  {everyYearEndIncludes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="offer-side">
                <div className="k">Every engagement</div>
                <div className="price">Fixed fee</div>
                <p>
                  Agreed in writing before the work starts, with a delivery date attached. The file
                  and the working papers are yours, whatever happens next.
                </p>
                <CalendlyButton text="Book a 30-minute call" className="btn btn-primary btn-sm" />
              </div>
            </div>
          </div>
        </section>

        <section id="guarantee">
          <div className="wrap">
            <p className="eyebrow">Our commitment</p>
            <h2>Three things we guarantee in writing</h2>
            <ul className="guarantees">
              {guarantees.map((item) => (
                <li key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ul>
            <div className="panel">
              <h3>The one limit on the fixed fee, stated plainly</h3>
              <p>
                A fixed fee covers preparing a year-end from records that exist. If entire periods
                were never recorded, that is a catch-up bookkeeping project, and it is quoted and
                approved before it starts — as separate work, not as a repricing of your year-end.
                We will tell you this after the first look, not in month three.
              </p>
            </div>
            <div className="panel panel-accent">
              <h3>How the delivery clock works</h3>
              <p>
                A date guarantee is only honest if both sides can see the clock. Ours is defined in
                the engagement letter, in these terms:
              </p>
              <ul>
                <li>
                  <strong>It starts when we say your records are complete</strong>
                  {' '}
                  — in writing, within three business days of receiving your file, measured against a
                  checklist you have in advance. If something is missing, you get the list immediately
                  rather than at the end.
                </li>
                <li>
                  <strong>Open queries pause it, day for day.</strong>
                  {' '}
                  A question left unanswered beyond three business days suspends the clock and resumes
                  it when we have the answer. It doesn&apos;t extend the deadline by more than the delay
                  itself.
                </li>
                <li>
                  <strong>Things neither of us controls sit outside it.</strong>
                  {' '}
                  Inventory counts, bank and legal confirmations, actuarial reports, a prior firm
                  releasing your file, and your auditor&apos;s own calendar are excluded — named
                  individually, not as a general escape clause.
                </li>
                <li>
                  <strong>The fee credit is the whole remedy.</strong>
                  {' '}
                  We don&apos;t take on liability for what happens downstream of a late file. Filing
                  penalties and interest belong to the filer, and we are not your filer.
                </li>
                <li>
                  <strong>It applies to engagements booked before the cut-off.</strong>
                  {' '}
                  We cap how many year-ends we accept in each filing window. A firm that accepts
                  unlimited work in February cannot promise anyone a date in March.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="alt" id="pricing">
          <div className="wrap">
            <p className="eyebrow">What it costs</p>
            <h2>Three tiers, published</h2>
            <p className="intro">
              Tier is set by the complexity of the entity and the reporting you have to produce —
              not by revenue alone. We&apos;ll tell you on the call which one applies, and we would
              rather move you down than sell you up.
            </p>
            <div className="tiers">
              {tiers.map((tier) => (
                <div className={`tier${tier.featured ? ' tier-featured' : ''}`} key={tier.name}>
                  <div className="name">{tier.name}</div>
                  <div className="price">{tier.price}</div>
                  <div className="unit">{tier.unit}</div>
                  <div className="turn">{tier.turn}</div>
                  <p className="who">{tier.who}</p>
                  <ul>
                    {tier.items.map((item) => (
                      <li className={item.carry ? 'carry' : undefined} key={item.text}>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                  <CalendlyButton
                    text="Enquire"
                    className={`btn btn-sm ${tier.featured ? 'btn-solid' : 'btn-outline'}`}
                  />
                </div>
              ))}
            </div>
            <p className="section-note" style={{ marginTop: 28 }}>
              Prior-year catch-up is quoted separately, typically from $1,800. Each additional entity
              is $1,200. Out-of-scope hourly work is $275, consistent with our other service lines.
              Prices are in Canadian dollars, exclusive of HST, and hold for twelve months from the
              date of your engagement letter.
            </p>
          </div>
        </section>

        <section id="limits">
          <div className="wrap">
            <p className="eyebrow">Being specific about it</p>
            <h2>What we don&apos;t do</h2>
            <p className="intro">
              Every firm publishes what it does. Fewer will tell you where the work stops — which is
              where most disappointment in this category comes from.
            </p>
            <div className="limits">
              <div>
                <h3>Not included in a year-end engagement</h3>
                <ul>
                  {notIncluded.map((item) => (
                    <li key={item.rest}>
                      {item.strong ? (
                        <>
                          <strong>{item.strong}</strong>
                          {item.rest}
                        </>
                      ) : (
                        item.rest
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Who this is a poor fit for</h3>
                <ul>
                  {poorFit.map((item) => (
                    <li key={item.slice(0, 48)}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="panel panel-accent">
              <h3>If a controller-level relationship is what you actually need</h3>
              <p>
                A good year-end tells you what happened. It does not fix the twelve months that
                produced it. If the real problem is that your monthly numbers aren&apos;t trustworthy or
                aren&apos;t timely, the
                {' '}
                <Link to="/services/fractional-controller">fractional controller service</Link>
                {' '}
                is the better starting point — and we&apos;ll say so on the call rather than selling you a
                year-end and letting you find out.
              </p>
            </div>
          </div>
        </section>

        <section className="alt" id="process">
          <div className="wrap">
            <p className="eyebrow">How it starts</p>
            <h2>Three steps, and you can stop after any of them</h2>
            <ol className="steps">
              <li>
                <h3>A 30-minute call</h3>
                <p>
                  We establish your year-end date, what you&apos;re actually required to produce and for
                  whom, and which tier fits. If the honest answer is that another service or another
                  firm suits you better, we&apos;ll say which.
                </p>
              </li>
              <li>
                <h3>A fixed quote and an engagement letter with a date on it</h3>
                <p>
                  The fee, the scope, the delivery window and the list of what counts as complete
                  records — all agreed before you send us anything. Ideally before your year-end
                  closes, so the cut-off work can be done properly rather than reconstructed.
                </p>
              </li>
              <li>
                <h3>You send records; we deliver on the date</h3>
                <p>
                  Statements, the working paper file, the adjustment list with causes, the package for
                  your tax preparer, and the commentary on what the year actually shows — delivered on
                  the committed date.
                </p>
                <p style={{ marginTop: '0.9em' }}>
                  The delivery guarantee applies to engagements signed at least 30 days before your
                  fiscal year-end, or by 28 February for December year-ends. We cap how many year-ends
                  we take in each filing window, because that is the only thing that makes a date
                  commitment mean anything.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section id="faq">
          <div className="wrap">
            <p className="eyebrow">Questions we get</p>
            <h2>Before you ask</h2>
            <div className="faq">
              {faqs.map((item, index) => (
                <details key={item.q} open={index === 0}>
                  <summary>{item.q}</summary>
                  <div className="a">
                    {item.a.map((para) => (
                      <p key={para.slice(0, 48)}>{para}</p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="closing" id="closing">
          <div className="wrap">
            <h2>Know the fee and the date before you hand anything over.</h2>
            <p className="lede">
              A 30-minute call is enough to establish what you&apos;re required to produce, which tier
              applies, and when you&apos;d have it. No proposal theatre, and no quote that moves later.
            </p>
            <div className="cta-row">
              <CalendlyButton text="Book a 30-minute call" className="btn btn-solid" />
              <a className="btn btn-outline" href="#pricing">
                See scope and pricing
              </a>
            </div>
            <p className="section-note" style={{ marginTop: 28, marginInline: 'auto' }}>
              Axiom Financial &amp; Technology prepares year-end financial information. We do not
              perform audit, review or other assurance engagements on financial information we have
              prepared.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}

export default YearEndReportingService
