/**
 * ICFM/ICFR process template downloads.
 * Canonical files live on DigitalOcean Spaces under
 * /public/resources/excel-templates/icfm-icfr/.
 * publicPath is retained as a deploy fallback only.
 */
import { getSpacesUrl } from '../config/spaces'

export type IcfmIcfrProcessTemplate = {
  id: string
  label: string
  fileName: string
  /** Site-relative path (works after deploy without Spaces upload) */
  publicPath: string
  /** DigitalOcean Spaces public URL (after upload script / console upload) */
  spacesUrl: string
}

const SPACES_DIR = '/public/resources/excel-templates/icfm-icfr'

/**
 * Object keys currently on Spaces use Windows 8.3 short names from the upload.
 * Download `fileName` stays user-friendly for Save As.
 */
export const icfmIcfrProcessTemplates: IcfmIcfrProcessTemplate[] = [
  {
    id: 'order-to-cash',
    label: 'Order-to-Cash',
    fileName: 'Axiom-ICFR-Order-to-Cash.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-Order-to-Cash.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/ICFR_P~1.XLS`)
  },
  {
    id: 'procure-to-pay',
    label: 'Procure-to-Pay',
    fileName: 'Axiom-ICFR-Procure-to-Pay.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-Procure-to-Pay.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/ICFR_P~2.XLS`)
  },
  {
    id: 'payroll',
    label: 'Payroll',
    fileName: 'Axiom-ICFR-Payroll.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-Payroll.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/ICFR_P~3.XLS`)
  },
  {
    id: 'financial-close-reporting',
    label: 'Financial Close & Reporting',
    fileName: 'Axiom-ICFR-Financial-Close-Reporting.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-Financial-Close-Reporting.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/ICFR_P~4.XLS`)
  },
  {
    id: 'fixed-assets',
    label: 'Fixed Assets',
    fileName: 'Axiom-ICFR-Fixed-Assets.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-Fixed-Assets.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/ICB1A2~1.XLS`)
  },
  {
    id: 'treasury-cash-management',
    label: 'Treasury & Cash Management',
    fileName: 'Axiom-ICFR-Treasury-Cash-Management.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-Treasury-Cash-Management.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/ICB877~1.XLS`)
  },
  {
    id: 'it-general-controls',
    label: 'IT General Controls',
    fileName: 'Axiom-ICFR-IT-General-Controls.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-IT-General-Controls.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/IC9B9B~1.XLS`)
  }
]

/** Serve downloads from DigitalOcean Spaces (objects must be public-read). */
export const USE_ICFM_ICFR_SPACES_URLS = true

export const getIcfmIcfrDownloadUrl = (template: IcfmIcfrProcessTemplate): string =>
  USE_ICFM_ICFR_SPACES_URLS ? template.spacesUrl : template.publicPath
