# 02 — Architecture

## Purpose of this document

Describes how the codebase is organized, how a request flows through the layers, which design patterns we use and why, and how SOLID principles are applied. Read this before adding new modules or refactoring layer boundaries.

## 1. High-level overview

```
┌─────────────────────┐         ┌─────────────────────┐         ┌──────────────┐
│   Next.js (Vercel)  │  HTTPS  │   FastAPI (Render)  │  TCP    │   Postgres   │
│   App Router + SSR  │ ───────►│   REST + JWT auth   │ ───────►│   (Neon)     │
└─────────────────────┘         └─────────────────────┘         └──────────────┘
                                          │
                                          ▼
                                    Local uploads/
                                    (PDFs + images)
```

Two deployable units: a Next.js frontend and a FastAPI backend. Postgres is managed (Neon). Files live on the backend's local filesystem (see `08-deployment.md` for the ephemeral-filesystem caveat).

## 2. Backend architecture (strict layers)

```
backend/
├── app/
│   ├── main.py              # FastAPI app factory, middleware, router mounting
│   ├── core/
│   │   ├── config.py        # Pydantic Settings (env vars)
│   │   ├── security.py      # JWT encode/decode, bcrypt
│   │   ├── exceptions.py    # custom exception classes
│   │   └── deps.py          # FastAPI dependency providers (get_db, get_current_user)
│   ├── db/
│   │   ├── base.py          # SQLAlchemy declarative base
│   │   └── session.py       # engine + SessionLocal
│   ├── models/              # SQLAlchemy ORM classes (one file per table)
│   ├── schemas/             # Pydantic request/response DTOs (one file per resource)
│   ├── repositories/        # DB queries (one class per aggregate)
│   ├── services/            # business logic (one class per use case group)
│   ├── routes/              # FastAPI routers (one file per resource)
│   └── storage/             # file upload helpers (validators, path resolution)
├── alembic/                 # migrations
├── alembic.ini
├── tests/                   # smoke tests (pytest)
├── uploads/                 # runtime file storage (gitignored)
└── pyproject.toml
```

### Layer rules

| Layer        | Allowed to call         | Forbidden                                       |
|--------------|-------------------------|-------------------------------------------------|
| routes       | services, schemas       | repositories, models                            |
| services     | repositories, schemas, other services | routes, raw SQL                  |
| repositories | models, db session      | services, routes, schemas                       |
| models       | (nothing — pure ORM)    | routes, services, repositories                  |
| schemas      | (pure Pydantic)         | models (don't import ORM into Pydantic)         |

A route never touches a model. A repository never returns a Pydantic schema — services do that conversion.

## 3. Frontend architecture

```
frontend/
├── app/                     # Next.js App Router
│   ├── (auth)/              # route group: login, register
│   ├── notes/
│   ├── marketplace/
│   ├── events/
│   ├── buddies/
│   ├── messages/
│   ├── me/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                  # shadcn primitives
│   ├── notes/
│   ├── marketplace/
│   ├── events/
│   ├── buddies/
│   ├── messages/
│   └── shared/              # navbar, footer, empty states
├── lib/
│   ├── api/                 # typed API client (one file per resource)
│   ├── auth.ts              # token storage, current-user helpers
│   ├── types.ts             # shared TS types (mirror backend schemas)
│   └── utils.ts
├── hooks/                   # custom hooks (client only)
└── public/
```

### Server vs client components

- **Default to server components.** They render on the server, ship no JS, and can call the API directly.
- **Use `"use client"` only when** the component needs `useState`, `useEffect`, browser APIs (localStorage, window), event handlers, or shadcn primitives that require it (Dialog, DropdownMenu, etc.).
- API client functions live in `lib/api/` and are isomorphic (work in both server and client components). They read the JWT from cookies on the server and from localStorage on the client.

## 4. Request flow (example: create a listing)

```
[Browser]
  POST /api/listings + JWT  + multipart body
    │
    ▼
[FastAPI middleware] — CORS, exception handler, request logger
    │
    ▼
[routes/listings.py: create_listing]
  - Depends(get_current_user) → User
  - Parses multipart into ListingCreate schema
  - Calls service.create_listing(user, data, files)
    │
    ▼
[services/listing_service.py]
  - Validates business rules (price > 0, image count ≤ 8)
  - Calls storage.save_image() for each file
  - Calls repositories.listings.create()
  - Calls repositories.listing_images.create_many()
  - Loads the full listing via repositories.listings.get_with_images()
  - Returns ListingRead schema
    │
    ▼
[repositories/listings.py]
  - SQLAlchemy session.add(...) / session.commit()
  - Returns ORM Listing
    │
    ▼
[Postgres]
```

Errors raised in services as `core.exceptions.AppError` subclasses are caught by an exception middleware in `main.py` and translated to JSON error responses with the right status code.

## 5. Design patterns (GoF)

We use three concrete patterns. They're chosen because they map cleanly onto layers we already need — not for ceremony.

### 5.1 Repository pattern

**Where:** `app/repositories/`

**What:** Each aggregate (User, Note, Listing, Event, BuddyProfile, Message) has a repository class that owns all SQLAlchemy queries for that aggregate. Services depend on the repository, never on the ORM directly.

**Why:** Keeps SQL out of business logic, makes services testable with a fake repository, and gives us one place to optimize queries (indexes, joins, eager-loading).

**Sketch:**
```python
class ListingRepository:
    def __init__(self, db: Session): self.db = db
    def get(self, listing_id: UUID) -> Listing | None: ...
    def list(self, *, category: str | None, status: str | None) -> list[Listing]: ...
    def create(self, data: ListingCreate, seller_id: UUID) -> Listing: ...
```

### 5.2 Factory pattern

**Where:** `app/storage/uploader_factory.py`

**What:** A factory that returns the right uploader (`PdfUploader` or `ImageUploader`) based on the resource type. Each uploader bundles its own MIME whitelist, size limit, and target directory.

**Why:** Notes, listing images, and any future upload type share a common interface but differ in validation rules. A factory keeps `services/` ignorant of which validator runs.

**Sketch:**
```python
class Uploader(Protocol):
    def save(self, file: UploadFile, owner_id: UUID) -> str: ...

def get_uploader(kind: Literal["pdf", "image"]) -> Uploader: ...
```

### 5.3 Strategy pattern

**Where:** `app/services/listing_service.py` (and parallel for events, notes)

**What:** A pluggable filter/sort strategy. The list endpoints accept query params (`category`, `status`, `sort=newest|price_asc|price_desc`); the service picks a strategy object that knows how to apply that combination to a query.

**Why:** Adds one more sort/filter without touching unrelated code. Keeps `if/elif` ladders out of route handlers. Three implementations (`NewestFirstSort`, `PriceAscSort`, `PriceDescSort`) implement the same `apply(query) -> query` signature.

**Sketch:**
```python
class SortStrategy(Protocol):
    def apply(self, query: Select) -> Select: ...

SORT_STRATEGIES: dict[str, SortStrategy] = {
    "newest": NewestFirstSort(),
    "price_asc": PriceAscSort(),
    "price_desc": PriceDescSort(),
}
```

## 6. SOLID application

- **SRP** — Each layer changes for one reason. A route changes when the HTTP contract changes; a repository changes when a query changes. We don't bundle them.
- **OCP** — Adding a new sort order means adding a strategy class, not editing existing ones. New upload type = new uploader, no edit to factory clients.
- **LSP** — All `Uploader` implementations honor the same `save()` contract; services treat them interchangeably.
- **ISP** — Small Pydantic schemas split by intent: `ListingCreate`, `ListingUpdate`, `ListingRead` instead of one mega-DTO with optional fields.
- **DIP** — Services depend on repository *classes* (constructor-injected via FastAPI `Depends`), not on the SQLAlchemy session. Swapping to a fake repo for tests requires no production-code change.

## 7. Cross-cutting concerns

- **Auth** — `Depends(get_current_user)` on every protected route. The dependency reads `Authorization: Bearer <jwt>`, validates, loads the user.
- **Errors** — Custom exceptions in `core/exceptions.py` (e.g., `NotFoundError`, `ForbiddenError`, `ValidationError`). A FastAPI exception handler in `main.py` maps each to a status code + JSON body.
- **Logging** — Standard library `logging`, configured at startup. Never `print()`. Never log secrets, tokens, or passwords.
- **Config** — `pydantic-settings` reads env vars. No hardcoded secrets; `.env` is gitignored.

## Related documents

- [01-requirements.md](01-requirements.md) — what these layers serve
- [03-database-schema.md](03-database-schema.md) — the model layer in detail
- [04-api-spec.md](04-api-spec.md) — the route layer in detail
- [07-coding-standards.md](07-coding-standards.md) — style rules these layers follow
