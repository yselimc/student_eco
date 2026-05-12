# Student Ecosystem

A web platform that bundles four utilities for university students: notes & past exams (PDF upload + course/semester filtering), marketplace (item listings with images + per-listing messaging), events (RSVP + categories), and study buddy (lightweight profiles + filtering). Built as a 6-day graduation project.

## Tech Stack

- **Frontend:** Next.js 14.2 (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui
- **Backend:** Python 3.12, FastAPI 0.115+, Pydantic 2, SQLAlchemy 2.0, Alembic 1.13+
- **Database:** Postgres 16
- **Auth:** JWT (python-jose) with bcrypt password hashing
- **Containers:** Docker Compose (postgres:16-alpine, python:3.12-slim, node:20-alpine)

## Quick Start (Docker — recommended)

1. Clone the repo.
2. `cp backend/.env.example backend/.env` and uncomment the **Docker Compose** `DATABASE_URL` line.
3. `cp frontend/.env.example frontend/.env.local`.
4. `docker compose up --build -d`.
5. Wait for `Application startup complete` in `docker compose logs backend`.

Then:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs (Swagger): http://localhost:8000/docs
- Postgres: localhost:5432

> If you have a local Postgres running on `:5432`, stop it first (`sudo systemctl stop postgresql`) or change the port mapping in `docker-compose.yml`.

## Manual Setup (without Docker)

### Backend

- Requires Python 3.12+ and a running Postgres.
- `cd backend`
- `python -m venv .venv && source .venv/bin/activate`
- `pip install -e .`
- `cp .env.example .env` (uncomment the **native dev** `DATABASE_URL` line and point it at your Postgres)
- `alembic upgrade head`
- `uvicorn app.main:app --reload`

### Frontend

- Requires Node.js 20+.
- `cd frontend`
- `npm install`
- `cp .env.example .env.local`
- `npm run dev`

## Project Structure

```
backend/
├── app/             FastAPI application (routes, services, repositories, models, schemas)
├── alembic/         Database migrations
└── uploads/         Runtime uploads (PDFs, listing images, avatars) — gitignored

frontend/
└── src/
    ├── app/         Next.js App Router pages
    ├── components/  Reusable UI (shadcn primitives + feature components)
    └── lib/         API client, types, auth helpers
```

See [`docs/02-architecture.md`](docs/02-architecture.md) for layer rules and request flow.

## Common Tasks

- Run migrations: `docker compose exec backend alembic upgrade head`
- Create a new migration: `docker compose exec backend alembic revision --autogenerate -m "message"`
- Run tests: **not wired up yet** — `backend/tests/` does not exist and `pytest` is not in the backend dev dependencies. Smoke testing is manual via the Swagger UI at http://localhost:8000/docs.
- Reset DB (DESTRUCTIVE — drops Postgres + uploads volumes): `docker compose down -v && docker compose up -d`
- Tail backend logs: `docker compose logs -f backend`

## Environment Variables

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for the full list with inline comments.

## Troubleshooting

- **Port 5432 already in use** — stop the host Postgres (`sudo systemctl stop postgresql`) or change the `db` port mapping in `docker-compose.yml`.
- **`DATABASE_URL` not set** (backend exits at startup) — both `DATABASE_URL` lines in `backend/.env` are commented out by default; uncomment the one that matches how you're running the backend.
- **Frontend can't reach backend** — check `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local`. Remember `NEXT_PUBLIC_*` is baked at build time, so rebuild the frontend (`docker compose up --build frontend`) after changing it.
