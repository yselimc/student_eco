# 04 — API specification

## Purpose of this document

Defines every REST endpoint: method, path, request body, response body, status codes, and auth requirement. Consult before adding or changing any route. Endpoints below align with the tables in `03-database-schema.md` and the user stories in `01-requirements.md`.

## 1. Conventions

- **Base URL:** `/` — all routers mount at the root (no `/api` prefix in the app). If you add a reverse proxy in production, prefix `/api` there.
- **Auth:** `Authorization: Bearer <jwt>` on all endpoints unless marked **Public**. JWT lifetime is 7 days; no refresh token in v1.
- **Pagination:** list endpoints accept `?limit=<int, 1..100, default 20>&offset=<int, ≥0, default 0>`.
- **Timestamps:** all ISO 8601 with timezone (`2026-05-05T14:30:00Z`). UTC unless otherwise noted.
- **IDs:** UUID strings.

### Error responses

Two shapes; both use Turkish, user-facing messages.

**AppError / HTTP error (single-detail shape):**
```json
{ "detail": "Not bulunamadı", "code": "NOT_FOUND" }
```

**Validation error (422, multi-field shape):**
```json
{
  "detail": "Doğrulama hatası",
  "errors": [
    { "field": "password", "message": "Şifre en az 8 karakter olmalıdır" },
    { "field": "email",    "message": "Geçerli bir e-posta adresi giriniz" }
  ]
}
```

The `field` value is the dotted Pydantic path with the leading request-location segment (`body`/`query`/`path`) stripped — e.g. `password`, `contact_info.instagram`, `items.0.price`.

### Error codes (`code` field)

From the HTTP status map (Starlette HTTPException):

| Status | Code                     |
|--------|--------------------------|
| 400    | `BAD_REQUEST`            |
| 401    | `UNAUTHENTICATED`        |
| 403    | `FORBIDDEN`              |
| 404    | `NOT_FOUND`              |
| 405    | `METHOD_NOT_ALLOWED`     |
| 409    | `CONFLICT`               |
| 413    | `PAYLOAD_TOO_LARGE`      |
| 415    | `UNSUPPORTED_MEDIA_TYPE` |
| other  | `HTTP_ERROR`             |

From AppError subclasses (raised by services / storage):

| Code                       | Status | Source                                           |
|----------------------------|--------|--------------------------------------------------|
| `NOT_FOUND`                | 404    | `core.exceptions.NotFoundError`                  |
| `FORBIDDEN`                | 403    | `core.exceptions.ForbiddenError`                 |
| `CONFLICT`                 | 409    | `core.exceptions.ConflictError`                  |
| `VALIDATION_ERROR`         | 400    | `core.exceptions.ValidationFailedError`          |
| `UNAUTHENTICATED`          | 401    | `core.exceptions.UnauthenticatedError`           |
| `EVENT_FULL`               | 409    | `services.events.EventFullError`                 |
| `BUDDY_CONTACT_REQUIRED`   | 422    | `services.buddies.BuddyContactRequiredError`     |
| `UNSUPPORTED_MEDIA_TYPE`   | 415    | `storage.uploaders.UnsupportedMediaTypeError`    |
| `PAYLOAD_TOO_LARGE`        | 413    | `storage.uploaders.PayloadTooLargeError`         |
| `APP_ERROR`                | 400    | bare `AppError` fallback                         |

422 from FastAPI's `RequestValidationError` does **not** carry a `code` — it uses the multi-field shape above.

### Standard status codes used

| Code | When                                                            |
|------|-----------------------------------------------------------------|
| 200  | OK (read, update, delete success without body)                  |
| 201  | Created                                                         |
| 204  | No content (delete success)                                     |
| 400  | Bad request (domain validation, business rule violation)        |
| 401  | Unauthenticated (missing/invalid JWT)                           |
| 403  | Forbidden (authenticated but not allowed)                       |
| 404  | Not found                                                       |
| 409  | Conflict (duplicate, state mismatch, event full)                |
| 413  | Payload too large (file size)                                   |
| 415  | Unsupported media type (file MIME)                              |
| 422  | Unprocessable entity (Pydantic validation, multi-field shape)   |

## 2. Auth

### `UserOut` schema
```json
{
  "id": "uuid",
  "email": "alice@uni.edu",
  "display_name": "Alice Smith",
  "university": "State Uni",
  "department": "CS",
  "avatar_url": "/uploads/avatars/<uuid>.jpg",
  "created_at": "...",
  "updated_at": "..."
}
```
`avatar_url` is `null` until the user uploads an avatar.

### POST `/auth/register` — **Public**

Request:
```json
{ "email": "alice@uni.edu", "password": "...", "display_name": "Alice Smith" }
```
- `password`: 8..128 chars
- `display_name`: 1..100 chars

Response 201:
```json
{ "access_token": "<jwt>", "token_type": "bearer", "user": { ...UserOut } }
```
Errors: 409 `CONFLICT` (email already registered), 422.

### POST `/auth/login` — **Public**

Request:
```json
{ "email": "alice@uni.edu", "password": "..." }
```
Response 200:
```json
{ "access_token": "<jwt>", "token_type": "bearer", "user": { ...UserOut } }
```
Errors: 401 `UNAUTHENTICATED` (invalid credentials), 422.

### GET `/auth/me`

Response 200: `UserOut`.
Errors: 401.

### PATCH `/auth/me`

Editable fields only: `display_name`, `university`, `department` (Decision #24). Email and password are not changeable in v1.

Request (any subset):
```json
{ "display_name": "...", "university": "...", "department": "..." }
```
- Sending `null` for `university` or `department` clears that field.
- `display_name` may not be explicitly null and may not be empty after trim (422).

Response 200: `UserOut`.
Errors: 401, 422.

### POST `/auth/me/avatar` — multipart

Form field: `file` (image/jpeg or image/png, ≤ 2 MB). MIME, extension, and magic bytes are all validated.

Response 200: `UserOut` (with the new `avatar_url`).
Errors: 401, 413 `PAYLOAD_TOO_LARGE`, 415 `UNSUPPORTED_MEDIA_TYPE`.

### DELETE `/auth/me/avatar`

Idempotent — removing an already-empty avatar still returns 200.

Response 200: `UserOut` (with `avatar_url: null`).
Errors: 401.

## 3. Users

### `PublicProfileRead` schema
```json
{
  "id": "uuid",
  "display_name": "Alice Smith",
  "university": "State Uni",
  "department": "CS",
  "avatar_url": "/uploads/avatars/<uuid>.jpg",
  "created_at": "...",
  "notes_count": 3,
  "listings_count": 1,
  "events_organized_count": 2,
  "buddy_profile_id": "uuid"
}
```
`listings_count` counts only listings with `status='active'` (Decision #25). `buddy_profile_id` is `null` if the user has no buddy profile. Email is deliberately omitted.

### GET `/users/{user_id}/profile`

Response 200: `PublicProfileRead`.
Errors: 401, 404.

## 4. Notes

### `NoteRead`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "author_name": "Alice Smith",
  "author_avatar_url": "/uploads/avatars/<uuid>.jpg",
  "title": "...",
  "description": "... (optional, ≤2000 chars)",
  "course_code": "CS301",
  "semester": "Fall 2025",
  "file_size_bytes": 524288,
  "created_at": "..."
}
```
`author_name` / `author_avatar_url` are joined from `users` on every list/get response.

### GET `/notes`

Query: `course_code`, `semester`, `q` (title/description search), `limit`, `offset`.
Response 200: `{ "items": [NoteRead], "total": 42 }`.
Errors: 401.

### POST `/notes` — multipart

Form fields:
- `title` (1..200 chars)
- `course_code` (1..50 chars)
- `semester` (1..20 chars)
- `description` (optional, ≤2000 chars)
- `file` — PDF only, ≤ 10 MB (MIME, extension, and magic-bytes validated)

Response 201: `NoteRead`.
Errors: 401, 413 `PAYLOAD_TOO_LARGE`, 415 `UNSUPPORTED_MEDIA_TYPE`, 422.

### GET `/notes/{note_id}`

Response 200: `NoteRead`.
Errors: 401, 404.

### GET `/notes/{note_id}/download`

Auth-gated PDF download. Response 200: `application/pdf` with `Content-Disposition: attachment; filename="<title>.pdf"`.
Errors: 401, 404.

### DELETE `/notes/{note_id}`

Auth: must be the uploader.
Response 204.
Errors: 401, 403 `FORBIDDEN`, 404 `NOT_FOUND`.

## 5. Marketplace listings

Decisions that shape this section: prices are integer TL (Decision #3); status enum is `active|sold` (Decision #2); categories are English DB keys / Turkish UI labels (Decision #1); listing edit was skipped for v1 — only status flip (Decision #6); images are uploaded with the listing in a single multipart call (Decision #12).

### `ListingRead`
```json
{
  "id": "uuid",
  "seller_id": "uuid",
  "seller_name": "Bob Jones",
  "seller_avatar_url": "/uploads/avatars/<uuid>.jpg",
  "title": "...",
  "description": "...",
  "price": 350,
  "category": "book",
  "status": "active",
  "images": [{ "id": "uuid", "display_order": 0 }],
  "created_at": "...",
  "updated_at": "..."
}
```
- `price` is **integer TL** (no decimals).
- `category` ∈ `{ "book", "electronics", "clothing", "furniture", "other" }`.
- `status` ∈ `{ "active", "sold" }`.
- `images` carries `{id, display_order}` only — the image binary is served at `GET /listings/{id}/images/{image_id}` (auth-gated, not a public static URL).

### GET `/listings`

Query: `category`, `status` (no default — pass `active` or `sold` to filter; omit for both), `q` (title/description search), `limit`, `offset`.
Response 200: `{ "items": [ListingRead], "total": N }`.
Errors: 401.

### POST `/listings` — multipart

Form fields:
- `title` (1..200 chars)
- `price` (integer ≥ 0)
- `category` (one of the enum values above)
- `description` (optional, ≤2000 chars)
- `files` — 1..3 images (`image/jpeg` or `image/png`, ≤ 5 MB each). MIME + extension + magic bytes are validated. Images are saved under `uploads/listings/<listing_id>/<uuid>.<ext>`.

Response 201: `ListingRead` (with the uploaded images).
Errors: 401, 413 `PAYLOAD_TOO_LARGE`, 415 `UNSUPPORTED_MEDIA_TYPE`, 422.

### GET `/listings/{listing_id}`

Response 200: `ListingRead`.
Errors: 401, 404.

### PATCH `/listings/{listing_id}/status`

Auth: seller only. Only the status field is editable in v1.
Request:
```json
{ "status": "sold" }
```
`status` must be one of `active`, `sold`.

Response 200: `ListingRead`.
Errors: 401, 403, 404, 422.

### DELETE `/listings/{listing_id}`

Auth: seller only. Cascades to `listing_images` (rows + files). Messages survive with `listing_id` set to NULL (Decision #7).
Response 204.
Errors: 401, 403, 404.

### GET `/listings/{listing_id}/images/{image_id}`

Auth-gated. Streams the image file with `Content-Type: image/jpeg` or `image/png` based on the file's extension.
Response 200: image bytes.
Errors: 401, 404.

## 6. Events

Decisions that shape this section: events list defaults to all (past + future) (Decision #16); no edit endpoint in v1 — delete + recreate is the supported flow (Decision #22); capacity overrun by 1 is acceptable for v1 (Decision #20); `EVENT_FULL` is a distinct 409 code from generic conflict (Decision #21); `?mine=1` is an OR filter over organizer + attendee (Decision #30).

### `EventRead`
```json
{
  "id": "uuid",
  "organizer_id": "uuid",
  "organizer_name": "Carol Lee",
  "organizer_avatar_url": "/uploads/avatars/<uuid>.jpg",
  "title": "...",
  "description": "...",
  "category": "academic",
  "location": "Library room 204",
  "starts_at": "...",
  "ends_at": "...",
  "max_attendees": 10,
  "attendee_count": 5,
  "created_at": "...",
  "updated_at": "..."
}
```
- `category` ∈ `{ "academic", "social", "sports", "culture", "other" }`.
- `max_attendees` is `null` for unlimited; otherwise an integer ≥ 1.
- `ends_at` is optional.

### GET `/events`

Query:
- `category` — one of the enum values
- `from` — ISO datetime; lower bound on `starts_at`. No default (omit for "no lower bound")
- `to` — ISO datetime; upper bound on `starts_at`
- `q` — title/description search
- `mine` — boolean; when `true`, returns events the caller organizes OR has RSVPed to
- `limit`, `offset`

Response 200: `{ "items": [EventRead], "total": N }`.
Errors: 401.

### POST `/events`

Request:
```json
{
  "title": "...",
  "description": "... (optional, ≤2000 chars)",
  "category": "academic",
  "location": "... (optional, ≤200 chars)",
  "starts_at": "2026-05-20T18:00:00Z",
  "ends_at": "2026-05-20T20:00:00Z",
  "max_attendees": 10
}
```
- `title`: 1..200 chars
- `category`: one of the enum values above
- `ends_at`: optional; if provided, must be `>= starts_at`
- `max_attendees`: optional, ≥ 1, or null for unlimited

Response 201: `EventRead`.
Errors: 401, 422.

### GET `/events/{event_id}`

Response 200: `EventRead`.
Errors: 401, 404.

### DELETE `/events/{event_id}`

Auth: organizer only. Cascades to `event_attendees`.
Response 204.
Errors: 401, 403, 404.

### POST `/events/{event_id}/attendees` — RSVP

Body: empty.
Response 201:
```json
{ "event_id": "uuid", "user_id": "uuid", "created_at": "..." }
```
Errors:
- 401, 404
- 409 `CONFLICT` — caller already RSVPed
- 409 `EVENT_FULL` — capacity reached (`max_attendees` not null and already met)

### DELETE `/events/{event_id}/attendees/me` — un-RSVP

Response 204.
Errors: 401, 404 (no existing RSVP).

### GET `/events/{event_id}/attendees`

Response 200:
```json
{
  "items": [
    {
      "user_id": "uuid",
      "display_name": "Alice Smith",
      "avatar_url": "/uploads/avatars/<uuid>.jpg",
      "rsvp_at": "..."
    }
  ],
  "total": N
}
```
Errors: 401, 404.

## 7. Buddy profiles

### `BuddyProfileRead`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "display_name": "Alice Smith",
  "looking_for": "CS junior, focused sessions preferred.",
  "courses": ["CS301", "CS210"],
  "available_days": ["monday", "wednesday", "friday"],
  "study_style": "group",
  "contact_info": {
    "instagram": "alice_codes",
    "discord": null,
    "telefon": null
  },
  "created_at": "...",
  "updated_at": "..."
}
```
- `study_style` ∈ `{ "quiet", "group", "cafe" }`.
- `available_days` items ∈ `{ "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday" }` (lowercase).
- `contact_info` is an object with optional `instagram` / `discord` / `telefon` keys. At least one must be non-null (enforced by DB CHECK + service-level `BUDDY_CONTACT_REQUIRED`).
- `courses` and `available_days` are Postgres ARRAYs (not comma-separated strings).

### GET `/buddies`

Query:
- `course` — exact course code (ARRAY membership lookup, GIN-indexed)
- `day` — weekday (ARRAY membership lookup, GIN-indexed)
- `study_style` — one of `quiet`/`group`/`cafe`
- `limit`, `offset`

Response 200: `{ "items": [BuddyProfileRead], "total": N }`.
Errors: 401.

### GET `/buddies/me`

Response 200: `BuddyProfileRead`.
Errors: 401, 404 (no profile yet).

### PUT `/buddies/me` — upsert

Request:
```json
{
  "looking_for": "string ≥10 chars after trim",
  "courses": ["CS301", "CS210"],
  "available_days": ["monday", "wednesday"],
  "study_style": "group",
  "contact_info": {
    "instagram": "alice_codes",
    "discord": null,
    "telefon": null
  }
}
```
- `courses`: 1..20 items (deduplicated case-insensitively, stripped)
- `available_days`: 1..7 items (deduplicated, sorted Monday→Sunday)
- `contact_info`: at least one field must be non-null
- `telefon`: stripped down to digits only on save

Response 200 (updated) or 201 (created): `BuddyProfileRead`.
Errors: 401, 422 (including `BUDDY_CONTACT_REQUIRED` when no contact field is provided).

### DELETE `/buddies/me`

Response 204.
Errors: 401, 404.

### GET `/buddies/{target_user_id}`

Note: looked up by the buddy's **user_id**, not the profile id.

Response 200: `BuddyProfileRead`.
Errors: 401, 404.

## 8. Messages (marketplace-scoped)

Decisions that shape this section: no real-time messaging — polling only (Decision #8); inbox does not poll (Decision #9); listing_id is nullable to keep orphan threads alive when a listing is deleted (Decision #7).

### `MessageRead`
```json
{
  "id": "uuid",
  "listing_id": "uuid",
  "sender_id": "uuid",
  "recipient_id": "uuid",
  "body": "...",
  "read_at": null,
  "created_at": "..."
}
```
`listing_id` is `null` for orphan threads (their listing was deleted).

### `ConversationItem` (inbox row)
```json
{
  "listing_id": "uuid",
  "listing_title": "CLRS textbook, used",
  "listing_status": "active",
  "other_user_id": "uuid",
  "other_user_name": "Bob Jones",
  "last_message_body": "...",
  "last_message_at": "...",
  "unread_count": 2
}
```
`listing_id`, `listing_title`, `listing_status` are all `null` for orphan threads.

### POST `/messages`

Request:
```json
{ "listing_id": "uuid", "recipient_id": "uuid", "body": "Selam! Hala satılık mı?" }
```
- `body`: 1..5000 chars.
- `sender_id` is taken from the JWT.

Response 201: `MessageRead`.
Errors: 401, 404 (listing or recipient not found), 422.

### GET `/messages/conversations` — inbox

Returns the caller's threads, ordered by `last_message_at` desc.
Response 200: `{ "items": [ConversationItem] }` (no `total`).
Errors: 401.

### GET `/messages/listings/{listing_id}/with/{other_user_id}`

Full message history for a specific listing-scoped thread between the caller and `other_user_id`. Side effect: marks all messages where the caller is the recipient as read.
Response 200: `{ "items": [MessageRead] }`.
Errors: 401, 404.

### GET `/messages/orphans/with/{other_user_id}`

Full message history for the orphan thread between the caller and `other_user_id` — i.e. messages where `listing_id IS NULL`. Same read-marking side effect as the listing thread endpoint.
Response 200: `{ "items": [MessageRead] }`.
Errors: 401, 404.

### PATCH `/messages/{message_id}/read`

Auth: must be the recipient.
Response 200: `MessageRead` with `read_at` set.
Errors: 401, 403, 404.

## 9. Static files & health

### GET `/uploads/avatars/{filename}` — **Public**

User avatars. Avatars are inherently public once shown on `/profile/{userId}` (Decision #26). Filename is `<uuid>.<ext>` so each upload gets a fresh URL (Decision #27).

Listing images are **not** mounted statically — they're served via the auth-gated route `GET /listings/{listing_id}/images/{image_id}` (§5). Note PDFs are served only via `GET /notes/{note_id}/download` (§4).

### GET `/health` — **Public**

Liveness check. Response 200: `{ "ok": true, "env": "dev" }`.

## Related documents

- [01-requirements.md](01-requirements.md) — user stories these endpoints implement
- [02-architecture.md](02-architecture.md) — request flow through layers
- [03-database-schema.md](03-database-schema.md) — underlying tables
- [05-frontend-pages.md](05-frontend-pages.md) — pages that consume these endpoints
