import { FC } from 'react'
import SEO from '../components/SEO'

const Privacy: FC = () => {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="RPC Associates Privacy Policy - Learn how we collect, use, and protect your personal information when you use our accounting, consulting, and tech services."
        canonical="/privacy"
      />
      <main className="py-xxl min-h-[60vh]">
      <div className="max-w-[900px] mx-auto px-md">
        <div className="leading-relaxed">
          <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-md">Privacy Policy</h1>
          
          <p className="text-text-light text-sm mb-lg pb-md border-b border-border">
            <strong>Last Updated:</strong> January 1, 2025
          </p>

          <div className="bg-background p-md rounded-lg mb-lg">
            <p className="mb-xs"><strong>Company Name:</strong> RPC Associates – Accounting, Consulting, and Tech Solutions</p>
            <p className="mb-0"><strong>Website:</strong> rpcassociates.co</p>
          </div>

          <p>
            RPC Associates ("we," "our," or "us") is committed to protecting the privacy, confidentiality, and security of personal information entrusted to us. This Privacy Policy outlines how we collect, use, disclose, store, and protect your information when you visit our website, use our software tools, or engage our accounting, consulting, or technology services.
          </p>

          <p>
            By using our website or services, you consent to the practices described in this policy.
          </p>

          <section className="mb-xl mt-xl">
            <h2 className="text-3xl font-semibold text-primary mt-xl mb-md pb-xs border-b-2 border-primary">1. Information We Collect</h2>
            <p className="mb-md">We may collect the following types of information:</p>

            <h3 className="text-xl font-semibold text-text mt-lg mb-sm">A. Personal Information</h3>
            <p className="mb-md">Information you provide directly, including:</p>
            <ul className="mb-md pl-lg">
              <li className="mb-sm">Name, address, email address, phone number</li>
              <li className="mb-sm">Identification information required for accounting or tax engagements</li>
              <li className="mb-sm">Financial information provided for advisory or tax preparation services</li>
              <li className="mb-sm">Documents uploaded through our secure client portal</li>
              <li className="mb-sm">Login credentials for our technology platforms (handled securely using authentication providers)</li>
            </ul>

            <h3 className="text-xl font-semibold text-text mt-lg mb-sm">B. Automatically Collected Information</h3>
            <p className="mb-md">When you access our website or online tools, we may collect:</p>
            <ul className="mb-md pl-lg">
              <li className="mb-sm">IP address and browser type</li>
              <li className="mb-sm">Device information</li>
              <li className="mb-sm">Pages visited and usage behavior</li>
              <li className="mb-sm">Cookies or similar technologies if enabled</li>
            </ul>

            <h3 className="text-xl font-semibold text-text mt-lg mb-sm">C. Client Portal & SaaS Platform Data</h3>
            <p className="mb-md">For users of our secure online systems, we may also collect:</p>
            <ul className="mb-md pl-lg">
              <li className="mb-sm">Files exchanged between you and our firm</li>
              <li className="mb-sm">Data required to operate our applications (e.g., workflow automation, accounting tools)</li>
              <li className="mb-sm">Technical logs for system performance and security</li>
            </ul>
          </section>

          <section className="mb-xl mt-xl">
            <h2 className="text-3xl font-semibold text-primary mt-xl mb-md pb-xs border-b-2 border-primary">2. How We Use Your Information</h2>
            <p>We use personal information only for purposes that a reasonable person would consider appropriate in the circumstances, including:</p>
            <ul className="mb-md pl-lg">
              <li className="mb-sm">Providing accounting, tax, consulting, and technology services</li>
              <li className="mb-sm">Communicating with you about your file, account, or inquiries</li>
              <li className="mb-sm">Operating, maintaining, and improving our website and software platforms</li>
              <li className="mb-sm">Processing payments or billing</li>
              <li className="mb-sm">Ensuring system security and fraud prevention</li>
              <li className="mb-sm">Meeting professional, legal, and regulatory obligations in Canada</li>
              <li className="mb-sm">Developing new tools, features, and services</li>
            </ul>
            <p><strong>We do not sell your personal information.</strong></p>
          </section>

          <section className="mb-xl mt-xl">
            <h2 className="text-3xl font-semibold text-primary mt-xl mb-md pb-xs border-b-2 border-primary">3. Sharing of Information</h2>
            <p className="mb-md">We may share information only in the following circumstances:</p>

            <h3 className="text-xl font-semibold text-text mt-lg mb-sm">A. With Your Consent</h3>
            <p className="mb-md">When you explicitly authorize us to share information with third parties.</p>

            <h3 className="text-xl font-semibold text-text mt-lg mb-sm">B. Service Providers</h3>
            <p className="mb-md">Trusted third-party providers who assist with:</p>
            <ul className="mb-md pl-lg">
              <li className="mb-sm">Secure hosting (e.g., DigitalOcean, cloud storage)</li>
              <li className="mb-sm">Authentication and access control (e.g., Clerk)</li>
              <li className="mb-sm">Payment processing (e.g., Stripe)</li>
              <li className="mb-sm">Email communications</li>
              <li className="mb-sm">Data backup and security</li>
            </ul>
            <p className="mb-md">These providers are contractually required to maintain confidentiality and comply with applicable privacy laws.</p>

            <h3 className="text-xl font-semibold text-text mt-lg mb-sm">C. Legal Requirements</h3>
            <p className="mb-md">We may disclose information to comply with:</p>
            <ul className="mb-md pl-lg">
              <li className="mb-sm">Federal or provincial laws</li>
              <li className="mb-sm">Professional accounting or tax regulation</li>
              <li className="mb-sm">Court orders or governmental requests</li>
            </ul>
          </section>

          <section className="mb-xl mt-xl">
            <h2 className="text-3xl font-semibold text-primary mt-xl mb-md pb-xs border-b-2 border-primary">4. Data Security</h2>
            <p className="mb-md">We implement multiple layers of administrative, physical, and technical safeguards, including but not limited to:</p>
            <ul className="mb-md pl-lg">
              <li className="mb-sm">Encryption for data in transit and at rest</li>
              <li className="mb-sm">Secure document portal with granular access controls</li>
              <li className="mb-sm">Multi-factor authentication (where available)</li>
              <li className="mb-sm">Firewalls, intrusion detection, and monitoring</li>
              <li className="mb-sm">Regular backup and disaster-recovery protocols</li>
              <li className="mb-sm">Principle of least privilege and role-based access to client data</li>
              <li className="mb-sm">Ongoing review of security practices</li>
            </ul>
            <p className="mb-md">Despite strong safeguards, no method of electronic transmission or storage is completely risk-free.</p>
          </section>

          <section className="mb-xl mt-xl">
            <h2 className="text-3xl font-semibold text-primary mt-xl mb-md pb-xs border-b-2 border-primary">5. Data Retention</h2>
            <p className="mb-md">We retain personal information only as long as necessary to:</p>
            <ul className="mb-md pl-lg">
              <li className="mb-sm">Fulfill the purpose for which it was collected</li>
              <li className="mb-sm">Comply with professional standards and legal obligations</li>
              <li className="mb-sm">Resolve disputes and enforce agreements</li>
            </ul>
            <p className="mb-md">When information is no longer required, we securely destroy or anonymize it.</p>
          </section>

          <section className="mb-xl mt-xl">
            <h2 className="text-3xl font-semibold text-primary mt-xl mb-md pb-xs border-b-2 border-primary">6. Your Rights and Choices</h2>
            <p className="mb-md">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="mb-md pl-lg">
              <li className="mb-sm">Access the personal information we hold about you</li>
              <li className="mb-sm">Request corrections or updates</li>
              <li className="mb-sm">Withdraw consent for certain uses (subject to legal limitations)</li>
              <li className="mb-sm">Request deletion where appropriate</li>
              <li className="mb-sm">Request information about how your data is processed</li>
            </ul>
            <p className="mb-md">To submit a request, contact us using the information below.</p>
          </section>

          <section className="mb-xl mt-xl">
            <h2 className="text-3xl font-semibold text-primary mt-xl mb-md pb-xs border-b-2 border-primary">7. Cookies and Tracking Technologies</h2>
            <p className="mb-md">Our website may use cookies to:</p>
            <ul className="mb-md pl-lg">
              <li className="mb-sm">Improve user experience</li>
              <li className="mb-sm">Track usage analytics</li>
              <li className="mb-sm">Personalize content</li>
            </ul>
            <p className="mb-md">You can disable cookies in your browser settings, though this may affect website functionality.</p>
          </section>

          <section className="mb-xl mt-xl">
            <h2 className="text-3xl font-semibold text-primary mt-xl mb-md pb-xs border-b-2 border-primary">8. Third-Party Links</h2>
            <p className="mb-md">
              Our website may contain links to external websites. We are not responsible for their privacy practices or content. We encourage you to review any third-party policies before sharing personal information.
            </p>
          </section>

          <section className="mb-xl mt-xl">
            <h2 className="text-3xl font-semibold text-primary mt-xl mb-md pb-xs border-b-2 border-primary">9. Children's Privacy</h2>
            <p className="mb-md">
              Our services are not intended for individuals under 16 unless parental or legal guardian consent is provided. We do not knowingly collect information from minors without proper authorization.
            </p>
          </section>

          <section className="mb-xl mt-xl">
            <h2 className="text-3xl font-semibold text-primary mt-xl mb-md pb-xs border-b-2 border-primary">10. Changes to This Privacy Policy</h2>
            <p className="mb-md">
              We may update this Privacy Policy periodically. Changes will be posted on this page with an updated revision date. Continued use of our services indicates acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-xl mt-xl">
            <h2 className="text-3xl font-semibold text-primary mt-xl mb-md pb-xs border-b-2 border-primary">11. Contact Information</h2>
            <p className="mb-md">For questions, concerns, or requests related to this Privacy Policy, please contact:</p>
            <div className="bg-background p-md rounded-lg mt-md">
              <p className="mb-sm"><strong>RPC Associates – Accounting, Consulting, and Tech Solutions</strong></p>
              <p className="mb-sm">
                <strong>Email:</strong> <a href="mailto:roger.reid@rpcassociates.co" className="text-primary hover:underline">roger.reid@rpcassociates.co</a>
              </p>
              <p className="mb-0">
                <strong>Phone:</strong> <a href="tel:6138840208" className="text-primary hover:underline">613-884-0208</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
    </>
  )
}

export default Privacy

