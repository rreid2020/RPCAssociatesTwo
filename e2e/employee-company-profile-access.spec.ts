import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

const COMPANY_PROFILE_PATHS = [
  '/portal/accounting/company-profile',
  '/portal/accounting/company-profile/employees',
  '/portal/accounting/company-profile/entities',
  '/portal/accounting/company-profile/roles-and-permissions'
] as const

const ROUTE_PERMISSION_LABELS = [
  'workspace.manage',
  'workspace.invite',
  'workspace.manage',
  'rbac.read'
] as const

const hasEmployeeCredentials = Boolean(
  process.env.E2E_EMPLOYEE_EMAIL && process.env.E2E_EMPLOYEE_PASSWORD
)

test.describe('employee business/firm profile access', () => {
  test.skip(
    !hasEmployeeCredentials,
    'Set E2E_EMPLOYEE_EMAIL and E2E_EMPLOYEE_PASSWORD to run Playwright auth tests.'
  )

  test.beforeEach(async ({ context }) => {
    await setupClerkTestingToken({ context })
  })

  test('does not show business/firm profile links in the sidebar', async ({ page }) => {
    await page.goto('/portal/dashboard')
    await page.waitForLoadState('networkidle')

    const sidebar = page.getByRole('navigation')
    await expect(sidebar.getByRole('link', { name: 'Business/Firm Details' })).toHaveCount(0)
    await expect(sidebar.getByRole('link', { name: 'Invite Employees' })).toHaveCount(0)
    await expect(sidebar.getByRole('link', { name: 'Roles & Permissions' })).toHaveCount(0)
  })

  for (let index = 0; index < COMPANY_PROFILE_PATHS.length; index += 1) {
    const profilePath = COMPANY_PROFILE_PATHS[index]
    const permissionLabel = ROUTE_PERMISSION_LABELS[index]

    test(`blocks direct access to ${profilePath}`, async ({ page }) => {
      await page.goto(profilePath, { waitUntil: 'networkidle' })

      if (page.url().includes('/portal/subscription')) {
        throw new Error(
          'Redirected to onboarding instead of company profile. Complete onboarding for the E2E employee account first.'
        )
      }

      await expect(page.getByRole('heading', { name: 'Premium Feature' })).toBeVisible({ timeout: 30_000 })
      await expect(page.getByText(permissionLabel)).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Business/Firm Details', exact: true })).toHaveCount(0)
    })
  }
})
