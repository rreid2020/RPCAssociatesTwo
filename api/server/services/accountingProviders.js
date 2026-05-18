import { decryptSecret, encryptionReady } from './tokenEncryption.js'

export class AccountingDataProvider {
  constructor (connection) {
    this.connection = connection
  }

  async connect () { throw new Error('Not implemented') }
  async disconnect () { throw new Error('Not implemented') }
  async getConnectionStatus () { throw new Error('Not implemented') }
  async fetchChartOfAccounts () { throw new Error('Not implemented') }
  async fetchTrialBalance () { throw new Error('Not implemented') }
  async fetchGeneralLedger () { throw new Error('Not implemented') }
  async fetchAttachments () { throw new Error('Not implemented') }
  async postJournalEntry () { throw new Error('Not implemented') }
}

export class QuickBooksOnlineProvider extends AccountingDataProvider {
  static envRequirements () {
    return {
      configured: Boolean(
        process.env.QBO_CLIENT_ID &&
        process.env.QBO_CLIENT_SECRET &&
        process.env.QBO_REDIRECT_URI &&
        process.env.QBO_ENVIRONMENT &&
        encryptionReady()
      ),
      missing: [
        !process.env.QBO_CLIENT_ID ? 'QBO_CLIENT_ID' : null,
        !process.env.QBO_CLIENT_SECRET ? 'QBO_CLIENT_SECRET' : null,
        !process.env.QBO_REDIRECT_URI ? 'QBO_REDIRECT_URI' : null,
        !process.env.QBO_ENVIRONMENT ? 'QBO_ENVIRONMENT' : null,
        !encryptionReady() ? 'ENCRYPTION_KEY' : null
      ].filter(Boolean)
    }
  }

  async getConnectionStatus () {
    const env = QuickBooksOnlineProvider.envRequirements()
    return {
      provider: 'quickbooks_online',
      configured: env.configured,
      missingEnv: env.missing,
      status: this.connection?.connection_status || 'disconnected'
    }
  }

  async fetchChartOfAccounts () {
    throw new Error('QBO chart-of-accounts ingestion is scaffolded but not enabled')
  }

  async fetchTrialBalance () {
    throw new Error('QBO trial balance ingestion is scaffolded but not enabled')
  }

  async fetchGeneralLedger () {
    throw new Error('QBO general ledger ingestion is scaffolded but not enabled')
  }

  async fetchAttachments () {
    throw new Error('QBO attachment sync is scaffolded but not enabled')
  }

  async postJournalEntry () {
    if (process.env.ENABLE_QBO_JOURNAL_POSTING !== 'true') {
      throw new Error('QBO journal posting is disabled by feature flag')
    }
    throw new Error('QBO journal posting scaffold exists but live posting is not enabled')
  }
}

export class GoogleSheetsProvider extends AccountingDataProvider {
  static envRequirements () {
    return {
      configured: Boolean(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REDIRECT_URI
      ),
      missing: [
        !process.env.GOOGLE_CLIENT_ID ? 'GOOGLE_CLIENT_ID' : null,
        !process.env.GOOGLE_CLIENT_SECRET ? 'GOOGLE_CLIENT_SECRET' : null,
        !process.env.GOOGLE_REDIRECT_URI ? 'GOOGLE_REDIRECT_URI' : null
      ].filter(Boolean)
    }
  }

  async getConnectionStatus () {
    const env = GoogleSheetsProvider.envRequirements()
    return {
      provider: 'google_sheets',
      configured: env.configured,
      missingEnv: env.missing,
      status: this.connection?.connection_status || 'disconnected'
    }
  }

  async fetchTrialBalance () {
    throw new Error('Google Sheets ingestion is scaffolded but not enabled')
  }
}

export function createAccountingProvider (provider, connection) {
  if (provider === 'quickbooks_online') return new QuickBooksOnlineProvider(connection)
  if (provider === 'google_sheets') return new GoogleSheetsProvider(connection)
  return new AccountingDataProvider(connection)
}

export function getDecryptedConnectionTokens (connection) {
  return {
    accessToken: connection?.access_token_encrypted ? decryptSecret(connection.access_token_encrypted) : null,
    refreshToken: connection?.refresh_token_encrypted ? decryptSecret(connection.refresh_token_encrypted) : null
  }
}

