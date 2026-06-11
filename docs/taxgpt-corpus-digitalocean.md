# TaxGPT corpus pipeline on DigitalOcean

Run CRA **expand + ingest** on DigitalOcean instead of your laptop so overnight shutdowns and local network issues do not stop indexing.

## Recommended architecture

Use an **App Platform Job** (scheduled cron) that runs one batch per tick, then exits. Each run is idempotent and picks up where the last run left off.

| Approach | Best for |
|----------|----------|
| **Scheduled job** (`taxgpt:batch` every **60 min**) | Production — survives restarts, no multi-hour timeout risk |
| **One-off job** (`taxgpt:pipeline`) | Initial backfill — trigger manually from DO console |
| **Local machine** | Debugging only |

## 1. Add the job component

In **DigitalOcean → App Platform → your app → Create → Job** (or edit `/.do/app.yaml`):

```yaml
jobs:
  - name: taxgpt-corpus
    kind: SCHEDULED
    schedule:
      cron: "0 * * * *"          # every hour (minimum interval on DO is 15 minutes)
      time_zone: America/Toronto
    dockerfile_path: client-portal/Dockerfile.taxgpt-corpus
    instance_size_slug: basic-s   # puppeteer needs more RAM than basic-xxs
    instance_count: 1
    envs:
      - key: NODE_ENV
        value: production
        scope: RUN_TIME
      - key: PUPPETEER_EXECUTABLE_PATH
        value: /usr/bin/chromium
        scope: RUN_TIME
      - key: DATABASE_URL
        scope: RUN_TIME
        type: SECRET
      - key: OPENAI_API_KEY
        scope: RUN_TIME
        type: SECRET
      - key: OPENAI_EMBED_MODEL
        value: text-embedding-3-small
        scope: RUN_TIME
```

Set **DATABASE_URL** to your **pooled** Postgres connection string (same DB the API uses).

Set **OPENAI_API_KEY** on this job component (not only on the API).

Set **CANLII_API_KEY** on the same job when received (Tax Court case law discovery runs in each `taxgpt:batch` tick).

### Run command override (DigitalOcean → taxgpt-corpus → Settings → Run command)

**Replace** the default — do not append flags (duplicate `--ingest-limit` values ignore the second one unless you use the full command below).

Recommended while catching up (each canada.ca fetch can take several minutes):

```bash
tsx src/scripts/taxgpt-corpus.ts run-batch --expand-limit=5 --ingest-limit=5
```

Or leave empty to use the Dockerfile default (`npm run taxgpt:batch` → 5 expand + 5 ingest per run).

### Schedule: avoid job pile-up

If a run takes longer than the cron interval, DigitalOcean queues another invocation (**PENDING** behind **RUNNING**).

- Use **every 60 minutes** (`0 * * * *`), not every 30 minutes, until batches finish reliably in under an hour.
- Set job **timeout** to `2h` while catching up.
- **Cancel** stale PENDING/RUNNING jobs before changing limits.
- Keep `--expand-limit=5` — `50` expand landings × ~7 min each can exceed 5 hours per run.

### Faster runs (after ingest is healthy)

- Increase job size to `basic-m` or `professional-s` if expand is CPU-bound.
- Raise limits only when canada.ca responds consistently from the job.

## 2. Manual full pipeline (one-off)

From **App Platform → taxgpt-corpus job → Run**, override the command:

```bash
npm run taxgpt:pipeline
```

This loops until expand and ingest are complete. Use for initial catch-up; prefer the hourly `taxgpt:batch` for steady state.

## 3. Monitor progress

**Runtime logs** → select `taxgpt-corpus` job.

Or run stats locally against production DB:

```bash
cd client-portal/taxgpt-api
npm run taxgpt:stats
```

Look for `embeddingCount > 0` and `retrievalReady: true`.

## 4. Commands reference

| Command | Behavior |
|---------|----------|
| `npm run taxgpt:batch` | CRA expand + CanLII discover (if key set) + ingest batch, then exit |
| `npm run taxgpt:discover-canlii` | Discover Tax Court decisions (2010–present) via CanLII API |
| `npm run taxgpt:pipeline` | Loop until fully complete (long-running) |
| `npm run taxgpt:stats` | Corpus snapshot |

## 5. Why not run on the API service?

The API component is for HTTP requests. Corpus work uses **Puppeteer**, long runtimes, and heavy CPU — it belongs in a **separate job**, not on the same `basic-xxs` API instance.

## 6. Optional: Droplet + cron

If you prefer a VPS, create a small Droplet, clone the repo, install Chromium, set `DATABASE_URL` + `OPENAI_API_KEY`, and add cron:

```cron
0 * * * * cd /opt/RPCAssociatesTwo/client-portal/taxgpt-api && npm run taxgpt:batch >> /var/log/taxgpt-corpus.log 2>&1
```

App Platform jobs are simpler to operate (no server patching, billed only while the job runs).
