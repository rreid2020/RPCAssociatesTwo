import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
import { ARO_RECALC_URL } from '../lib/resources/resources'

const keywords = [
  'ARO recalculation',
  'PS 3280',
  'asset retirement obligation',
  'public sector accounting',
  'ARO variance report',
  'Canadian PSAS',
  'municipal ARO',
  'Ottawa',
]

const faqs = [
  {
    question: "It's free. What's the catch?",
    answer:
      'There is no payment and no account requirement. Axiom publishes the tool because ARO recalculation is the kind of work that gets deferred indefinitely once it has to be scoped and quoted — and because entities that find material variances often want help resolving them. You are under no obligation to engage us for that, and the tool works the same either way.',
  },
  {
    question: 'Do I still need my own ARO schedule?',
    answer:
      'Yes. The tool is a check against your records, not a replacement for them — it has to have something to compare its result to. It also does not post entries, so your schedule and general ledger remain the books of record.',
  },
  {
    question: 'What happens to our data?',
    answer:
      'The recalculation runs entirely in your browser. Your extracts and curves are not uploaded to Axiom, and nothing is stored or retained on our servers. Closing the tab clears the working session from memory.',
  },
  {
    question: 'Can my auditor rely on the output?',
    answer:
      "That is the auditor's judgment to make, not ours. What the tool produces is an independent recalculation with its inputs, method and results visible — the form of evidence a recalculation procedure is meant to generate. Auditors are welcome to run it themselves against client data rather than relying on a client-prepared run.",
  },
  {
    question: 'Does it check whether our discount rate is appropriate?',
    answer:
      'No. Rate selection is a management judgment under PS 3280 and depends on facts the tool has no visibility into. What it does test is whether the rate you selected has been applied consistently — to the right layer, from the right date, on the right base.',
  },
  {
    question: 'Does it handle multiple revisions to the same asset?',
    answer:
      'Yes. Each revision is treated as its own measurement layer, with its own cash flows, rate and recognition date, and is accreted independently. This is one of the more common sources of variance, because a spreadsheet that started with a single layer per asset often was not built to add more.',
  },
  {
    question: 'Our ARO file has its own layout. Is that a problem?',
    answer:
      'Downloadable templates are provided for a clean first import. You can also load your own workbook and map columns to the required fields. Most municipal ARO spreadsheets need a light mapping pass rather than a full re-key — typically the identifiers, cost estimates, dates, rates, and recorded FV/PV balances.',
  },
  {
    question: 'How long does a run take?',
    answer:
      'The recalculation itself is immediate. The work is in assembling the inputs — typically an afternoon for a first run, and considerably less in later years once the input file exists and only needs updating.',
  },
  {
    question: 'What if it finds a variance?',
    answer:
      'A variance is a difference, not automatically an error. It can mean the recorded balance is wrong, or that an input was captured differently than it was originally measured. The report narrows it to a specific asset and component so you can tell which. Correcting it is ordinary work; if the amount is material or the cause is not obvious, book a demo and we can look at it together.',
  },
  {
    question:
      "We adopted PS 3280 with outside help and haven't touched the model since. Is this useful?",
    answer:
      'That is the most common situation among the entities we speak to, and the one the tool was built for. An adoption-year model that has been rolled forward without review is precisely where an independent recalculation has the most to say.',
  },
  {
    question: 'Does it work for ASPE or IFRS reporters?',
    answer:
      'No. It applies PS 3280 under Canadian public sector accounting standards. Asset retirement obligations under ASPE and IFRS have different recognition and measurement mechanics, and a PS 3280 recalculation would not give you a valid answer.',
  },
  {
    question: 'Who built it?',
    answer:
      "Axiom Financial & Technology, an Ottawa firm providing accounting, advisory and automation services to Canadian organizations. The tool was built by Roger Reid, CPA, CMA, CGAP. It is the free, independent check that sits alongside ARO Suite — Axiom's end-to-end ARO measurement, close, disclosure and audit-evidence product.",
  },
] as const

const problems = [
  {
    title: 'The roll-forward verifies itself',
    body:
      "Each year's closing balance is derived from last year's closing balance, in the same file, using the same formulas. If the original measurement was wrong, the error carries forward and compounds — and nothing in the process is capable of detecting it.",
  },
  {
    title: 'Accretion at the wrong rate, or on the wrong base',
    body:
      'Accretion unwinds the discount on each measurement layer at the rate used to measure that layer. It is common to see a single current-year rate applied across the whole balance, or accretion calculated on a closing rather than an opening position.',
  },
  {
    title: 'Revisions entered as adjustments, not re-measurements',
    body:
      'A change in the estimated cost or timing of retirement is a change in expected cash flows — discounted, and layered onto the existing obligation. Posting the change directly as a balance adjustment produces a liability that no longer ties to any set of cash flows.',
  },
  {
    title: 'Amortization drifting away from the asset',
    body:
      "The retirement cost capitalized under PS 3280 is amortized over the related asset's remaining useful life. When that life is revised, or a later layer is capitalized, the two schedules routinely fall out of step and stay that way.",
  },
  {
    title: 'Retired and settled assets still carrying a liability',
    body:
      'Assets come off the capital asset register; their ARO layers frequently do not. The obligation keeps accreting against an asset that has already been disposed of, demolished, or settled.',
  },
  {
    title: 'Real and nominal inputs mixed together',
    body:
      "Cash flows stated in today's dollars discounted at a nominal rate — or inflation applied both to the cash flow and inside the rate — produces a measurement error that grows with the length of the settlement horizon.",
  },
  {
    title: 'Nobody left who can explain the file',
    body:
      'Turnover in public sector finance is constant. When the auditor asks how the balance was derived, the honest answer is increasingly "that is what the model produces" — which is not an explanation of the number.',
  },
  {
    title: 'An audit request with no good answer',
    body:
      'Auditors ask for support for the ARO continuity schedule. The only support available is the spreadsheet that generated the schedule. That is circular, it is not independent evidence, and both sides know it.',
  },
] as const

const solutions = [
  {
    from: 'Self-verifying roll-forward',
    title: 'A derivation that does not start from your balance',
    body:
      "The recalculation runs from estimated cost, settlement date, rate and recognition date — not from last year's closing figure. That independence is what makes a variance meaningful rather than tautological.",
  },
  {
    from: 'Accretion errors',
    title: 'Accretion recomputed layer by layer',
    body:
      'Each measurement layer is accreted at its own discount rate, from its own recognition date, to the measurement date you specify. Where your accretion differs, the variance lands against the specific asset that caused it.',
  },
  {
    from: 'Revisions posted as plugs',
    title: 'Revisions rebuilt as discounted cash flows',
    body:
      'Estimate changes are re-measured and layered. The report shows the liability the revised cash flows actually support, and how far the recorded balance sits from it.',
  },
  {
    from: 'Amortization drift',
    title: "Capitalized cost tied back to the asset's life",
    body:
      "The capitalized retirement cost is amortized on the asset's own remaining useful life. Schedules that have fallen out of step surface as an accumulated amortization variance rather than staying buried.",
  },
  {
    from: 'Retired and settled assets',
    title: 'Layers with no live asset isolated',
    body:
      'Obligations still accreting against assets that have been disposed of or settled are separated out, so they can be removed rather than carried forward another year.',
  },
  {
    from: 'Mixed real and nominal inputs',
    title: 'Input consistency tested before measurement',
    body:
      'Real-versus-nominal mismatches, settlement dates preceding recognition dates, negative remaining lives and missing rates are flagged in their own right — not silently absorbed into a number.',
  },
  {
    from: 'Turnover and lost knowledge',
    title: "A method that does not live in one person's file",
    body:
      'The procedure is the same every year, regardless of who runs it. A new treasurer or manager of accounting can produce and explain the check on their first year-end.',
  },
  {
    from: 'The audit request',
    title: 'Evidence that is not your own spreadsheet',
    body:
      'The variance report is an independent recalculation with its inputs, method and results visible. You can prepare it before the auditors arrive — or your auditor can run it themselves on your data as a substantive recalculation procedure.',
  },
] as const

/**
 * Marketing landing page for the free ARO Recalculation tool.
 * Tool itself runs at arorecalc.axiomft.ca; this page is the in-site entry from Resources.
 */
const AroRecalcPage: FC = () => {
  return (
    <>
      <SEO
        title="ARO Recalculation Tool | Independent PS 3280 Check"
        description="A free, independent recalculation of your PS 3280 asset retirement obligation balances, compared line by line against your own records."
        canonical="/resources/aro-recalculation"
        keywords={keywords}
        ogType="website"
        schemaSoftware={{
          name: 'ARO Recalculation Tool',
          description:
            'Free, browser-based independent recalculation of PS 3280 asset retirement obligation balances with line-by-line variance reporting.',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offersUrl: ARO_RECALC_URL,
          offersPrice: '0',
          offersCurrency: 'CAD',
        }}
        schemaFaq={faqs.map((item) => ({ question: item.question, answer: item.answer }))}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Resources', path: '/resources' },
          { name: 'Online Calculators', path: '/resources/category/online-calculators' },
          { name: 'ARO Recalculation', path: '/resources/aro-recalculation' },
        ]}
      />

      <main className="svc-landing">
        <section className="hero" id="overview">
          <div className="wrap">
            <p className="eyebrow">Free tool · PS 3280 Asset Retirement Obligations</p>
            <h1>ARO Recalculation Tool</h1>
            <p className="lede">
              An <strong>independent recalculation</strong> of your asset retirement obligation
              balances, compared line by line against the balances in your own records. Where the
              two disagree, you see the variance — by asset, by component, with the amount and
              direction of the difference.
            </p>
            <p className="lede" style={{ marginTop: '1em' }}>
              It does not replace your ARO schedule. It tests it.
            </p>
            <div className="cta-row">
              <a
                className="btn btn-primary"
                href={ARO_RECALC_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open the recalculation tool
              </a>
              <CalendlyButton text="Book a demo" className="btn btn-ghost" />
            </div>
            <p className="strip">
              <b>Free</b>
              {' '}
              &nbsp;&middot;&nbsp;
              {' '}
              <b>PS 3280 / Canadian PSAS</b>
              {' '}
              &nbsp;&middot;&nbsp;
              {' '}
              <b>Public sector &amp; auditors</b>
              {' '}
              &nbsp;&middot;&nbsp;
              {' '}
              <b>Variance report as working paper</b>
            </p>
          </div>
        </section>

        <section className="alt" id="facts">
          <div className="wrap">
            <ul className="facts" style={{ marginTop: 0 }}>
              <li>
                <div className="k">Cost</div>
                <div className="v">Free. No engagement required.</div>
              </li>
              <li>
                <div className="k">Standard</div>
                <div className="v">PS 3280, Canadian PSAS</div>
              </li>
              <li>
                <div className="k">Built for</div>
                <div className="v">
                  Municipalities, school boards, hospitals, agencies, Crown entities — and their
                  auditors
                </div>
              </li>
              <li>
                <div className="k">Output</div>
                <div className="v">Variance report you can file as a working paper</div>
              </li>
            </ul>
          </div>
        </section>

        <section id="problem">
          <div className="wrap">
            <p className="eyebrow">The problem</p>
            <h2>
              The number in your financial statements has not been independently recalculated since
              the day it was created.
            </h2>
            <div className="intro">
              <p>
                PS 3280 took effect for fiscal years beginning on or after April 1, 2022. For most
                entities, the initial liability was recognized three or four year-ends ago — often in
                a spreadsheet built once, under deadline, sometimes with outside help. Every year
                since, that spreadsheet has been rolled forward. Very few have been rebuilt from the
                underlying inputs.
              </p>
              <p>
                That leaves a balance in the statements that is material, that is growing through
                accretion, and that no one has ever checked against a second calculation. In
                practice, these are the things that go wrong.
              </p>
            </div>
            <div className="detail-grid detail-grid--flag">
              {problems.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="alt" id="solution">
          <div className="wrap">
            <p className="eyebrow">How the tool solves it</p>
            <h2>
              It calculates the balance again, separately — then shows you where the two answers
              differ.
            </h2>
            <p className="intro">
              Every problem above has the same root: there is only one calculation, and it checks
              itself. The tool supplies a second one. It starts from your asset-level inputs rather
              than from your closing balance, measures the obligation independently, and reports the
              difference against what you have recorded.
            </p>
            <div className="pair-grid">
              {solutions.map((item) => (
                <div className="pair" key={item.title}>
                  <span className="from">{item.from}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
            <div className="panel">
              <h3>What the tool does not do</h3>
              <ul>
                <li>
                  <strong>It does not judge whether your estimates are reasonable.</strong>{' '}
                  Retirement cost, settlement timing and discount rate selection are management
                  judgments. The tool takes them as given and tests the measurement mechanics built
                  on top of them.
                </li>
                <li>
                  <strong>It does not determine whether an obligation exists.</strong> Identifying
                  legal obligations associated with the retirement of tangible capital assets is
                  scoping work under PS 3280, and it stays with you.
                </li>
                <li>
                  <strong>It does not distinguish PS 3280 from PS 3260.</strong> Contamination
                  unrelated to the retirement of an asset in productive use belongs in liability for
                  contaminated sites. That determination happens before the data reaches the tool.
                </li>
                <li>
                  <strong>It is not a subledger.</strong> It does not replace your ARO schedule,
                  your capital asset register or your general ledger. It needs those records to
                  exist, because comparing against them is the entire point.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="how">
          <div className="wrap">
            <p className="eyebrow">How it works</p>
            <h2>Five steps, one sitting.</h2>
            <p className="intro">
              The tool needs two things: the inputs your obligation was measured from, and the
              balances you currently have recorded. Everything else is calculation and comparison.
            </p>
            <ol className="steps">
              <li>
                <h3>Assemble your inputs</h3>
                <p>
                  One row per obligation layer — a base recognition plus any later revisions to the
                  same asset. Most of this already exists in your ARO schedule and capital asset
                  register.
                </p>
                <div className="fields">
                  <b>Measurement inputs:</b> asset identifier · estimated retirement cost · the date
                  that estimate is stated at · expected settlement date · discount rate · inflation
                  assumption · recognition date · in-service date · useful life
                  <br />
                  <b>Recorded balances to compare against:</b> ARO liability · capitalized retirement
                  cost · accumulated amortization
                </div>
              </li>
              <li>
                <h3>Load it into the tool</h3>
                <p>
                  Download a template or import your own workbook with the required columns, then
                  confirm the field mapping. The tool runs entirely in your browser — nothing is
                  uploaded, stored, or retained on Axiom&apos;s servers.
                </p>
              </li>
              <li>
                <h3>The tool recalculates independently</h3>
                <p>
                  Each layer is measured from its own cash flows and rate, accreted from its
                  recognition date forward, and the related capitalized cost amortized over the
                  asset&apos;s remaining life — all the way to the measurement date you choose.
                  Year-end, an interim date, or a prior year if you want to test a comparative
                  figure.
                </p>
              </li>
              <li>
                <h3>Recalculated balances are matched against yours</h3>
                <p>
                  Layer to layer, asset to asset, and in total — across the liability, the
                  capitalized retirement cost and accumulated amortization, so a difference in one
                  component is not masked by an offsetting difference in another.
                </p>
              </li>
              <li>
                <h3>Read and export the variance report</h3>
                <p>
                  Differences are listed by asset with amount and direction, alongside a total that
                  reconciles in continuity-schedule form: opening balance, additions, accretion,
                  revisions, settlements, closing balance. Save the run as a working paper, correct
                  what needs correcting, and re-run.
                </p>
              </li>
            </ol>
            <div className="panel panel-accent">
              <h3>A reasonable first run</h3>
              <ul>
                <li>
                  <strong>Start with your largest asset class.</strong> Landfill closure and
                  post-closure, or asbestos in buildings, will usually carry most of the balance and
                  most of the risk.
                </li>
                <li>
                  <strong>Run it at your last audited year-end first.</strong> Variances against an
                  audited figure are the clearest signal, and you are not working against a deadline.
                </li>
                <li>
                  <strong>Expect some variances that are not errors.</strong> A difference can also
                  come from an input recorded differently than it was originally measured. The
                  report tells you which asset and which component so you can tell the two apart.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="alt" id="faq">
          <div className="wrap">
            <p className="eyebrow">Questions</p>
            <h2>Frequently asked questions</h2>
            <div className="faq">
              {faqs.map((item, index) => (
                <details key={item.question} open={index === 0}>
                  <summary>{item.question}</summary>
                  <div className="a">
                    <p>
                      {item.question === 'Who built it?' ? (
                        <>
                          Axiom Financial &amp; Technology, an Ottawa firm providing accounting,
                          advisory and automation services to Canadian organizations. The tool was
                          built by Roger Reid, CPA, CMA, CGAP. It is the free, independent check that
                          sits alongside{' '}
                          <Link to="/products/aro-suite">ARO Suite</Link> — Axiom&apos;s end-to-end
                          ARO measurement, close, disclosure and audit-evidence product.
                        </>
                      ) : (
                        item.answer
                      )}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="closing" id="closing">
          <div className="wrap">
            <h2>Find out what a second calculation says.</h2>
            <p className="lede">
              Run your own numbers through the tool at no cost, or walk through a run with us using a
              sample file before you touch your own data.
            </p>
            <div className="cta-row">
              <a
                className="btn btn-solid"
                href={ARO_RECALC_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open the recalculation tool
              </a>
              <CalendlyButton text="Book a demo" className="btn btn-outline" />
            </div>
            <p className="section-note" style={{ marginTop: 28, marginInline: 'auto' }}>
              The ARO Recalculation Tool supports the preparation and review of PS 3280 balances. It
              does not constitute an audit, a review engagement, or assurance on your financial
              statements, and it does not replace professional judgment about the estimates
              underlying your obligation.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}

export default AroRecalcPage
