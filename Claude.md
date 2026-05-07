# Student Ecosystem — Claude Code Instructions

## Project Context

A 4-module university student platform built as a graduation project:
1. **Notes & past exams** — PDF upload, course/semester filtering
2. **Marketplace** — textbook/item listings with images and messaging
3. **Events** — calendar with RSVP and categories
4. **Study buddy** — simple profile + filter + contact (NO real-time chat)

**Timeline:** 6 days. Scope must reflect this. Don't over-engineer.

**Audience:** A graduation jury. Architecture and code quality matter, but a working demo matters more.

## Project Structure

The project lives in three top-level folders:

- `backend/` — FastAPI app (scaffolded on Day 1)
- `frontend/` — Next.js app (scaffolded on Day 1)
- `docs/` — Documentation (created during the documentation phase)

If any of these folders don't exist when you need them, create them. 
Don't ask permission for creating these standard folders.

## Tech Stack (Non-Negotiable)

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Auth:** JWT with python-jose + passlib (bcrypt)
- **File storage:** Local `uploads/` folder (S3 migration is a future concern, not now)
- **Package managers:** `uv` or `pip` for Python, `pnpm` for Node

Don't propose stack changes mid-project. If something is genuinely blocking, raise it; otherwise stick to this.

## Documentation Is Source of Truth

The `docs/` folder contains the full spec:
- `docs/01-requirements.md` — what to build
- `docs/02-architecture.md` — how it's structured
- `docs/03-database-schema.md` — DB design (consult before any model change)
- `docs/04-api-spec.md` — endpoint contracts (consult before any route change)
- `docs/05-frontend-pages.md` — page structure
- `docs/06-development-roadmap.md` — daily plan
- `docs/07-coding-standards.md` — style rules
- `docs/08-deployment.md` — deployment

**Rules:**
- Read the relevant doc BEFORE making changes in that area
- If you need to deviate from a doc, explain why and propose updating the doc first
- If you find inconsistencies between docs, flag them — don't silently pick one

## Working Protocol

1. **Confirm before building.** Before any non-trivial feature, summarize what you'll do and wait for approval. "Non-trivial" = anything beyond a single file edit or bug fix.
2. **Feature branch per feature.** Each feature gets its own `feature/<short-name>` branch off `main`. Build, commit, and push on the branch. When the feature is verified working, merge to `main`, push `main`, and delete the branch (locally and on remote). One feature = one branch.
   - Trivial chores that aren't features (e.g., `docs:` tweaks, single-file `chore:` updates) can land directly on `main`.
   - Branch naming: `feature/<kebab-case-name>` — e.g., `feature/navbar`, `feature/notes-upload`.
   - Merge style: fast-forward when possible, otherwise `--no-ff` is fine. Don't squash unless asked.
3. **One logical change per commit.** Use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
4. **Test what you build.** For backend, hit the endpoint. For frontend, verify it renders. Don't claim "done" without verification.
5. **Ask, don't assume.** If a requirement is ambiguous, ask. Don't invent business logic.
6. **End-of-day ritual.** When I say "wrap up the day", give a summary of what was built, what was skipped, what's broken, and what's next.

## Architecture Rules

**Backend layers (strict):**
```
routes/      → HTTP only, parse request, return response
schemas/     → Pydantic models (request/response DTOs)
services/    → business logic, orchestration
repositories/→ DB access only (SQLAlchemy queries)
models/      → SQLAlchemy ORM classes
```
Never call repositories from routes. Never put business logic in repositories. Never let models leak past services (always convert to schema).

**Frontend layers:**
```
app/         → Next.js routes (server components default)
components/  → reusable UI (shadcn/ui based)
lib/         → API client, utilities, types
hooks/       → custom React hooks (client side only)
```
Server components by default. Add `"use client"` only when you need state, effects, or browser APIs.

## Code Standards

**Python:**
- Type hints on every function signature (params and return type)
- Pydantic for all request/response shapes
- `async def` for all route handlers
- Custom exceptions in `core/exceptions.py`, mapped to HTTP responses by middleware
- No `print()` — use `logging` module

**TypeScript:**
- Strict mode on
- No `any` (use `unknown` and narrow if you must)
- Explicit return types on exported functions
- Zod schemas for API response validation where it matters

**Naming:**
- Python: `snake_case` for variables/functions, `PascalCase` for classes
- TypeScript: `camelCase` for variables/functions, `PascalCase` for components/types
- Files: `kebab-case` for frontend (`user-profile.tsx`), `snake_case` for backend (`user_service.py`)
- Components: one component per file, file name matches component name

## Database Rules

- **Never write raw `CREATE TABLE` or manual schema changes.** Always Alembic migrations.
- After every model change: `alembic revision --autogenerate -m "..."` then review the generated migration before applying.
- Foreign keys with explicit `ondelete` behavior (CASCADE for owned data, SET NULL for references).
- Indexes on every foreign key and any column used in WHERE/ORDER BY filters.
- Soft deletes are NOT in scope. Use hard deletes.

## Auth & Security

- All non-public endpoints require JWT auth via `Depends(get_current_user)`
- Hash passwords with bcrypt (cost factor 12)
- JWT expiry: 7 days for access token (no refresh token in v1, keep it simple)
- Never log passwords, tokens, or PII
- File uploads: validate MIME type AND extension AND size (max 10MB for PDFs, 5MB for images)
- SQL injection: SQLAlchemy ORM only, never f-string queries

## What NOT to Do (Out of Scope)

- Email verification / password reset (skip for v1)
- Real-time anything (no WebSocket, no SSE)
- Notifications system
- Admin panel (unless time permits on Day 6)
- Mobile app
- i18n (English only for the demo)
- Rate limiting (FastAPI defaults are fine)
- Comprehensive test suite (smoke tests are enough — we have 6 days)

If you find yourself building any of the above, stop and ask.

## Communication Style

- Be direct. Skip "I'll help you with that!" preambles.
- When you make a decision, state it and the reason in one line.
- When something is unclear, ask one focused question. Don't ask three vague ones.
- After completing a task, summarize in 3-5 bullet points: what changed, what to test, what's next.
- If something I asked for is a bad idea, push back. Don't just comply.

## Quick Reference

**Start the backend:**
```bash
cd backend && uvicorn app.main:app --reload
```

**Start the frontend:**
```bash
cd frontend && pnpm dev
```

**Run a migration:**
```bash
cd backend && alembic upgrade head
```

**Create a migration:**
```bash
cd backend && alembic revision --autogenerate -m "describe change"
```
