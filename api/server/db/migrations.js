/**
 * Database migration functions
 * Run these to create the necessary tables
 */

export async function createLeadsTable(pool) {
  const query = `
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      business_phone VARCHAR(50) NOT NULL,
      business_type VARCHAR(100) NOT NULL,
      business_owner_status VARCHAR(100) NOT NULL,
      speak_to_advisor BOOLEAN DEFAULT FALSE,
      marketing_consent BOOLEAN NOT NULL,
      resource_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_resource_name ON leads(resource_name);
  `
  
  await pool.query(query)
  console.log('Leads table created/verified')
}

export async function createContactsTable(pool) {
  const query = `
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
    CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
  `
  
  await pool.query(query)
  console.log('Contacts table created/verified')
}
