import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { clerk, clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright'
import { chromium, type FullConfig } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authDir = path.join(__dirname, '.auth')
const authFile = path.join(authDir, 'employee.json')

async function globalSetup (config: FullConfig) {
  const email = process.env.E2E_EMPLOYEE_EMAIL
  const password = process.env.E2E_EMPLOYEE_PASSWORD
  if (!email || !password) {
    return
  }

  await clerkSetup()

  fs.mkdirSync(authDir, { recursive: true })

  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:5173'
  const browser = await chromium.launch()
  const context = await browser.newContext()
  await setupClerkTestingToken({ context })
  const page = await context.newPage()

  await page.goto(`${baseURL}/portal/sign-in`, { waitUntil: 'networkidle' })

  try {
    await clerk.signIn({ page, emailAddress: email })
    await page.goto(`${baseURL}/portal/post-auth`, { waitUntil: 'networkidle' })
    await page.waitForURL(
      (url) => !url.pathname.includes('/portal/sign-in') && !url.pathname.includes('/portal/post-auth'),
      { timeout: 60_000 }
    )
  } catch (error) {
    throw new Error(
      [
        'Employee sign-in did not complete for E2E global setup.',
        `Current URL: ${page.url()}`,
        'Confirm the Clerk test user exists in the same Clerk app as VITE_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY.',
        'The user must be assigned organization role employee in your test workspace.',
        'If Clerk requires email verification for password sign-in, create the user in test mode or use a dedicated automation account.'
      ].join('\n'),
      { cause: error }
    )
  }

  await page.goto(`${baseURL}/portal/accounting/company-profile`, { waitUntil: 'networkidle' })

  if (page.url().includes('/portal/subscription')) {
    throw new Error(
      [
        'Playwright signed in, but the app redirected to organization onboarding/subscription.',
        'This usually means the E2E user cannot see an active, onboarded team workspace.',
        '',
        'Checklist:',
        `- E2E_EMPLOYEE_EMAIL must exactly match the Clerk user primary email (${email}).`,
        '- Portal roster status must be active (deactivated/inactive employees are blocked from the workspace).',
        '- The user must be an organization employee on your firm workspace (not only a Clerk user).',
        '- Pending invites must be linked to the Clerk account (sign in once through the portal, or let Playwright global setup run /portal/post-auth).',
        '- That workspace must already be onboarded by an owner/admin; employees do not run the onboarding wizard themselves.',
        '',
        'Fix: in Roles & Permissions, remove and re-invite the employee if needed, sign in once as that user, then re-run Playwright.'
      ].join('\n')
    )
  }

  await context.storageState({ path: authFile })
  await browser.close()
}

export default globalSetup
