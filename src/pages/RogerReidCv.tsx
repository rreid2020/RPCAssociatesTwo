import { FC } from 'react'
import SEO from '../components/SEO'
import MarketingPageHero from '../components/MarketingPageHero'

const CV_HREF = '/downloads/private/roger-reid-cv.docx'
const CV_FILENAME = 'Roger-Reid-CV-August-2026.docx'

const RogerReidCv: FC = () => {
  return (
    <>
      <SEO
        title="Roger Reid — CV"
        description="Curriculum vitae for Roger Reid, CPA, CMA, CGAP."
        canonical="/roger-reid-cv"
        noIndex
        noFollow
      />
      <main>
        <MarketingPageHero
          eyebrow="Private link"
          title="Roger Reid"
          lede="CPA, CMA, CGAP — Curriculum Vitae (August 2026). This page is unlisted and intended only for people who have been given the link."
          primary={(
            <a href={CV_HREF} download={CV_FILENAME} className="btn btn-primary">
              Download CV (.docx)
            </a>
          )}
          strip={['CPA · CMA · CGAP', 'Unlisted']}
        />
      </main>
    </>
  )
}

export default RogerReidCv
