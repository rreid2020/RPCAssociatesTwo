import { FC } from 'react'
import SEO from '../components/SEO'

const Terms: FC = () => {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="RPC Associates Terms of Service - Read our terms and conditions for using our accounting, consulting, and tech solutions services."
        canonical="/terms"
      />
      <main className="page-content">
      <div className="container">
        <div className="terms-of-service">
          <h1>Terms of Service</h1>
          
          <p className="terms-of-service__last-updated">
            <strong>Last Updated:</strong> January 1, 2025
          </p>

          <p>
            Welcome to RPC Associates, Accounting, Consulting, and Tech Solutions ("Company," "we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of our website, applications, client portals, products, and services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms. If you do not agree, please discontinue use immediately.
          </p>

          <section className="terms-of-service__section">
            <h2>1. Use of Services</h2>
            <p>You may use our Services only for lawful purposes and in accordance with these Terms. You agree not to:</p>
            <ul>
              <li>Use the Services in any manner that violates applicable laws or regulations.</li>
              <li>Attempt to gain unauthorized access to any systems, accounts, or networks.</li>
              <li>Interfere with the security or functionality of the Services.</li>
              <li>Use the Services to transmit harmful, fraudulent, or malicious content.</li>
            </ul>
            <p>We reserve the right to suspend or terminate your access if we believe you have violated these Terms.</p>
          </section>

          <section className="terms-of-service__section">
            <h2>2. Professional Advice Disclaimer</h2>
            <ul>
              <li>Content and tools provided through our website or software are for general informational purposes only and do not constitute professional accounting, tax, legal, or financial advice.</li>
              <li>For advice specific to your situation, you must consult a qualified professional.</li>
              <li>Use of automated tools, calculators, or software provided by us does not create an accountant-client relationship unless expressly stated in a written engagement agreement.</li>
            </ul>
          </section>

          <section className="terms-of-service__section">
            <h2>3. Client Portal</h2>
            <p>If you access our secure client portal:</p>
            <ul>
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You agree to notify us immediately of any unauthorized access.</li>
              <li>You must not share access with unauthorized third parties.</li>
              <li>We use industry-standard security measures; however, we cannot guarantee absolute security of electronic transmissions.</li>
            </ul>
          </section>

          <section className="terms-of-service__section">
            <h2>4. Intellectual Property</h2>
            <p>All content, branding, trademarks, text, graphics, code, and software on our website are the exclusive property of RPC Associates unless otherwise stated.</p>
            <p>You may not:</p>
            <ul>
              <li>Copy, reproduce, distribute, or create derivative works without written permission.</li>
              <li>Use our trademarks or branding without authorization.</li>
            </ul>
          </section>

          <section className="terms-of-service__section">
            <h2>5. Payments and Billing (If Applicable)</h2>
            <p>If our Services involve fees, you agree to:</p>
            <ul>
              <li>Provide accurate billing information.</li>
              <li>Pay all charges incurred under your account.</li>
              <li>Understand that certain fees may be non-refundable unless stated otherwise.</li>
            </ul>
            <p>We reserve the right to modify pricing or service features at any time with reasonable notice.</p>
          </section>

          <section className="terms-of-service__section">
            <h2>6. Third-Party Services</h2>
            <p>Our Services may integrate with or reference third-party platforms (e.g., cloud storage providers, payment processors, automation tools). We are not responsible for:</p>
            <ul>
              <li>The availability, security, or performance of third-party services.</li>
              <li>Any damages arising from the use of such third-party services.</li>
            </ul>
            <p>Use of third-party services is governed by their own terms and privacy policies.</p>
          </section>

          <section className="terms-of-service__section">
            <h2>7. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law:</p>
            <ul>
              <li>We are not liable for any indirect, incidental, special, or consequential damages arising from your use of our Services.</li>
              <li>Our total liability to you will not exceed the amount paid by you for Services in the six months preceding the claim (or $0 if no fees were paid).</li>
              <li>We make no warranties regarding accuracy, completeness, or reliability of content provided through our Services.</li>
            </ul>
          </section>

          <section className="terms-of-service__section">
            <h2>8. Indemnification</h2>
            <p>You agree to indemnify and hold harmless RPC Associates, its officers, employees, contractors, and partners from any claims, damages, liabilities, or expenses arising from:</p>
            <ul>
              <li>Your use or misuse of the Services.</li>
              <li>Your violation of these Terms or any applicable law.</li>
              <li>Content you submit or upload through our platform.</li>
            </ul>
          </section>

          <section className="terms-of-service__section">
            <h2>9. Termination</h2>
            <p>We may terminate or restrict your access to the Services at our discretion, without notice, if we believe you have violated these Terms.</p>
            <p>Upon termination:</p>
            <ul>
              <li>Your right to use the Services immediately ceases.</li>
              <li>Sections relating to intellectual property, limitation of liability, indemnification, and governing law continue to apply.</li>
            </ul>
          </section>

          <section className="terms-of-service__section">
            <h2>10. Governing Law</h2>
            <p>These Terms are governed by the laws of the Province of Ontario and the laws of Canada applicable therein.</p>
            <p>Any disputes shall be resolved in the courts of Ontario, unless otherwise agreed in writing.</p>
          </section>

          <section className="terms-of-service__section">
            <h2>11. Changes to These Terms</h2>
            <p>
              We may update or modify these Terms at any time. The "Last Updated" date reflects the most recent revision. Continued use of the Services constitutes acceptance of updated Terms.
            </p>
          </section>

          <section className="terms-of-service__section">
            <h2>12. Contact Information</h2>
            <p>If you have questions about these Terms, you may contact us at:</p>
            <div className="terms-of-service__contact">
              <p><strong>RPC Associates, Accounting, Consulting, and Tech Solutions</strong></p>
              <p>
                <strong>Email:</strong> <a href="mailto:roger.reid@rpcassociates.co">roger.reid@rpcassociates.co</a>
              </p>
              <p>
                <strong>Phone:</strong> <a href="tel:6138840208">613-884-0208</a>
              </p>
              <p>
                <strong>Website:</strong> <a href="https://rpcassociates.co">rpcassociates.co</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
    </>
  )
}

export default Terms

