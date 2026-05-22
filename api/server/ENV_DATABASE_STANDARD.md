# Database Environment Standard

Use one canonical connection string:

- `api/server` runtime: `DATABASE_URL`

Use this value in:

- `api/server/.env`

## Recommended Format

`postgres://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require`

## Why

- Prevents API and scripts from pointing at different databases.
- Eliminates split-brain between `axiomft` and `defaultdb`.
- Makes local and deployed behavior consistent.

## Enforcement

`api/server` requires `DATABASE_URL`. Legacy `DB_*` values are not read by runtime connection code.
