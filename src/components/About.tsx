import { FC } from 'react'

const About: FC = () => {
  const benefits = [
    'Integrated approach: Accounting + Consulting + Tech',
    'Clear, jargon-free communication',
    'Tailored solutions, not templates',
    'Proactive, not reactive'
  ]

  return (
    <section id="about" className="section">
      <div className="container">
        <div className="about__container">
          <div className="about__content">
            <span className="about__pill">About RPC Associates</span>
            <h2>Practical accounting, advisory, and tech—under one roof</h2>
            <p>
              RPC Associates, Accounting, Consulting, and Tech Solutions is a boutique firm focused on helping businesses and professionals build strong financial foundations and smarter systems.
            </p>
            <p>
              We specialize in practical, plain-language advice, robust internal controls and process design, and modern, cloud-based tools for accounting and automation. You get the benefits of a seasoned accountant and consultant, with the flexibility and responsiveness of a smaller firm.
            </p>
          </div>
          <div className="about__sub-sections">
            <div className="about__sub-section">
              <h4>What I love most about this work</h4>
              <p>
                What I enjoy most is seeing the "lightbulb moment" when clients finally feel in control of their finances instead of overwhelmed by them. Turning messy records into clean, understandable reports, helping someone see exactly where their profit comes from, or designing a simple process that saves hours every month—that is the part of the work I truly enjoy.
              </p>
            </div>
            <div className="about__sub-section">
              <h4>Why I started RPC Associates</h4>
              <p>
                I started RPC Associates because I saw two recurring problems: many businesses were receiving basic compliance services but no real strategic guidance, and owners were stuck doing manual, repetitive work that technology could easily handle. RPC Associates brings together accounting, business consulting, and tech solutions so clients can have accurate numbers, stronger decision-making support, and better systems from a single partner.
              </p>
            </div>
          </div>
        </div>
        <div className="about__benefits">
          {benefits.map((benefit, index) => (
            <div key={index} className="about__benefit">{benefit}</div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default About

