# 04 — API specification

## Purpose of this document

Defines every REST endpoint: method, path, request body, response body, status codes, and auth requirement. Consult before adding or changing any route. Endpoints below align with the tables in `03-database-schema.md` and the user stories in `01-requirements.md`.

## 1. Conventions

- **Base URL:** `/api`
- **Auth:** `Authorization: Bearer <jwt>` on all endpoints unless marked **Public**
- **Errors:** JSON body `{ "detail": "<message>", "code": "<error_code>" }`
- **Pagination:** list endpoints accept `?limit=<int, default 20, max 100>&offset=<int, default 0>`
- **Timestamps:** all ISO 8601 with timezone (`2026-05-05T14:30:00Z`)
- **IDs:** UUID strings

### Standard status codes used

| Code | When                                              |
|------|---------------------------------------------------|
| 200  | OK (read, update, delete success without body)    |
| 201  | Created                                           |
| 204  | No content (delete success)                       |
| 400  | Bad request (validation, business rule violation) |
| 401  | Unauthenticated (missing/invalid JWT)             |
| 403  | Forbidden (authenticated but not allowed)         |
| 404  | Not found                                         |
| 409  | Conflict (duplicate, state mismatch)              |
| 413  | Payload too large (file size)                     |
| 415  | Unsupported media type (file MIME)                |
| 422  | Unprocessable entity (Pydantic validation)        |

## 2. Auth

### POST `/api/auth/register` — **Public**

Request:
```json
{ "email": "alice@uni.edu", "password": "...", "full_name": "Alice Smith" }
```
Response 201:
```json
{ "id": "uuid", "email": "alice@uni.edu", "full_name": "Alice Smith", "access_token": "<jwt>" }
```
Errors: 409 (email already registered), 422.

### POST `/api/auth/login` — **Public**

Request:
```json
{ "email": "alice@uni.edu", "password": "..." }
```
Response 200:
```json
{ "access_token": "<jwt>", "token_type": "bearer", "expires_in": 604800 }
```
Errors: 401 (invalid credentials), 422.

### GET `/api/auth/me`

Response 200: `UserRead` (see §3).
Errors: 401.

## 3. Users

### `UserRead` schema
```json
{
  "id": "uuid",
  "email": "alice@uni.edu",
  "full_name": "Alice Smith",
  "university": "State Uni",
  "department": "CS",
  "contact_info": "alice@uni.edu",
  "created_at": "..."
}
```

### PATCH `/api/users/me`

Request (any subset):
```json
{ "full_name": "...", "university": "...", "department": "...", "contact_info": "..." }
```
Response 200: `UserRead`.
Errors: 401, 422.

### GET `/api/users/{id}` — public profile snippet

Response 200:
```json
{ "id": "uuid", "full_name": "...", "university": "...", "department": "...", "contact_info": "..." }
```
Errors: 401, 404.

## 4. Notes

### `NoteRead`
```json
{
  "id": "uuid", "user_id": "uuid", "title": "...", "description": "...",
  "course_code": "CS301", "semester": "Fall 2025",
  "file_size_bytes": 524288, "created_at": "..."
}
```

### GET `/api/notes`

Query: `course_code`, `semester`, `q` (title search), `limit`, `offset`.
Response 200: `{ "items": [NoteRead], "total": 42 }`.

### POST `/api/notes` — multipart

Form fields: `title`, `description`, `course_code`, `semester`, `file` (PDF, ≤10MB).
Response 201: `NoteRead`.
Errors: 401, 413, 415, 422.

### GET `/api/notes/{id}`

Response 200: `NoteRead`.
Errors: 401, 404.

### GET `/api/notes/{id}/download`

Response 200: `application/pdf` stream with `Content-Disposition: attachment`.
Errors: 401, 404.

### DELETE `/api/notes/{id}`

Auth: must be the uploader.
Response 204.
Errors: 401, 403, 404.

## 5. Marketplace listings

### `ListingRead`
```json
{
  "id": "uuid", "seller_id": "uuid",
  "title": "...", "description": "...",
  "price": 35.00, "category": "textbook", "status": "available",
  "images": [{ "id": "uuid", "url": "/uploads/images/...jpg", "display_order": 0 }],
  "created_at": "...", "updated_at": "..."
}
```

### GET `/api/listings`

Query: `category`, `status` (default `available`), `q`, `sort` (`newest`|`price_asc`|`price_desc`), `limit`, `offset`.
Response 200: `{ "items": [ListingRead], "total": N }`.

### POST `/api/listings`

Request (JSON):
```json
{ "title": "...", "description": "...", "price": 35.00, "category": "textbook" }
```
Response 201: `ListingRead` (without images — upload in next call).
Errors: 401, 422.

### GET `/api/listings/{id}`

Response 200: `ListingRead`.
Errors: 401, 404.

### PATCH `/api/listings/{id}`

Auth: seller only.
Request (any subset): `title`, `description`, `price`, `category`, `status`.
Response 200: `ListingRead`.
Errors: 401, 403, 404, 422.

### DELETE `/api/listings/{id}`

Auth: seller only. Cascades to images and messages.
Response 204.
Errors: 401, 403, 404.

### POST `/api/listings/{id}/images` — multipart

Auth: seller only.
Form fields: one or more `files` (image/jpeg or image/png, ≤5MB each, max 8 total per listing).
Response 201: `[{ "id": "uuid", "url": "...", "display_order": N }]`.
Errors: 401, 403, 404, 409 (over limit), 413, 415.

### DELETE `/api/listings/{id}/images/{image_id}`

Auth: seller only.
Response 204.
Errors: 401, 403, 404.

## 6. Events

### `EventRead`
```json
{
  "id": "uuid", "organizer_id": "uuid",
  "title": "...", "description": "...",
  "category": "academic", "location": "Library room 204",
  "starts_at": "...", "ends_at": "...",
  "attendee_count": 5,
  "created_at": "...", "updated_at": "..."
}
```

### GET `/api/events`

Query: `category`, `from` (ISO datetime, default = now), `to` (ISO datetime), `limit`, `offset`.
Response 200: `{ "items": [EventRead], "total": N }`.

### POST `/api/events`

Request:
```json
{ "title": "...", "description": "...", "category": "academic",
  "location": "...", "starts_at": "...", "ends_at": "..." }
```
Response 201: `EventRead`.
Errors: 401, 422.

### GET `/api/events/{id}`

Response 200: `EventRead`.
Errors: 401, 404.

### PATCH `/api/events/{id}`

Auth: organizer only.
Request: any subset of create fields.
Response 200: `EventRead`.
Errors: 401, 403, 404, 422.

### DELETE `/api/events/{id}`

Auth: organizer only.
Response 204.
Errors: 401, 403, 404.

### POST `/api/events/{id}/attendees` — RSVP

Body: empty.
Response 201: `{ "event_id": "...", "user_id": "...", "created_at": "..." }`.
Errors: 401, 404, 409 (already RSVPed).

### DELETE `/api/events/{id}/attendees/me` — un-RSVP

Response 204.
Errors: 401, 404.

### GET `/api/events/{id}/attendees`

Response 200:
```json
{ "items": [{ "user_id": "...", "full_name": "...", "department": "..." }], "total": N }
```
Errors: 401, 404.

## 7. Buddy profiles

### `BuddyProfileRead`
```json
{
  "id": "uuid", "user_id": "uuid",
  "full_name": "Alice Smith",  "department": "CS",  "contact_info": "alice@uni.edu",
  "bio": "...",
  "subjects": ["CS301", "CS210"],
  "preferred_study_style": "group",
  "availability": "Weekday evenings",
  "created_at": "...", "updated_at": "..."
}
```
(`subjects` is stored as a comma-separated VARCHAR; the API splits/joins on the boundary.)

### GET `/api/buddies`

Query: `subject` (matches any in subjects via ILIKE), `style` (`group`|`solo`|`mixed`), `limit`, `offset`.
Response 200: `{ "items": [BuddyProfileRead], "total": N }`.

### GET `/api/buddies/me`

Response 200: `BuddyProfileRead` if exists.
Errors: 401, 404 (no profile yet).

### PUT `/api/buddies/me` — upsert

Request:
```json
{ "bio": "...", "subjects": ["CS301", "CS210"],
  "preferred_study_style": "group", "availability": "..." }
```
Response 200 (updated) or 201 (created): `BuddyProfileRead`.
Errors: 401, 422.

### DELETE `/api/buddies/me`

Response 204.
Errors: 401, 404.

### GET `/api/buddies/{id}`

Response 200: `BuddyProfileRead`.
Errors: 401, 404.

## 8. Messages (marketplace-scoped)

### `MessageRead`
```json
{
  "id": "uuid", "listing_id": "uuid",
  "sender_id": "uuid", "recipient_id": "uuid",
  "body": "...", "read_at": null, "created_at": "..."
}
```

### `ThreadRead` (inbox summary)
```json
{
  "listing_id": "uuid", "listing_title": "...",
  "other_user": { "id": "uuid", "full_name": "..." },
  "last_message": { "body": "...", "created_at": "...", "from_me": false },
  "unread_count": 2
}
```

### GET `/api/messages` — inbox: list of threads

Response 200: `{ "items": [ThreadRead], "total": N }`.
Errors: 401.

### GET `/api/messages/listings/{listing_id}/with/{user_id}`

Returns full message history for a thread. Caller must be either sender or recipient.
Response 200: `{ "items": [MessageRead], "total": N }`.
Errors: 401, 403, 404.

### POST `/api/messages`

Request:
```json
{ "listing_id": "uuid", "recipient_id": "uuid", "body": "Hi! Still available?" }
```
The server sets `sender_id` from the JWT. `recipient_id` must be the listing seller (if sender is buyer) or the buyer (if sender is seller in an existing thread). 400 otherwise.
Response 201: `MessageRead`.
Errors: 400, 401, 404, 422.

### PATCH `/api/messages/{id}/read`

Auth: must be the recipient.
Response 200: `MessageRead` with `read_at` set.
Errors: 401, 403, 404.

## 9. Static files

### GET `/uploads/images/{filename}` — **Public**
### GET `/uploads/notes/{filename}` — **Authenticated**

Notes downloads also have a dedicated endpoint (§4) that adds `Content-Disposition`. Direct paths exist for image embedding.

## Related documents

- [01-requirements.md](01-requirements.md) — user stories these endpoints implement
- [02-architecture.md](02-architecture.md) — request flow through layers
- [03-database-schema.md](03-database-schema.md) — underlying tables
- [05-frontend-pages.md](05-frontend-pages.md) — pages that consume these endpoints
