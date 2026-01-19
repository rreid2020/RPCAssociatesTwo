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
    <section id="remote" className="py-xxl">
      <div className="max-w-[1200px] mx-auto px-md">
        <div className="text-center mb-xl max-w-[800px] mx-auto">
          <h2 className="mb-md">Remote & Online Services</h2>
          <p className="text-lg text-text-light">
            Most of our services are designed to be delivered fully remotely, so you can work with us wherever you are without sacrificing security or personal service.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl items-start mb-lg max-w-[1000px] mx-auto">
          <div className="flex flex-col justify-start min-h-full">
            <p className="mb-0 leading-relaxed">
              Our services are delivered remotely using secure cloud tools that ensure your data is protected while providing seamless collaboration and real-time access to your financial information.
            </p>
          </div>
          <div className="flex flex-col justify-start">
            <ul className="list-none m-0 p-0">
              {services.map((service, index) => (
                <li key={index} className="mb-md pl-md relative leading-relaxed before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold last:mb-0">
                  <strong className="text-primary">{service.label}</strong> {service.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-center italic text-text-light mt-xl max-w-[800px] mx-auto">
          Whether you are across town or across the country, you can work with us as if we were down the hall.
        </p>
      </div>
    </section>
  )
}

export default Remote

