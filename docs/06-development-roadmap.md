# 06 — Development roadmap

## Purpose of this document

The 6-day plan for building Student Ecosystem from scaffold to demo-ready. Each day is split into a morning block and an afternoon block with concrete tasks and verifiable success criteria. Slip a day → cut from the bottom (Day 6 polish first), don't slip the demo.

## 1. Day-by-day plan

### Day 1 — Scaffolding & auth

**Morning: project setup**
- Init repos: `backend/` (FastAPI + uv/pip), `frontend/` (Next.js + pnpm)
- Backend: configure `pyproject.toml`, install fastapi, sqlalchemy, alembic, pydantic-settings, python-jose, passlib[bcrypt], psycopg, httpx
- Frontend: scaffold Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui (init + add `button`, `input`, `card`, `form`)
- Postgres: spin up locally via Docker, configure connection
- Alembic: init, configure to read DB URL from env, generate baseline migration
- Set up `.env.example` files in both apps

**Afternoon: auth end-to-end**
- Backend: `users` table (model + migration), Pydantic schemas, repository, auth service (register/login/me), JWT helpers in `core/security.py`, `get_current_user` dependency
- Backend: routes for `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Frontend: API client (`lib/api/auth.ts`), `lib/auth.ts` for token storage, `/login` and `/register` pages, navbar with login state
- Wire up CORS in FastAPI

**Success criteria:**
- Both apps start with one command each
- A user can register via the frontend, log in, and see their email rendered in the navbar
- `pytest` passes one smoke test (register + login + /me round-trip)

### Day 2 — Notes & marketplace (no messaging)

**Morning: notes module**
- Backend: `notes` model + migration, repository, service (with file save via `storage/uploaders.py`), routes (`GET /notes`, `POST /notes`, `GET /notes/{id}`, `GET /notes/{id}/download`, `DELETE /notes/{id}`)
- Backend: file validation (PDF MIME, ≤10MB), `uploads/notes/` directory served as static
- Frontend: `lib/api/notes.ts`, `/notes` (list + filter), `/notes/new` (upload form), `/notes/[id]` (detail + download)

**Afternoon: marketplace listings (without messages)**
- Backend: `listings` and `listing_images` models + migration, repositories, listing service, routes (CRUD + image upload/delete)
- Backend: image validation (jpeg/png, ≤5MB, max 8 per listing), `uploads/images/` static
- Frontend: `lib/api/listings.ts`, `/marketplace` (grid + filters), `/marketplace/new` (form + image uploader), `/marketplace/[id]` (detail + carousel)

**Success criteria:**
- Upload a PDF and download it back via the UI
- Create a listing with 2 images and view it on the detail page
- Filtering on `/notes` and `/marketplace` returns the expected results
- Smoke tests for note upload and listing create pass

### Day 3 — Events & study buddy

**Morning: events module**
- Backend: `events` and `event_attendees` models + migrations, repositories, service, routes (CRUD + RSVP/un-RSVP + attendee list)
- Frontend: `lib/api/events.ts`, `/events` (list + filter by category and date), `/events/new`, `/events/[id]` (detail + RSVP button + attendee list)

**Afternoon: study buddy module**
- Backend: `buddy_profiles` model + migration, repository, service, routes (`GET /buddies`, upsert `PUT /buddies/me`, `GET /buddies/me`, `GET /buddies/{id}`, `DELETE /buddies/me`)
- Frontend: `lib/api/buddies.ts`, `/buddies` (list + filter), `/buddies/me` (form), `/buddies/[id]` (profile view with prominent contact_info)

**Success criteria:**
- Create an event, RSVP, see your name in the attendee list
- Create a buddy profile, find it via subject filter, view it from someone else's account
- Smoke tests for event RSVP and buddy upsert pass

### Day 4 — Marketplace messaging + integration

**Morning: messages backend + thread inbox**
- Backend: `messages` model + migration, repository, message service (validates sender/recipient relationship to listing), routes (`POST /messages`, `GET /messages` inbox, `GET /messages/listings/{id}/with/{user_id}`, `PATCH /messages/{id}/read`)
- Frontend: `lib/api/messages.ts`, `/messages` inbox page (list of threads)

**Afternoon: thread view & integration**
- Frontend: `/marketplace/[id]/messages` thread view, message composer, "Message seller" button on listing detail
- Frontend: 10s polling on the thread page (focused only)
- End-to-end test by hand: User A lists a book → User B sends message → both see thread → A marks as sold

**Success criteria:**
- A 2-user demo flow works completely on the marketplace + messaging path
- Inbox shows threads with last-message preview and unread count
- Smoke tests for message send/list pass

### Day 5 — Polish, error handling, UX consistency

**Morning: error handling & states**
- Backend: confirm exception middleware maps every `AppError` correctly; add 404s where missing; review status codes
- Frontend: route-level `error.tsx` and `loading.tsx` for each module; empty-state components for every list; toasts on success/failure
- Validate all forms client-side via Zod

**Afternoon: UI polish**
- Visual consistency: spacing, typography, button variants; same card style across modules
- Mobile responsiveness pass (375px breakpoint)
- Navbar: active link styling, mobile hamburger
- Replace any leftover Lorem with realistic copy
- Add `seed.py` with the data from `03-database-schema.md` §4

**Success criteria:**
- No unhandled errors visible in the browser when poking edges (delete + refresh, 404 IDs, etc.)
- All pages render cleanly on mobile width
- A judge can navigate the app without seeing a single empty white page

### Day 6 — Deployment & demo prep

**Morning: deploy**
- Provision Neon Postgres (free tier); copy `DATABASE_URL`
- Deploy backend to Render (Web Service, Python runtime); set env vars; run `alembic upgrade head` via shell
- Deploy frontend to Vercel; set `NEXT_PUBLIC_API_URL` to the Render URL
- Smoke-test the deployed app end-to-end
- Optional: custom domain if available

**Afternoon: demo prep**
- Seed production DB with the demo data from `seed.py`
- Write a 10-minute demo script: register → upload note → list textbook → message → RSVP to event → create buddy profile
- Take screenshots of every module for the presentation slides
- README polish: clear "Run locally" + deployment URLs
- Buffer time: fix anything that breaks during dry runs

**Success criteria:**
- Deployed URLs are accessible and the demo script runs end-to-end on production data
- README has working local-setup instructions a stranger could follow

## 2. Daily ritual

- **Start of day:** read the day's roadmap entry; review yesterday's open issues
- **Mid-day check-in:** if the morning block isn't done by lunch, cut something — don't push afternoon work into evening
- **End of day:** when prompted "wrap up the day", produce a 5-bullet summary: built / skipped / broken / next day's risk / blockers (per CLAUDE.md §5 working protocol)

## 3. Cut list (in order, if behind schedule)

If a day slips, drop in this order — these are the items most decoupled from the demo:

1. Day 5 mobile responsiveness (desktop demo only)
2. Day 6 custom domain
3. Day 4 unread-count in inbox
4. Day 4 message read receipts
5. Day 2 listing edit (delete + re-create works)
6. Day 3 buddy delete (rare in demo)

If you cut something, note it in the commit message and update `docs/01-requirements.md` with the deferral.

## 4. Risks & mitigations

| Risk                                         | Mitigation                                                  |
|----------------------------------------------|-------------------------------------------------------------|
| File uploads break on Render (ephemeral FS)  | See `08-deployment.md` Known Limitations — re-seed on demo  |
| Alembic migration drift between dev & prod   | Always run `alembic upgrade head` after deploy; CI later    |
| JWT secret not set in prod                   | Pydantic Settings raises on missing required env vars       |
| Cold-start lag on Render free tier           | Hit the URL once before the demo to warm it                 |
| Browser CORS blocks API calls                | Test from the deployed frontend on Day 6 morning, not later |

## Related documents

- [01-requirements.md](01-requirements.md) — features each day delivers
- [02-architecture.md](02-architecture.md) — structure assumed by the day-1 scaffold
- [07-coding-standards.md](07-coding-standards.md) — applied throughout
- [08-deployment.md](08-deployment.md) — Day 6 in detail
