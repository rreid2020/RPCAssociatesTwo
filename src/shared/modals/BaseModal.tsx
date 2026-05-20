import { FC, ReactNode } from 'react'

interface BaseModalProps {
  title: string
  children: ReactNode
}

const BaseModal: FC<BaseModalProps> = ({ title, children }) => (
  <div className="rounded-lg border border-border bg-white shadow-sm">
    <div className="border-b border-border px-4 py-3">
      <h3 className="text-sm font-semibold text-primary-dark">{title}</h3>
    </div>
    <div className="px-4 py-3">{children}</div>
  </div>
)

export default BaseModal

