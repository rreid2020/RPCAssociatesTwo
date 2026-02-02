import { FC } from 'react'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'

const ClientPortal: FC = () => {
  return (
    <>
      <SEO
        title="Client Portal | Secure Workspace for Tax, Documents & Collaboration"
        description="RPC Associates Client Portal: Dashboard insights, TaxGPT AI research, secure file repository, working papers, and accounting app integrations. One secure workspace for everything we do together."
        keywords="client portal, secure file sharing, tax research, document management, accounting portal, client collaboration, TaxGPT, working papers, accounting integrations"
        canonical="/client-portal"
      />
      <main>
        {/* Hero Section */}
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
              <div className="max-w-[600px]">
                <div className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-md">Client Portal</div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-md text-primary-dark">
                  One secure workspace for everything we do together.
                </h1>
                <p className="text-lg text-text-light mb-lg">
                  Centralize communication, documents, and tax intelligence in a single portal built for fast, secure client collaboration. Access your dashboard, research tax questions, share files, and connect your accounting tools—all in one place.
                </p>
                <div className="flex gap-md mb-lg flex-wrap">
                  <CalendlyButton text="Request Portal Access" />
                  <a href="tel:6138840208" className="btn btn--secondary">
                    Call: 613-884-0208
                  </a>
                </div>
              </div>
              <div className="bg-white p-xl rounded-xl shadow-md">
                <h3 className="text-2xl mb-md text-primary-dark">Why use the Client Portal?</h3>
                <p className="mb-md text-text-light">
                  Stop juggling emails, file shares, and multiple tools. The Client Portal brings everything into one secure, organized workspace designed specifically for accounting and tax collaboration.
                </p>
                <ul className="list-none">
                  <li className="pl-md mb-sm relative before:content-['✓'] before:absolute before:left-0 before:text-accent before:font-bold">Instant access to your financial dashboard and status</li>
                  <li className="pl-md mb-sm relative before:content-['✓'] before:absolute before:left-0 before:text-accent before:font-bold">AI-powered tax research with instant answers</li>
                  <li className="pl-md mb-sm relative before:content-['✓'] before:absolute before:left-0 before:text-accent before:font-bold">Secure document sharing and organization</li>
                  <li className="pl-md mb-sm relative before:content-['✓'] before:absolute before:left-0 before:text-accent before:font-bold">Real-time collaboration on working papers</li>
                  <li className="pl-md mb-sm relative before:content-['✓'] before:absolute before:left-0 before:text-accent before:font-bold">Seamless integration with your accounting apps</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Portal Modules Overview */}
        <section className="py-xxl">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <h2 className="mb-md text-primary-dark">Everything You Need in One Portal</h2>
              <p className="text-lg text-text-light">
                Five powerful modules working together to streamline your accounting, tax, and business advisory needs.
              </p>
            </div>
          </div>
        </section>

        {/* Dashboard Module */}
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-md">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-accent uppercase tracking-wider">Dashboard</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-md text-primary-dark">
                  At-a-glance visibility into your account status
                </h2>
                <p className="text-lg text-text-light mb-lg">
                  Your personalized dashboard gives you instant insight into what's happening with your account, what needs your attention, and what's coming up next.
                </p>
                <div className="space-y-md">
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Account Overview</h4>
                    <p className="text-text-light">
                      See your current service status, active projects, and account information at a glance. Know exactly where things stand without digging through emails.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Open Items & Action Required</h4>
                    <p className="text-text-light">
                      Clear visibility into documents we need from you, questions pending your response, and tasks that require your input. Never miss a deadline or forget to send a file.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Upcoming Milestones</h4>
                    <p className="text-text-light">
                      Tax filing deadlines, compliance dates, and important meetings are highlighted so you can plan ahead and stay on track.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Quick Access</h4>
                    <p className="text-text-light">
                      One-click access to your most-used features: file uploads, tax research, working papers, and recent communications.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-xl rounded-xl shadow-md">
                <div className="space-y-md">
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Real-time Status Updates</h4>
                    <p className="text-sm text-text-light">See when documents are received, reviewed, and processed in real-time.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Notification Center</h4>
                    <p className="text-sm text-text-light">Get notified about important updates, requests, and deadlines without email clutter.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Activity Timeline</h4>
                    <p className="text-sm text-text-light">Track all interactions, file exchanges, and progress in one chronological view.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TaxGPT Module */}
        <section className="py-xxl">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
              <div className="order-2 lg:order-1 bg-white p-xl rounded-xl shadow-md">
                <div className="space-y-md">
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Tax Research Chat</h4>
                    <p className="text-sm text-text-light">Ask complex tax questions and get instant, accurate answers with citations from CRA publications and tax legislation.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Document Intelligence</h4>
                    <p className="text-sm text-text-light">Upload tax documents and get AI-powered analysis, extraction, and guidance on how to handle specific situations.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Form Guidance</h4>
                    <p className="text-sm text-text-light">Step-by-step guidance for completing T1 General, T2 Corporate, and other tax forms with explanations of each line.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Deduction Discovery</h4>
                    <p className="text-sm text-text-light">Identify potential deductions and credits you might be missing based on your situation and industry.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Audit Risk Assessment</h4>
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
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-md text-primary-dark">
                  AI-powered tax research and guidance
                </h2>
                <p className="text-lg text-text-light mb-lg">
                  TaxGPT combines artificial intelligence with our comprehensive tax knowledge base to give you instant, accurate answers to complex tax questions—with full citations and source references.
                </p>
                <div className="space-y-md">
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Instant Tax Answers</h4>
                    <p className="text-text-light">
                      Ask questions in plain language and get detailed, accurate responses backed by CRA publications, tax legislation, and official guidance. Every answer includes citations so you can verify and understand the source.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Document Analysis</h4>
                    <p className="text-text-light">
                      Upload tax documents, receipts, or financial statements and get AI-powered analysis. Extract key information, identify tax implications, and receive guidance on how to handle specific situations.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Form Completion Guidance</h4>
                    <p className="text-text-light">
                      Get step-by-step help completing T1 General, T2 Corporate, and other tax forms. Understand what each line means, what information goes where, and how to avoid common mistakes.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Proactive Tax Planning</h4>
                    <p className="text-text-light">
                      Discover deductions and credits you might be missing, understand audit risk factors, and get recommendations for tax-efficient strategies based on your specific situation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* File Repository Module */}
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-md">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm font-semibold text-accent uppercase tracking-wider">File Repository</span>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">Coming Soon</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-md text-primary-dark">
                  Secure document sharing and organization
                </h2>
                <p className="text-lg text-text-light mb-lg">
                  Replace email attachments and scattered file shares with a centralized, secure repository designed for accounting and tax documents. Organize, share, and access everything in one place.
                </p>
                <div className="space-y-md">
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Secure Upload & Storage</h4>
                    <p className="text-text-light">
                      Upload documents with bank-level encryption. Files are stored securely and accessible only to you and your RPC Associates team. No more emailing sensitive financial documents.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Organized Folder Structure</h4>
                    <p className="text-text-light">
                      Pre-configured folders organized by tax year, document type, and project. Find what you need quickly with intuitive organization that matches how accountants actually work.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Version Control</h4>
                    <p className="text-text-light">
                      Track document versions automatically. See what changed, when, and by whom. Never lose track of which version is current or accidentally overwrite important files.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Quick Sharing</h4>
                    <p className="text-text-light">
                      Share files with your RPC team instantly. Set permissions, add comments, and get notifications when files are accessed or updated. Collaboration made simple.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-xl rounded-xl shadow-md">
                <div className="space-y-md">
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Drag & Drop Upload</h4>
                    <p className="text-sm text-text-light">Upload multiple files at once with simple drag-and-drop. Supports PDFs, images, spreadsheets, and more.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Document Search</h4>
                    <p className="text-sm text-text-light">Full-text search across all your documents. Find receipts, invoices, or statements in seconds.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Automatic Organization</h4>
                    <p className="text-sm text-text-light">Smart categorization and tagging help keep your files organized without manual effort.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Mobile Access</h4>
                    <p className="text-sm text-text-light">Access and upload files from your phone or tablet, perfect for capturing receipts on the go.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Working Papers Module */}
        <section className="py-xxl">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
              <div className="order-2 lg:order-1 bg-white p-xl rounded-xl shadow-md">
                <div className="space-y-md">
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Collaborative Checklists</h4>
                    <p className="text-sm text-text-light">Shared checklists for tax preparation, year-end close, and compliance tasks. Track progress together in real-time.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Digital Workpapers</h4>
                    <p className="text-sm text-text-light">Create, edit, and collaborate on working papers directly in the portal. No more emailing spreadsheets back and forth.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Notes & Comments</h4>
                    <p className="text-sm text-text-light">Add context, questions, and notes to documents. Threaded conversations keep everything organized.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Audit Trail</h4>
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
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">Coming Soon</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-md text-primary-dark">
                  Centralized collaboration on workpapers and checklists
                </h2>
                <p className="text-lg text-text-light mb-lg">
                  Move beyond email threads and shared drives. Working Papers brings your accounting workpapers, checklists, and collaboration notes into one organized, searchable workspace.
                </p>
                <div className="space-y-md">
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Digital Workpapers</h4>
                    <p className="text-text-light">
                      Create and manage working papers directly in the portal. Link to source documents, add calculations, and maintain a clear audit trail of all changes and decisions.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Collaborative Checklists</h4>
                    <p className="text-text-light">
                      Shared checklists for tax preparation, year-end close, and compliance tasks. Both you and your RPC team can update progress, add notes, and mark items complete in real-time.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Contextual Notes</h4>
                    <p className="text-text-light">
                      Add notes, questions, and comments directly to documents and workpapers. Threaded conversations keep context with the work, making it easy to understand decisions and follow up on questions.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Template Library</h4>
                    <p className="text-text-light">
                      Access pre-built templates for common working papers, checklists, and documentation. Save time and ensure consistency across engagements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations Module */}
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-md">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-accent uppercase tracking-wider">Integrations</span>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">Coming Soon</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-md text-primary-dark">
                  Connect your accounting apps and streamline data flow
                </h2>
                <p className="text-lg text-text-light mb-lg">
                  Stop manually exporting and importing data. Connect your accounting software, banking apps, and business tools directly to the portal for seamless data synchronization and reporting.
                </p>
                <div className="space-y-md">
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Accounting Software Integration</h4>
                    <p className="text-text-light">
                      Connect QuickBooks, Xero, Sage, and other accounting platforms. Automatically sync transactions, chart of accounts, and financial data for real-time collaboration and analysis.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Banking Connections</h4>
                    <p className="text-text-light">
                      Securely connect bank accounts and credit cards for automatic transaction import. Reconcile faster with direct access to bank feeds and statements.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Business App Connections</h4>
                    <p className="text-text-light">
                      Integrate with payment processors, invoicing tools, payroll systems, and expense management apps. One portal to see all your financial data in context.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-xs text-primary-dark">Automated Reporting</h4>
                    <p className="text-text-light">
                      Generate financial reports, tax summaries, and compliance documents automatically from connected data sources. Reduce manual data entry and improve accuracy.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-xl rounded-xl shadow-md">
                <div className="space-y-md">
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">QuickBooks Online</h4>
                    <p className="text-sm text-text-light">Two-way sync with QuickBooks for seamless data flow and collaboration.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Xero</h4>
                    <p className="text-sm text-text-light">Connect Xero accounts for automatic transaction and financial data sync.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">Banking APIs</h4>
                    <p className="text-sm text-text-light">Secure connections to major Canadian banks for transaction import and reconciliation.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-md">
                    <h4 className="font-semibold mb-xs text-primary-dark">More Coming</h4>
                    <p className="text-sm text-text-light">We're continuously adding integrations based on client needs. Request your preferred app.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Trust Section */}
        <section className="py-xxl">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <h2 className="mb-md text-primary-dark">Bank-Level Security & Compliance</h2>
              <p className="text-lg text-text-light">
                Your financial data deserves the highest level of protection. The Client Portal is built with security and compliance as foundational principles.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              <div className="bg-white p-lg rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-md">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-xs text-primary-dark">End-to-End Encryption</h3>
                <p className="text-sm text-text-light">
                  All data is encrypted in transit and at rest using industry-standard encryption protocols. Your documents and communications are protected at every step.
                </p>
              </div>
              <div className="bg-white p-lg rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-md">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-xs text-primary-dark">SOC 2 Compliant</h3>
                <p className="text-sm text-text-light">
                  Our infrastructure and processes meet SOC 2 Type II standards, ensuring rigorous security, availability, and confidentiality controls.
                </p>
              </div>
              <div className="bg-white p-lg rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-md">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-xs text-primary-dark">Access Controls</h3>
                <p className="text-sm text-text-light">
                  Role-based access ensures only authorized users can view or modify specific documents and data. You control who sees what.
                </p>
              </div>
              <div className="bg-white p-lg rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-md">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-xs text-primary-dark">Audit Logs</h3>
                <p className="text-sm text-text-light">
                  Complete audit trail of all access, changes, and activities. Know exactly who accessed what and when for compliance and security.
                </p>
              </div>
              <div className="bg-white p-lg rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-md">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-xs text-primary-dark">Cloud Infrastructure</h3>
                <p className="text-sm text-text-light">
                  Built on enterprise-grade cloud infrastructure with automatic backups, redundancy, and disaster recovery. Your data is safe and always available.
                </p>
              </div>
              <div className="bg-white p-lg rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-md">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-xs text-primary-dark">PIPEDA Compliant</h3>
                <p className="text-sm text-text-light">
                  Fully compliant with Canadian privacy legislation (PIPEDA) and provincial privacy laws. Your personal and financial information is handled according to the highest standards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="bg-white p-xxl rounded-xl shadow-md text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-md text-primary-dark">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-text-light mb-lg max-w-[600px] mx-auto">
                Join clients who are already using the Client Portal to streamline their accounting, tax, and business advisory needs. Request access today.
              </p>
              <div className="flex gap-md justify-center flex-wrap">
                <CalendlyButton text="Request Portal Access" />
                <a href="mailto:roger.reid@rpcassociates.co" className="btn btn--secondary">
                  Email Us
                </a>
                <a href="tel:6138840208" className="btn btn--secondary">
                  Call: 613-884-0208
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default ClientPortal
