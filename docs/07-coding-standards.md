# 07 — Coding standards

## Purpose of this document

Defines style, naming, error handling, logging, and version control conventions for both the Python backend and the TypeScript frontend. Applied uniformly across the codebase. Linters/formatters enforce most of this — the rest is on review.

## 1. Python (backend)

### 1.1 Tooling

- Python 3.11+
- Formatter: `ruff format` (Black-compatible)
- Linter: `ruff check` (selects E, F, I, B, UP, SIM)
- Type checker: `mypy --strict` on `app/` (best-effort, not blocking CI in v1)
- Test runner: `pytest`

### 1.2 Style

- **Type hints required** on every function signature (params + return type). Use `from __future__ import annotations` if needed for forward refs.
- `async def` for all FastAPI route handlers and any function that touches the DB session asynchronously (when applicable).
- Pydantic v2 models for all request/response bodies. Don't use raw `dict[str, Any]`.
- Imports sorted by `ruff` (`isort` style): stdlib → third-party → local; one blank line between groups.
- Line length: 100.
- Docstrings: only when the *why* isn't obvious from the name. One-line docstrings preferred. No formal docstring style enforced.

### 1.3 Naming

- `snake_case` for variables, functions, modules
- `PascalCase` for classes (incl. Pydantic models)
- `UPPER_SNAKE` for module-level constants
- Files: `snake_case.py` (`user_service.py`, `listing_repository.py`)
- One main public class per file when the file is named after the class

### 1.4 Error handling

- Custom exceptions in `app/core/exceptions.py`:
  ```python
  class AppError(Exception):
      status_code: int = 400
      error_code: str = "app_error"
  class NotFoundError(AppError): status_code = 404; error_code = "not_found"
  class ForbiddenError(AppError): status_code = 403; error_code = "forbidden"
  class ConflictError(AppError): status_code = 409; error_code = "conflict"
  class ValidationFailedError(AppError): status_code = 400; error_code = "validation_failed"
  ```
- A FastAPI `exception_handler(AppError)` in `app/main.py` returns `{ "detail": str(exc), "code": exc.error_code }` with the right status.
- Don't `raise HTTPException` directly in services — services raise `AppError` subclasses; routes can use `HTTPException` for HTTP-shaped concerns (e.g., parsing errors caught early).

### 1.5 Logging

- `logging` module, configured at startup in `app/main.py` via `logging.config.dictConfig`.
- Log level via `LOG_LEVEL` env var (default `INFO`).
- Format: `%(asctime)s %(levelname)s %(name)s | %(message)s`.
- Get a logger per module: `logger = logging.getLogger(__name__)`.
- **Never log** passwords, JWTs, full request bodies that may contain secrets, or PII beyond user IDs.
- Use `logger.exception(...)` inside `except` blocks to include the traceback.

## 2. TypeScript (frontend)

### 2.1 Tooling

- Node 20+, package manager: `pnpm`
- Formatter: Prettier (default config + `printWidth: 100`)
- Linter: ESLint (Next.js + TypeScript ruleset)
- TS config: `strict: true`, `noUncheckedIndexedAccess: true`

### 2.2 Style

- **No `any`.** Use `unknown` and narrow. If you need an escape hatch, comment why and use `// eslint-disable-next-line` on that line.
- Explicit return types on **exported** functions (inferred is fine for inline callbacks).
- Prefer `interface` for object shapes, `type` for unions/utility types.
- Prefer named exports. Default exports are reserved for Next.js `page.tsx` / `layout.tsx`.
- Zod schemas for API response validation in `lib/api/*.ts` — validate responses before returning typed data to callers.

### 2.3 React / Next.js

- Server components by default; add `"use client"` only when needed.
- One component per file. File name matches component name.
- Props typed via an explicit `interface` named `<Component>Props`.
- Don't fetch in `useEffect` for initial loads — fetch in the server component and pass data down. `useEffect` is for client-only side effects (subscriptions, intervals).
- Co-locate component-specific styles via Tailwind utility classes; avoid CSS modules unless the styling can't be expressed in Tailwind.

### 2.4 Naming

- `camelCase` for variables, functions
- `PascalCase` for components, types, interfaces
- `UPPER_SNAKE` for compile-time constants
- Files:
  - Components: `kebab-case.tsx` (`note-card.tsx`)
  - Hooks: `use-<thing>.ts` (`use-current-user.ts`)
  - API clients: `kebab-case.ts` (`notes.ts`, `listings.ts`)
  - Page files: Next.js conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`)

### 2.5 Error handling

- API client wraps fetch in a `try/catch`, throws a typed `ApiError` with `{ status, code, message }`.
- Page-level errors render via `app/error.tsx` and route-segment `error.tsx` files.
- Form errors via react-hook-form + Zod resolver; show inline + a toast on submit failure.
- Don't swallow errors silently. If you catch one, either rethrow, surface it to the user, or log it.

## 3. Version control

### 3.1 Branch strategy

- `main` — always deployable
- `feat/<short-name>` — feature branches
- `fix/<short-name>` — bug fixes
- `chore/<short-name>` — non-product changes (CI, deps, config)
- For a 6-day project, branches are short-lived; squash-merge into `main` via PR (or push directly during early scaffolding).

### 3.2 Commit format

Conventional Commits — `<type>(<scope>)?: <subject>`.

Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `style`.

Examples:
- `feat(notes): add PDF upload endpoint`
- `fix(auth): handle missing Authorization header`
- `docs: add database schema doc`
- `refactor(listings): extract sort strategy`
- `chore: bump fastapi to 0.110`

Rules:
- One logical change per commit
- Subject line ≤ 72 chars, imperative mood, no trailing period
- Body (optional) wrapped at 100 chars; explain *why* not *what*
- Reference issues with `Closes #123` in the body when applicable

### 3.3 PR conventions

- Title mirrors the commit subject style
- Description: short summary + manual test notes (what you clicked / what you curl'd)
- Self-review the diff before requesting review
- For solo-dev velocity in this 6-day window: PRs may be optional for non-risky scaffolding work, but are required for anything touching auth, DB schema, or deployment

## 4. Testing

- **Backend:** smoke tests with `pytest` + `httpx.AsyncClient`. One happy-path test per resource is enough for v1. Tests live in `backend/tests/`.
- **Frontend:** no automated tests in v1. Manual verification: render every page, exercise every form. Document known issues in the PR description.
- This is *intentional scope cutting* per CLAUDE.md — six days, working demo over comprehensive coverage.

## 5. Comments

Default to no comments. Add one only when:

- The *why* is non-obvious (workaround for a known bug, surprising business rule)
- A subtle invariant must hold (e.g., "must run before X loads")

Don't comment what well-named code already says. Don't reference issues, PRs, or tickets in code — they belong in commit messages.

## 6. Secrets and config

- All secrets via environment variables. `.env` files are gitignored.
- A `.env.example` lives in both `backend/` and `frontend/` listing every variable with placeholder values.
- Never commit a JWT secret, DB URL, or API key — even to a private repo.
- Pydantic `BaseSettings` (`pydantic-settings`) reads env on startup; missing required vars must crash the app with a clear message.

## Related documents

- [02-architecture.md](02-architecture.md) — what the layers do (the *what*; this doc is the *how*)
- [06-development-roadmap.md](06-development-roadmap.md) — when these standards are applied during the build
- [08-deployment.md](08-deployment.md) — env-var conventions in practice
