/**
 * ICFM/ICFR process template downloads.
 * Files live in public/downloads (served with the site) and mirror to Spaces
 * at /public/resources/excel-templates/icfm-icfr/ when uploaded.
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

export const icfmIcfrProcessTemplates: IcfmIcfrProcessTemplate[] = [
  {
    id: 'order-to-cash',
    label: 'Order-to-Cash',
    fileName: 'Axiom-ICFR-Order-to-Cash.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-Order-to-Cash.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/Axiom-ICFR-Order-to-Cash.xlsx`)
  },
  {
    id: 'procure-to-pay',
    label: 'Procure-to-Pay',
    fileName: 'Axiom-ICFR-Procure-to-Pay.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-Procure-to-Pay.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/Axiom-ICFR-Procure-to-Pay.xlsx`)
  },
  {
    id: 'payroll',
    label: 'Payroll',
    fileName: 'Axiom-ICFR-Payroll.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-Payroll.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/Axiom-ICFR-Payroll.xlsx`)
  },
  {
    id: 'financial-close-reporting',
    label: 'Financial Close & Reporting',
    fileName: 'Axiom-ICFR-Financial-Close-Reporting.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-Financial-Close-Reporting.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/Axiom-ICFR-Financial-Close-Reporting.xlsx`)
  },
  {
    id: 'fixed-assets',
    label: 'Fixed Assets',
    fileName: 'Axiom-ICFR-Fixed-Assets.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-Fixed-Assets.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/Axiom-ICFR-Fixed-Assets.xlsx`)
  },
  {
    id: 'treasury-cash-management',
    label: 'Treasury & Cash Management',
    fileName: 'Axiom-ICFR-Treasury-Cash-Management.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-Treasury-Cash-Management.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/Axiom-ICFR-Treasury-Cash-Management.xlsx`)
  },
  {
    id: 'it-general-controls',
    label: 'IT General Controls',
    fileName: 'Axiom-ICFR-IT-General-Controls.xlsx',
    publicPath: '/downloads/excel-templates/icfm-icfr/Axiom-ICFR-IT-General-Controls.xlsx',
    spacesUrl: getSpacesUrl(`${SPACES_DIR}/Axiom-ICFR-IT-General-Controls.xlsx`)
  }
]

/** Prefer Spaces URLs once uploaded; publicPath works immediately after web deploy. */
export const USE_ICFM_ICFR_SPACES_URLS = false

export const getIcfmIcfrDownloadUrl = (template: IcfmIcfrProcessTemplate): string =>
  USE_ICFM_ICFR_SPACES_URLS ? template.spacesUrl : template.publicPath
