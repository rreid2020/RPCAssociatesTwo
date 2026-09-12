import { FC } from 'react'

const About: FC = () => {
  return (
    <section id="about" className="py-xxl">
      <div className="max-w-[1200px] mx-auto px-md">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl mb-xl">
          <div>
            <span className="pill mb-md">About Axiom</span>
            <h2 className="mb-md">Practical accounting, advisory, and tech—under one roof</h2>
            <p className="mb-md">
              Axiom Financial &amp; Technology is an Ottawa boutique firm founded by Roger Reid, CPA, CMA, CGAP. We help Canadian businesses and professionals build strong financial foundations and smarter systems.
            </p>
            <p>
              We specialize in practical, plain-language advice, robust internal controls and process design, and modern, cloud-based tools for accounting and automation. You get the benefits of a seasoned accountant and consultant, with the flexibility and responsiveness of a smaller firm.
            </p>
          </div>
          <div>
            <div className="mb-lg">
              <h3 className="text-lg mb-sm text-primary">What I love most about this work</h3>
              <p>
                What I enjoy most is seeing the "lightbulb moment" when clients finally feel in control of their finances instead of overwhelmed by them. Turning messy records into clean, understandable reports, helping someone see exactly where their profit comes from, or designing a simple process that saves hours every month—that is the part of the work I truly enjoy.
              </p>
            </div>
            <div className="mb-lg">
              <h3 className="text-lg mb-sm text-primary">Why I started Axiom</h3>
              <p>
                I started Axiom because I saw two recurring problems: many businesses were receiving basic compliance services but no real strategic guidance, and owners were stuck doing manual, repetitive work that technology could easily handle. Axiom brings together accounting, business consulting, and tech solutions so clients can have accurate numbers, stronger decision-making support, and better systems from a single partner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About

