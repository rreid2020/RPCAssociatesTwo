import { FC } from 'react'
import SEO from '../components/SEO'

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
      <main className="py-xxl min-h-[60vh]">
        <div className="max-w-[640px] mx-auto px-md">
          <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-md">
            Roger Reid
          </h1>
          <p className="text-lg text-text-light mb-xl">
            CPA, CMA, CGAP — Curriculum Vitae (August 2026)
          </p>
          <p className="text-text mb-xl leading-relaxed">
            Download the current CV as a Word document. This page is unlisted and
            intended only for people who have been given the link.
          </p>
          <a
            href={CV_HREF}
            download={CV_FILENAME}
            className="btn btn--primary inline-flex items-center gap-2"
          >
            Download CV (.docx)
          </a>
        </div>
      </main>
    </>
  )
}

export default RogerReidCv
