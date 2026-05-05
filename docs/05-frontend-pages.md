# 05 — Frontend pages

## Purpose of this document

Catalogs every page in the Next.js frontend: route, server-vs-client status, components used, APIs called, and a text wireframe. Use this as the page inventory when implementing the UI.

## 1. Conventions

- Routes follow Next.js App Router (file = `app/<route>/page.tsx`)
- "Server" = server component by default. "Client" = `"use client"` directive at the top.
- shadcn/ui components are pulled in per page; install with `pnpm dlx shadcn-ui add <name>` as needed
- All pages share a root layout with a top navbar (`components/shared/navbar.tsx`) and a toaster (`<Toaster />`)
- Auth: pages under `/login`, `/register`, `/` (landing) are public; everything else redirects to `/login` if no JWT

## 2. Page inventory

| Route                             | Type    | Purpose                            |
|-----------------------------------|---------|------------------------------------|
| `/`                               | Server  | Landing / dashboard                |
| `/login`                          | Client  | Email + password login             |
| `/register`                       | Client  | New account signup                 |
| `/notes`                          | Server  | Note list with filters             |
| `/notes/new`                      | Client  | Upload a PDF                       |
| `/notes/[id]`                     | Server  | Note detail + download             |
| `/marketplace`                    | Server  | Listing grid with filters          |
| `/marketplace/new`                | Client  | Create a listing (form + images)   |
| `/marketplace/[id]`               | Server  | Listing detail + image gallery     |
| `/marketplace/[id]/messages`      | Client  | Thread view for this listing       |
| `/events`                         | Server  | Upcoming events list               |
| `/events/new`                     | Client  | Create an event                    |
| `/events/[id]`                    | Server  | Event detail + RSVP + attendees    |
| `/buddies`                        | Server  | Buddy profile list with filters    |
| `/buddies/me`                     | Client  | Edit own profile                   |
| `/buddies/[id]`                   | Server  | View a buddy profile               |
| `/messages`                       | Server  | Inbox: list of threads             |
| `/me`                             | Client  | Edit own user (full_name, etc.)    |

## 3. Per-page details

Each entry lists the components, shadcn primitives, API calls, and a text wireframe. Wireframes are intentionally rough — they're for layout intent, not pixel design.

### `/` — Landing / dashboard (Server)

- **Components:** `components/shared/hero.tsx`, `components/shared/module-card.tsx`
- **shadcn:** `Card`, `Button`
- **API:** none for the public hero; if logged in, `GET /api/auth/me` to greet by name
- **Wireframe:**
```
┌─────────────────────────────────────────────┐
│ [Logo] Notes  Market  Events  Buddies  Me   │
├─────────────────────────────────────────────┤
│  Welcome to Student Ecosystem               │
│  [Get started] [Log in]                     │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────┐ │
│  │ Notes   │ │ Market  │ │ Events  │ │ ...│ │
│  └─────────┘ └─────────┘ └─────────┘ └────┘ │
└─────────────────────────────────────────────┘
```

### `/login` (Client)

- **Components:** `components/auth/login-form.tsx`
- **shadcn:** `Card`, `Input`, `Label`, `Button`, `Form` (react-hook-form), `Toaster`
- **API:** `POST /api/auth/login` → store JWT in localStorage, redirect to `/`
- **Wireframe:**
```
┌──────────────────────────┐
│ Log in                   │
│ Email   [____________]   │
│ Pass    [____________]   │
│ [   Log in   ]           │
│ No account? Register →   │
└──────────────────────────┘
```

### `/register` (Client)

- **Components:** `components/auth/register-form.tsx`
- **shadcn:** `Card`, `Input`, `Label`, `Button`, `Form`
- **API:** `POST /api/auth/register` → store JWT, redirect to `/`
- **Wireframe:** like login + `Full name`.

### `/notes` (Server)

- **Components:** `components/notes/note-filter-bar.tsx` (client), `components/notes/note-card.tsx`
- **shadcn:** `Input`, `Select`, `Card`, `Badge`, `Button`
- **API:** `GET /api/notes?course_code=&semester=&q=&limit=&offset=`
- **Wireframe:**
```
┌─────────────────────────────────────────────┐
│ Notes                              [+ New]  │
│ Course [____] Semester [____] Search [___]  │
├─────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ CS301    │ │ MATH210  │ │ CS210    │      │
│ │ midterm  │ │ cheat    │ │ notes    │      │
│ │ Fall 25  │ │ Sp 25    │ │ Fall 25  │      │
│ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────┘
```

### `/notes/new` (Client)

- **Components:** `components/notes/upload-form.tsx`
- **shadcn:** `Input`, `Textarea`, `Label`, `Button`, `Form`
- **API:** `POST /api/notes` (multipart) → redirect to `/notes/[id]`

### `/notes/[id]` (Server)

- **Components:** `components/notes/note-detail.tsx`, `components/notes/download-button.tsx` (client)
- **shadcn:** `Card`, `Button`, `Badge`
- **API:** `GET /api/notes/{id}`; download triggers `GET /api/notes/{id}/download`
- **Owner-only:** "Delete" button → `DELETE /api/notes/{id}`

### `/marketplace` (Server)

- **Components:** `components/marketplace/listing-filter-bar.tsx` (client), `components/marketplace/listing-card.tsx`
- **shadcn:** `Card`, `Input`, `Select`, `Badge`, `Button`
- **API:** `GET /api/listings?category=&status=&sort=&q=`
- **Wireframe:** card grid; each card shows first image, title, price, category badge.

### `/marketplace/new` (Client)

- **Components:** `components/marketplace/listing-form.tsx`, `components/marketplace/image-uploader.tsx`
- **shadcn:** `Input`, `Textarea`, `Select`, `Label`, `Button`, `Form`, `Card`
- **API:** `POST /api/listings`, then `POST /api/listings/{id}/images`. On success, redirect to `/marketplace/[id]`.

### `/marketplace/[id]` (Server)

- **Components:** `components/marketplace/listing-detail.tsx`, `components/marketplace/image-gallery.tsx` (client), `components/marketplace/contact-seller-button.tsx` (client)
- **shadcn:** `Card`, `Button`, `Badge`, `Carousel` (or `Dialog` for full image)
- **API:** `GET /api/listings/{id}`. Owner sees Edit / Delete / Mark sold buttons.
- **Wireframe:**
```
┌─────────────────────────────────────────────┐
│ ← back                                      │
│ ┌──────────────┐  Title                     │
│ │ image carousel│  $35.00                   │
│ │ [<]      [>] │  [Textbook] [Available]    │
│ └──────────────┘  Description...            │
│                   [Message seller]          │
└─────────────────────────────────────────────┘
```

### `/marketplace/[id]/messages` (Client)

- **Components:** `components/messages/thread-view.tsx`, `components/messages/message-bubble.tsx`, `components/messages/message-composer.tsx`
- **shadcn:** `ScrollArea`, `Input`, `Button`, `Card`
- **API:** `GET /api/messages/listings/{listing_id}/with/{user_id}`, `POST /api/messages`, `PATCH /api/messages/{id}/read` on render
- **Note:** No real-time. Polling every 10s while the page is focused (using `setInterval` in the client component).

### `/events` (Server)

- **Components:** `components/events/event-filter-bar.tsx` (client), `components/events/event-card.tsx`
- **shadcn:** `Card`, `Select`, `DatePicker` (custom around shadcn `Calendar` + `Popover`), `Badge`, `Button`
- **API:** `GET /api/events?category=&from=&to=`
- **Wireframe:** vertical list sorted by `starts_at`. Each row: date block + title + category + "RSVP" button.

### `/events/new` (Client)

- **Components:** `components/events/event-form.tsx`
- **shadcn:** `Input`, `Textarea`, `Select`, `Calendar`, `Popover`, `Button`, `Form`
- **API:** `POST /api/events`

### `/events/[id]` (Server)

- **Components:** `components/events/event-detail.tsx`, `components/events/rsvp-button.tsx` (client), `components/events/attendee-list.tsx`
- **shadcn:** `Card`, `Button`, `Badge`, `Avatar`
- **API:** `GET /api/events/{id}`, `GET /api/events/{id}/attendees`, `POST /api/events/{id}/attendees`, `DELETE /api/events/{id}/attendees/me`

### `/buddies` (Server)

- **Components:** `components/buddies/buddy-filter-bar.tsx` (client), `components/buddies/buddy-card.tsx`
- **shadcn:** `Card`, `Input`, `Select`, `Badge`, `Button`
- **API:** `GET /api/buddies?subject=&style=`
- **Wireframe:** card per profile showing avatar (initials), name, dept, subjects (badges), study style.

### `/buddies/me` (Client)

- **Components:** `components/buddies/buddy-form.tsx`
- **shadcn:** `Input`, `Textarea`, `Select`, `Label`, `Button`, `Form`, `Card`
- **API:** `GET /api/buddies/me`, `PUT /api/buddies/me`, `DELETE /api/buddies/me`

### `/buddies/[id]` (Server)

- **Components:** `components/buddies/buddy-detail.tsx`
- **shadcn:** `Card`, `Avatar`, `Badge`
- **API:** `GET /api/buddies/{id}`. Shows `contact_info` prominently — no in-app messaging.

### `/messages` — Inbox (Server)

- **Components:** `components/messages/thread-list.tsx`, `components/messages/thread-row.tsx`
- **shadcn:** `Card`, `Avatar`, `Badge`
- **API:** `GET /api/messages`
- Each row links to `/marketplace/{listing_id}/messages?with={other_user_id}` (or similar — the route renders the thread view with both IDs from URL).

### `/me` (Client)

- **Components:** `components/me/profile-form.tsx`
- **shadcn:** `Input`, `Label`, `Button`, `Form`, `Card`, `Tabs` (optional, for splitting profile vs auth)
- **API:** `GET /api/auth/me`, `PATCH /api/users/me`

## 4. Shared UI

- **Navbar** (`components/shared/navbar.tsx`, client) — links to all modules, current user dropdown (logout)
- **EmptyState** (`components/shared/empty-state.tsx`, server) — used in any list with zero items
- **ErrorBoundary** (`app/error.tsx`) — Next.js convention; renders a friendly fallback
- **NotFound** (`app/not-found.tsx`) — 404 page

## 5. Auth integration

- **v1 decision: JWT lives in `localStorage`** under key `auth_token`. Read/written by `lib/auth.ts` from client components. Server components that need the user load it via a small client-side bootstrap (the protected pages are mostly client-rendered already).
- `lib/api/client.ts` injects `Authorization: Bearer ...` from `localStorage` on the client and from a request header on the server (when called via SSR after a client fetch hands off the token).
- A 401 response triggers a redirect to `/login` (client side) or a Next.js `redirect()` (server side).

### 5.1 Security tradeoffs

`localStorage` is the simpler choice but it has a known XSS footgun: any script that runs in the page can read the token. The risk is small in v1 because we don't render unsanitized user-generated HTML — all user input is rendered as text via React and listing/note descriptions are plain strings. Adding rich-text or markdown rendering later raises the risk and should be paired with the migration below.

It also avoids the CSRF concerns that come with cookie-based auth, but at the cost of XSS exposure rather than eliminating both.

**Future work — migrate to `httpOnly` cookies:**

- Add a Next.js route handler at `/api/auth/cookie` that takes the JWT from a login response and sets `Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Lax; Path=/`
- Read the cookie in server components and forward it as a `Cookie` header to the FastAPI backend (or convert to `Authorization` server-side)
- Remove `localStorage` usage from `lib/auth.ts`; the cookie is now the single source of truth
- Add CSRF protection to state-changing endpoints (double-submit token or origin check) since cookies are sent automatically

The migration is mechanical and isolated to `lib/auth.ts` + a new route handler — no API surface changes — which is why we can defer it past v1 without painting ourselves into a corner.

## Related documents

- [01-requirements.md](01-requirements.md) — features each page implements
- [04-api-spec.md](04-api-spec.md) — endpoints each page calls
- [07-coding-standards.md](07-coding-standards.md) — TS / component conventions
