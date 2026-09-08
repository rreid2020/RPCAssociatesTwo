import { FC } from 'react'
import { Link } from 'react-router-dom'
import { services } from '../lib/services/data'

const Services: FC = () => {
  return (
    <section id="services" className="py-xxl">
      <div className="max-w-[1120px] mx-auto px-md">
        <div className="text-center mb-xl max-w-[800px] mx-auto">
          <p className="eyebrow">What we do</p>
          <h2 className="mb-md">Services</h2>
          <p className="text-lg text-text-body">
            Bringing together accounting, consulting, and technology so you have accurate numbers, practical advice, and modern systems working together.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {services.map((service) => (
            <Link
              key={service.slug}
              to={`/services/${service.slug}`}
              className="bg-white p-lg rounded border border-border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 block no-underline text-inherit"
            >
              <span className="pill mb-md">{service.pill}</span>
              <h3 className="text-xl mb-sm text-primary">{service.title}</h3>
              <p className="text-text-body mb-md text-[0.9375rem]">{service.intro}</p>
              <ul className="list-none m-0 p-0">
                {service.bullets.map((bullet, bulletIndex) => (
                  <li
                    key={bulletIndex}
                    className="pl-md mb-xs relative before:content-['•'] before:absolute before:left-0 before:text-accent before:font-bold text-[0.9375rem] text-text-body"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services
