import { FC, ReactNode } from 'react'

interface FormFieldProps {
  label: string
  children: ReactNode
  hint?: string
}

const FormField: FC<FormFieldProps> = ({ label, children, hint }) => (
  <div>
    <label className="block text-xs text-text-light mb-1">{label}</label>
    {children}
    {hint && <p className="text-xs text-text-light mt-1">{hint}</p>}
  </div>
)

export default FormField

