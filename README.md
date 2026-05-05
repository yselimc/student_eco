# Student Ecosystem

A 4-module web platform for university students: notes & past exams, marketplace, events, and study buddy. Graduation project, 6-day build.

## Quick start

```bash
# Postgres (one-time per machine, then it just runs)
docker compose up -d db

# Backend (terminal 1)
cd backend && uvicorn app.main:app --reload     # http://localhost:8000

# Frontend (terminal 2)
cd frontend && pnpm dev                          # http://localhost:3000
```

First-time setup, env vars, deployment, and the rest of the spec live in [`docs/`](docs/README.md). The build plan is in [`docs/06-development-roadmap.md`](docs/06-development-roadmap.md).

## Stack

FastAPI + SQLAlchemy 2.0 + Postgres on the backend. Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui on the frontend. JWT auth, local file storage in v1.
