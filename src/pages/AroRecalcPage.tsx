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
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Resources', path: '/resources' },
          { name: 'Online Calculators', path: '/resources/category/online-calculators' },
          { name: 'ARO Recalculation', path: '/resources/aro-recalculation' },
        ]}
      />

      <main className="aro-landing">
        <style>{`
          .aro-landing {
            --navy:#00204a;
            --navy-800:#052e63;
            --navy-050:#eef3f9;
            --accent:#0e7c86;
            --accent-050:#e6f2f3;
            --flag:#8a5a00;
            --flag-050:#fdf4e3;
            --ink:#12202f;
            --ink-muted:#4c5c6d;
            --rule:#d9e1ea;
            --paper:#ffffff;
            --paper-alt:#f6f8fb;
            --radius:6px;
            --maxw:1080px;
            --font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --font-display: Georgia, "Times New Roman", serif;
            background:var(--paper);
            color:var(--ink);
            font-family:var(--font);
            font-size:17px;
            line-height:1.65;
            -webkit-font-smoothing:antialiased;
          }
          .aro-landing .wrap{max-width:var(--maxw); margin-inline:auto; padding-inline:24px}
          .aro-landing section{padding-block:64px; border-top:1px solid var(--rule)}
          .aro-landing section:first-of-type{border-top:0}
          .aro-landing .alt{background:var(--paper-alt)}
          .aro-landing h1,.aro-landing h2,.aro-landing h3{
            font-family:var(--font-display); font-weight:600; line-height:1.2; color:var(--navy); margin:0 0 .5em
          }
          .aro-landing h1{font-size:clamp(2rem,4.4vw,3rem); letter-spacing:-.01em}
          .aro-landing h2{font-size:clamp(1.5rem,3vw,2rem)}
          .aro-landing h3{font-size:1.075rem; font-family:var(--font); font-weight:650; line-height:1.35}
          .aro-landing p{margin:0 0 1em}
          .aro-landing p:last-child{margin-bottom:0}
          .aro-landing a{color:var(--accent)}
          .aro-landing .eyebrow{
            font-size:.75rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
            color:var(--accent); margin:0 0 14px;
          }
          .aro-landing .lede{font-size:1.2rem; line-height:1.55; color:var(--ink-muted); max-width:62ch}
          .aro-landing .intro{max-width:70ch}
          .aro-landing .section-note{font-size:.95rem; color:var(--ink-muted); max-width:70ch}
          .aro-landing .hero{background:var(--navy); color:#dbe6f2; border-top:0}
          .aro-landing .hero h1{color:#fff}
          .aro-landing .hero .eyebrow{color:#7fc7cf}
          .aro-landing .hero .lede{color:#c2d3e4}
          .aro-landing .hero strong{color:#fff}
          .aro-landing .facts{
            list-style:none; margin:32px 0 0; padding:0;
            display:grid; gap:1px; background:rgba(255,255,255,.18);
            border:1px solid rgba(255,255,255,.18); border-radius:var(--radius); overflow:hidden;
            grid-template-columns:repeat(auto-fit,minmax(190px,1fr));
          }
          .aro-landing .facts li{background:var(--navy); padding:16px 18px}
          .aro-landing .facts .k{
            font-size:.7rem; letter-spacing:.12em; text-transform:uppercase;
            color:#7fc7cf; font-weight:700; margin-bottom:4px;
          }
          .aro-landing .facts .v{font-size:.95rem; color:#fff; line-height:1.4}
          .aro-landing .cta-row{display:flex; flex-wrap:wrap; gap:14px; margin-top:32px}
          .aro-landing .btn{
            display:inline-block; padding:13px 24px; border-radius:var(--radius);
            font-weight:650; font-size:.98rem; text-decoration:none; border:2px solid transparent;
            line-height:1.2; text-align:center; cursor:pointer;
          }
          .aro-landing .btn-primary{background:#fff; color:var(--navy); border-color:#fff}
          .aro-landing .btn-primary:hover{background:#e9f3f4; color:var(--navy)}
          .aro-landing .btn-ghost{background:transparent; color:#fff; border-color:rgba(255,255,255,.55)}
          .aro-landing .btn-ghost:hover{border-color:#fff; color:#fff; background:rgba(255,255,255,.08)}
          .aro-landing .btn-solid{background:var(--navy); color:#fff; border-color:var(--navy)}
          .aro-landing .btn-solid:hover{background:var(--navy-800); color:#fff}
          .aro-landing .btn-outline{background:transparent; color:var(--navy); border-color:var(--navy)}
          .aro-landing .btn-outline:hover{background:var(--navy-050); color:var(--navy)}
          .aro-landing .grid{display:grid; gap:20px; margin-top:36px}
          .aro-landing .grid-2{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}
          .aro-landing .grid-3{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
          .aro-landing .card{
            background:var(--paper); border:1px solid var(--rule); border-radius:var(--radius);
            padding:22px 22px 24px; border-top:3px solid var(--navy);
          }
          .aro-landing .card p{font-size:.97rem; color:var(--ink-muted)}
          .aro-landing .card h3{margin-bottom:.45em}
          .aro-landing .card-problem{border-top-color:var(--flag)}
          .aro-landing .card-problem h3{color:var(--flag)}
          .aro-landing .pair{border-left:3px solid var(--accent); padding:2px 0 2px 20px}
          .aro-landing .pair h3{color:var(--navy); margin-bottom:.35em}
          .aro-landing .pair p{font-size:.97rem; color:var(--ink-muted); margin:0}
          .aro-landing .pair .from{
            display:block; font-size:.72rem; letter-spacing:.1em; text-transform:uppercase;
            color:var(--ink-muted); font-weight:700; margin-bottom:6px;
          }
          .aro-landing .panel{
            margin-top:40px; padding:26px 28px; border-radius:var(--radius);
            background:var(--flag-050); border:1px solid #e6d3ac;
          }
          .aro-landing .panel h3{color:var(--flag); font-size:1.05rem}
          .aro-landing .panel ul{margin:0; padding-left:1.15em}
          .aro-landing .panel li{margin-bottom:.7em; font-size:.97rem; color:var(--ink)}
          .aro-landing .panel li:last-child{margin-bottom:0}
          .aro-landing .panel li strong{color:var(--flag)}
          .aro-landing .panel-accent{background:var(--accent-050); border-color:#b9d9dc}
          .aro-landing .panel-accent h3{color:var(--accent)}
          .aro-landing .panel-accent li strong{color:var(--accent)}
          .aro-landing .steps{list-style:none; counter-reset:step; margin:36px 0 0; padding:0}
          .aro-landing .steps > li{
            counter-increment:step; position:relative;
            padding:0 0 30px 66px; border-left:2px solid var(--rule); margin-left:20px;
          }
          .aro-landing .steps > li:last-child{border-left-color:transparent; padding-bottom:0}
          .aro-landing .steps > li::before{
            content:counter(step); position:absolute; left:-21px; top:-4px;
            width:40px; height:40px; border-radius:50%;
            background:var(--navy); color:#fff;
            font-weight:700; font-size:1rem; display:grid; place-items:center;
          }
          .aro-landing .steps h3{margin-bottom:.35em}
          .aro-landing .steps p{font-size:.97rem; color:var(--ink-muted)}
          .aro-landing .steps .fields{
            margin:12px 0 0; padding:14px 16px; background:var(--paper-alt);
            border:1px solid var(--rule); border-radius:var(--radius);
            font-size:.9rem; color:var(--ink-muted); line-height:1.7;
          }
          .aro-landing .fields b{color:var(--ink); font-weight:650}
          .aro-landing .faq{margin-top:36px; border-top:1px solid var(--rule)}
          .aro-landing .faq details{border-bottom:1px solid var(--rule)}
          .aro-landing .faq summary{
            cursor:pointer; list-style:none; padding:18px 44px 18px 0; position:relative;
            font-weight:650; color:var(--navy); font-size:1.02rem;
          }
          .aro-landing .faq summary::-webkit-details-marker{display:none}
          .aro-landing .faq summary::after{
            content:"+"; position:absolute; right:8px; top:15px;
            font-size:1.5rem; font-weight:400; color:var(--accent); line-height:1;
          }
          .aro-landing .faq details[open] summary::after{content:"\\2013"}
          .aro-landing .faq summary:focus-visible{outline:2px solid var(--accent); outline-offset:3px}
          .aro-landing .faq .a{padding:0 44px 22px 0; color:var(--ink-muted); font-size:.98rem; max-width:78ch}
          .aro-landing .faq .a ul{padding-left:1.15em; margin:.6em 0}
          .aro-landing .faq .a li{margin-bottom:.4em}
          .aro-landing .closing{background:var(--navy-050); text-align:center; border-top:1px solid var(--rule)}
          .aro-landing .closing .lede{margin-inline:auto}
          .aro-landing .closing .cta-row{justify-content:center}
          @media (max-width:640px){
            .aro-landing{font-size:16px}
            .aro-landing section{padding-block:48px}
            .aro-landing .steps > li{padding-left:56px}
          }
        `}</style>

        <section className="hero" id="overview">
          <div className="wrap">
            <p className="eyebrow">Free tool · PS 3280 Asset Retirement Obligations</p>
            <h1>ARO Recalculation Tool</h1>
            <p className="lede">
              An <strong>independent recalculation</strong> of your asset retirement obligation
              balances, compared line by line against the balances in your own records.
              Where the two disagree, you see the variance — by asset, by component,
              with the amount and direction of the difference.
            </p>
            <p className="lede" style={{ marginTop: '1em' }}>
              It does not replace your ARO schedule. It tests it.
            </p>
            <ul className="facts">
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
            <div className="grid grid-3">
              <article className="card card-problem">
                <h3>The roll-forward verifies itself</h3>
                <p>
                  Each year&apos;s closing balance is derived from last year&apos;s closing balance,
                  in the same file, using the same formulas. If the original measurement was wrong,
                  the error carries forward and compounds — and nothing in the process is capable of
                  detecting it.
                </p>
              </article>
              <article className="card card-problem">
                <h3>Accretion at the wrong rate, or on the wrong base</h3>
                <p>
                  Accretion unwinds the discount on each measurement layer at the rate used to
                  measure that layer. It is common to see a single current-year rate applied across
                  the whole balance, or accretion calculated on a closing rather than an opening
                  position.
                </p>
              </article>
              <article className="card card-problem">
                <h3>Revisions entered as adjustments, not re-measurements</h3>
                <p>
                  A change in the estimated cost or timing of retirement is a change in expected cash
                  flows — discounted, and layered onto the existing obligation. Posting the change
                  directly as a balance adjustment produces a liability that no longer ties to any
                  set of cash flows.
                </p>
              </article>
              <article className="card card-problem">
                <h3>Amortization drifting away from the asset</h3>
                <p>
                  The retirement cost capitalized under PS 3280 is amortized over the related
                  asset&apos;s remaining useful life. When that life is revised, or a later layer is
                  capitalized, the two schedules routinely fall out of step and stay that way.
                </p>
              </article>
              <article className="card card-problem">
                <h3>Retired and settled assets still carrying a liability</h3>
                <p>
                  Assets come off the capital asset register; their ARO layers frequently do not.
                  The obligation keeps accreting against an asset that has already been disposed of,
                  demolished, or settled.
                </p>
              </article>
              <article className="card card-problem">
                <h3>Real and nominal inputs mixed together</h3>
                <p>
                  Cash flows stated in today&apos;s dollars discounted at a nominal rate — or
                  inflation applied both to the cash flow and inside the rate — produces a
                  measurement error that grows with the length of the settlement horizon.
                </p>
              </article>
              <article className="card card-problem">
                <h3>Nobody left who can explain the file</h3>
                <p>
                  Turnover in public sector finance is constant. When the auditor asks how the
                  balance was derived, the honest answer is increasingly “that is what the model
                  produces” — which is not an explanation of the number.
                </p>
              </article>
              <article className="card card-problem">
                <h3>An audit request with no good answer</h3>
                <p>
                  Auditors ask for support for the ARO continuity schedule. The only support
                  available is the spreadsheet that generated the schedule. That is circular, it is
                  not independent evidence, and both sides know it.
                </p>
              </article>
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
            <div className="grid grid-2">
              <div className="pair">
                <span className="from">Self-verifying roll-forward</span>
                <h3>A derivation that does not start from your balance</h3>
                <p>
                  The recalculation runs from estimated cost, settlement date, rate and recognition
                  date — not from last year&apos;s closing figure. That independence is what makes a
                  variance meaningful rather than tautological.
                </p>
              </div>
              <div className="pair">
                <span className="from">Accretion errors</span>
                <h3>Accretion recomputed layer by layer</h3>
                <p>
                  Each measurement layer is accreted at its own discount rate, from its own
                  recognition date, to the measurement date you specify. Where your accretion
                  differs, the variance lands against the specific asset that caused it.
                </p>
              </div>
              <div className="pair">
                <span className="from">Revisions posted as plugs</span>
                <h3>Revisions rebuilt as discounted cash flows</h3>
                <p>
                  Estimate changes are re-measured and layered. The report shows the liability the
                  revised cash flows actually support, and how far the recorded balance sits from
                  it.
                </p>
              </div>
              <div className="pair">
                <span className="from">Amortization drift</span>
                <h3>Capitalized cost tied back to the asset&apos;s life</h3>
                <p>
                  The capitalized retirement cost is amortized on the asset&apos;s own remaining
                  useful life. Schedules that have fallen out of step surface as an accumulated
                  amortization variance rather than staying buried.
                </p>
              </div>
              <div className="pair">
                <span className="from">Retired and settled assets</span>
                <h3>Layers with no live asset isolated</h3>
                <p>
                  Obligations still accreting against assets that have been disposed of or settled
                  are separated out, so they can be removed rather than carried forward another
                  year.
                </p>
              </div>
              <div className="pair">
                <span className="from">Mixed real and nominal inputs</span>
                <h3>Input consistency tested before measurement</h3>
                <p>
                  Real-versus-nominal mismatches, settlement dates preceding recognition dates,
                  negative remaining lives and missing rates are flagged in their own right — not
                  silently absorbed into a number.
                </p>
              </div>
              <div className="pair">
                <span className="from">Turnover and lost knowledge</span>
                <h3>A method that does not live in one person&apos;s file</h3>
                <p>
                  The procedure is the same every year, regardless of who runs it. A new treasurer
                  or manager of accounting can produce and explain the check on their first
                  year-end.
                </p>
              </div>
              <div className="pair">
                <span className="from">The audit request</span>
                <h3>Evidence that is not your own spreadsheet</h3>
                <p>
                  The variance report is an independent recalculation with its inputs, method and
                  results visible. You can prepare it before the auditors arrive — or your auditor
                  can run it themselves on your data as a substantive recalculation procedure.
                </p>
              </div>
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
              <details open>
                <summary>It&apos;s free. What&apos;s the catch?</summary>
                <div className="a">
                  <p>
                    There is no payment and no account requirement. Axiom publishes the tool because
                    ARO recalculation is the kind of work that gets deferred indefinitely once it
                    has to be scoped and quoted — and because entities that find material variances
                    often want help resolving them. You are under no obligation to engage us for
                    that, and the tool works the same either way.
                  </p>
                </div>
              </details>
              <details>
                <summary>Do I still need my own ARO schedule?</summary>
                <div className="a">
                  <p>
                    Yes. The tool is a check against your records, not a replacement for them — it
                    has to have something to compare its result to. It also does not post entries, so
                    your schedule and general ledger remain the books of record.
                  </p>
                </div>
              </details>
              <details>
                <summary>What happens to our data?</summary>
                <div className="a">
                  <p>
                    The recalculation runs entirely in your browser. Your extracts and curves are
                    not uploaded to Axiom, and nothing is stored or retained on our servers. Closing
                    the tab clears the working session from memory.
                  </p>
                </div>
              </details>
              <details>
                <summary>Can my auditor rely on the output?</summary>
                <div className="a">
                  <p>
                    That is the auditor&apos;s judgment to make, not ours. What the tool produces is
                    an independent recalculation with its inputs, method and results visible — the
                    form of evidence a recalculation procedure is meant to generate. Auditors are
                    welcome to run it themselves against client data rather than relying on a
                    client-prepared run.
                  </p>
                </div>
              </details>
              <details>
                <summary>Does it check whether our discount rate is appropriate?</summary>
                <div className="a">
                  <p>
                    No. Rate selection is a management judgment under PS 3280 and depends on facts
                    the tool has no visibility into. What it does test is whether the rate you
                    selected has been applied consistently — to the right layer, from the right date,
                    on the right base.
                  </p>
                </div>
              </details>
              <details>
                <summary>Does it handle multiple revisions to the same asset?</summary>
                <div className="a">
                  <p>
                    Yes. Each revision is treated as its own measurement layer, with its own cash
                    flows, rate and recognition date, and is accreted independently. This is one of
                    the more common sources of variance, because a spreadsheet that started with a
                    single layer per asset often was not built to add more.
                  </p>
                </div>
              </details>
              <details>
                <summary>Our ARO file has its own layout. Is that a problem?</summary>
                <div className="a">
                  <p>
                    Downloadable templates are provided for a clean first import. You can also load
                    your own workbook and map columns to the required fields. Most municipal ARO
                    spreadsheets need a light mapping pass rather than a full re-key — typically the
                    identifiers, cost estimates, dates, rates, and recorded FV/PV balances.
                  </p>
                </div>
              </details>
              <details>
                <summary>How long does a run take?</summary>
                <div className="a">
                  <p>
                    The recalculation itself is immediate. The work is in assembling the inputs —
                    typically an afternoon for a first run, and considerably less in later years once
                    the input file exists and only needs updating.
                  </p>
                </div>
              </details>
              <details>
                <summary>What if it finds a variance?</summary>
                <div className="a">
                  <p>
                    A variance is a difference, not automatically an error. It can mean the recorded
                    balance is wrong, or that an input was captured differently than it was
                    originally measured. The report narrows it to a specific asset and component so
                    you can tell which. Correcting it is ordinary work; if the amount is material or
                    the cause is not obvious, book a demo and we can look at it together.
                  </p>
                </div>
              </details>
              <details>
                <summary>
                  We adopted PS 3280 with outside help and haven&apos;t touched the model since. Is
                  this useful?
                </summary>
                <div className="a">
                  <p>
                    That is the most common situation among the entities we speak to, and the one the
                    tool was built for. An adoption-year model that has been rolled forward without
                    review is precisely where an independent recalculation has the most to say.
                  </p>
                </div>
              </details>
              <details>
                <summary>Does it work for ASPE or IFRS reporters?</summary>
                <div className="a">
                  <p>
                    No. It applies PS 3280 under Canadian public sector accounting standards. Asset
                    retirement obligations under ASPE and IFRS have different recognition and
                    measurement mechanics, and a PS 3280 recalculation would not give you a valid
                    answer.
                  </p>
                </div>
              </details>
              <details>
                <summary>Who built it?</summary>
                <div className="a">
                  <p>
                    Axiom Financial &amp; Technology, an Ottawa firm providing accounting, advisory
                    and automation services to Canadian organizations. The tool was built by Roger
                    Reid, CPA, CMA, CGAP. It is the free, independent check that sits alongside{' '}
                    <Link to="/products/aro-suite">ARO Suite</Link> — Axiom&apos;s end-to-end ARO
                    measurement, close, disclosure and audit-evidence product.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </section>

        <section className="closing">
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
