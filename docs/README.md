# Student Ecosystem — Documentation

## Purpose of this document

Entry point to the project documentation. Summarizes what Student Ecosystem is, links every spec doc, and shows the minimum commands to get the app running locally.

## Project summary

A 4-module web platform for university students, built as a 6-day graduation project:

1. **Notes & past exams** — PDF upload and filtering by course/semester
2. **Marketplace** — buy/sell textbooks and items with images and per-listing messaging
3. **Events** — student-organized events with RSVP and category filters
4. **Study buddy** — searchable profiles with out-of-band contact info

**Stack:** FastAPI + SQLAlchemy 2.0 + Postgres on the backend, Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui on the frontend, JWT auth, local file storage in v1.

**Demo deployment:** Render (backend) + Vercel (frontend) + Neon (Postgres).

## Documentation index

| #  | Document                                          | What it covers                                                    |
|----|---------------------------------------------------|-------------------------------------------------------------------|
| 01 | [01-requirements.md](01-requirements.md)          | Functional + non-functional requirements, user stories, use case  |
| 02 | [02-architecture.md](02-architecture.md)          | Layers, folder structure, request flow, GoF patterns, SOLID       |
| 03 | [03-database-schema.md](03-database-schema.md)    | Tables, columns, indexes, FKs, ER diagram, seed data              |
| 04 | [04-api-spec.md](04-api-spec.md)                  | REST endpoints with method, path, schemas, status codes, auth     |
| 05 | [05-frontend-pages.md](05-frontend-pages.md)      | Pages with routes, components, APIs called, wireframes            |
| 06 | [06-development-roadmap.md](06-development-roadmap.md) | 6-day plan with morning/afternoon blocks and success criteria |
| 07 | [07-coding-standards.md](07-coding-standards.md)  | Python + TS style, naming, commits, errors, logging               |
| 08 | [08-deployment.md](08-deployment.md)              | Local setup, env vars, production deploy, known limitations       |

For high-level project rules and Claude Code working protocol, see the repo-root `Claude.md`.

## Quick start

```bash
# 1. Postgres via Docker
docker compose up -d db

# 2. Backend (terminal 1)
cd backend
cp .env.example .env
uv sync
alembic upgrade head
python scripts/seed.py            # optional demo data
uvicorn app.main:app --reload     # http://localhost:8000

# 3. Frontend (terminal 2)
cd frontend
cp .env.example .env.local
pnpm install
pnpm dev                          # http://localhost:3000
```

After a model change:

```bash
cd backend
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Conventions for these docs

- All docs in English, Markdown
- Each doc starts with a "Purpose of this document" section and ends with a "Related documents" section
- Cross-references stay consistent: endpoints in `04-api-spec.md` match tables in `03-database-schema.md`, pages in `05-frontend-pages.md` call those endpoints, and so on
- Working reference, not a thesis — when something can be expressed in five lines, it's expressed in five lines

## Out of scope (v1)

Per `Claude.md`: email verification, password reset, real-time anything, notifications, admin panel, mobile app, i18n, rate limiting, exhaustive test coverage. If the build veers into any of these, stop and reconfirm scope.

## Related documents

All numbered docs above.
