# 01 — Requirements

## Purpose of this document

Defines the functional and non-functional requirements for the Student Ecosystem platform. This is the source of truth for *what* the system must do. Architecture, schema, and API decisions in later docs derive from this.

## 1. Project summary

A web platform that bundles four utilities for university students:

1. **Notes & past exams** — share PDF study material, filter by course and semester
2. **Marketplace** — list textbooks and items for sale with images and per-listing messaging
3. **Events** — student-organized events with RSVP and category filtering
4. **Study buddy** — lightweight profiles to find study partners and contact them out-of-band

Built as a 6-day graduation project. The bar is "working demo with clean architecture", not "production-grade."

## 2. Actors

- **Guest** — unauthenticated visitor; can view public landing only
- **Student (authenticated user)** — full access to all four modules
- *No admin role in v1.*

## 3. Functional requirements

### 3.1 Authentication & profile

- FR-A1: Users can register with email, password, and full name
- FR-A2: Users can log in and receive a JWT (7-day expiry, no refresh)
- FR-A3: Users can view and update their profile (full name, university, department, contact info)
- FR-A4: All non-public endpoints require a valid JWT
- FR-A5: Out of scope: email verification, password reset, OAuth

### 3.2 Notes & past exams

- FR-N1: Authenticated users can upload a PDF (max 10MB) with title, description, course code, semester
- FR-N2: Anyone authenticated can browse all notes
- FR-N3: Notes can be filtered by course code and semester
- FR-N4: Authenticated users can download a note's PDF
- FR-N5: Uploaders can delete their own notes (no edit in v1 — re-upload instead)

### 3.3 Marketplace

- FR-M1: Authenticated users can create a listing with title, description, price, category, and 1+ images (max 5MB each, max 8 images per listing)
- FR-M2: Anyone authenticated can browse listings, filtered by category and status (available/sold)
- FR-M3: Listing owners can edit and delete their listings
- FR-M4: Listing owners can mark a listing as sold
- FR-M5: Authenticated users can send messages to a seller, scoped to a specific listing
- FR-M6: Both parties can see the message thread for a listing they're a participant in
- FR-M7: Recipients can mark messages as read

### 3.4 Events

- FR-E1: Authenticated users can create an event with title, description, category, location, start time, end time
- FR-E2: Anyone authenticated can browse events, filtered by category and date range
- FR-E3: Event organizers can edit and delete their own events
- FR-E4: Authenticated users can RSVP (attend) and un-RSVP from any event
- FR-E5: Organizers and attendees can see the attendee list

### 3.5 Study buddy

- FR-B1: Authenticated users can create one buddy profile (bio, subjects, study style, availability)
- FR-B2: Users can update or delete their own buddy profile
- FR-B3: Anyone authenticated can browse buddy profiles, filtered by subject and study style
- FR-B4: Profiles display the user's `contact_info` field (email or alternative the user chose to share)
- FR-B5: No in-app messaging for buddies — contact happens out-of-band via the displayed contact info

## 4. Non-functional requirements

- NFR-1 (Performance): Initial page load under 2s on a typical connection; list endpoints return under 500ms with seed data
- NFR-2 (Security): bcrypt password hashing (cost 12), JWT auth, input validation on all writes, file MIME + extension + size validation
- NFR-3 (Browser support): latest Chrome, Firefox, Safari, Edge; no IE
- NFR-4 (Responsive): usable on mobile (375px+) and desktop (1280px+)
- NFR-5 (Accessibility): semantic HTML, keyboard navigable, WCAG AA color contrast (best-effort, not audited)
- NFR-6 (Code quality): typed end-to-end (Python type hints + TS strict), layered architecture per `02-architecture.md`
- NFR-7 (Maintainability): all schema changes via Alembic migrations, all commits follow Conventional Commits

## 5. User stories

### 5.1 Notes (5)

- US-N1: As a student, I want to upload my lecture notes as a PDF so classmates can find them later.
- US-N2: As a student, I want to filter notes by course code so I only see material relevant to my classes.
- US-N3: As a student, I want to filter notes by semester so I find the most recent material first.
- US-N4: As a student, I want to download a note PDF to study offline.
- US-N5: As an uploader, I want to delete a note I shared by mistake.

### 5.2 Marketplace (5)

- US-M1: As a student, I want to list a used textbook with photos and a price so I can sell it.
- US-M2: As a buyer, I want to filter listings by category to find what I need quickly.
- US-M3: As a buyer, I want to message a seller about a specific listing without sharing my email publicly.
- US-M4: As a seller, I want to mark a listing as sold so buyers stop messaging me about it.
- US-M5: As a participant in a thread, I want to see when my messages have been read.

### 5.3 Events (5)

- US-E1: As an organizer, I want to create a study group event with date, place, and category.
- US-E2: As a student, I want to browse upcoming events filtered by category (academic / social / sports).
- US-E3: As a student, I want to RSVP to an event so the organizer knows I'm coming.
- US-E4: As an attendee, I want to un-RSVP if my plans change.
- US-E5: As an organizer, I want to see who is attending my event.

### 5.4 Study buddy (5)

- US-B1: As a student, I want to publish a buddy profile listing the subjects I'm studying.
- US-B2: As a student, I want to filter buddies by subject to find someone studying the same course.
- US-B3: As a student, I want to filter by study style (group / solo / mixed) to find a compatible partner.
- US-B4: As a student, I want to see a buddy's contact info on their profile so I can reach out.
- US-B5: As a profile owner, I want to update my availability when my schedule changes.

### 5.5 Auth (cross-cutting, 3)

- US-A1: As a new user, I want to register with email and password so I can use the platform.
- US-A2: As a returning user, I want to log in and stay logged in for a week.
- US-A3: As a user, I want to update my profile fields (university, department, contact info).

## 6. Use case description (primary flow)

**UC: Buy a textbook through the marketplace** (representative flow that touches auth, browse, message)

- **Actor:** Authenticated student (Buyer)
- **Preconditions:** Buyer is logged in. At least one listing exists with status=available.
- **Main flow:**
  1. Buyer navigates to `/marketplace`
  2. Buyer applies a category filter (e.g., "Textbooks")
  3. Buyer clicks a listing card to view details at `/marketplace/{id}`
  4. Buyer clicks "Message seller", types a message, submits
  5. System creates a message thread scoped to (listing, buyer, seller)
  6. Seller sees a new thread in their inbox at `/messages`
  7. Conversation continues until they agree on the sale
  8. Seller marks the listing as sold; status updates everywhere
- **Postconditions:** Listing status is `sold`. Message thread persists.
- **Alternate flows:**
  - Buyer is not logged in → redirected to `/login`
  - Listing already sold → "Message seller" button disabled

Other modules follow analogous patterns: browse → filter → act (upload / RSVP / view profile).

## Related documents

- [02-architecture.md](02-architecture.md) — how requirements map to layers
- [03-database-schema.md](03-database-schema.md) — data model
- [04-api-spec.md](04-api-spec.md) — endpoint contracts
- [05-frontend-pages.md](05-frontend-pages.md) — UI surface
