# Database Environment Standard

Use one canonical connection string across runtime and migrations:

- `api/server` runtime: `DATABASE_URL`
- `client-portal` migrations: `DATABASE_URL`

Use the exact same value in:

- `api/server/.env`
- `client-portal/.env`

## Recommended Format

`postgres://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require`

## Why

- Prevents API pointing at one database while migrations run on another.
- Eliminates split-brain between `axiomft` and `defaultdb`.
- Makes local and deployed behavior consistent.

## Backward Compatibility

`api/server` still supports legacy `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` only when `DATABASE_URL` is not set.
