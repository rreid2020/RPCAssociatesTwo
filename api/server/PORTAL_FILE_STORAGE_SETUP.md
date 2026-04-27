# Step-by-step: File repository + DigitalOcean Spaces

Follow these in order. Uploads use **your API** to get a presigned URL, then the **browser** sends the file **directly to your Space** (S3 API). The API also needs **Clerk** and **Postgres** (already set up for the rest of the portal).

---

## 1) Confirm you have a Space (bucket)

1. In **DigitalOcean** → **Spaces** → your bucket (e.g. `rpc-associates-space`).
2. Note the **region** (e.g. `tor1` = Toronto). You will use the **regional endpoint**, not the “CDN” URL, for the API.
3. **File listing** can stay “Restricted”; that does not block presigned uploads.

---

## 2) Create (or find) a Spaces access key

1. **DigitalOcean** → **API** → **Spaces keys** (or from the Space → **Access keys**).
2. Create a key with **read/write** to your bucket.
3. Save **two values** (the secret is shown only once):
   - **Access Key** → maps to `DO_SPACES_KEY`
   - **Secret** → maps to `DO_SPACES_SECRET`  
4. If you lost the secret, create a new key and update the API env.

---

## 3) CORS on the Space (required for browser uploads)

The browser `PUT`s the file to DigitalOcean. The Space must allow your **website origin(s)** and the **PUT** method.

1. Open your **Space** → **Settings** → **CORS** (or CORS configurations).
2. For **each origin** where users open the app, add a rule (or one rule with multiple origins, if the UI allows it), for example:
   - `https://rpcassociates.co`  
   - `https://www.rpcassociates.co` (if you use it)  
   - `https://axiomft.ca` and `https://www.axiomft.ca` (if the portal is there)  
   - `https://portal.axiomft.ca` (if you use a portal subdomain)  
   - `http://localhost:5173` (local dev with Vite)
3. **Allowed methods** must include at least: **GET**, **PUT**, **HEAD** (and often **POST** / **DELETE** for future use).
4. **Allowed headers** must include **`Content-Type`** (or use `*` if the UI allows it).

**Common mistake:** only `GET` and `HEAD` are allowed → uploads fail after “presign” with a network / CORS error.

---

## 4) Set environment variables on the **API** (Node / Express)

These must be available to the process that runs `node server.js` (e.g. **App Platform** `api` service, or `api/server` on your host). They are **not** Vite/frontend variables (except you may set `VITE_API_BASE_URL` on the **web** build—see step 6).

| Variable | Example (Toronto `tor1`, bucket `rpc-associates-space`) |
|----------|--------------------------------------------------------|
| `DO_SPACES_ENDPOINT` | `https://tor1.digitaloceanspaces.com` |
| `DO_SPACES_BUCKET` | `rpc-associates-space` |
| `DO_SPACES_KEY` | Your Spaces access key ID |
| `DO_SPACES_SECRET` | Your Spaces secret key |
| `DO_SPACES_REGION` | `us-east-1` (works with most Spaces + AWS SDK v3 examples; if presign fails, try `tor1` per [DO Spaces docs](https://docs.digitalocean.com/products/spaces/reference/s3-compatibility/)) |
| `CLERK_SECRET_KEY` | From Clerk dashboard → your app → **API keys** (required in production for `/api/portal`) |
| `ALLOWED_ORIGINS` | Comma-separated list of your real site URLs (no spaces after commas is safest), e.g. `https://rpcassociates.co,https://www.rpcassociates.co,https://axiomft.ca,https://www.axiomft.ca,https://portal.axiomft.ca,http://localhost:5173` |

**Do not** set `DO_SPACES_*` in the Vite “web” app unless you only use them server-side in a custom setup—the file upload flow reads them in **api/server** only.

---

## 5) Redeploy the API and check logs

1. Deploy / restart the API.
2. In logs, you should see a line like:  
   `[portal files] Object storage: configured (bucket: rpc-associates-space, endpoint: tor1.digitaloceanspaces.com)`  
3. If you see **NOT configured**, one of the four `DO_SPACES_*` values is missing, wrong, or not passed to that service.

---

## 6) Frontend → API URL (production)

- **Same host, path routing:** If your static site and API share one domain and `/api` routes to the API (e.g. App Platform: `web` on `/`, `api` on `/api`), you usually **do not** set `VITE_API_BASE_URL`; the app calls `/api/portal` on the same origin.
- **Split domains:** If the site is on `https://a.com` but the API is on `https://api.b.com`, set at **build time** for the web app:  
  `VITE_API_BASE_URL=https://api.b.com`  
  and add `https://a.com` to the API’s **CORS** `ALLOWED_ORIGINS`.

---

## 7) Local development

1. **Terminal A** (repo root): `npm run dev` → Vite, port **5173** (proxies `/api` → 3000).
2. **Terminal B**: `cd api/server && npm install && npm start` → API on **3000**.
3. In `api/server`, copy `.env.example` to `.env` and fill in DB, `CLERK_SECRET_KEY`, and all `DO_SPACES_*` values.
4. Open the portal, sign in, go to **File repository**. The yellow “uploads off” banner should disappear when step 5’s log line is present.

---

## 8) Test an upload

1. Open browser **DevTools** → **Network**.
2. Upload a small file.
3. You should see: a request to `.../api/portal/v1/files/presign-put` (200), then a **PUT** to `*.digitaloceanspaces.com` (200/204), then `.../v1/files/complete` (200).
4. The file should appear in the list and in Postgres `taxgpt.portal_client_files`.

---

## 9) Still broken? Quick checks

| Symptom | What to check |
|--------|----------------|
| Yellow “object storage is not configured” | API env + redeploy; logs for `Object storage: configured` |
| Presign 401 / 503 on portal | `CLERK_SECRET_KEY` on API; user signed in |
| Presign 200, then PUT fails (CORS / network) | Space CORS: **PUT** + your **exact** origin |
| Presign 200, PUT 403 | Key permissions, bucket name, endpoint/region |
| Complete 400 “Invalid key” | Same user as presign; don’t change Clerk between steps |

---

## 10) Security

- Treat `DO_SPACES_SECRET` and `CLERK_SECRET_KEY` as secrets; use encrypted env in App Platform.
- Rotate Spaces keys if they were exposed (e.g. in a screenshot or chat).

---

**Copy-paste for `.env` (api/server, local):** see `.env.example` in this folder.
