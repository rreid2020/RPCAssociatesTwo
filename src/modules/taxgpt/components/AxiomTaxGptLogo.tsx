import { FC } from 'react'
import markSrc from '../../../assets/axiom-taxgpt-mark.svg'

type Size = 'sm' | 'md' | 'lg'

const sizes: Record<Size, { mark: string; axiom: string; taxgpt: string; gap: string }> = {
  sm: {
    mark: 'h-8 w-8',
    axiom: 'text-sm',
    taxgpt: 'text-base',
    gap: 'gap-2.5'
  },
  md: {
    mark: 'h-11 w-11',
    axiom: 'text-base',
    taxgpt: 'text-xl',
    gap: 'gap-3'
  },
  lg: {
    mark: 'h-14 w-14',
    axiom: 'text-lg',
    taxgpt: 'text-2xl',
    gap: 'gap-3.5'
  }
}

export type AxiomTaxGptLogoProps = {
  size?: Size
  className?: string
}

const AxiomTaxGptLogo: FC<AxiomTaxGptLogoProps> = ({ size = 'md', className = '' }) => {
  const s = sizes[size]

  return (
    <div className={`inline-flex items-center justify-center ${s.gap} ${className}`.trim()}>
      <img
        src={markSrc}
        alt=""
        width={48}
        height={48}
        className={`${s.mark} shrink-0 select-none`}
        aria-hidden
      />
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className={`${s.axiom} font-medium text-text-light`}>Axiom</span>
        <span className={`${s.taxgpt} font-semibold tracking-tight text-primary-dark`}>TaxGPT</span>
      </div>
    </div>
  )
}

export default AxiomTaxGptLogo
