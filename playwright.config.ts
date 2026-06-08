import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { defineConfig, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })
const employeeAuthFile = path.join(__dirname, 'e2e/.auth/employee.json')
const hasEmployeeCredentials = Boolean(
  process.env.E2E_EMPLOYEE_EMAIL && process.env.E2E_EMPLOYEE_PASSWORD
)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  globalSetup: hasEmployeeCredentials ? './e2e/global-setup.ts' : undefined,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    storageState: hasEmployeeCredentials ? employeeAuthFile : undefined
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
    {
      command: 'node server.js',
      cwd: path.join(__dirname, 'api/server'),
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000
    },
    {
      command: 'npx vite --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_FORCE_ENTERPRISE_ACCESS: 'false'
      }
    }
  ]
})
