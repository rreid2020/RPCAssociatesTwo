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

## Backward Compatibility

`api/server` still supports legacy `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` only when `DATABASE_URL` is not set.
