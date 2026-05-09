# Project State

> Auto-maintained by Claude Code. Read at session start, update at session end (or before usage cutoff). Never delete history sections — append.

## Current Position

- **Day:** 3 of 6 — Marketplace + messaging module
- **Active branch:** `main`
- **Last commit:** `4d27b76` chore: rename Claude.md to CLAUDE.md
- **Next step:** Day 3 wrap-up. Day 4 (Events module) starts on the next session — branch `feature/events`.
- **Blockers:** None. Awaiting Day 4 kickoff.

## Services

- Backend: stopped (uvicorn killed at end of last session)
- Frontend: stopped (`npm run dev` killed at end of last session)
- Postgres: assumed running on `:5432` (system service, not stopped explicitly)

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

### Day 4 — Events 🔜

Not started. Plan TBD at Day 4 kickoff.

### Day 5 — Study Buddy 🔜

Not started.

### Day 6 — Polish + Demo 🔜

Not started.

## Open Tech Debt

- **bcrypt 72-byte truncation** [Day 1] — passwords longer than 72 bytes are silently truncated. Acceptable for v1 demo.
- **localStorage XSS exposure for JWT** [Day 1] — known tradeoff documented in `docs/05-frontend-pages.md`. Acceptable for v1.
- **`useSearchParams` Suspense bailout** [Day 2] — dev warning only; needs `<Suspense>` wrapper before deploy.
- **No navbar links to feature pages** [Day 3] — `/messages`, `/marketplace`, `/notes` only reachable by direct URL or after first action. Polish in Day 4 or 5.
- **`CLAUDE.md` line 32 says `pnpm`** [Day 3] — project actually uses `npm`. Fix wording in next chore commit.
- **`backend/uv.lock` untracked** [Day 1, surfaced Day 3] — decide tracked-or-ignored. [Day 5 polish]

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

## Recent Session Snapshots

### 2026-05-09 — Day 3 wrap-up; STATE.md system installed

- **Done this session:** Built C7 (frontend messages inbox + per-listing thread + orphan thread, with 5 s polling, visibilitychange pause, beforeunload defensive backup, manual "Yenile" inbox refresh, auto-scroll only on new messages). Merged `feature/marketplace` via PR #2 (regular merge, all 7 commits preserved). Deleted local + remote feature branch. Renamed `Claude.md` → `CLAUDE.md`. Installed this session-resume system (CLAUDE.md "Session Resume Protocol" section + STATE.md).
- **Next:** Day 4 — Events module. Plan TBD at kickoff. Servers stopped; user must restart manually.
- **Unresolved:** None tracking. The "no navbar links to feature pages" debt could be cleaned up early in Day 4 if it bothers the user during Events nav design.
