import { FC } from 'react'
import logo from '../assets/axiom-logo.svg'

type Size = 'sm' | 'md' | 'lg'

const sizes: Record<
  Size,
  { icon: string; word: string; tag: string; line3: string }
> = {
  sm: {
    icon: 'h-8 w-8 flex-shrink-0',
    word: 'text-base font-semibold leading-none tracking-[0.2em]',
    tag: 'text-[8px] sm:text-[9px] font-medium leading-tight',
    line3: 'text-[9px] text-text-light mt-0.5 font-medium',
  },
  md: {
    icon: 'h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0',
    word: 'text-lg sm:text-[1.35rem] font-semibold leading-none tracking-[0.2em] sm:tracking-[0.22em]',
    tag: 'text-[8px] sm:text-[9px] font-medium leading-tight',
    line3: 'text-[9px] sm:text-[10px] text-text-light mt-0.5 font-medium',
  },
  lg: {
    icon: 'h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0',
    word: 'text-2xl sm:text-3xl font-semibold leading-none tracking-[0.22em] sm:tracking-[0.24em]',
    tag: 'text-[10px] sm:text-xs font-medium leading-tight',
    line3: 'text-xs sm:text-sm text-text-light mt-1 font-medium',
  },
}

export type AxiomWordmarkProps = {
  size?: Size
  /** Stacked, centered (auth pages). Default: horizontal row. */
  centered?: boolean
  /** e.g. “Client Portal” under the tagline. */
  line3?: string
  className?: string
}

/**
 * Renders the Axiom mark + AXIOM / FINANCIAL & TECHNOLOGY wordmark to match the brand lockup
 * (Cinzel + Montserrat, loaded in index.html).
 */
const AxiomWordmark: FC<AxiomWordmarkProps> = ({
  size = 'md',
  centered = false,
  line3,
  className = '',
}) => {
  const s = sizes[size]
  const flexDir = centered ? 'flex flex-col items-center' : 'flex items-center'
  const gap = centered ? 'gap-2' : 'gap-2.5 sm:gap-3'
  const textBlock = centered ? 'flex flex-col items-center text-center' : 'flex flex-col text-left min-w-0'
  const taglineRow = centered ? 'flex items-center justify-center gap-1' : 'flex items-center justify-start gap-1 sm:gap-1.5'

  return (
    <div className={`${flexDir} ${gap} ${className}`.trim()}>
      <img src={logo} alt="" className={s.icon} width={48} height={48} />
      <div className={textBlock}>
        <span className={`${s.word} font-cinzel text-primary uppercase`}>
          Axiom
        </span>
        <div className={`${taglineRow} mt-0.5 sm:mt-1`}>
          <span
            className="hidden sm:block h-px w-2 sm:w-2.5 bg-text-light/55 flex-shrink-0"
            aria-hidden
          />
          <span
            className={`${s.tag} font-montserrat uppercase text-text-light tracking-[0.14em] sm:tracking-[0.16em]`}
          >
            Financial &amp; Technology
          </span>
          <span
            className="hidden sm:block h-px w-2 sm:w-2.5 bg-text-light/55 flex-shrink-0"
            aria-hidden
          />
        </div>
        {line3 ? <p className={s.line3 + ' font-montserrat'}>{line3}</p> : null}
      </div>
    </div>
  )
}

export default AxiomWordmark
