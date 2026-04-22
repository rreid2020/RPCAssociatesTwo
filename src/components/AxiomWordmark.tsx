import { FC } from 'react'
import markSrc from '../assets/axiom-mark.png'
import logotypeSrc from '../assets/axiom-logotype.png'

type Size = 'sm' | 'md' | 'lg'

const sizes: Record<Size, { mark: string; logotype: string; line3: string }> = {
  sm: {
    mark: 'h-8 w-auto sm:h-9',
    logotype: 'h-8 w-auto sm:h-9 max-w-[min(100%,12.5rem)]',
    line3: 'text-[9px] sm:text-[10px] text-text-light mt-0.5',
  },
  /* Header: one PNG; scale height so 2nd/3rd text bands in the art read clearly. */
  md: {
    mark: 'h-9 w-auto sm:h-12 md:h-14 xl:h-[3.75rem]',
    logotype: 'h-12 w-auto sm:h-14 md:h-[4.5rem] lg:h-[5.25rem] xl:h-24 2xl:h-28',
    line3: 'text-[9px] sm:text-[10px] text-text-light mt-0.5',
  },
  lg: {
    mark: 'h-12 w-auto sm:h-16 md:h-[4.5rem]',
    logotype: 'h-12 w-auto sm:h-20 md:h-[5.5rem] lg:h-28',
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
        } gap-2.5 sm:gap-4 md:gap-5 min-w-0`}
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
