# 03 — Database schema

## Purpose of this document

Defines every table, column, constraint, index, and foreign-key relationship in the Postgres database. Consult this before any model change. All schema changes ship as Alembic migrations — never raw SQL.

## 1. Conventions

- All primary keys are `UUID` (generated server-side via `uuid_generate_v4()` or Python `uuid4`)
- All `timestamp` columns are `TIMESTAMP WITH TIME ZONE`, default `now()`
- `created_at` is set on insert; `updated_at` is set on insert and updated on every change (trigger or app-side)
- Foreign keys: `ON DELETE CASCADE` for owned data, `ON DELETE SET NULL` for soft references
- Every FK column gets an index. Every column used in `WHERE` or `ORDER BY` gets an index
- No soft deletes — hard deletes only

## 2. Tables

### 2.1 `users`

| Column         | Type           | Constraints                                              |
|----------------|----------------|----------------------------------------------------------|
| id             | UUID           | PK                                                       |
| email          | VARCHAR(255)   | NOT NULL, UNIQUE                                         |
| password_hash  | VARCHAR(255)   | NOT NULL                                                 |
| display_name   | VARCHAR(100)   | NOT NULL                                                 |
| university     | VARCHAR(100)   | NULL                                                     |
| department     | VARCHAR(100)   | NULL                                                     |
| avatar_path    | VARCHAR(500)   | NULL  (relative path under `uploads/avatars/`)           |
| created_at     | TIMESTAMPTZ    | NOT NULL, DEFAULT now()                                  |
| updated_at     | TIMESTAMPTZ    | NOT NULL, DEFAULT now(), ON UPDATE now()                 |

Indexes: `email` (UNIQUE).

Per-user contact details (Instagram / Discord / phone) live on the buddy profile (§2.7), not on `users`.

### 2.2 `notes`

| Column           | Type          | Constraints                                       |
|------------------|---------------|---------------------------------------------------|
| id               | UUID          | PK                                                |
| user_id          | UUID          | NOT NULL, FK → users.id ON DELETE CASCADE         |
| title            | VARCHAR(200)  | NOT NULL                                          |
| description      | TEXT          | NULL                                              |
| course_code      | VARCHAR(50)   | NOT NULL                                          |
| semester         | VARCHAR(20)   | NOT NULL  (e.g. "Fall 2025")                      |
| file_path        | VARCHAR(500)  | NOT NULL                                          |
| file_size_bytes  | INTEGER       | NOT NULL                                          |
| created_at       | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                           |

Indexes: `user_id`, `course_code`, `semester`, composite `(course_code, semester)`.

### 2.3 `listings`

| Column        | Type           | Constraints                                                                       |
|---------------|----------------|-----------------------------------------------------------------------------------|
| id            | UUID           | PK                                                                                |
| seller_id     | UUID           | NOT NULL, FK → users.id ON DELETE CASCADE                                         |
| title         | VARCHAR(200)   | NOT NULL                                                                          |
| description   | TEXT           | NULL                                                                              |
| price         | INTEGER        | NOT NULL, CHECK (price >= 0) — integer TL, no decimals (Decision #3)              |
| category      | VARCHAR(50)    | NOT NULL  (book, electronics, clothing, furniture, other)                         |
| status        | VARCHAR(20)    | NOT NULL, DEFAULT 'active', CHECK IN ('active','sold') (Decision #2)              |
| created_at    | TIMESTAMPTZ    | NOT NULL, DEFAULT now()                                                           |
| updated_at    | TIMESTAMPTZ    | NOT NULL, DEFAULT now(), ON UPDATE now()                                          |

Named CHECK constraints: `ck_listings_price_nonneg`, `ck_listings_status_valid`.
Indexes: `seller_id`, `category`, `status`, `created_at`, composite `ix_listings_status_category (status, category)`.

### 2.4 `listing_images`

| Column         | Type          | Constraints                                          |
|----------------|---------------|------------------------------------------------------|
| id             | UUID          | PK                                                   |
| listing_id     | UUID          | NOT NULL, FK → listings.id ON DELETE CASCADE         |
| file_path      | VARCHAR(500)  | NOT NULL                                             |
| display_order  | INTEGER       | NOT NULL, DEFAULT 0                                  |
| created_at     | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                              |

Indexes: `listing_id`, composite `(listing_id, display_order)`.

### 2.5 `events`

| Column         | Type          | Constraints                                                              |
|----------------|---------------|--------------------------------------------------------------------------|
| id             | UUID          | PK                                                                       |
| organizer_id   | UUID          | NOT NULL, FK → users.id ON DELETE CASCADE                                |
| title          | VARCHAR(200)  | NOT NULL                                                                 |
| description    | TEXT          | NULL                                                                     |
| category       | VARCHAR(50)   | NOT NULL  (academic, social, sports, culture, other)                     |
| location       | VARCHAR(200)  | NULL                                                                     |
| starts_at      | TIMESTAMPTZ   | NOT NULL                                                                 |
| ends_at        | TIMESTAMPTZ   | NULL                                                                     |
| max_attendees  | INTEGER       | NULL (null = unlimited capacity)                                         |
| created_at     | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                                                  |
| updated_at     | TIMESTAMPTZ   | NOT NULL, DEFAULT now(), ON UPDATE now()                                 |

Named CHECK constraints (defense in depth on top of Pydantic, Decision #23):
- `ck_events_category_valid` — `category IN ('academic','social','sports','culture','other')`
- `ck_events_ends_after_starts` — `ends_at IS NULL OR ends_at >= starts_at`
- `ck_events_max_attendees_positive` — `max_attendees IS NULL OR max_attendees >= 1`

Indexes: `organizer_id`, `category`, `starts_at`, composite `ix_events_category_starts_at (category, starts_at)`.

### 2.6 `event_attendees`

| Column     | Type        | Constraints                                          |
|------------|-------------|------------------------------------------------------|
| id         | UUID        | PK                                                   |
| event_id   | UUID        | NOT NULL, FK → events.id ON DELETE CASCADE           |
| user_id    | UUID        | NOT NULL, FK → users.id ON DELETE CASCADE            |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now()                              |

Constraints: UNIQUE `(event_id, user_id)`.
Indexes: `event_id`, `user_id`.

### 2.7 `buddy_profiles`

| Column          | Type             | Constraints                                                        |
|-----------------|------------------|--------------------------------------------------------------------|
| id              | UUID             | PK                                                                 |
| user_id         | UUID             | NOT NULL, UNIQUE, FK → users.id ON DELETE CASCADE                  |
| looking_for     | VARCHAR(500)     | NOT NULL  (free-text description, ≥10 chars by CHECK)              |
| courses         | VARCHAR[]        | NOT NULL  (Postgres ARRAY of course codes/topics)                  |
| available_days  | VARCHAR[]        | NOT NULL  (ARRAY of weekday lowercase keys: `monday`..`sunday`)    |
| study_style     | VARCHAR(20)      | NOT NULL, CHECK IN ('quiet','group','cafe')                        |
| contact_info    | JSONB            | NOT NULL  (object with optional `instagram`/`discord`/`telefon`)   |
| created_at      | TIMESTAMPTZ      | NOT NULL, DEFAULT now()                                            |
| updated_at      | TIMESTAMPTZ      | NOT NULL, DEFAULT now(), ON UPDATE now()                           |

Named CHECK constraints:
- `ck_buddy_profiles_study_style_valid` — enum on `study_style`
- `ck_buddy_profiles_courses_nonempty` — `COALESCE(array_length(courses, 1), 0) >= 1`
- `ck_buddy_profiles_available_days_nonempty` — `COALESCE(array_length(available_days, 1), 0) >= 1`
- `ck_buddy_profiles_looking_for_min_length` — `char_length(looking_for) >= 10`
- `ck_buddy_profiles_contact_info_at_least_one` — at least one of `contact_info->>'instagram'`, `->>'discord'`, `->>'telefon'` is non-null

Indexes:
- `user_id` UNIQUE (via the UNIQUE constraint)
- `study_style`
- `updated_at`
- `ix_buddy_profiles_courses_gin` (GIN on `courses`) — enables fast array-membership lookup for the `?course=` filter
- `ix_buddy_profiles_available_days_gin` (GIN on `available_days`) — same, for `?day=`

### 2.8 `messages`

| Column        | Type          | Constraints                                                            |
|---------------|---------------|------------------------------------------------------------------------|
| id            | UUID          | PK                                                                     |
| listing_id    | UUID          | NULL, FK → listings.id ON DELETE SET NULL (Decision #7)                |
| sender_id     | UUID          | NOT NULL, FK → users.id ON DELETE CASCADE                              |
| recipient_id  | UUID          | NOT NULL, FK → users.id ON DELETE CASCADE                              |
| body          | TEXT          | NOT NULL                                                               |
| read_at       | TIMESTAMPTZ   | NULL                                                                   |
| created_at    | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                                                |

Named CHECK constraints: `ck_messages_body_not_empty` — `length(body) > 0`.
Indexes: `listing_id`, `sender_id`, `recipient_id`, `created_at`, composite `ix_messages_listing_sender_recipient (listing_id, sender_id, recipient_id)` for thread lookups.

A "thread" is implicit: all messages with the same `listing_id` between the same pair of users. No separate `threads` table in v1.

When a listing is deleted, its messages survive with `listing_id` set to NULL (orphan thread, surfaced via `GET /messages/orphans/with/{other_user_id}` in §8 of the API spec).

## 3. ER diagram (ASCII)

```
                         ┌───────────────┐
                         │     users     │
                         │───────────────│
                         │ id (PK)       │
                         │ email (UQ)    │
                         │ password_hash │
                         │ display_name  │
                         │ university    │
                         │ department    │
                         │ avatar_path   │
                         └──────┬────────┘
                                │ 1
                ┌───────────────┼────────────────┬────────────────┬───────────────┐
                │               │                │                │               │
              N │             N │              N │              N │             N │
        ┌───────▼──────┐ ┌──────▼───────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼─────────┐
        │    notes     │ │   listings   │ │   events    │ │   buddy_    │ │   messages     │
        │──────────────│ │──────────────│ │─────────────│ │   profiles  │ │ (sender +      │
        │ id (PK)      │ │ id (PK)      │ │ id (PK)     │ │─────────────│ │  recipient)    │
        │ user_id (FK) │ │ seller_id    │ │ organizer_id│ │ id (PK)     │ │────────────────│
        │ course_code  │ │ category     │ │ category    │ │ user_id (UQ)│ │ id (PK)        │
        │ semester     │ │ status       │ │ starts_at   │ │ looking_for │ │ listing_id (FK,│
        │ file_path    │ │ price (INT)  │ │ max_attend. │ │ courses[]   │ │   nullable)    │
        └──────────────┘ └──────┬───────┘ └─────┬───────┘ │ avail_days[]│ │ sender_id (FK) │
                                │ 1             │ 1       │ study_style │ │ recipient_id   │
                              N │             N │         │ contact_info│ │ body, read_at  │
                       ┌────────▼────────┐ ┌────▼────────────┐ (JSONB)  │ └────────┬───────┘
                       │ listing_images  │ │ event_attendees │ └────────────┘      │ N
                       │─────────────────│ │─────────────────│       ┌─────────────▼────────┐
                       │ id (PK)         │ │ id (PK)         │       │ listings.id          │
                       │ listing_id (FK) │ │ event_id (FK)   │       │ (SET NULL on delete) │
                       │ file_path       │ │ user_id (FK)    │       └──────────────────────┘
                       │ display_order   │ │ UQ(event,user)  │
                       └─────────────────┘ └─────────────────┘
```

Notes:
- `messages.listing_id` is **nullable** and uses `ON DELETE SET NULL`: orphan messages survive when their listing is deleted (Decision #7).
- All other user-owned FKs are `ON DELETE CASCADE`.
- `messages` has two FKs to `users` (sender and recipient).
- `event_attendees` and `listing_images` are pure join/child tables.
- `users.avatar_path` is a relative path under `uploads/avatars/`; the public StaticFiles mount serves it at `/uploads/avatars/<filename>` (Decision #26).

## 4. Sample seed data

A minimal seed for local demo. Copy-paste into `psql`; passwords are placeholder bcrypt hashes (replace with real ones from `passlib.hash.bcrypt.hash("...")` if you want to log in).

```sql
-- 3 users
INSERT INTO users (id, email, password_hash, display_name, university, department) VALUES
  ('11111111-1111-1111-1111-111111111111', 'alice@uni.edu', '$2b$12$placeholder', 'Alice Smith', 'State Uni', 'CS'),
  ('22222222-2222-2222-2222-222222222222', 'bob@uni.edu',   '$2b$12$placeholder', 'Bob Jones',   'State Uni', 'EE'),
  ('33333333-3333-3333-3333-333333333333', 'carol@uni.edu', '$2b$12$placeholder', 'Carol Lee',   'State Uni', 'Math');

-- 2 notes (file_path is the relative path the app stores; the file itself lives at uploads/notes/<uuid>.pdf)
INSERT INTO notes (id, user_id, title, course_code, semester, file_path, file_size_bytes) VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Algorithms midterm review', 'CS301',   'Fall 2025',   'notes/00000000-0000-0000-0000-000000000001.pdf', 524288),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Linear algebra cheatsheet', 'MATH210', 'Spring 2025', 'notes/00000000-0000-0000-0000-000000000002.pdf', 102400);

-- 2 listings (integer TL prices; active status; valid category enum values)
INSERT INTO listings (id, seller_id, title, price, category, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'CLRS kitabı, kullanılmış', 350, 'book',        'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'TI-84 hesap makinesi',      500, 'electronics', 'active');

-- listing images (paths under uploads/listings/<listing_id>/<uuid>.<ext>)
INSERT INTO listing_images (id, listing_id, file_path, display_order) VALUES
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'listings/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/img1.jpg', 0),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'listings/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/img1.jpg', 0);

-- 1 event with capacity + 1 attendee
INSERT INTO events (id, organizer_id, title, category, location, starts_at, max_attendees) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'Calc II çalışma grubu', 'academic', 'Kütüphane oda 204', '2026-05-20 18:00+03', 10);
INSERT INTO event_attendees (id, event_id, user_id) VALUES
  (gen_random_uuid(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111');

-- 2 buddy profiles (note: arrays for courses/available_days, JSONB for contact_info, study_style ∈ {quiet,group,cafe})
INSERT INTO buddy_profiles (id, user_id, looking_for, courses, available_days, study_style, contact_info) VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'CS junior, odaklı kısa seanslar tercih ederim.',
   ARRAY['CS301','CS210'], ARRAY['monday','wednesday','friday'], 'group',
   '{"instagram": "alice_codes"}'::jsonb),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333',
   'Matematik bölümü, sınav öncesi çalışma arkadaşı.',
   ARRAY['MATH210','MATH310'], ARRAY['saturday','sunday'], 'cafe',
   '{"discord": "carol#1234", "telefon": "5551234567"}'::jsonb);

-- 1 message thread (Carol asks Bob about CLRS)
INSERT INTO messages (id, listing_id, sender_id, recipient_id, body) VALUES
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Selam! CLRS kitabı hala satılık mı?');
```

## Related documents

- [01-requirements.md](01-requirements.md) — features these tables support
- [02-architecture.md](02-architecture.md) — how models fit in the layered structure
- [04-api-spec.md](04-api-spec.md) — endpoints that read/write these tables
