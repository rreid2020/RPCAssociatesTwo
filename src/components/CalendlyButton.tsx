import { FC } from 'react'
import { Link } from 'react-router-dom'

interface CalendlyButtonProps {
  text?: string
  className?: string
}

const CalendlyButton: FC<CalendlyButtonProps> = ({ 
  text = 'Book a Consultation',
  className = 'btn btn--primary'
}) => {
  return (
    <Link 
      to="/book-consultation"
      className={className}
    >
      {text}
    </Link>
  )
}

export default CalendlyButton
