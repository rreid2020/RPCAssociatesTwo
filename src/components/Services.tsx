import { FC } from 'react'
import { Link } from 'react-router-dom'
import { services } from '../lib/services/data'

const Services: FC = () => {
  return (
    <div className="svc-landing">
      <section id="services" className="alt" style={{ borderTop: '1px solid var(--rule)' }}>
        <div className="wrap">
          <p className="eyebrow">What we do</p>
          <h2>Services</h2>
          <p className="intro">
            Bringing together accounting, consulting, and technology so you have accurate numbers,
            practical advice, and modern systems working together.
          </p>
          <div className="service-grid">
            {services.map((service) => (
              <Link key={service.slug} to={`/services/${service.slug}`} className="service-card">
                <div className="name">{service.pill}</div>
                <h3>{service.title}</h3>
                <p className="intro">{service.intro}</p>
                <ul>
                  {service.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Services
