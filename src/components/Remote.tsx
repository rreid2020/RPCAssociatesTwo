import { FC } from 'react'

const Remote: FC = () => {
  const services = [
    {
      label: 'Secure cloud accounting platforms',
      text: 'for real-time access to your numbers'
    },
    {
      label: 'Encrypted document sharing',
      text: 'to send and receive sensitive information safely'
    },
    {
      label: 'Video meetings and screen-sharing',
      text: 'for walkthroughs, training, and discussions'
    },
    {
      label: 'Shared dashboards and reporting',
      text: 'so you always know where things stand'
    }
  ]

  return (
    <section id="remote" className="section">
      <div className="container">
        <div className="section__header">
          <h2 className="section__title">Remote & Online Services</h2>
          <p className="section__subtitle">
            Most of our services are designed to be delivered fully remotely, so you can work with us wherever you are without sacrificing security or personal service.
          </p>
        </div>
        <div className="remote__container">
          <div className="remote__content">
            <p>
              Our services are delivered remotely using secure cloud tools that ensure your data is protected while providing seamless collaboration and real-time access to your financial information.
            </p>
          </div>
          <div className="remote__list-wrapper">
            <ul className="remote__list">
              {services.map((service, index) => (
                <li key={index} className="remote__item">
                  <strong>{service.label}</strong> {service.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="remote__closing">
          Whether you are across town or across the country, you can work with us as if we were down the hall.
        </p>
      </div>
    </section>
  )
}

export default Remote

