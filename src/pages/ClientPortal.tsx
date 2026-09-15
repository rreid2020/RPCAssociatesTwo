import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import Services from '../components/Services'
import { portalPlatformSeo } from '../lib/portal/modules'

const ModuleStatusBadge: FC<{ status: 'available' | 'development' }> = ({ status }) => {
  if (status === 'available') {
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
        Available
      </span>
    )
  }

  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
      Under Development
    </span>
  )
}

const ClientPortal: FC = () => {
  return (
    <>
      <SEO
        title={portalPlatformSeo.title}
        description={portalPlatformSeo.description}
        keywords={portalPlatformSeo.keywords}
        canonical="/client-portal"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Client Portal', path: '/client-portal' },
        ]}
      />
      <main>
        <div className="svc-landing">
          <section className="hero" id="hero">
            <div className="wrap">
              <p className="eyebrow">Client Portal</p>
              <h1>One secure workspace for everything we do together.</h1>
              <p className="lede">
                Centralize communication, documents, and tax intelligence in a single portal built
                for fast, secure client collaboration. Dashboard, TaxGPT, files, and accounting tools
                — in one place.
              </p>
              <div className="cta-row">
                <Link to="/portal/sign-in" className="btn btn-primary">
                  Sign in to portal
                </Link>
                <Link to="/portal/select-plan" className="btn btn-ghost">
                  Create an account
                </Link>
              </div>
              <p className="strip">
                <b>Secure collaboration</b>
                {' '}
                &nbsp;&middot;&nbsp;
                {' '}
                <b>TaxGPT research</b>
                {' '}
                &nbsp;&middot;&nbsp;
                {' '}
                <b>Working papers &amp; files</b>
              </p>
            </div>
          </section>
        </div>

        <div className="svc-landing">
          <section className="alt" id="modules">
            <div className="wrap">
              <p className="eyebrow">Portal modules</p>
              <h2>Everything you need in one portal</h2>
              <p className="intro">
                Six modules working together to streamline accounting, tax, and business advisory work.
              </p>
              <div className="cta-row">
                <Link to="/portal/sign-in" className="btn btn-solid">
                  Open the portal
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* Dashboard Module */}
        <section id="dashboard" className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-md">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-accent uppercase tracking-wider">Dashboard</span>
                  <ModuleStatusBadge status="available" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-md text-primary">
                  At-a-glance visibility into your account status
                </h2>
                <p className="text-lg text-text-body mb-lg">
                  Your personalized dashboard gives you instant insight into what's happening with your account, what needs your attention, and what's coming up next.
                </p>
                <div className="space-y-md">
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Account Overview</h4>
                    <p className="text-text-light">
                      See your current service status, active projects, and account information at a glance. Know exactly where things stand without digging through emails.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Open Items & Action Required</h4>
                    <p className="text-text-light">
                      Clear visibility into documents we need from you, questions pending your response, and tasks that require your input. Never miss a deadline or forget to send a file.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Upcoming Milestones</h4>
                    <p className="text-text-light">
                      Tax filing deadlines, compliance dates, and important meetings are highlighted so you can plan ahead and stay on track.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Quick Access</h4>
                    <p className="text-text-light">
                      One-click access to your most-used features: file uploads, tax research, working papers, and recent communications.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-xl rounded-lg shadow-md">
                <div className="space-y-md">
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Real-time Status Updates</h4>
                    <p className="text-sm text-text-light">See when documents are received, reviewed, and processed in real-time.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Notification Center</h4>
                    <p className="text-sm text-text-light">Get notified about important updates, requests, and deadlines without email clutter.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Activity Timeline</h4>
                    <p className="text-sm text-text-light">Track all interactions, file exchanges, and progress in one chronological view.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="taxgpt" className="py-xxl">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
              <div className="order-2 lg:order-1 bg-white p-xl rounded-lg shadow-md">
                <div className="space-y-md">
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Tax Research Chat</h4>
                    <p className="text-sm text-text-light">Ask complex tax questions and get instant, accurate answers with citations from CRA publications and tax legislation.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Document Intelligence</h4>
                    <p className="text-sm text-text-light">Upload tax documents and get AI-powered analysis, extraction, and guidance on how to handle specific situations.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Form Guidance</h4>
                    <p className="text-sm text-text-light">Step-by-step guidance for completing T1 General, T2 Corporate, and other tax forms with explanations of each line.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Deduction Discovery</h4>
                    <p className="text-sm text-text-light">Identify potential deductions and credits you might be missing based on your situation and industry.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Audit Risk Assessment</h4>
                    <p className="text-sm text-text-light">Understand potential audit triggers and get recommendations to minimize risk while maximizing legitimate deductions.</p>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 mb-md">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l2.5 5 5.5 2.5-5.5 2.5L12 18l-2.5-5-5.5-2.5 5.5-2.5L12 3z" />
                  </svg>
                  <span className="text-sm font-semibold text-accent uppercase tracking-wider">TaxGPT</span>
                  <ModuleStatusBadge status="available" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-md text-primary">
                  AI-powered tax research and guidance
                </h2>
                <p className="text-lg text-text-body mb-lg">
                  TaxGPT combines artificial intelligence with our comprehensive tax knowledge base to give you instant, accurate answers to complex tax questions—with full citations and source references.
                </p>
                <div className="space-y-md">
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Instant Tax Answers</h4>
                    <p className="text-text-light">
                      Ask questions in plain language and get detailed, accurate responses backed by CRA publications, tax legislation, and official guidance. Every answer includes citations so you can verify and understand the source.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Document Analysis</h4>
                    <p className="text-text-light">
                      Upload tax documents, receipts, or financial statements and get AI-powered analysis. Extract key information, identify tax implications, and receive guidance on how to handle specific situations.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Form Completion Guidance</h4>
                    <p className="text-text-light">
                      Get step-by-step help completing T1 General, T2 Corporate, and other tax forms. Understand what each line means, what information goes where, and how to avoid common mistakes.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Proactive Tax Planning</h4>
                    <p className="text-text-light">
                      Discover deductions and credits you might be missing, understand audit risk factors, and get recommendations for tax-efficient strategies based on your specific situation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="tax-return-builder" className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-md">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-semibold text-accent uppercase tracking-wider">Tax Return Builder</span>
                  <ModuleStatusBadge status="development" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-md text-primary">
                  Personal T1 return workspace
                </h2>
                <p className="text-lg text-text-body mb-lg">
                  Prepare personal income tax returns end to end with interview-driven setup, slip and schedule worksheets, optimization, scenarios, and audit readiness—all inside the portal.
                </p>
                <div className="space-y-md">
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Interview-Driven Setup</h4>
                    <p className="text-text-light">
                      Walk through a guided interview to capture taxpayer details, income sources, deductions, and credits without starting from a blank return.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Slips, Schedules & Worksheets</h4>
                    <p className="text-text-light">
                      Enter CRA slips, schedules, and form worksheets in one workspace with line-level guidance and validation as you build the return.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Optimization & Scenarios</h4>
                    <p className="text-text-light">
                      Compare filing options, test what-if scenarios, and review optimization opportunities before finalizing the return.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Audit Readiness</h4>
                    <p className="text-text-light">
                      Review audit risk signals, supporting documentation, and return completeness before submission.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-xl rounded-lg shadow-md">
                <div className="space-y-md">
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Tax Returns & Slip Entry</h4>
                    <p className="text-sm text-text-light">Manage personal returns and CRA slip data in a structured T1 workflow.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Document Processing</h4>
                    <p className="text-sm text-text-light">Upload source documents and map extracted data into return worksheets.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Forms & Schedules</h4>
                    <p className="text-sm text-text-light">Complete schedules, federal/provincial forms, and supporting worksheets in one place.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Scenarios & Audit & Risk</h4>
                    <p className="text-sm text-text-light">Model outcomes and review risk before filing.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="file-repository" className="py-xxl">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-md">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm font-semibold text-accent uppercase tracking-wider">File Repository</span>
                  <ModuleStatusBadge status="available" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-md text-primary">
                  Secure document sharing and organization
                </h2>
                <p className="text-lg text-text-body mb-lg">
                  Replace email attachments and scattered file shares with a centralized, secure repository designed for accounting and tax documents. Organize, share, and access everything in one place.
                </p>
                <div className="space-y-md">
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Secure Upload & Storage</h4>
                    <p className="text-text-light">
                      Upload documents with bank-level encryption. Files are stored securely and accessible only to you and your Axiom team. No more emailing sensitive financial documents.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Organized Folder Structure</h4>
                    <p className="text-text-light">
                      Pre-configured folders organized by tax year, document type, and project. Find what you need quickly with intuitive organization that matches how accountants actually work.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Version Control</h4>
                    <p className="text-text-light">
                      Track document versions automatically. See what changed, when, and by whom. Never lose track of which version is current or accidentally overwrite important files.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Quick Sharing</h4>
                    <p className="text-text-light">
                      Share files with the Axiom team instantly. Set permissions, add comments, and get notifications when files are accessed or updated. Collaboration made simple.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-xl rounded-lg shadow-md">
                <div className="space-y-md">
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Drag & Drop Upload</h4>
                    <p className="text-sm text-text-light">Upload multiple files at once with simple drag-and-drop. Supports PDFs, images, spreadsheets, and more.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Document Search</h4>
                    <p className="text-sm text-text-light">Full-text search across all your documents. Find receipts, invoices, or statements in seconds.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Automatic Organization</h4>
                    <p className="text-sm text-text-light">Smart categorization and tagging help keep your files organized without manual effort.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Mobile Access</h4>
                    <p className="text-sm text-text-light">Access and upload files from your phone or tablet, perfect for capturing receipts on the go.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="working-papers" className="py-xxl">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
              <div className="order-2 lg:order-1 bg-white p-xl rounded-lg shadow-md">
                <div className="space-y-md">
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Collaborative Checklists</h4>
                    <p className="text-sm text-text-light">Shared checklists for tax preparation, year-end close, and compliance tasks. Track progress together in real-time.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Digital Workpapers</h4>
                    <p className="text-sm text-text-light">Create, edit, and collaborate on working papers directly in the portal. No more emailing spreadsheets back and forth.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Notes & Comments</h4>
                    <p className="text-sm text-text-light">Add context, questions, and notes to documents. Threaded conversations keep everything organized.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Audit Trail</h4>
                    <p className="text-sm text-text-light">Complete history of who made what changes and when, essential for compliance and accountability.</p>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 mb-md">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-accent uppercase tracking-wider">Working Papers</span>
                  <ModuleStatusBadge status="development" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-md text-primary">
                  Centralized collaboration on workpapers and checklists
                </h2>
                <p className="text-lg text-text-body mb-lg">
                  Move beyond email threads and shared drives. Working Papers brings your accounting workpapers, checklists, and collaboration notes into one organized, searchable workspace.
                </p>
                <div className="space-y-md">
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Digital Workpapers</h4>
                    <p className="text-text-light">
                      Create and manage working papers directly in the portal. Link to source documents, add calculations, and maintain a clear audit trail of all changes and decisions.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Collaborative Checklists</h4>
                    <p className="text-text-light">
                      Shared checklists for tax preparation, year-end close, and compliance tasks. Both you and the Axiom team can update progress, add notes, and mark items complete in real-time.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Contextual Notes</h4>
                    <p className="text-text-light">
                      Add notes, questions, and comments directly to documents and workpapers. Threaded conversations keep context with the work, making it easy to understand decisions and follow up on questions.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Template Library</h4>
                    <p className="text-text-light">
                      Access pre-built templates for common working papers, checklists, and documentation. Save time and ensure consistency across engagements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="integrations" className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-md">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-accent uppercase tracking-wider">Integrations</span>
                  <ModuleStatusBadge status="development" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-md text-primary">
                  Connect your accounting apps and streamline data flow
                </h2>
                <p className="text-lg text-text-body mb-lg">
                  You can request connections to common providers from the portal; our team follows up to complete setup. Deeper automatic sync
                  is on the roadmap. Stop manually exporting and importing data as we roll out each integration.
                </p>
                <div className="space-y-md">
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Accounting Software Integration</h4>
                    <p className="text-text-light">
                      Connect QuickBooks, Xero, Sage, and other accounting platforms. Automatically sync transactions, chart of accounts, and financial data for real-time collaboration and analysis.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Banking Connections</h4>
                    <p className="text-text-light">
                      Securely connect bank accounts and credit cards for automatic transaction import. Reconcile faster with direct access to bank feeds and statements.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Business App Connections</h4>
                    <p className="text-text-light">
                      Integrate with payment processors, invoicing tools, payroll systems, and expense management apps. One portal to see all your financial data in context.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary">Automated Reporting</h4>
                    <p className="text-text-light">
                      Generate financial reports, tax summaries, and compliance documents automatically from connected data sources. Reduce manual data entry and improve accuracy.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-xl rounded-lg shadow-md">
                <div className="space-y-md">
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">QuickBooks Online</h4>
                    <p className="text-sm text-text-light">Two-way sync with QuickBooks for seamless data flow and collaboration.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Xero</h4>
                    <p className="text-sm text-text-light">Connect Xero accounts for automatic transaction and financial data sync.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">Banking APIs</h4>
                    <p className="text-sm text-text-light">Secure connections to major Canadian banks for transaction import and reconciliation.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary">More Coming</h4>
                    <p className="text-sm text-text-light">We're continuously adding integrations based on client needs. Request your preferred app.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Services />

        <div className="svc-landing">
          <section className="alt" id="security">
            <div className="wrap">
              <p className="eyebrow">Security</p>
              <h2>Bank-level security and compliance</h2>
              <p className="intro">
                Your financial data deserves the highest level of protection. The Client Portal is built with
                security and compliance as foundational principles.
              </p>
              <div className="detail-grid">
                <article>
                  <h3>End-to-end encryption</h3>
                  <p>Data encrypted in transit and at rest using industry-standard protocols.</p>
                </article>
                <article>
                  <h3>SOC 2 compliant</h3>
                  <p>Infrastructure and processes meet SOC 2 Type II security and confidentiality controls.</p>
                </article>
                <article>
                  <h3>Access controls</h3>
                  <p>Role-based access so only authorized users can view or modify specific data.</p>
                </article>
                <article>
                  <h3>Audit logs</h3>
                  <p>Complete trail of access, changes, and activity for compliance and security.</p>
                </article>
                <article>
                  <h3>Cloud infrastructure</h3>
                  <p>Enterprise-grade hosting with backups, redundancy, and disaster recovery.</p>
                </article>
                <article>
                  <h3>PIPEDA compliant</h3>
                  <p>Aligned with Canadian privacy legislation and provincial privacy requirements.</p>
                </article>
              </div>
            </div>
          </section>

          <section className="closing" id="closing">
            <div className="wrap">
              <h2>Ready to get started?</h2>
              <p className="lede">
                Join clients already using the Client Portal to streamline accounting, tax, and advisory work.
              </p>
              <div className="cta-row">
                <Link to="/portal/sign-in" className="btn btn-solid">
                  Sign in to portal
                </Link>
                <a href="mailto:roger.reid@axiomft.ca" className="btn btn-outline">
                  Email us
                </a>
                <a href="tel:6138840208" className="btn btn-outline">
                  Call: 613-884-0208
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default ClientPortal
