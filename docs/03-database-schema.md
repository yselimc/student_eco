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

| Column         | Type           | Constraints                            |
|----------------|----------------|----------------------------------------|
| id             | UUID           | PK                                     |
| email          | VARCHAR(255)   | NOT NULL, UNIQUE                       |
| password_hash  | VARCHAR(255)   | NOT NULL                               |
| full_name      | VARCHAR(100)   | NOT NULL                               |
| university     | VARCHAR(100)   | NULL                                   |
| department     | VARCHAR(100)   | NULL                                   |
| contact_info   | VARCHAR(255)   | NULL  (shown on buddy profile)         |
| created_at     | TIMESTAMPTZ    | NOT NULL, DEFAULT now()                |
| updated_at     | TIMESTAMPTZ    | NOT NULL, DEFAULT now()                |

Indexes: `email` (UNIQUE).

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

| Column        | Type           | Constraints                                                |
|---------------|----------------|------------------------------------------------------------|
| id            | UUID           | PK                                                         |
| seller_id     | UUID           | NOT NULL, FK → users.id ON DELETE CASCADE                  |
| title         | VARCHAR(200)   | NOT NULL                                                   |
| description   | TEXT           | NULL                                                       |
| price         | NUMERIC(10,2)  | NOT NULL, CHECK (price >= 0)                               |
| category      | VARCHAR(50)    | NOT NULL  (textbook, electronics, furniture, other)        |
| status        | VARCHAR(20)    | NOT NULL, DEFAULT 'available', CHECK IN ('available','sold')|
| created_at    | TIMESTAMPTZ    | NOT NULL, DEFAULT now()                                    |
| updated_at    | TIMESTAMPTZ    | NOT NULL, DEFAULT now()                                    |

Indexes: `seller_id`, `category`, `status`, `(status, category)`, `created_at`.

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

| Column        | Type          | Constraints                                          |
|---------------|---------------|------------------------------------------------------|
| id            | UUID          | PK                                                   |
| organizer_id  | UUID          | NOT NULL, FK → users.id ON DELETE CASCADE            |
| title         | VARCHAR(200)  | NOT NULL                                             |
| description   | TEXT          | NULL                                                 |
| category      | VARCHAR(50)   | NOT NULL  (academic, social, sports, career, other)  |
| location      | VARCHAR(200)  | NULL                                                 |
| starts_at     | TIMESTAMPTZ   | NOT NULL                                             |
| ends_at       | TIMESTAMPTZ   | NULL, CHECK (ends_at IS NULL OR ends_at >= starts_at)|
| created_at    | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                              |
| updated_at    | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                              |

Indexes: `organizer_id`, `category`, `starts_at`, composite `(category, starts_at)`.

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

| Column                 | Type          | Constraints                                                  |
|------------------------|---------------|--------------------------------------------------------------|
| id                     | UUID          | PK                                                           |
| user_id                | UUID          | NOT NULL, UNIQUE, FK → users.id ON DELETE CASCADE            |
| bio                    | TEXT          | NULL                                                         |
| subjects               | VARCHAR(500)  | NOT NULL  (comma-separated course codes / topic names)       |
| preferred_study_style  | VARCHAR(20)   | NOT NULL, CHECK IN ('group','solo','mixed')                  |
| availability           | VARCHAR(200)  | NULL  (free text, e.g. "Weekday evenings")                   |
| created_at             | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                                      |
| updated_at             | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                                      |

Indexes: `user_id` (UNIQUE), `preferred_study_style`. `subjects` is filtered with `ILIKE` — no dedicated index in v1.

### 2.8 `messages`

| Column        | Type          | Constraints                                                  |
|---------------|---------------|--------------------------------------------------------------|
| id            | UUID          | PK                                                           |
| listing_id    | UUID          | NOT NULL, FK → listings.id ON DELETE CASCADE                 |
| sender_id     | UUID          | NOT NULL, FK → users.id ON DELETE CASCADE                    |
| recipient_id  | UUID          | NOT NULL, FK → users.id ON DELETE CASCADE                    |
| body          | TEXT          | NOT NULL, CHECK (length(body) > 0)                           |
| read_at       | TIMESTAMPTZ   | NULL                                                         |
| created_at    | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                                      |

Indexes: `listing_id`, `sender_id`, `recipient_id`, `created_at`, composite `(listing_id, sender_id, recipient_id)` for thread lookups.

A "thread" is implicit: all messages with the same `listing_id` between the same pair of users. No separate `threads` table in v1.

## 3. ER diagram (ASCII)

```
                         ┌──────────────┐
                         │    users     │
                         │──────────────│
                         │ id (PK)      │
                         │ email (UQ)   │
                         │ password_hash│
                         │ full_name    │
                         │ contact_info │
                         └──────┬───────┘
                                │ 1
                ┌───────────────┼────────────────┬────────────────┬───────────────┐
                │               │                │                │               │
              N │             N │              N │              N │             N │
        ┌───────▼──────┐ ┌──────▼───────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼─────────┐
        │    notes     │ │  listings    │ │   events    │ │   buddy_    │ │   messages     │
        │──────────────│ │──────────────│ │─────────────│ │   profiles  │ │ (sender +      │
        │ id (PK)      │ │ id (PK)      │ │ id (PK)     │ │─────────────│ │  recipient)    │
        │ user_id (FK) │ │ seller_id    │ │ organizer_id│ │ id (PK)     │ │────────────────│
        │ course_code  │ │ category     │ │ category    │ │ user_id (UQ)│ │ id (PK)        │
        │ semester     │ │ status       │ │ starts_at   │ │ subjects    │ │ listing_id (FK)│
        │ file_path    │ │ price        │ │ location    │ │ study_style │ │ sender_id (FK) │
        └──────────────┘ └──────┬───────┘ └─────┬───────┘ └─────────────┘ │ recipient_id   │
                                │ 1             │ 1                       │ body, read_at  │
                              N │             N │                         └────────┬───────┘
                       ┌────────▼────────┐ ┌────▼────────────┐                     │ N
                       │ listing_images  │ │ event_attendees │           ┌─────────▼────────┐
                       │─────────────────│ │─────────────────│           │   listings.id    │
                       │ id (PK)         │ │ id (PK)         │           └──────────────────┘
                       │ listing_id (FK) │ │ event_id (FK)   │
                       │ file_path       │ │ user_id (FK)    │
                       │ display_order   │ │ UQ(event,user)  │
                       └─────────────────┘ └─────────────────┘
```

Notes:
- `messages.listing_id` connects threads back to their listing context
- `messages` has two FKs to `users` (sender and recipient)
- `event_attendees` and `listing_images` are pure join/child tables

## 4. Sample seed data

A minimal seed (see `backend/scripts/seed.py`) for local demo:

```sql
-- 3 users
INSERT INTO users (id, email, password_hash, full_name, university, department, contact_info) VALUES
  ('11111111-...', 'alice@uni.edu', '<bcrypt>', 'Alice Smith', 'State Uni',  'CS',   'alice@uni.edu'),
  ('22222222-...', 'bob@uni.edu',   '<bcrypt>', 'Bob Jones',   'State Uni',  'EE',   'bob@uni.edu'),
  ('33333333-...', 'carol@uni.edu', '<bcrypt>', 'Carol Lee',   'State Uni',  'Math', '@carol_tg');

-- 2 notes
INSERT INTO notes (user_id, title, course_code, semester, file_path, file_size_bytes) VALUES
  ('11111111-...', 'Algorithms midterm review', 'CS301', 'Fall 2025', 'uploads/notes/...pdf', 524288),
  ('33333333-...', 'Linear algebra cheatsheet', 'MATH210', 'Spring 2025', 'uploads/notes/...pdf', 102400);

-- 2 listings + images
INSERT INTO listings (id, seller_id, title, price, category, status) VALUES
  ('aaaaaaaa-...', '22222222-...', 'CLRS textbook, used', 35.00, 'textbook', 'available'),
  ('bbbbbbbb-...', '11111111-...', 'TI-84 calculator',     50.00, 'electronics', 'available');

INSERT INTO listing_images (listing_id, file_path, display_order) VALUES
  ('aaaaaaaa-...', 'uploads/images/clrs1.jpg', 0),
  ('bbbbbbbb-...', 'uploads/images/ti84.jpg',  0);

-- 1 event + 1 attendee
INSERT INTO events (id, organizer_id, title, category, location, starts_at) VALUES
  ('eeeeeeee-...', '33333333-...', 'Calc II study group', 'academic', 'Library room 204', '2026-05-10 18:00+00');
INSERT INTO event_attendees (event_id, user_id) VALUES ('eeeeeeee-...', '11111111-...');

-- 2 buddy profiles
INSERT INTO buddy_profiles (user_id, bio, subjects, preferred_study_style, availability) VALUES
  ('11111111-...', 'CS junior, prefer focused sessions.', 'CS301,CS210', 'group',  'Weekday evenings'),
  ('33333333-...', 'Math major, exam prep buddy.',        'MATH210,MATH310', 'mixed', 'Weekends');

-- 1 message thread (Carol asks Bob about CLRS)
INSERT INTO messages (listing_id, sender_id, recipient_id, body) VALUES
  ('aaaaaaaa-...', '33333333-...', '22222222-...', 'Hi! Is the CLRS book still available?');
```

## Related documents

- [01-requirements.md](01-requirements.md) — features these tables support
- [02-architecture.md](02-architecture.md) — how models fit in the layered structure
- [04-api-spec.md](04-api-spec.md) — endpoints that read/write these tables
