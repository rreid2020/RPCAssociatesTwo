import { FC } from 'react'

const About: FC = () => {
  return (
    <div className="svc-landing">
      <section id="about">
        <div className="wrap">
          <p className="eyebrow">About Axiom</p>
          <h2>Practical accounting, advisory, and tech — under one roof</h2>
          <p className="intro">
            Axiom Financial &amp; Technology is an Ottawa boutique firm founded by Roger Reid, CPA, CMA,
            CGAP. We help Canadian businesses and professionals build strong financial foundations and
            smarter systems.
          </p>
          <div className="detail-grid">
            <article>
              <h3>What this work is for</h3>
              <p>
                We specialize in practical, plain-language advice, robust internal controls and process
                design, and modern cloud-based tools for accounting and automation. You get the benefits
                of a seasoned accountant and consultant, with the flexibility of a smaller firm.
              </p>
            </article>
            <article>
              <h3>What I love most about this work</h3>
              <p>
                The &quot;lightbulb moment&quot; when clients finally feel in control of their finances instead
                of overwhelmed — turning messy records into clean reports, or designing a simple process
                that saves hours every month.
              </p>
            </article>
            <article>
              <h3>Why I started Axiom</h3>
              <p>
                Many businesses were getting basic compliance with no strategic guidance, while owners
                stayed stuck in manual work technology could handle. Axiom brings accounting, consulting,
                and tech together so clients get accurate numbers, better decisions, and stronger systems
                from one partner.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
