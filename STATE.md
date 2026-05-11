# Project State

> Auto-maintained by Claude Code. Read at session start, update at session end (or before usage cutoff). Never delete history sections — append.

## Current Position

- **Day:** 5 of 6 — Phases 1-3 shipped; Phase 4 TBD at kickoff
- **Active branch:** `main`
- **Last commit:** `13d570a` Merge pull request #6 from yselimc/feature/profile
- **Next step:** Day 5 Phase 4 — topic TBD at kickoff. Remaining sequenced phases per the in-flight plan: Phase 5 = `chore/tech-debt-cleanup` (Day 3 items: navbar typo, `uv.lock` decision, npm-audit, Day 4 events doc drift), Phase 6 = Day 5 wrap-up + Day 6 polish kickoff.
- **Blockers:** None.

## Services

- Backend: running on `:8000` (uvicorn, foreground was killed earlier this session and restarted; still up at session close)
- Frontend: running on `:3000` (`npm run dev`, still up at session close)
- Postgres: running on `:5432` (system service)
- If the user wants a clean stop before next session: `pkill -f "uvicorn app.main"` and Ctrl-C the next-dev terminal, or just leave them running.

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
- Phases 4-6 not yet started.

### Day 6 — Polish + Demo 🔜

Not started.

## Open Tech Debt

- **bcrypt 72-byte truncation** [Day 1] — passwords longer than 72 bytes are silently truncated. Acceptable for v1 demo.
- **localStorage XSS exposure for JWT** [Day 1] — known tradeoff documented in `docs/05-frontend-pages.md`. Acceptable for v1.
- **`useSearchParams` Suspense bailout** [Day 2] — dev warning only; needs `<Suspense>` wrapper before deploy.
- **No navbar links to feature pages** [Day 3] — `/messages`, `/marketplace`, `/notes` only reachable by direct URL or after first action. Polish in Day 4 or 5.
- **`CLAUDE.md` line 32 says `pnpm`** [Day 3] — project actually uses `npm`. Fix wording in next chore commit.
- **`backend/uv.lock` untracked** [Day 1, surfaced Day 3] — decide tracked-or-ignored. [Day 5 polish]
- **Events doc deviations from `docs/03-database-schema.md` and `docs/04-api-spec.md`** [Day 4] — schema doc lists `career` not `culture`; doesn't enforce category enum at DB level (we added a CHECK); attendee shape doc says `{user_id, full_name, department}` but we return `{user_id, display_name, rsvp_at}` (User model has `display_name`, no `department` column); spec lists `PATCH /events/{id}` we didn't implement (no edit for v1); neither doc mentions `max_attendees`. Reconcile in Day 5/6 doc-polish pass.
- **npm audit warnings from `react-big-calendar` transitive deps** [Day 4] — 5 vulnerabilities reported (1 moderate, 4 high) at install. Not blocking the demo; assess severity and decide patch-or-accept on Day 5.
- **`validation_handler` `ctx.error` serializes as `{}`** [Day 4] — the `bee689d` fix uses `jsonable_encoder` which coerces non-JSON values to empty dicts. Field error message still carries the human-readable text via the `msg` field; the `ctx` is just lossy. Acceptable; flag if a future error path needs richer ctx.

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
