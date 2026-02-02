# Database Migrations

This directory contains SQL migration files for the database schema.

## Running Migrations

### Using Drizzle Kit (Recommended)

```bash
# Generate migrations from schema changes
pnpm db:generate

# Run migrations
pnpm db:migrate
```

### Manual SQL Execution

```bash
psql $DATABASE_URL -f packages/shared/src/db/migrations/0000_initial.sql
```

## Migration Files

- `0000_initial.sql` - Initial schema with all tables, indexes, and pgvector extension
- `0001_add_tax_forms.sql` - Add tax forms metadata and source references

