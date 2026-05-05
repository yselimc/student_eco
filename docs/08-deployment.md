# 08 — Deployment

## Purpose of this document

How to run Student Ecosystem locally and how to deploy it to production. Covers env vars, Docker Compose for local Postgres, and the production stack (Render + Vercel + Neon). Read before changing anything that touches the runtime environment.

## 1. Local development

### 1.1 Prerequisites

- Python 3.11+
- Node 20+ and `pnpm`
- Docker (for local Postgres) — or a manually installed Postgres 15+
- `uv` recommended for Python deps; `pip` works fine

### 1.2 First-time setup

```bash
# 1. Clone
git clone <repo-url>
cd student_eco

# 2. Bring up Postgres
docker compose up -d db

# 3. Backend
cd backend
cp .env.example .env          # edit DB_URL etc.
uv sync                       # or: python -m venv .venv && pip install -e .
alembic upgrade head
python scripts/seed.py        # optional: insert demo data

# 4. Frontend (new terminal)
cd ../frontend
cp .env.example .env.local    # edit NEXT_PUBLIC_API_URL
pnpm install
```

### 1.3 Daily workflow

```bash
# Backend
cd backend && uvicorn app.main:app --reload     # http://localhost:8000

# Frontend
cd frontend && pnpm dev                          # http://localhost:3000

# After model changes
cd backend && alembic revision --autogenerate -m "describe change"
cd backend && alembic upgrade head
```

## 2. Docker Compose (local Postgres only)

`docker-compose.yml` at the repo root defines a single Postgres service. The apps run on the host (faster reloads). Docker is only there to avoid installing Postgres directly.

```yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: student
      POSTGRES_PASSWORD: student
      POSTGRES_DB: student_eco
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

Containerizing the backend and frontend is intentionally out of scope for v1 — adds friction without payoff in a 6-day window.

## 3. Environment variables

### 3.1 Backend (`backend/.env`)

| Variable           | Required | Example                                                | Purpose                                |
|--------------------|----------|--------------------------------------------------------|----------------------------------------|
| `DATABASE_URL`     | yes      | `postgresql+psycopg://student:student@localhost/student_eco` | SQLAlchemy connection string     |
| `JWT_SECRET`       | yes      | `<long random string>`                                 | HS256 signing key                      |
| `JWT_ALGORITHM`    | no       | `HS256`                                                | Default `HS256`                        |
| `JWT_EXPIRE_DAYS`  | no       | `7`                                                    | Default `7`                            |
| `CORS_ORIGINS`     | yes      | `http://localhost:3000,https://app.example.com`        | Comma-separated allowed origins        |
| `UPLOAD_DIR`       | no       | `./uploads`                                            | Default `./uploads`                    |
| `LOG_LEVEL`        | no       | `INFO`                                                 | Default `INFO`                         |
| `ENV`              | no       | `dev` / `prod`                                         | Used in logs and error verbosity       |

### 3.2 Frontend (`frontend/.env.local`)

| Variable                  | Required | Example                              | Purpose                          |
|---------------------------|----------|--------------------------------------|----------------------------------|
| `NEXT_PUBLIC_API_URL`     | yes      | `http://localhost:8000`              | Backend base URL                 |
| `NEXT_PUBLIC_APP_NAME`    | no       | `Student Ecosystem`                  | Branding string                  |

`NEXT_PUBLIC_*` vars ship to the browser. Anything secret stays server-only and is *not* prefixed.

## 4. Production deployment (primary path)

Stack: **Render** (backend) + **Vercel** (frontend) + **Neon** (Postgres). All have free tiers that fit a graduation demo.

### 4.1 Neon (Postgres)

1. Create a project at [neon.tech](https://neon.tech), pick a region near your backend region
2. Copy the connection string (the *pooled* one for the app; non-pooled for migrations)
3. Run migrations once locally pointed at Neon: `DATABASE_URL=<neon-url> alembic upgrade head`
4. Optionally seed: `DATABASE_URL=<neon-url> python scripts/seed.py`

### 4.2 Render (backend)

1. New → Web Service → connect the GitHub repo
2. Settings:
   - Root directory: `backend`
   - Build command: `pip install -e .`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Environment: Python 3.11
3. Set env vars from §3.1. Use the Neon **pooled** connection string for `DATABASE_URL`. Set `CORS_ORIGINS` to the Vercel URL(s).
4. Deploy. Once live, run migrations in the Render shell: `alembic upgrade head`. Re-run `seed.py` if you want demo data on prod.

### 4.3 Vercel (frontend)

1. New project → import the GitHub repo
2. Settings:
   - Framework preset: Next.js
   - Root directory: `frontend`
   - Build command: `pnpm build` (default works)
   - Install command: `pnpm install` (default works)
3. Set env var: `NEXT_PUBLIC_API_URL` = the Render URL (e.g. `https://student-eco-api.onrender.com`)
4. Deploy.

### 4.4 Post-deploy checklist

- [ ] Hit `<api-url>/api/auth/me` without auth → expect 401 (not 500)
- [ ] Register a test user via the deployed frontend
- [ ] Log in, navigate to each module, confirm no CORS errors in the browser console
- [ ] Verify uploads work (acknowledge the limitation in §6)
- [ ] Check Render logs are flowing and contain no plaintext secrets

## 5. Alternative: Railway

Railway is a one-stop alternative if you'd rather not split across three providers. It can host the backend, the Postgres database, and (with their Next.js template) the frontend. Free trial only — pricing kicks in after the trial credits. For this project the Render + Vercel + Neon path is recommended because each provider's free tier is genuinely free for an idle demo and the separation matches a typical production layout. If you choose Railway, mirror §4 — same env vars, same migration step, just one dashboard.

## 6. Known limitations

### 6.1 Ephemeral filesystem on Render free tier

Render's free Web Service runs on a container with a non-persistent filesystem. Every redeploy or restart wipes the `uploads/` directory. Implications:

- PDFs and images uploaded after deploy will disappear on the next deploy
- The demo seed (`scripts/seed.py`) must be re-run after any redeploy that should show files
- Database rows referencing missing files still exist; the UI will render broken images / failed downloads until re-seeded

**Workarounds for the demo:**
1. Don't redeploy in the 24h before presenting
2. Keep a `seed.py` invocation handy to refresh state quickly
3. Pre-upload demo files locally, commit them to `backend/uploads/seed/`, and have `seed.py` copy them into `uploads/` on run

### 6.2 Future work — object storage

The right fix is object storage (S3, Cloudflare R2, or Backblaze B2). The plan, **not in v1 scope**:

- Replace `app/storage/uploaders.py` filesystem writes with a presigned-URL-based S3 client
- Store `s3://bucket/key` (or just the key) instead of a local path in `notes.file_path` and `listing_images.file_path`
- Serve files via either presigned GET URLs or a CDN
- Migrate existing rows with a one-off script

This is a clean swap because uploads are already isolated behind the uploader factory (see `02-architecture.md` §5.2).

### 6.3 Cold starts

Render's free tier sleeps services after 15 minutes of inactivity. The first request after sleep can take 30+ seconds. Mitigation: hit the URL right before the demo to wake it, or upgrade to the cheapest paid tier on demo day.

## 7. Rollback

If a deploy breaks production:

1. Render: Web Service → Deploys → click the prior good deploy → "Redeploy"
2. Vercel: Deployments → previous deployment → "Promote to Production"
3. Database: Neon supports branching and point-in-time restore; create a branch from a known-good time and re-point `DATABASE_URL`. Document this as a last resort — schema rollback via Alembic (`alembic downgrade -1`) is preferred when possible.

## Related documents

- [02-architecture.md](02-architecture.md) — what's deployed and where
- [06-development-roadmap.md](06-development-roadmap.md) — Day 6 deployment block
- [07-coding-standards.md](07-coding-standards.md) — env-var conventions
