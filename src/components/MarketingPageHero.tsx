import { FC, ReactNode } from 'react'

type Cta = {
  href?: string
  to?: string
  label: string
  variant?: 'primary' | 'ghost' | 'solid' | 'outline'
  element?: ReactNode
}

type MarketingPageHeroProps = {
  eyebrow: string
  title: string
  lede: string
  primary?: ReactNode
  secondary?: ReactNode
  strip?: string[]
}

/** Shared dark navy hero used across marketing pages. */
const MarketingPageHero: FC<MarketingPageHeroProps> = ({
  eyebrow,
  title,
  lede,
  primary,
  secondary,
  strip,
}) => {
  return (
    <div className="svc-landing">
      <section className="hero" id="hero">
        <div className="wrap">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{lede}</p>
          {(primary || secondary) && (
            <div className="cta-row">
              {primary}
              {secondary}
            </div>
          )}
          {strip && strip.length > 0 && (
            <p className="strip">
              {strip.map((item, index) => (
                <span key={item}>
                  {index > 0 ? <> &nbsp;&middot;&nbsp; </> : null}
                  <b>{item}</b>
                </span>
              ))}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

export default MarketingPageHero
export type { MarketingPageHeroProps, Cta }
