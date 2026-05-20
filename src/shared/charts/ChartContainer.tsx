import { FC, ReactNode } from 'react'

interface ChartContainerProps {
  title?: string
  children: ReactNode
}

const ChartContainer: FC<ChartContainerProps> = ({ title, children }) => (
  <div className="rounded-lg border border-border bg-white p-4">
    {title && <h3 className="text-sm font-semibold text-primary-dark mb-3">{title}</h3>}
    {children}
  </div>
)

export default ChartContainer

