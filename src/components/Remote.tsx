import { FC } from 'react'

const services = [
  {
    label: 'Secure cloud accounting platforms',
    text: 'for real-time access to your numbers',
  },
  {
    label: 'Encrypted document sharing',
    text: 'to send and receive sensitive information safely',
  },
  {
    label: 'Video meetings and screen-sharing',
    text: 'for walkthroughs, training, and discussions',
  },
  {
    label: 'Shared dashboards and reporting',
    text: 'so you always know where things stand',
  },
] as const

const Remote: FC = () => {
  return (
    <div className="svc-landing">
      <section id="remote">
        <div className="wrap">
          <p className="eyebrow">How we work</p>
          <h2>Remote &amp; online services</h2>
          <p className="intro">
            Most of our services are designed to be delivered fully remotely, so you can work with us
            wherever you are without sacrificing security or personal service.
          </p>
          <div className="offer">
            <div className="offer-main">
              <h3>How engagement works remotely</h3>
              <ul className="checklist">
                {services.map((service) => (
                  <li key={service.label}>
                    <strong>{service.label}</strong>
                    {' '}
                    {service.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="offer-side">
              <div className="k">Delivery model</div>
              <div className="price">Remote-first</div>
              <p>
                Whether you are across town or across the country, you can work with us as if we were
                down the hall.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Remote
