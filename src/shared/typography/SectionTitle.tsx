import { FC } from 'react'

interface SectionTitleProps {
  text: string
}

const SectionTitle: FC<SectionTitleProps> = ({ text }) => (
  <h2 className="text-xl font-semibold text-primary-dark">{text}</h2>
)

export default SectionTitle

