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

const foundationIncludes = [
  'Month-end close oversight and review',
  'Monthly reporting pack with commentary',
  'Rolling 13-week cash flow',
  'Annual budget and quarterly reforecast',
  'Monthly review meeting',
  'Year-end file prepared for your tax preparer',
]

const coreIncludes = [
  'Everything in Foundation',
  'Committed close calendar with a fixed delivery day',
  'KPI set designed with you, reported monthly',
  'Variance analysis against budget and prior year',
  'Margin and pricing analysis',
  'Lender and covenant reporting',
  'Documented controls, tested annually',
  'Support on hiring, pricing and capital decisions',
]

const advancedIncludes = [
  'Everything in Core',
  'Multi-entity consolidation',
  'Board-ready reporting and meeting attendance',
  'Scenario and sensitivity modelling',
  'Diligence-standard record keeping',
  'Systems and integration roadmap',
  'Direct support through audit or transaction processes',
]

const notIncluded = [
  'Day-to-day bookkeeping and transaction entry — a separate Axiom service line, or we work alongside your existing bookkeeper',
  'Corporate and personal tax return preparation and filing — separate engagement',
  'Audit, review or any assurance engagement — professional independence rules prevent us from auditing work we perform',
  'Formal business valuations and fairness opinions',
  'Legal advice, and investment or securities advice',
  'Representation in CRA disputes or appeals',
  'Payroll processing and remittance administration',
]

const poorFit = [
  'Businesses under about $1M in revenue — bookkeeping plus a good year-end is usually better value, and we\'ll tell you so',
  'Anyone looking for the cheapest available monthly number. There are providers at $750. We are not competing with them.',
  'Situations where the real need is a full-time controller in the building five days a week',
  'Owners who want the reporting produced but don\'t intend to change anything based on it',
]

const faqs = [
  {
    q: 'Why do you charge for the review when everyone else offers a free consultation?',
    a: 'Because a free consultation is a sales meeting, and it produces a proposal rather than an answer. The review produces a document you can act on, keep, and hand to someone else. Charging for it also means we can spend three weeks on it rather than ninety minutes. We do offer a free 30-minute call first, to work out whether the review is worth doing at all.',
  },
  {
    q: 'Do I have to leave my current bookkeeper or accountant?',
    a: 'No, and we would usually rather you didn\'t. A controller sits above bookkeeping and beside your tax preparer. We work with whoever you already have, and part of our job is making those relationships work better — most year-end pain comes from those three roles never speaking to each other.',
  },
  {
    q: "What's the difference between a fractional controller and a fractional CFO?",
    a: 'A controller makes sure the numbers are right, on time, and understood — close, controls, reporting, cash, budget discipline. A CFO uses those numbers to make capital, structural and strategic decisions. Most businesses under $15M need the first far more than the second, and a great many are sold the second while still missing the first. If what you need is genuinely CFO-level, we\'ll tell you.',
  },
  {
    q: 'Can I just buy the review and nothing else?',
    a: 'Yes. It\'s a complete deliverable, priced on its own, and a meaningful number of clients do exactly that — take the plan, fix things internally, and come back when the business is larger. There is no obligation attached to it and no pressure afterwards.',
  },
  {
    q: 'What happens if my business changes size?',
    a: 'Tiers move. If your scope shrinks — often because we\'ve automated something — the fee comes down at the next quarterly review. If it grows, we\'ll tell you before it starts costing you, not after.',
  },
  {
    q: 'Are you actually in Ottawa?',
    a: 'Yes. Axiom is Ottawa-based and we serve clients across Ontario and nationally. Most of the work happens on your systems remotely; we come in person when it\'s genuinely more useful, and for anything board-facing.',
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

      <main className="fc-page">
        <style>{`
          .fc-page {
            --fc-navy: #00204a;
            --fc-navy-2: #0b3161;
            --fc-ink: #16202c;
            --fc-body: #3d4a58;
            --fc-muted: #6b7a89;
            --fc-rule: #dfe5ec;
            --fc-band: #f4f7fa;
            --fc-band-2: #eaf0f6;
            --fc-accent: #b0632c;
            --fc-ok: #1e6b3c;
            --fc-maxw: 1120px;
            color: var(--fc-body);
            font-size: 17px;
            line-height: 1.65;
            -webkit-font-smoothing: antialiased;
          }
          .fc-page h1, .fc-page h2, .fc-page h3 {
            font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
            color: var(--fc-navy);
            font-weight: 600;
            letter-spacing: -0.01em;
          }
          .fc-page h1 { font-size: clamp(2.1rem, 4.4vw, 3.15rem); line-height: 1.12; margin: 0 0 0.55em; }
          .fc-page h2 { font-size: clamp(1.6rem, 2.8vw, 2.15rem); line-height: 1.2; margin: 0 0 0.5em; }
          .fc-page h3 { font-size: 1.16rem; line-height: 1.3; margin: 0 0 0.45em; }
          .fc-page p { margin: 0 0 1.05em; }
          .fc-wrap { max-width: var(--fc-maxw); margin: 0 auto; padding: 0 28px; }
          .fc-narrow { max-width: 820px; }
          .fc-btn {
            display: inline-block; padding: 12px 22px; border-radius: 3px; font-size: 0.92rem;
            font-weight: 600; text-decoration: none; border: 1.5px solid transparent;
            transition: 0.15s; line-height: 1.2; text-align: center; cursor: pointer;
          }
          .fc-btn-primary { background: var(--fc-accent); color: #fff; border-color: var(--fc-accent); }
          .fc-btn-primary:hover { background: #9a5624; border-color: #9a5624; color: #fff; }
          .fc-btn-ghost { border-color: rgba(255,255,255,0.55); color: #fff; background: transparent; }
          .fc-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }
          .fc-btn-outline { border-color: var(--fc-navy); color: var(--fc-navy); background: transparent; }
          .fc-btn-outline:hover { background: var(--fc-navy); color: #fff; }
          .fc-hero {
            background: linear-gradient(180deg, var(--fc-band-2), var(--fc-band));
            border-bottom: 1px solid var(--fc-rule); padding: 74px 0 66px; text-align: center;
          }
          .fc-pill {
            display: inline-block; background: var(--fc-navy); color: #fff; font-size: 0.66rem;
            letter-spacing: 0.19em; text-transform: uppercase; padding: 7px 16px; border-radius: 20px;
            margin-bottom: 26px; font-weight: 600;
          }
          .fc-lede { font-size: 1.2rem; color: var(--fc-body); max-width: 730px; margin: 0 auto 1.4em; }
          .fc-cta-row { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-top: 26px; }
          .fc-microcopy { font-size: 0.86rem; color: var(--fc-muted); margin-top: 20px; }
          .fc-section { padding: 74px 0; }
          .fc-band { background: var(--fc-band); }
          .fc-dark { background: var(--fc-navy); color: rgba(255,255,255,0.86); }
          .fc-dark h2, .fc-dark h3 { color: #fff; }
          .fc-eyebrow {
            font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase;
            color: var(--fc-accent); font-weight: 700; margin: 0 0 14px;
          }
          .fc-dark .fc-eyebrow { color: #e0a877; }
          .fc-section-head { max-width: 760px; margin-bottom: 44px; }
          .fc-section-head.center { margin-left: auto; margin-right: auto; text-align: center; }
          .fc-section-head p { font-size: 1.08rem; margin-bottom: 0; }
          .fc-pair {
            display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--fc-rule);
            background: #fff; margin-bottom: 22px; border-radius: 4px; overflow: hidden;
          }
          .fc-pair > div { padding: 28px 30px; }
          .fc-prob { background: #fbfcfd; border-right: 1px solid var(--fc-rule); }
          .fc-tag {
            font-size: 0.66rem; letter-spacing: 0.16em; text-transform: uppercase;
            font-weight: 700; margin-bottom: 12px; display: block;
          }
          .fc-tag-bad { color: #9a3b2c; }
          .fc-tag-good { color: var(--fc-ok); }
          .fc-pair h3 { font-size: 1.06rem; margin-bottom: 0.5em; }
          .fc-pair p { font-size: 0.97rem; margin-bottom: 0; }
          .fc-pair p + p { margin-top: 0.8em; }
          .fc-tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 8px; }
          .fc-tier {
            background: #fff; border: 1px solid var(--fc-rule); border-radius: 4px;
            padding: 30px 26px; display: flex; flex-direction: column;
          }
          .fc-tier-feature { border: 2px solid var(--fc-navy); position: relative; }
          .fc-tier-feature::before {
            content: "MOST COMMON"; position: absolute; top: -11px; left: 26px;
            background: var(--fc-navy); color: #fff; font-size: 0.6rem; letter-spacing: 0.16em;
            padding: 4px 12px; border-radius: 2px; font-weight: 700;
          }
          .fc-who {
            font-size: 0.78rem; letter-spacing: 0.13em; text-transform: uppercase;
            color: var(--fc-muted); font-weight: 700; margin-bottom: 10px;
          }
          .fc-price {
            font-family: Georgia, serif; font-size: 2.05rem; color: var(--fc-navy);
            line-height: 1; margin-bottom: 4px;
          }
          .fc-price span {
            font-size: 0.86rem; font-family: system-ui, -apple-system, sans-serif;
            color: var(--fc-muted); letter-spacing: 0.02em;
          }
          .fc-fit {
            font-size: 0.9rem; color: var(--fc-muted); margin-bottom: 20px;
            padding-bottom: 18px; border-bottom: 1px solid var(--fc-rule);
          }
          .fc-tier ul { list-style: none; padding: 0; margin: 0 0 22px; flex: 1; }
          .fc-tier li {
            font-size: 0.94rem; padding-left: 22px; position: relative;
            margin-bottom: 9px; line-height: 1.5;
          }
          .fc-tier li::before {
            content: ""; position: absolute; left: 2px; top: 0.35em; width: 6px; height: 11px;
            border-right: 2px solid var(--fc-accent); border-bottom: 2px solid var(--fc-accent);
            transform: rotate(42deg);
          }
          .fc-entry {
            background: #fff; border: 2px solid var(--fc-accent); border-radius: 4px;
            padding: 34px; margin-bottom: 34px; display: grid;
            grid-template-columns: 1.35fr 1fr; gap: 34px; align-items: center;
          }
          .fc-entry .fc-price { font-size: 2.6rem; margin: 0 0 6px; }
          .fc-entry h3 { font-size: 1.35rem; }
          .fc-guarantee {
            background: #fff; border-left: 4px solid var(--fc-accent); padding: 34px 36px;
            border-radius: 0 4px 4px 0; box-shadow: 0 1px 3px rgba(0,32,74,0.07);
          }
          .fc-guarantee ol { margin: 18px 0 0; padding-left: 20px; }
          .fc-guarantee li { margin-bottom: 12px; padding-left: 6px; }
          .fc-guarantee li strong { color: var(--fc-navy); }
          .fc-cols2 { display: grid; grid-template-columns: 1fr 1fr; gap: 34px; }
          .fc-checklist, .fc-exclude { list-style: none; padding: 0; margin: 0; }
          .fc-checklist li, .fc-exclude li {
            padding-left: 28px; position: relative; margin-bottom: 11px; font-size: 0.99rem;
          }
          .fc-checklist li::before {
            content: ""; position: absolute; left: 4px; top: 0.3em; width: 6px; height: 12px;
            border-right: 2px solid var(--fc-ok); border-bottom: 2px solid var(--fc-ok);
            transform: rotate(42deg);
          }
          .fc-exclude li::before {
            content: "—"; position: absolute; left: 2px; top: 0;
            color: var(--fc-muted); font-weight: 700;
          }
          .fc-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 26px; }
          .fc-step .fc-n {
            font-family: Georgia, serif; font-size: 2.4rem; color: #e0a877;
            line-height: 1; display: block; margin-bottom: 10px;
          }
          .fc-dark .fc-step p { color: rgba(255,255,255,0.8); font-size: 0.97rem; }
          .fc-faq { border-top: 1px solid var(--fc-rule); }
          .fc-faq details { border-bottom: 1px solid var(--fc-rule); padding: 20px 0; }
          .fc-faq summary {
            cursor: pointer; font-family: Georgia, serif; font-size: 1.06rem;
            color: var(--fc-navy); font-weight: 600; list-style: none;
            display: flex; justify-content: space-between; gap: 20px; align-items: flex-start;
          }
          .fc-faq summary::-webkit-details-marker { display: none; }
          .fc-faq summary::after { content: "+"; font-size: 1.4rem; color: var(--fc-accent); line-height: 1; flex: none; }
          .fc-faq details[open] summary::after { content: "–"; }
          .fc-faq details p { margin: 14px 0 0; font-size: 0.99rem; }
          .fc-final {
            background: var(--fc-navy); color: #fff; text-align: center; padding: 80px 0;
          }
          .fc-final h2 { color: #fff; }
          .fc-final p {
            color: rgba(255,255,255,0.82); max-width: 640px; margin: 0 auto 1.6em; font-size: 1.08rem;
          }
          .fc-note { font-size: 0.87rem; color: var(--fc-muted); margin-top: 18px; }
          @media (max-width: 860px) {
            .fc-pair { grid-template-columns: 1fr; }
            .fc-prob { border-right: 0; border-bottom: 1px solid var(--fc-rule); }
            .fc-tiers, .fc-steps, .fc-cols2 { grid-template-columns: 1fr; }
            .fc-entry { grid-template-columns: 1fr; }
            .fc-section { padding: 56px 0; }
          }
        `}</style>

        <section className="fc-hero">
          <div className="fc-wrap">
            <span className="fc-pill">Fractional Controller</span>
            <h1>
              Most fractional controller
              <br />
              arrangements go wrong
              <br />
              the same four ways.
            </h1>
            <p className="fc-lede">
              Unclear scope. A price you can&apos;t compare. A quote given before anyone has looked at
              your books. And one person holding all of it in their head. We fixed those four things
              first, then built the service around them.
            </p>
            <div className="fc-cta-row">
              <a className="fc-btn fc-btn-primary" href="#review" style={{ padding: '14px 30px' }}>
                Start with a Finance Function Review
              </a>
              <a className="fc-btn fc-btn-outline" href="#pricing">
                See scope and pricing
              </a>
            </div>
            <p className="fc-microcopy">
              Fixed fee · Fixed scope · Delivered in 21 days or you don&apos;t pay for it
            </p>
          </div>
        </section>

        <section className="fc-section">
          <div className="fc-wrap">
            <div className="fc-section-head">
              <p className="fc-eyebrow">What usually goes wrong</p>
              <h2>The problem isn&apos;t the model. It&apos;s how it&apos;s sold.</h2>
              <p>
                Fractional finance leadership is a genuinely good idea: you get senior capability at
                the intensity your business actually needs. The delivery is where it breaks down —
                and it breaks down predictably. Here is what we see, and what we do about each one.
              </p>
            </div>
            {problemAnswerPairs.map((pair) => (
              <div className="fc-pair" key={pair.problemTitle}>
                <div className="fc-prob">
                  <span className="fc-tag fc-tag-bad">The problem</span>
                  <h3>{pair.problemTitle}</h3>
                  {pair.problemBody.map((para) => (
                    <p key={para.slice(0, 40)}>{para}</p>
                  ))}
                </div>
                <div>
                  <span className="fc-tag fc-tag-good">What we do</span>
                  <h3>{pair.answerTitle}</h3>
                  {pair.answerBody.map((para) => (
                    <p key={para.slice(0, 40)}>{para}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="fc-section fc-band" id="review">
          <div className="fc-wrap">
            <div className="fc-section-head">
              <p className="fc-eyebrow">Where every engagement starts</p>
              <h2>The Finance Function Review</h2>
              <p>
                Three weeks. One fixed fee. A clear written picture of what you have, what it&apos;s
                costing you, and what to do about it — whether or not you ever retain us.
              </p>
            </div>
            <div className="fc-entry">
              <div>
                <h3>What you get</h3>
                <ul className="fc-checklist">
                  <li>Assessment of your books, close process and reporting against a defined standard</li>
                  <li>Risk and control review — where money moves, and who can move it</li>
                  <li>Systems review: what&apos;s manual that shouldn&apos;t be, and what it costs you in hours</li>
                  <li>A prioritised remediation plan, sequenced and costed</li>
                  <li>Written report plus a working session with you and your team</li>
                </ul>
              </div>
              <div>
                <p className="fc-price">
                  $4,500 <span>fixed</span>
                </p>
                <p style={{ fontSize: '0.94rem', color: 'var(--fc-muted)', marginBottom: 18 }}>
                  Three weeks from the date we receive access. Fee does not change based on the state
                  of your records.
                </p>
                <CalendlyButton text="Book the review" className="fc-btn fc-btn-primary" />
              </div>
            </div>
            <div className="fc-guarantee">
              <p className="fc-eyebrow" style={{ marginBottom: 8 }}>
                Our commitment
              </p>
              <h3 style={{ fontSize: '1.3rem' }}>Three things we guarantee in writing</h3>
              <ol>
                <li>
                  <strong>The fee is fixed.</strong> Whatever we find, the price is $4,500.
                  Discovering that the records are in worse shape than expected is our risk to carry,
                  not a reason to reprice you.
                </li>
                <li>
                  <strong>The date is fixed.</strong> Delivered within 21 days of receiving access to
                  your systems. If we&apos;re late for any reason within our control, the review is
                  free.
                </li>
                <li>
                  <strong>It has to be worth something.</strong> If the review doesn&apos;t identify
                  at least three specific, actionable improvements to your finance function, you
                  don&apos;t pay for it.
                </li>
              </ol>
              <p className="fc-note">
                We can offer this because we&apos;ve done it enough times to know what we&apos;ll
                find. If a provider won&apos;t commit to a fee, a date, or an outcome, ask why.
              </p>
            </div>
          </div>
        </section>

        <section className="fc-section" id="pricing">
          <div className="fc-wrap">
            <div className="fc-section-head">
              <p className="fc-eyebrow">Ongoing engagements</p>
              <h2>What it costs, and what&apos;s in it</h2>
              <p>
                Choose a tier after the review, not before. Most clients move up or down a tier at
                least once — that&apos;s expected, and it&apos;s a conversation, not a renegotiation.
              </p>
            </div>
            <div className="fc-tiers">
              <div className="fc-tier">
                <p className="fc-who">Foundation</p>
                <p className="fc-price">
                  $2,900<span> / month</span>
                </p>
                <p className="fc-fit">
                  Under roughly $3M revenue. Single entity. You have bookkeeping handled and need the
                  layer above it.
                </p>
                <ul>
                  {foundationIncludes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link to="/contact" className="fc-btn fc-btn-outline">
                  Enquire
                </Link>
              </div>
              <div className="fc-tier fc-tier-feature">
                <p className="fc-who">Core</p>
                <p className="fc-price">
                  $4,900<span> / month</span>
                </p>
                <p className="fc-fit">
                  Roughly $3M–$10M revenue. Growing headcount, real working capital cycles, a lender
                  or a board to answer to.
                </p>
                <ul>
                  {coreIncludes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link to="/contact" className="fc-btn fc-btn-primary">
                  Enquire
                </Link>
              </div>
              <div className="fc-tier">
                <p className="fc-who">Advanced</p>
                <p className="fc-price">
                  $7,900<span> / month</span>
                </p>
                <p className="fc-fit">
                  $10M+, multiple entities, or preparing for a transaction, a funder, or an audit.
                </p>
                <ul>
                  {advancedIncludes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link to="/contact" className="fc-btn fc-btn-outline">
                  Enquire
                </Link>
              </div>
            </div>
            <p className="fc-note">
              Project work outside a retainer is quoted at a fixed fee, typically from $6,000.
              Out-of-scope hourly work is $275. Prices are in Canadian dollars, exclusive of HST, and
              hold for the twelve months from the start of your engagement.
            </p>
          </div>
        </section>

        <section className="fc-section fc-band">
          <div className="fc-wrap">
            <div className="fc-section-head">
              <p className="fc-eyebrow">Being specific about it</p>
              <h2>What we don&apos;t do</h2>
              <p>
                Every firm publishes what it does. Fewer will tell you where the work stops — which
                is where most disappointment in this category comes from.
              </p>
            </div>
            <div className="fc-cols2">
              <div>
                <h3>Not included in a controller engagement</h3>
                <ul className="fc-exclude">
                  {notIncluded.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Who this is a poor fit for</h3>
                <ul className="fc-exclude">
                  {poorFit.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="fc-note">
                  If any of these describe you, say so on the call. We would rather lose an
                  engagement in week one than in month seven.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="fc-section fc-dark">
          <div className="fc-wrap">
            <div className="fc-section-head center">
              <p className="fc-eyebrow">How it starts</p>
              <h2>Three steps, and you can stop after any of them</h2>
            </div>
            <div className="fc-steps">
              <div className="fc-step">
                <span className="fc-n">1</span>
                <h3>A 30-minute call</h3>
                <p>
                  We establish whether this is the right service for you and whether the numbers
                  work. If it isn&apos;t, we&apos;ll say which of our other services fits — or which
                  other firm does.
                </p>
              </div>
              <div className="fc-step">
                <span className="fc-n">2</span>
                <h3>The Finance Function Review</h3>
                <p>
                  Three weeks, $4,500, guaranteed on fee, date and outcome. You end with a written
                  plan you own outright, whether or not we go further.
                </p>
              </div>
              <div className="fc-step">
                <span className="fc-n">3</span>
                <h3>A tier, chosen with evidence</h3>
                <p>
                  We recommend a tier based on what the review actually found, not on what you told
                  us in the first meeting. Month to month after an initial three-month term.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="fc-section">
          <div className="fc-wrap fc-narrow">
            <div className="fc-section-head">
              <p className="fc-eyebrow">Questions we get</p>
              <h2>Before you ask</h2>
            </div>
            <div className="fc-faq">
              {faqs.map((faq, index) => (
                <details key={faq.q} open={index === 0}>
                  <summary>{faq.q}</summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="fc-final">
          <div className="fc-wrap">
            <h2>Find out what you&apos;re actually working with</h2>
            <p>
              Three weeks, $4,500, guaranteed on fee, date and outcome. You&apos;ll finish with a
              written assessment of your finance function and a costed plan — and no obligation to do
              anything else with us.
            </p>
            <div className="fc-cta-row">
              <CalendlyButton
                text="Book the Finance Function Review"
                className="fc-btn fc-btn-primary"
              />
              <CalendlyButton text="Book a 30-minute call first" className="fc-btn fc-btn-ghost" />
            </div>
            <p className="fc-microcopy" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Or browse related resources:{' '}
              <Link to="/resources" style={{ color: '#e0a877' }}>
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
