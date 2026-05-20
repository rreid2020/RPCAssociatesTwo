import { FC, ReactNode } from 'react'

interface PageSectionProps {
  title?: string
  description?: string
  children: ReactNode
}

const PageSection: FC<PageSectionProps> = ({ title, description, children }) => (
  <section className="space-y-3">
    {(title || description) && (
      <header>
        {title && <h2 className="text-xl font-semibold text-primary-dark">{title}</h2>}
        {description && <p className="text-sm text-text-light mt-1">{description}</p>}
      </header>
    )}
    {children}
  </section>
)

export default PageSection

