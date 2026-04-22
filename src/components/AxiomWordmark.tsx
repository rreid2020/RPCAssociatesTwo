import { FC } from 'react'
import markSrc from '../assets/axiom-mark.png'
import logotypeSrc from '../assets/axiom-logotype.png'

type Size = 'sm' | 'md' | 'lg'

const sizes: Record<Size, { mark: string; logotype: string; line3: string }> = {
  sm: {
    mark: 'h-8 w-auto sm:h-9',
    logotype: 'h-7 w-auto sm:h-8 max-w-[min(100%,11rem)]',
    line3: 'text-[9px] sm:text-[10px] text-text-light mt-0.5',
  },
  md: {
    mark: 'h-9 w-auto sm:h-10 md:h-11',
    logotype: 'h-8 w-auto sm:h-9 md:h-10 max-w-[min(100%,16rem)] sm:max-w-none',
    line3: 'text-[9px] sm:text-[10px] text-text-light mt-0.5',
  },
  lg: {
    mark: 'h-12 w-auto sm:h-14',
    logotype: 'h-10 w-auto sm:h-12',
    line3: 'text-xs sm:text-sm text-text-light mt-1',
  },
}

export type AxiomWordmarkProps = {
  size?: Size
  /** Lockup centered (e.g. sign-in page). */
  centered?: boolean
  /** e.g. “Client Portal” under the mark + logotype. */
  line3?: string
  className?: string
}

/**
 * A mark + logotype from provided brand art, vertically centered in one row.
 */
const AxiomWordmark: FC<AxiomWordmarkProps> = ({
  size = 'md',
  centered = false,
  line3,
  className = '',
}) => {
  const s = sizes[size]
  return (
    <div
      className={`${
        centered ? 'flex flex-col items-center' : 'flex flex-col'
      } min-w-0 ${className}`.trim()}
    >
      <div
        className={`flex items-center ${
          centered ? 'justify-center' : 'justify-start'
        } gap-2 sm:gap-3 min-w-0`}
      >
        <img
          src={markSrc}
          alt=""
          width={64}
          height={64}
          className={`${s.mark} object-contain object-center flex-shrink-0 select-none`}
          aria-hidden
        />
        <img
          src={logotypeSrc}
          alt="Axiom Financial & Technology"
          width={200}
          height={80}
          className={`${s.logotype} object-contain object-left flex-shrink-0 min-w-0`}
        />
      </div>
      {line3 ? (
        <p
          className={`${s.line3} ${
            centered ? 'text-center' : 'text-left'
          } leading-tight`}
        >
          {line3}
        </p>
      ) : null}
    </div>
  )
}

export default AxiomWordmark
