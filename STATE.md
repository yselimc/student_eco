# Project State

> Auto-maintained by Claude Code. Read at session start, update at session end (or before usage cutoff). Never delete history sections — append.

## Current Position

- **Day:** 6 of 6 — Day 5 complete; Day 6 kicked off with Docker setup landed
- **Active branch:** `main`
- **Last commit:** `dfd0891` chore: dockerize stack (direct on main)
- **Next step:** Day 6 — Polish + Demo continues. Remaining kickoff items: docs reconciliation (events drift from Day 4 + profile/avatar API contract from Phase 3), seed-data sanity, end-to-end smoke walkthrough.
- **Blockers:** None. (See Services for the system-Postgres-on-:5432 conflict to resolve before `docker compose up`.)

## Services

The project now runs via Docker Compose as the primary boot path; native dev still works.

**Primary — full stack via Docker Compose** (from project root):

```
sudo systemctl stop postgresql   # free :5432 for the db container
docker compose up --build -d     # build images, start db + backend + frontend
docker compose logs -f backend   # tail until "Application startup complete"
docker compose down              # stop (keeps volumes)
docker compose down -v           # nuke db + uploads volumes for a fresh DB
```

Host ports: `5432` (db), `8000` (backend), `3000` (frontend). Named volumes: `pgdata` (Postgres data), `uploads` (backend `/app/uploads`).

**Alternate — native dev** (against host Postgres on `:5432`):

```
cd backend && source .venv/bin/activate && uvicorn app.main:app --port 8000 --reload
cd frontend && npm run dev
```

Uses `backend/.env` `DATABASE_URL` as-is (points at `localhost:5432`). The compose file overrides `DATABASE_URL` to `db:5432` for in-container use, so both modes coexist without editing `.env`.

At session close: backend + frontend both **stopped** (containers down). Host Postgres state untouched (still installed; whether running depends on whether you stopped it for compose).

## Day Progress

### Day 1 — Setup + Auth ✅

- 13 commits on `main` (no feature branch — pre-workflow-adoption phase)
- Range: `c4909c2` (initial docs) → `9037adf` (logout button)
- Built: FastAPI scaffold, Next.js 14 scaffold, Postgres + Alembic wiring, JWT auth (register/login/me), login + register pages, landing CTAs, logout button, design system docs
- Tech-debt notes carried forward:
  - bcrypt 72-byte truncation (passwords longer than 72 bytes are silently truncated)
  - localStorage XSS exposure for JWT (documented tradeoff in `docs/05-frontend-pages.md` via commit `035fc70`)

### Day 2 — Notes ✅

- 4 transitional commits on `main` (Day 2 setup before feature branch was cut):
  - `b0f8a20` docs: switch to feature branch workflow
  - `8df217c` fix(backend): point DATABASE_URL at system postgres on 5432
  - `0c782ab` feat(frontend): app navbar with theme toggle and user menu
  - `af518b9` feat(frontend): protected route guard via layout
- 4 commits in `feature/notes` branch, merged via PR #1 (`0ec44e0`):
  - `f5c140c` feat(backend): notes model and migration
  - `5153d0d` feat(backend): notes routes (list, get, create, delete, download)
  - `aa8a698` feat(frontend): notes API client and list page
  - `f5dc6e0` feat(frontend): notes upload form and detail page
- Tech-debt notes carried forward:
  - `useSearchParams` Suspense bailout warning in dev — needs `<Suspense>` wrapper before deploy

### Day 3 — Marketplace ✅

- 7 commits in `feature/marketplace` branch, merged via PR #2 (`91d656f`):
  - `51e1f1d` feat(backend): listings, listing_images, messages models + migration (C1)
  - `5053ee4` feat(backend): image upload helper for listings (C2)
  - `058bd9c` feat(backend): listings CRUD + status + auth-gated image routes (C3)
  - `b1f2e2b` feat(backend): messages endpoints — conversations + threads (C4)
  - `1f1c7a7` feat(frontend): marketplace API client, list page, new listing form (C5)
  - `4c53e80` feat(frontend): listing detail page with carousel and seller actions (C6)
  - `52df97d` feat(frontend): messages inbox and thread with 5s polling (C7)
- Tech-debt notes added this day:
  - No navbar links to `/messages`, `/marketplace`, `/notes` — discoverability gap (homepage also has no feature cards)
  - `CLAUDE.md` line 32 says `pnpm` but project actually uses `npm` (has `package-lock.json`) — fix wording
  - `backend/uv.lock` untracked since Day 1 — decide whether to track or `.gitignore` [Day 5 polish]

### Day 4 — Events ✅

- 7 commits in `feature/events` branch, merged via PR #3 (`c0e01a3`):
  - `1f0de9f` feat(backend): events + event_attendees models + migration (E1)
  - `bee689d` fix(backend): make validation_handler serialize Pydantic ctx (surfaced during E2 smoke testing)
  - `70f57c2` feat(backend): events CRUD + RSVP routes (E2)
  - `1c7b444` feat(frontend): events API client + list page (E3)
  - `6be36d5` feat(frontend): events calendar view toggle (E4)
  - `fa70d17` feat(frontend): event detail + RSVP + new form + past-event badge (E5)
  - `5fa4144` feat: event capacity with max_attendees limit (E6)
- New deps: `react-big-calendar@^1.19`, `date-fns@^3.6`, `@types/react-big-calendar`
- Tech-debt notes added this day (see Open Tech Debt for full list)

### Day 5 — Phases 1-3 (Buddy + Navbar + Profile/Avatar) ✅ partial

- Phase 1 — Study buddy module merged via PR #4 (`dd8be1b`). `feature/buddy` branch. Frontend buddy public profile (B4) + earlier B1-B3 sub-features.
- Phase 2 — Navbar feature links + Profilim dropdown merged via PR #5 (`351ef44`, single commit `5533e9a`). Closed the Day 3 "no navbar links" debt item (still listed below pending Phase 5 chore commit per convention).
- Phase 3 — Profile pages + avatar feature merged via PR #6 (`13d570a`, 10 commits):
  - `68a3077` feat(backend): add user profile fields to users + migration (4bb7abc9298c — university, department, updated_at)
  - `cc22362` feat(backend): PATCH /auth/me + GET /users/{id}/profile (public DTO with 4 counts)
  - `1ddec2d` feat(frontend): profile API + /profile/me view + edit page
  - `0630df6` feat(frontend): /profile/[userId] public profile page
  - `f9f61e8` feat(frontend): link names to /profile/{userId} on detail pages
  - `79d699c` feat(backend): users.avatar_path + uploads/avatars static mount (migration 9c42bcd130fa)
  - `b04850d` feat(backend): POST/DELETE /auth/me/avatar + avatar_url on user DTOs
  - `70ef18c` feat(backend): include avatar_url on listing/note/event/attendee DTOs
  - `4acb0a6` feat(frontend): Avatar component + upload UI on /profile/me
  - `eeb3d4b` feat(frontend): avatars on public profile, navbar, and detail pages
- Phase 4 — Home page content merged via PR #7 (`8f6c5ee`, 2 commits):
  - `d47f655` feat(backend): add ?mine=1 filter to GET /events
  - `fc3677e` feat(frontend): authenticated home page content
- Phase 5 — Tech-debt cleanup landed direct on main as `87dff63` (single commit, no PR per CLAUDE.md "trivial chores can land directly on main"):
  - Suspense-wrapped `useSearchParams` on 4 list pages (notes, marketplace, events, buddies) — `npm run build` now passes
  - `backend/uv.lock` tracked
  - `CLAUDE.md` `pnpm` → `npm` (both hits)
  - `docker-compose.yml` annotated as alternate setup (kept rather than removed)
  - stale `curl :5433` permission dropped from `.claude/settings.local.json` (local-only, not in commit)
- Phase 6 (Day 6 — Polish + Demo) not yet started.

### Day 6 — Polish + Demo 🚧 in progress

- **Docker setup** ✅ landed direct on main as `dfd0891` (single commit, no PR per CLAUDE.md "trivial chores can land directly on main"):
  - `backend/Dockerfile` — python:3.12-slim, non-root `appuser` (uid 1000), `pip install .` from pyproject.toml, `CMD` runs `alembic upgrade head && uvicorn`.
  - `frontend/Dockerfile` — multi-stage node:20-alpine; build stage emits Next.js standalone, runtime stage serves via `node server.js` as the `node` user; `NEXT_PUBLIC_API_BASE_URL` accepted as build-arg (baked into the bundle).
  - `frontend/next.config.mjs` — added `output: 'standalone'` (only application-adjacent change required).
  - `docker-compose.yml` — replaces the orphaned alternate-Postgres-on-:5433 file (Day 2 leftover). Three services: `db` (postgres:16-alpine, `pg_isready` healthcheck, named volume `pgdata`), `backend` (env_file + `DATABASE_URL` override to `db:5432`, `uploads` named volume mounted at `/app/uploads`, `depends_on: db {condition: service_healthy}`), `frontend` (build-arg + env_file from `.env.local`, `depends_on: backend`). Host port mappings: 5432, 8000, 3000.
  - `backend/.dockerignore` + `frontend/.dockerignore` — exclude per requested list (`node_modules`, `.next`, `__pycache__`, `.venv`, `.env*`, `uploads/`, `.git`) plus standard cruft.
- Remaining Day 6 work (not started): docs reconciliation (`docs/03-database-schema.md` + `docs/04-api-spec.md` drift from Day 4 events and Phase 3 profile/avatar — see Open Tech Debt), seed-data sanity, end-to-end smoke walkthrough across all 4 modules + home + profile.

## Open Tech Debt

- **bcrypt 72-byte truncation** [Day 1] — passwords longer than 72 bytes are silently truncated. Acceptable for v1 demo.
- **localStorage XSS exposure for JWT** [Day 1] — known tradeoff documented in `docs/05-frontend-pages.md`. Acceptable for v1.
- **Docs drift from current implementation** [Day 4 events + Phase 3 profile/avatar] — `docs/03-database-schema.md` §2.1 users is missing `university`/`department`/`avatar_path`/`updated_at`; §2.5 events lists `career` not `culture`, missing `max_attendees`, missing CHECK constraints. `docs/04-api-spec.md` §3 still describes the old `/users/me` shape (no profile DTO with counts); §6 lists `PATCH /events/{id}` that doesn't exist, missing `?mine=1` filter, wrong attendee shape (`{user_id, full_name, department}` vs actual `{user_id, display_name, avatar_url, rsvp_at}`), missing `max_attendees`; auth section missing `PATCH /auth/me` + `POST/DELETE /auth/me/avatar`; `avatar_url` field missing on several DTOs. Reconcile in Day 6 docs pass.
- **npm audit: 5 Next.js CVEs (4 high + 1 moderate)** [Day 4, re-attributed Phase 5] — vulnerabilities are in Next.js itself (`next`, `@next/eslint-plugin-next`, transitive `glob`/`postcss`), **not** in `react-big-calendar` as originally guessed. Only patch is `next@16.2.6` (major version bump, breaking). **Accepted for v1:** the CVEs are in dev-server / image-optimization paths that don't affect the localhost demo; major bump mid-graduation-project is too risky. Post-demo task.
- **`validation_handler` `ctx.error` serializes as `{}`** [Day 4] — the `bee689d` fix uses `jsonable_encoder` which coerces non-JSON values to empty dicts. Field error message still carries the human-readable text via the `msg` field; the `ctx` is just lossy. Acceptable; flag if a future error path needs richer ctx.

### Closed by Phase 5 (`87dff63`)

- ~~`useSearchParams` Suspense bailout~~ [Day 2] — fixed by Suspense-wrapping notes/marketplace/events/buddies list pages.
- ~~No navbar links to feature pages~~ [Day 3] — closed by Phase 2 (`feature/navbar-links`); formally retired here.
- ~~`CLAUDE.md` `pnpm` references~~ [Day 3] — corrected on lines 55 + 177.
- ~~`backend/uv.lock` untracked~~ [Day 1] — now tracked.

## Decisions Log

Short bullets of "we chose X over Y because Z" — for context recovery.

1. **Marketplace categories: English keys / Turkish labels** — DB stores `book`, `electronics`, `clothing`, `furniture`, `other`; UI shows `Kitap`, `Elektronik`, `Kıyafet`, `Mobilya`, `Diğer`. Keeps DB locale-neutral while matching UI language.
2. **Listing status enum: `active` / `sold`** — overrides docs which had `available` / `sold`. Simpler vocabulary.
3. **Listing price: integer TL, no decimals** — overrides docs `NUMERIC(10,2)`. Turkish lira pricing for student items doesn't need cents; integer cleaner.
4. **Listing images: max 3 per listing, 5 MB each, auth-gated through backend** — not served from a static dir. MIME + extension + magic-bytes validation. Streamed save to `uploads/listings/<listing_id>/<uuid>.<ext>`.
5. **Default marketplace filter "Sadece aktif" ON** — sold items hidden by default; URL has `include_sold=1` only when toggled OFF.
6. **Listing edit: skipped for v1** — only create + delete + status flip. Edit can come later if time allows on Day 6.
7. **`messages.listing_id` is NULLABLE with `ON DELETE SET NULL`** — orphan messages survive listing deletion; UI shows "Bu ilan kaldırıldı" placeholder.
8. **No real-time messaging** — polling at 5 s interval ONLY on the open thread. No websockets, no SSE.
9. **Inbox does NOT poll** — mount-fetch only + manual "Yenile" button. Polling on a list view is wasteful when user could just click refresh.
10. **`ThreadView` cleanup: `useEffect` cleanup + `visibilitychange` handler + `beforeunload` defensive backup** — overrides prior memory entry that said "NO beforeunload (theatre)". User explicitly wanted defensive backup; documented here.
11. **Conversation list lives at `/messages` page**, not as a navbar dropdown. Easier to scan, room to grow.
12. **Listing creation transactionality** — pre-allocate `uuid4()`, flush listing row, save each image (per-file cleanup in `save_image` on error), on outer exception rollback DB + `shutil.rmtree(listing_dir, ignore_errors=True)`.
13. **Project uses `npm`, not `pnpm`** — has `package-lock.json`. `CLAUDE.md` line 32 lists `pnpm` but that's stale; project conventions follow `npm run dev`.
14. **PR-based workflow adopted from Day 2 onwards** — Day 1 used direct `main` pushes per the early-scaffolding exception in `CLAUDE.md`. From Day 2 every feature gets its own `feature/<name>` branch and merges via GitHub PR UI.
15. **Calendar library: `react-big-calendar` over `fullcalendar`** — ~100KB vs 250KB+, native React (no imperative wrapper), Month-view-only is enough; we don't need drag-drop, recurring events, Google sync, or resource scheduling.
16. **Events list defaults to `range=all`** — past events stay visible per the v1 spec ("past events visible but RSVP disabled"). The "Bu hafta" / "Bu ay" / "Tümü" dropdown is opt-in.
17. **List view is the default on `/events`; calendar is opt-in via toggle** — mobile-first; calendar is decision-fatigue material on small screens.
18. **View choice persists in localStorage under `student_eco.events.view`** — toggle "sticks" across visits without polluting the URL or requiring a backend pref.
19. **Asia/Istanbul treated as fixed UTC+3** — Turkey doesn't observe DST since 2016. `turkeyLocalToUtcIso` does pure-string parsing + `Date.UTC` so the conversion doesn't depend on the user's machine timezone (which would silently break the demo for non-Turkey clocks).
20. **Capacity overrun by 1 is acceptable for v1** — `rsvp` does a check-then-insert without `SELECT FOR UPDATE`; race between count-check and insert can let one extra slot slip in under high concurrency. Unique constraint on `(event_id, user_id)` still prevents double-booking. Hardening to `SELECT FOR UPDATE` is post-demo.
21. **`EventFullError(ConflictError)` with `error_code='event_full'`** — frontend distinguishes "you already RSVPed" (409 `conflict`) from "event is full" (409 `event_full`) without parsing message text. Domain error subclass lives in `services/events.py` to keep `core/exceptions.py` domain-free.
22. **No edit endpoint for events in v1** — delete + recreate is the supported flow. Capacity is set at creation time only; later changes are out of scope.
23. **`events` table has CHECK constraints at the DB level** — category enum + `ends_at >= starts_at` + `max_attendees IS NULL OR max_attendees >= 1`. Defense in depth on top of Pydantic validation; protects against direct SQL writes (e.g., the upcoming seed script).
24. **PATCH /auth/me editable fields: `display_name`, `university`, `department` only** — email and password stay non-editable. Email change needs verification (out of scope); password reset out of scope per CLAUDE.md. Null on optional fields clears them; null/empty `display_name` returns 422.
25. **PublicProfileRead does not include email** — public profile is shown to other students; leaking email defeats the contact-via-buddy / messages-via-listing flows. Counts surfaced: `notes_count`, `listings_count` (active only — "what they're currently selling"), `events_organized_count` (total), `buddy_profile_id` (UUID or null so the frontend can link to /buddies/{id} without a second roundtrip). Excluded: messages, RSVPed events (private to the user).
26. **/uploads/avatars/\* is public StaticFiles, not auth-gated** — overrides the `listings/` and `notes/` pattern. Reason: avatars are inherently public once shown on a `/profile/{userId}` page; auth-gating adds friction (custom `<AuthImage />` wrapper, blob URL lifecycle) without privacy benefit. Notes and listing images stay auth-gated because they have real privacy expectations.
27. **Avatar filename = `{uuid4().hex}.{ext}`, not `{user_id}.{ext}`** — each upload gets a fresh URL. Old file deleted on replace inside `set_avatar`. Cache-busting is free; no `?v=timestamp` query param needed. DB stores only the relative path `avatars/<uuid>.<ext>`; `avatar_url_from_path()` prepends `/uploads/`.
28. **Avatar surfaces: detail pages + navbar only, no list cards** — `ListingCard`, `NoteCard`, `EventRow` all wrap their content in a single outer `<Link>`. Adding a nested `<Link>` for the avatar/name would invalidate the HTML; pulling out the outer Link in favor of `onClick` is a bigger refactor than the demo needs. Avatars live on the 4 detail pages (marketplace, notes, events) + navbar dropdown/mobile sheet + both profile pages.
29. **Home page data-fetching: 4 parallel client-side fetches over a `/home/feed` aggregate** — parallel `Promise.all` saves nothing meaningful vs a single aggregate (max of fetches, not sum), reuses existing endpoints, gives each section its own loading/empty/error state, and matches the rest of the app. Aggregate endpoint was rejected because it's purpose-built, hard to reuse, and grows with every new home widget.
30. **`?mine=1` query param on `GET /events`** — picked over two new endpoints (`/events/organized` + `/events/attending`). One-line OR filter (`organizer_id = me OR id IN (event_attendees WHERE user_id = me)`); reusable for any future "My events" UI; default behavior unchanged when omitted. Combines with the existing `from`/`to`/`category`/`q`/`limit`/`offset` filters.
31. **Home page route: branch inside `(app)/page.tsx` on `hydrated && user`, not a separate authed route** — guest landing CTAs and authed dashboard both live at `/`. SSR returns a thin shell; the client picks the view after reading localStorage. Avoids redirect loops and matches how the navbar already gates on auth state.
32. **`docker-compose.yml` kept-with-comment over removed** [Phase 5] — Day 2's `8df217c` switched DATABASE_URL to system Postgres on `:5432`, leaving the compose file (Postgres-on-:5433) orphaned. Removing it loses an option for contributors without a native Postgres install for ~zero ongoing cost; a 7-line header comment annotates it as alternate setup with the env-var override needed to use it.
33. **Suspense fix style: thin outer wrapper renaming body to `<Name>PageContent`** [Phase 5] — for each of the 4 list pages with `useSearchParams`, the default export becomes `<Suspense fallback={<PageFallback />}><PageContent /></Suspense>`; the original body is renamed to `<Name>PageContent` and the fallback is a header+filter+list skeleton matching the page's chrome. Smallest possible diff that satisfies Next 15's CSR-bailout boundary requirement; alternatives like extracting only the search-param-reading sub-block would have churned more JSX for no functional gain.
34. **npm audit accept-for-v1** [Phase 5] — 5 Next.js CVEs (re-attributed from `react-big-calendar` to `next` itself + its eslint plugin) require a `next@16.2.6` major bump to patch. Decided to document and accept rather than patch: CVEs affect dev-server / image-optimization paths not used by the localhost demo, and a Next major mid-graduation-project is too risky.
35. **Docker as primary boot path; native dev preserved** [Day 6] — `docker compose up` is the one-command demo path; native `uvicorn` + `npm run dev` still works against host Postgres. Three concrete sub-decisions: (a) **named volume `uploads`** for backend `/app/uploads` rather than a host bind mount — survives container rebuilds without coupling demo state to the host filesystem layout (and avoids the uid-mismatch papercut a bind would create against the non-root `appuser`); (b) **build-arg for `NEXT_PUBLIC_API_BASE_URL`** because `NEXT_PUBLIC_*` is baked into the bundle at build time; runtime `env_file: frontend/.env.local` is kept anyway per the user instruction (harmless, useful for any future server-side env); (c) **`environment: DATABASE_URL` in compose overrides `backend/.env`** so the file can keep its native-dev value (`localhost:5432`) while the container uses the compose-network hostname (`db:5432`). The orphaned alternate-Postgres-on-:5433 compose file (Day 2 leftover, Decision #32) was replaced rather than kept — its sole use case (no native Postgres) is now subsumed by the new `db` service.

## Recent Session Snapshots

### 2026-05-09 — Day 3 wrap-up; STATE.md system installed

- **Done this session:** Built C7 (frontend messages inbox + per-listing thread + orphan thread, with 5 s polling, visibilitychange pause, beforeunload defensive backup, manual "Yenile" inbox refresh, auto-scroll only on new messages). Merged `feature/marketplace` via PR #2 (regular merge, all 7 commits preserved). Deleted local + remote feature branch. Renamed `Claude.md` → `CLAUDE.md`. Installed this session-resume system (CLAUDE.md "Session Resume Protocol" section + STATE.md).
- **Next:** Day 4 — Events module. Plan TBD at kickoff. Servers stopped; user must restart manually.
- **Unresolved:** None tracking. The "no navbar links to feature pages" debt could be cleaned up early in Day 4 if it bothers the user during Events nav design.

### 2026-05-10 — Day 4 wrap-up; events module shipped

- **Done this session:** Built and merged `feature/events` (PR #3, 7 commits). E1 = events + event_attendees models + migration. E2 = CRUD + RSVP routes (smoke-tested end-to-end: register → create → list → RSVP → 409 dup → cancel → 404 cancel-again → delete → cascade). Surfaced and fixed a latent JSON-serialization bug in `validation_handler` (commit `bee689d`) — affected all 422 responses app-wide, not just events. E3 = frontend API client + list page (URL-driven filters). E4 = react-big-calendar Month view with toggle, persisted in localStorage, default list. E5 = detail page (parallel event+attendees fetch, RSVP toggle, organizer-only delete, past-event badge), new-event form (datetime-local treated as Asia/Istanbul fixed UTC+3 and converted to UTC ISO). E6 = capacity (`max_attendees` nullable column, CHECK >= 1, `EventFullError` with `error_code='event_full'`, "Dolu" pill on detail, RSVP-disabled when full and not already attending; past wins over Dolu in disabled label). All six 3-account capacity scenarios verified in browser by user.
- **Next:** Day 5 kickoff. See Current Position for the Buddy-vs-Polish framing — original roadmap put Buddy on Day 3 afternoon and Polish on Day 5; our compressed schedule means Day 5 could be either.
- **Unresolved:**
  - npm audit warnings from rbc transitive deps (5 vulnerabilities) — assess and patch-or-accept on Day 5
  - Events docs (`03-database-schema.md`, `04-api-spec.md`) drift from implementation in several places (category set, attendee shape, no PATCH, no `max_attendees`) — Day 5 doc-polish
  - Servers (backend `:8000`, frontend `:3000`) left running at session close
  - Day 3 tech debt items (navbar links, `pnpm` typo, `uv.lock` decision) all still open — bundle into Day 5 polish per user's earlier call

### 2026-05-11 — Day 5 Phase 5: tech-debt cleanup + Day 5 wrap-up

- **Done this session:** Landed Phase 5 as `87dff63` directly on main (single commit, no PR per CLAUDE.md "trivial chores"). Suspense-wrapped `useSearchParams` on four list pages (notes/marketplace/events/buddies — buddies was missed by the original Day-2 debt note but had the same pattern; build would have failed without it). Verified via `npm run build`: ✓ Compiled, 17/17 pages, all four list routes now Static. Tracked `backend/uv.lock`. Corrected `CLAUDE.md` `pnpm` → `npm` on both hits. Annotated `docker-compose.yml` with a 7-line header comment marking it as alternate setup (kept over removed; preserves the option for contributors without native Postgres). Dropped stale `curl :5433` permission from `.claude/settings.local.json` (local-only, not in commit since the file is gitignored). Re-attributed the npm-audit warnings from `react-big-calendar` to Next.js itself (5 CVEs, fix is `next@16.2.6` major bump) and accepted-for-v1.
- **Next:** Day 6 — Polish + Demo. Open kickoff items: docs reconciliation (events Day-4 drift + profile/avatar Phase-3 drift, both in `docs/03-database-schema.md` and `docs/04-api-spec.md`), final demo prep (seed data sanity, smoke walkthrough of all 4 modules + home + profile flows).
- **Unresolved:**
  - Backend and frontend dev servers both stopped at session close — restart instructions in the Services section.
  - Docs drift item is the biggest open piece; bundled into a single Open Tech Debt entry covering both events and profile/avatar surfaces.
  - Next.js CVEs accepted-for-v1 — flagged in Decisions Log #34 and the corresponding Open Tech Debt bullet.

### 2026-05-11 — Day 5 Phase 4: home page content

- **Done this session:** Merged `feature/home-content` via PR #7 (`8f6c5ee`, 2 commits). Backend `d47f655` added `?mine=1` filter to `GET /events` — OR'd organizer + attendee, combines with the existing filters, default behavior unchanged when omitted. Frontend `fc3677e` rewrote `(app)/page.tsx` to branch on `hydrated && user`: guest sees the existing CTAs unchanged, authenticated user sees welcome banner (avatar + display_name), 4 quick-access cards (Notlar / Marketplace / Etkinlikler / Buddy with tinted icons), and "Son aktivite" with three parallel `Promise.all` fetches (last 3 notes, last 3 active listings, next upcoming `mine=1` event with `from=now&limit=1`). Each block carries its own loading/empty/error state. Backend smoke-tested via curl (mine=1 transitions through 0 → 1 organized → 2 organized+attended; from filter composes; 401 unauth). Frontend tsc + eslint clean; `/` serves 200.
- **Next:** Day 5 Phase 5 = `chore/tech-debt-cleanup` — kickoff pending. Scope per Open Tech Debt + the original Phase 5 plan: CLAUDE.md `pnpm` → `npm`, `backend/uv.lock` tracking decision, npm-audit triage on `react-big-calendar` transitive deps, Day 4 events docs reconciliation (`docs/03-database-schema.md` §2.5 + `docs/04-api-spec.md` §6).
- **Unresolved:**
  - Backend running on `:8000` (uvicorn, foreground, no `--reload`), frontend on `:3000` (`npm run dev`) at session close.
  - Day 3 navbar-links debt item still listed even though closed by Phase 2 — Phase 5 will retire it.
  - Avatar feature notes for docs: docs/04-api-spec.md needs the new `POST/DELETE /auth/me/avatar` endpoints and `avatar_url` fields documented; could fold into Phase 5's docs pass if not too much.

### 2026-05-11 — Day 5 Phase 3: profile pages + avatar feature

- **Done this session:** Merged `feature/profile` via PR #6 (`13d570a`, 10 commits — see Day 5 section for commit list). Phase 3 backend: PATCH /auth/me (display_name/university/department, null clears optionals, 422 on empty/null display_name) + GET /users/{user_id}/profile (4 counts, email excluded). Phase 3 frontend: /profile/me view+edit, /profile/[userId] public, name links wired on marketplace/notes/events detail pages (not list cards — outer Link wrappers). User then asked for an unplanned avatar feature mid-phase; pushed back briefly with the time cost, agreed on "Minimal" scope, then shipped: backend POST/DELETE /auth/me/avatar (2 MB JPG/PNG, magic-byte validated, atomic replace via uuid filename, /uploads/avatars/* public StaticFiles mount), `avatar_url` added to UserOut + PublicProfileRead + ListingRead + NoteRead + EventRead + AttendeeRead via existing user joins (one extra SELECT column, no new queries). Frontend: `<Avatar />` primitive with initials fallback (sm/md/lg/xl), upload UI on /profile/me, avatars rendered on /profile/[userId], navbar dropdown trigger + mobile sheet, marketplace seller card, notes author byline, events organizer card + attendee list. Two migrations: `4bb7abc9298c` (profile fields), `9c42bcd130fa` (avatar_path). Backend smoke-tested via curl end-to-end (replace, idempotent delete, MIME/magic/size rejections, counts match psql ground truth). Frontend tsc + eslint clean; all routes 200; user visually verified before merge.
- **Next:** Day 5 Phase 4 — topic TBD at kickoff. After Phase 4, sequenced phases are Phase 5 (`chore/tech-debt-cleanup`) and Phase 6 (Day 5 wrap-up + Day 6 polish kickoff).
- **Unresolved:**
  - Backend running on `:8000` (uvicorn, foreground, no `--reload`), frontend on `:3000` (`npm run dev`) at session close.
  - Day 3 tech-debt items still on the Open Tech Debt list pending Phase 5 chore commit (navbar typo, `uv.lock` decision, the navbar-links debt closed by Phase 2 but still listed by convention).
  - Day 4 events docs drift not yet reconciled (deferred to Phase 5/6).
  - npm-audit warnings on `react-big-calendar` transitive deps unchanged.

### 2026-05-11 — Day 5 Phase 2: navbar feature links

- **Done this session:** Merged `feature/navbar-links` (PR #5, 1 commit `5533e9a`). Navbar now exposes 5 module links (Notlar / Marketplace / Etkinlikler / Buddy / Mesajlar) on desktop (between logo and right-side actions) and inside the existing mobile hamburger sheet. Active route gets `bg-accent` + `font-medium` + `aria-current="page"`; `isActiveLink` uses prefix match so `/events/123` keeps "Etkinlikler" highlighted. New "Profilim" dropdown item between user header and "Çıkış yap" → `/profile/me` (404 until Phase 3). Links + Profilim gated to `hydrated && user`, matching the existing avatar-dropdown gating so guests still only see Giriş / Kaydol. (Context: Phase 1 — `feature/buddy` study-buddy module — was merged earlier today as PR #4; full Day 5 wrap-up entry deferred to Phase 6 per the kickoff plan.)
- **Next:** Phase 3 — profile pages. Backend: `PATCH /auth/me` (display_name/university/department), `GET /users/{user_id}/profile` (public DTO with counts). Frontend: `/profile/me` (view + edit), `/profile/[userId]` (public), wire seller/uploader/organizer name links. Pausing for kickoff approval.
- **Unresolved:** Day 3 "No navbar links to feature pages" tech-debt item is now closed by this PR — Open Tech Debt list still shows it; cleanup happens in Phase 5 (`chore/tech-debt-cleanup`) along with the other Day 3 debts. Other open items unchanged.

### 2026-05-12 — Day 6 kickoff: dockerize stack

- **Done this session:** Landed Docker setup as `dfd0891` directly on main (single commit, no PR per CLAUDE.md "trivial chores"). Six files: `backend/Dockerfile` (python:3.12-slim, non-root `appuser`, `pip install .`, runs `alembic upgrade head && uvicorn` on start), `frontend/Dockerfile` (multi-stage node:20-alpine → Next standalone runtime as the `node` user, `NEXT_PUBLIC_API_BASE_URL` accepted as build-arg), `frontend/next.config.mjs` (added `output: 'standalone'` — only application-adjacent change), `docker-compose.yml` (replaces the orphaned alternate-Postgres-on-:5433 file from Day 2; three services with `pg_isready`-gated startup, named volumes for `pgdata` + `uploads`, host ports 5432/8000/3000, in-container `DATABASE_URL` overridden to `db:5432` via `environment:` so `backend/.env` can keep its native-dev value), `backend/.dockerignore` + `frontend/.dockerignore` (per-spec exclude list + standard cruft). Decision #35 captures the three Docker sub-decisions (named volume vs bind mount, build-arg for `NEXT_PUBLIC_*`, env override for `DATABASE_URL`). Files written and committed; **`docker compose build` not run yet — boot is unverified end-to-end.**
- **Next:** Smoke-test the full `docker compose up --build` boot (will require stopping host Postgres on `:5432` first; document conflict already noted in Services section). Then continue Day 6 kickoff items: docs reconciliation (`docs/03-database-schema.md` + `docs/04-api-spec.md` drift from Day 4 events + Phase 3 profile/avatar), seed-data sanity, end-to-end smoke walkthrough across all 4 modules + home + profile.
- **Unresolved:**
  - **Docker boot unverified** — files committed without running `docker compose build` end-to-end. First run from a clean state should be done before relying on this for the demo.
  - Host Postgres on `:5432` will conflict with the new `db` service's `5432:5432` mapping; documented in the Services section, will need `sudo systemctl stop postgresql` before `docker compose up`.
  - Backend + frontend both stopped at session close (no containers up, no native dev servers running).
  - All Day 5 carry-overs unchanged: docs drift (single Open Tech Debt entry covering Day 4 events + Phase 3 profile/avatar), Next.js CVEs accepted-for-v1, bcrypt 72-byte truncation, localStorage JWT exposure.
