# CRM Axivity - API Contracts

> Generated: 2026-01-06 | Version: 1.0.0

## Overview

The CRM Axivity API consists of 11 Next.js API routes handling authentication, calendar integration, email, quote generation, invoicing, and administration.

All API routes use:
- **Error Handling**: Centralized via `handleApiError()` from `@/lib/api-error-handler`
- **Validation**: Zod schemas from `@/lib/schemas/api`
- **Authentication**: Supabase Auth or NextAuth.js session

---

## Authentication

### NextAuth.js OAuth

```
GET/POST /api/auth/[...nextauth]
```

Handles OAuth authentication for Google and Microsoft providers.

**Providers**:
- Google (Calendar, Gmail, Places scopes)
- Microsoft Entra ID (Calendars.ReadWrite, Mail.Send scopes)

**Session Token** includes:
- `accessToken`: OAuth access token
- `provider`: "google" | "microsoft"

---

## Calendar API

### Get Calendar Events

```
GET /api/calendar/events
```

Retrieves calendar events from Google Calendar or Microsoft Outlook.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `timeMin` | string (ISO 8601) | Yes | Start of time range |
| `timeMax` | string (ISO 8601) | Yes | End of time range |

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "event-id",
      "summary": "Meeting Title",
      "start": { "dateTime": "2026-01-06T10:00:00Z", "timeZone": "Europe/Paris" },
      "end": { "dateTime": "2026-01-06T11:00:00Z", "timeZone": "Europe/Paris" },
      "attendees": [{ "email": "john@example.com" }],
      "location": "Office",
      "htmlLink": "https://..."
    }
  ]
}
```

**Errors**:
- `401 Unauthorized`: No valid session
- `400 Bad Request`: Missing timeMin or timeMax

---

### Create Calendar Event

```
POST /api/calendar/events
```

Creates a calendar event in Google Calendar or Microsoft Outlook.

**Request Body**:
```json
{
  "summary": "Meeting Title",
  "description": "Meeting description",
  "start": {
    "dateTime": "2026-01-06T10:00:00",
    "timeZone": "Europe/Paris"
  },
  "end": {
    "dateTime": "2026-01-06T11:00:00",
    "timeZone": "Europe/Paris"
  },
  "attendees": [{ "email": "john@example.com" }],
  "location": "Office",
  "conferenceData": true
}
```

**Response** (200 OK):
```json
{
  "id": "event-id",
  "summary": "Meeting Title",
  "htmlLink": "https://calendar.google.com/...",
  "hangoutLink": "https://meet.google.com/..."
}
```

---

## Email API

### Send Email

```
POST /api/email/send
```

Sends an email via Gmail or Microsoft Outlook (based on user's OAuth provider).

**Request Body**:
```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "Email body content (HTML supported)"
}
```

**Validation Schema** (`sendEmailSchema`):
- `to`: Valid email address (required)
- `subject`: String, max 200 chars (required)
- `body`: String, max 10000 chars (required)

**Response** (200 OK):
```json
{
  "success": true,
  "messageId": "msg-id",
  "threadId": "thread-id"
}
```

---

## Devis (Quote) API

### Preview Quote PDF

```
POST /api/devis/preview
```

Generates a preview PDF of a quote without saving to database.

**Request Body**:
```json
{
  "opportuniteId": "uuid"
}
```

**Response**: Binary PDF stream with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: inline; filename="apercu-devis.pdf"`

---

### Generate Quote PDF

```
POST /api/devis/generate
```

Generates a final quote PDF, saves to database with sequential number (DEV-YYYY-NNN), and uploads to Supabase Storage.

**Request Body**:
```json
{
  "opportuniteId": "uuid"
}
```

**Response**: Binary PDF stream with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="DEV-2026-001.pdf"`
- `X-Devis-Id`: UUID of created devis record
- `X-Devis-Numero`: Sequential quote number

**Database Operations**:
1. Fetches opportunity with client, contact, quote lines
2. Generates sequential number via `generer_numero_devis()` function
3. Creates `devis` record with status "brouillon"
4. Uploads PDF to `devis-pdf` storage bucket
5. Updates devis with PDF URL

---

### Send Quote by Email

```
POST /api/devis/send
```

Sends a quote by email via Resend with PDF attachment.

**Request Body**:
```json
{
  "devisId": "uuid",
  "recipientEmail": "optional@email.com",
  "customMessage": "Optional custom message"
}
```

**Validation Schema** (`sendDevisSchema`):
- `devisId`: UUID (required)
- `recipientEmail`: Email (optional, falls back to contact email)
- `customMessage`: String (optional)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Email sent to john@example.com"
}
```

**Side Effects**:
- Updates devis status to "envoye"
- Sets `date_envoi` to current timestamp

---

## Factures (Invoice) API

### Generate Invoice from Quote

```
POST /api/factures/generate
```

Converts an accepted quote to an invoice PDF.

**Request Body**:
```json
{
  "devisId": "uuid"
}
```

**Validation**:
- Quote must exist
- Quote must not already be converted (checks `facture_id`)

**Response**: Binary PDF stream with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="FAC-2026-001.pdf"`
- `X-Facture-Id`: UUID of created facture record
- `X-Facture-Numero`: Sequential invoice number

**Database Operations**:
1. Fetches devis with client, contact, opportunity, quote lines
2. Generates sequential number via `generer_numero_facture()` function
3. Creates `factures` record with status "Brouillon"
4. Uploads PDF to `factures-pdf` storage bucket
5. Updates devis with `facture_id` and status "accepte"

---

### Send Invoice Reminder

```
POST /api/factures/relance
```

Sends a payment reminder email via N8N webhook.

**Request Body**:
```json
{
  "factureId": "uuid"
}
```

**Relance Levels**:
| Level | Days Overdue |
|-------|--------------|
| 1 | 1-7 days |
| 2 | 8-15 days |
| 3 | 15+ days |

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Relance N2 envoyée avec succès",
  "niveau_relance": 2,
  "facture_id": "uuid"
}
```

**Side Effects**:
- Calls N8N webhook `/webhook/relance-facture-manuelle`
- Creates interaction record for audit trail
- Updates facture `niveau_relance`

---

## Admin API

### List Users

```
GET /api/admin/users
```

Lists all users with their profiles. **Admin only**.

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "nom": "Dupont",
      "prenom": "Jean",
      "role": "commercial",
      "created_at": "2026-01-01T00:00:00Z",
      "last_sign_in_at": "2026-01-06T10:00:00Z",
      "email_confirmed_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### Invite User

```
POST /api/admin/users
```

Invites a new user via email. **Admin only**.

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "nom": "Dupont",
  "prenom": "Jean",
  "role": "commercial"
}
```

**Valid Roles**:
- `admin`
- `developpeur_nocode`
- `developpeur_automatisme`
- `commercial`
- `client`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Invitation envoyée à newuser@example.com",
  "user": { "id": "uuid", "email": "newuser@example.com" }
}
```

**Side Effects**:
- Creates profile record
- Creates equipe record (for non-client roles)
- Sends invitation email via Supabase Auth

---

### Update User

```
PATCH /api/admin/users/[id]
```

Updates a user's role. **Admin only**.

**Request Body**:
```json
{
  "role": "manager"
}
```

---

### Delete User

```
DELETE /api/admin/users/[id]
```

Deletes a user. **Admin only**.

---

## Places API

### Search Google Places

```
POST /api/places/search
```

Searches Google Places API for business information.

**Request Body**:
```json
{
  "query": "Acme Corporation",
  "city": "Paris"
}
```

**Response** (200 OK):
```json
{
  "result": {
    "placeId": "ChIJ...",
    "name": "Acme Corporation",
    "address": "123 Rue Example, 75001 Paris, France",
    "telephone": "01 23 45 67 89",
    "telephoneInternational": "+33 1 23 45 67 89",
    "siteWeb": "https://acme.example.com",
    "googleMapsUrl": "https://maps.google.com/?cid=..."
  }
}
```

**Note**: Returns `{ result: null }` if `GOOGLE_PLACES_API_KEY` is not configured (graceful degradation).

---

## Error Response Format

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { "field": "Additional context" }
}
```

### Error Types

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | 502 | External service (Google, Resend, N8N) failed |

---

## Rate Limiting

No explicit rate limiting is implemented. External APIs (Google, Microsoft, Resend) have their own limits.

---

## Authentication Requirements

| Endpoint | Auth Required | Admin Only |
|----------|--------------|------------|
| `/api/auth/*` | No | No |
| `/api/calendar/*` | Yes (NextAuth) | No |
| `/api/email/*` | Yes (NextAuth) | No |
| `/api/devis/*` | No (server-side) | No |
| `/api/factures/*` | No (server-side) | No |
| `/api/admin/*` | Yes (Supabase) | Yes |
| `/api/places/*` | No | No |
