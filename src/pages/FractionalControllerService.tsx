import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'

const keywords = [
  'fractional controller',
  'fractional CFO',
  'finance function review',
  'Ottawa fractional controller',
  'fixed fee controller',
  'month-end close',
  'cash flow forecasting',
  'business advisory',
  'CPA advisory',
  'Ontario controller services',
]

const problemAnswerPairs = [
  {
    problemTitle: "You can't tell what you're buying",
    problemBody: [
      'In Canada, published "fractional controller" and "fractional CFO" offers run from about $750 a month to well over $20,000 — for identically worded promises. One firm\'s fractional CFO tier sits $200 above its own bookkeeping tier.',
      "Almost nobody publishes a price. So you can't compare two proposals, and the only variable left is how much you liked the person in the meeting.",
    ],
    answerTitle: 'We publish the price and the scope',
    answerBody: [
      "Every number is on this page. So is the list of what each tier includes, and a separate list of what it doesn't. You can compare us to anyone before you speak to us.",
      "If a competing proposal won't tell you the price or define the scope in writing, that isn't a negotiating position. It's a gap you'll pay for later.",
    ],
  },
  {
    problemTitle: 'The quote comes before anyone has looked',
    problemBody: [
      'The standard sequence is: a conversation, a proposal, a twelve-month retainer — and then everyone discovers the records are worse than either side assumed. The timeline slips, the fee moves, and the relationship starts with an argument.',
      'This is the single most common reason these engagements fail. It is entirely avoidable, and it is avoided by looking first.',
    ],
    answerTitle: 'We look first, for a fixed fee',
    answerBody: [
      'Every relationship starts with a Finance Function Review: three weeks, one fixed price, and a written assessment of what you actually have. The fee does not change if we find a mess — that risk is ours, not yours.',
      "You decide about a retainer afterwards, knowing exactly what it involves. Plenty of clients take the review, fix three things themselves, and come back a year later. That's a fine outcome.",
    ],
  },
  {
    problemTitle: 'Scope creeps, and so does the invoice',
    problemBody: [
      '"Flexible" and "scale up or down as you grow" sound like features. In practice they mean nobody wrote down where the work stops, so every month is a small negotiation and the provider is the only one who knows what things cost.',
    ],
    answerTitle: 'Scope in writing, changes priced in advance',
    answerBody: [
      'Each tier has a defined deliverable list and a stated hour range. Anything outside it is quoted and approved before it starts — never discovered on an invoice.',
      'Our out-of-scope rate is published too: $275 per hour. You should never be surprised by a number from your own finance function.',
    ],
  },
  {
    problemTitle: "You're buying one person, one deep",
    problemBody: [
      "Most fractional controllers are sole practitioners. There's no review of the work, no backup when they're sick or busy with a larger client, and everything about your finances lives in one person's head. When they leave, it leaves with them.",
      'The barrier to entry is a job title. Across the interim and fractional market, first-time entrants have risen from 6% of the pool in 2020 to 15% in 2025.',
    ],
    answerTitle: 'Documented, reviewed, and not in one head',
    answerBody: [
      'Your close checklist, working papers, control points and reporting pack are documented in your file from month one — yours to keep, whoever does the work.',
      'Work is reviewed before it reaches you, and you have a named second contact at Axiom from the start.',
    ],
  },
  {
    problemTitle: "Nobody fixes the system — they just operate it",
    problemBody: [
      'The commercial incentive in this market is for your monthly hours to go up, not down. So the same manual close gets run every month, forever, and you rent an output instead of building a capability.',
      "Meanwhile the routine parts of the work — coding, reconciliation, document handling — are increasingly things software does well, and are still being billed as though they aren't.",
    ],
    answerTitle: 'We automate the parts that should be automated',
    answerBody: [
      'Systems and automation is one of our core service lines, not an afterthought. Reducing the manual hours in your close is an explicit objective of every engagement, and we report on it.',
      'If automation takes work out of your monthly scope, your tier goes down. We would rather keep a client for six years at a lower number than three years at a higher one.',
    ],
  },
  {
    problemTitle: "Nobody's looking at the controls",
    problemBody: [
      'Businesses your size rarely have segregation of duties, a documented approval path, or any test of whether the controls they think exist actually work. It\'s the gap that turns a small error — or a small fraud — into a large one, and almost no fractional controller is equipped to close it.',
    ],
    answerTitle: 'Controls are part of the work, not an upsell',
    answerBody: [
      'Every Finance Function Review includes a risk and control assessment: where the money can move, who can move it, and what would have to fail for it to go wrong unnoticed.',
      'We do this work at the enterprise level too — through to SOX 404 readiness — which is why we can do it properly at yours.',
    ],
  },
] as const

const reviewIncludes = [
  'Assessment of your books, close process and reporting against a defined standard',
  'Risk and control review — where money moves, and who can move it',
  "Systems review: what's manual that shouldn't be, and what it costs you in hours",
  'A prioritised remediation plan, sequenced and costed',
  'Written report plus a working session with you and your team',
] as const

const guarantees = [
  {
    title: 'The fee is fixed',
    body: 'Whatever we find, the price is $4,500. Discovering that the records are in worse shape than expected is our risk to carry, not a reason to reprice you.',
  },
  {
    title: 'The date is fixed',
    body: "Delivered within 21 days of receiving access to your systems. If we're late for any reason within our control, the review is free.",
  },
  {
    title: 'It has to be worth something',
    body: "If the review doesn't identify at least three specific, actionable improvements to your finance function, you don't pay for it.",
  },
] as const

const tiers = [
  {
    name: 'Foundation',
    price: '$2,900',
    unit: 'per month',
    who: 'Under roughly $3M revenue. Single entity. You have bookkeeping handled and need the layer above it.',
    featured: false,
    items: [
      'Month-end close oversight and review',
      'Monthly reporting pack with commentary',
      'Rolling 13-week cash flow',
      'Annual budget and quarterly reforecast',
      'Monthly review meeting',
      'Year-end file prepared for your tax preparer',
    ],
  },
  {
    name: 'Core',
    price: '$4,900',
    unit: 'per month',
    who: 'Roughly $3M–$10M revenue. Growing headcount, real working capital cycles, a lender or a board to answer to.',
    featured: true,
    items: [
      'Everything in Foundation',
      'Committed close calendar with a fixed delivery day',
      'KPI set designed with you, reported monthly',
      'Variance analysis against budget and prior year',
      'Margin and pricing analysis',
      'Lender and covenant reporting',
      'Documented controls, tested annually',
      'Support on hiring, pricing and capital decisions',
    ],
  },
  {
    name: 'Advanced',
    price: '$7,900',
    unit: 'per month',
    who: '$10M+, multiple entities, or preparing for a transaction, a funder, or an audit.',
    featured: false,
    items: [
      'Everything in Core',
      'Multi-entity consolidation',
      'Board-ready reporting and meeting attendance',
      'Scenario and sensitivity modelling',
      'Diligence-standard record keeping',
      'Systems and integration roadmap',
      'Direct support through audit or transaction processes',
    ],
  },
] as const

const notIncluded = [
  'Day-to-day bookkeeping and transaction entry — we work alongside your existing bookkeeper',
  'Corporate and personal tax return preparation and filing — separate engagement',
  'Audit, review or any assurance engagement — professional independence rules prevent us from auditing work we perform',
  'Formal business valuations and fairness opinions',
  'Legal advice, and investment or securities advice',
  'Representation in CRA disputes or appeals',
  'Payroll processing and remittance administration',
] as const

const poorFit = [
  "Businesses under about $1M in revenue — bookkeeping plus a good year-end is usually better value, and we'll tell you so",
  'Anyone looking for the cheapest available monthly number. There are providers at $750. We are not competing with them.',
  'Situations where the real need is a full-time controller in the building five days a week',
  "Owners who want the reporting produced but don't intend to change anything based on it",
] as const

const faqs = [
  {
    q: 'Why do you charge for the review when everyone else offers a free consultation?',
    a: 'Because a free consultation is a sales meeting, and it produces a proposal rather than an answer. The review produces a document you can act on, keep, and hand to someone else. Charging for it also means we can spend three weeks on it rather than ninety minutes. We do offer a free 30-minute call first, to work out whether the review is worth doing at all.',
  },
  {
    q: 'Do I have to leave my current bookkeeper or accountant?',
    a: "No, and we would usually rather you didn't. A controller sits above bookkeeping and beside your tax preparer. We work with whoever you already have, and part of our job is making those relationships work better — most year-end pain comes from those three roles never speaking to each other.",
  },
  {
    q: "What's the difference between a fractional controller and a fractional CFO?",
    a: "A controller makes sure the numbers are right, on time, and understood — close, controls, reporting, cash, budget discipline. A CFO uses those numbers to make capital, structural and strategic decisions. Most businesses under $15M need the first far more than the second, and a great many are sold the second while still missing the first. If what you need is genuinely CFO-level, we'll tell you.",
  },
  {
    q: 'Can I just buy the review and nothing else?',
    a: "Yes. It's a complete deliverable, priced on its own, and a meaningful number of clients do exactly that — take the plan, fix things internally, and come back when the business is larger. There is no obligation attached to it and no pressure afterwards.",
  },
  {
    q: 'What happens if my business changes size?',
    a: "Tiers move. If your scope shrinks — often because we've automated something — the fee comes down at the next quarterly review. If it grows, we'll tell you before it starts costing you, not after.",
  },
  {
    q: 'Are you actually in Ottawa?',
    a: "Yes. Axiom is Ottawa-based and we serve clients across Ontario and nationally. Most of the work happens on your systems remotely; we come in person when it's genuinely more useful, and for anything board-facing.",
  },
] as const

const FractionalControllerService: FC = () => {
  return (
    <>
      <SEO
        title="Fractional Controller | Fixed Scope, Published Price, Guaranteed Start"
        description="Most fractional controller engagements fail the same four ways. Ours are fixed-fee, fixed-scope, and start with a guaranteed Finance Function Review. Ottawa-based, CPA-led."
        canonical="/services/fractional-controller"
        keywords={keywords}
        ogType="website"
        schemaService={{
          name: 'Fractional Controller & Business Advisory',
          description:
            'Fixed-fee, fixed-scope fractional controller engagements starting with a guaranteed Finance Function Review. Ottawa-based, CPA-led.',
          provider: 'Axiom',
          areaServed: ['CA', 'CA-ON', 'Ottawa'],
          serviceType: 'Fractional Controller',
        }}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
          { name: 'Fractional Controller', path: '/services/fractional-controller' },
        ]}
      />

      <main className="svc-landing">
        <section className="hero" id="hero">
          <div className="wrap">
            <p className="eyebrow">Fractional Controller</p>
            <h1>Most fractional controller arrangements go wrong the same four ways.</h1>
            <p className="lede">
              Unclear scope. A price you can&apos;t compare. A quote given before anyone has looked at
              your books. And one person holding all of it in their head. We fixed those four things
              first, then built the service around them.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#review">
                Start with a Finance Function Review
              </a>
              <a className="btn btn-ghost" href="#pricing">
                See scope and pricing
              </a>
            </div>
            <p className="strip">
              <b>Fixed fee</b>
              {' '}
              &nbsp;&middot;&nbsp;
              {' '}
              <b>Fixed scope</b>
              {' '}
              &nbsp;&middot;&nbsp;
              {' '}
              <b>Delivered in 21 days or you don&apos;t pay for it</b>
            </p>
          </div>
        </section>

        <section id="problems">
          <div className="wrap">
            <p className="eyebrow">What usually goes wrong</p>
            <h2>The problem isn&apos;t the model. It&apos;s how it&apos;s sold.</h2>
            <p className="intro">
              Fractional finance leadership is a genuinely good idea: you get senior capability at
              the intensity your business actually needs. The delivery is where it breaks down — and
              it breaks down predictably. Here is what we see, and what we do about each one.
            </p>
            <div className="pairs">
              {problemAnswerPairs.map((pair) => (
                <div className="pairrow" key={pair.problemTitle}>
                  <div className="side-problem">
                    <p className="label label-problem">The problem</p>
                    <h3>{pair.problemTitle}</h3>
                    {pair.problemBody.map((para) => (
                      <p key={para.slice(0, 40)}>{para}</p>
                    ))}
                  </div>
                  <div className="side-do">
                    <p className="label label-do">What we do</p>
                    <h3>{pair.answerTitle}</h3>
                    {pair.answerBody.map((para) => (
                      <p key={para.slice(0, 40)}>{para}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="alt" id="review">
          <div className="wrap">
            <p className="eyebrow">Where every engagement starts</p>
            <h2>The Finance Function Review</h2>
            <p className="intro">
              Three weeks. One fixed fee. A clear written picture of what you have, what it&apos;s
              costing you, and what to do about it — whether or not you ever retain us.
            </p>
            <div className="offer">
              <div className="offer-main">
                <h3>What you get</h3>
                <ul className="checklist">
                  {reviewIncludes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="offer-side">
                <div className="k">Finance Function Review</div>
                <div className="price">$4,500</div>
                <div className="unit">fixed · three weeks</div>
                <p>
                  Fee does not change based on the state of your records. You leave with a written
                  plan you own outright.
                </p>
                <CalendlyButton text="Book the review" className="btn btn-primary btn-sm" />
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
              <h3>Why we can offer this</h3>
              <p>
                We&apos;ve done it enough times to know what we&apos;ll find. If a provider won&apos;t
                commit to a fee, a date, or an outcome, ask why.
              </p>
            </div>
          </div>
        </section>

        <section className="alt" id="pricing">
          <div className="wrap">
            <p className="eyebrow">Ongoing engagements</p>
            <h2>What it costs, and what&apos;s in it</h2>
            <p className="intro">
              Choose a tier after the review, not before. Most clients move up or down a tier at
              least once — that&apos;s expected, and it&apos;s a conversation, not a renegotiation.
            </p>
            <div className="tiers">
              {tiers.map((tier) => (
                <div className={`tier${tier.featured ? ' tier-featured' : ''}`} key={tier.name}>
                  <div className="name">{tier.name}</div>
                  <div className="price">{tier.price}</div>
                  <div className="unit">{tier.unit}</div>
                  <p className="who">{tier.who}</p>
                  <ul>
                    {tier.items.map((item, index) => (
                      <li
                        className={index === 0 && tier.name !== 'Foundation' ? 'carry' : undefined}
                        key={item}
                      >
                        {item}
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
              Project work outside a retainer is quoted at a fixed fee, typically from $6,000.
              Out-of-scope hourly work is $275. Prices are in Canadian dollars, exclusive of HST, and
              hold for the twelve months from the start of your engagement.
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
                <h3>Not included in a controller engagement</h3>
                <ul>
                  {notIncluded.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Who this is a poor fit for</h3>
                <ul>
                  {poorFit.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="panel panel-accent">
              <h3>If a clean year-end is what you actually need</h3>
              <p>
                A controller fixes the twelve months. If what you need right now is a published-fee
                year-end with a delivery date and working papers you keep, start with
                {' '}
                <Link to="/services/year-end-reporting">year-end reporting</Link>
                {' '}
                — and we&apos;ll say so on the call rather than selling you a retainer you don&apos;t
                need.
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
                  We establish whether this is the right service for you and whether the numbers
                  work. If it isn&apos;t, we&apos;ll say which of our other services fits — or which
                  other firm does.
                </p>
              </li>
              <li>
                <h3>The Finance Function Review</h3>
                <p>
                  Three weeks, $4,500, guaranteed on fee, date and outcome. You end with a written
                  plan you own outright, whether or not we go further.
                </p>
              </li>
              <li>
                <h3>A tier, chosen with evidence</h3>
                <p>
                  We recommend a tier based on what the review actually found, not on what you told
                  us in the first meeting. Month to month after an initial three-month term.
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
                    <p>{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="closing" id="closing">
          <div className="wrap">
            <h2>Find out what you&apos;re actually working with</h2>
            <p className="lede">
              Three weeks, $4,500, guaranteed on fee, date and outcome. You&apos;ll finish with a
              written assessment of your finance function and a costed plan — and no obligation to do
              anything else with us.
            </p>
            <div className="cta-row">
              <CalendlyButton text="Book the Finance Function Review" className="btn btn-solid" />
              <CalendlyButton text="Book a 30-minute call first" className="btn btn-outline" />
            </div>
            <p className="section-note" style={{ marginTop: 28, marginInline: 'auto' }}>
              Related reading:
              {' '}
              <Link to="/resources">
                What&apos;s Broken in Fractional Controller Services — and How We Fixed It
              </Link>
            </p>
          </div>
        </section>
      </main>
    </>
  )
}

export default FractionalControllerService
