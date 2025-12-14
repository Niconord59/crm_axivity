# API Contract: Airtable REST API

**Feature**: 001-crm-axivity-interface
**Date**: 2025-12-14

## Overview

Ce document définit les contrats d'API pour l'interaction avec Airtable. L'application utilise l'API REST officielle d'Airtable comme backend.

## Base Configuration

```
Base URL: https://api.airtable.com/v0
Base ID: appEf6JtWFdfLwsU6
Authentication: Bearer Token (API Key)
```

## Common Headers

```http
Authorization: Bearer {AIRTABLE_API_KEY}
Content-Type: application/json
```

## Rate Limits

- **5 requests per second** per base
- Réponse 429 si dépassé (avec Retry-After header)
- Strategy: Batch requests + debounce searches

---

## Clients API

### List Clients

```http
GET /v0/{baseId}/tbljVwWGbg2Yq9toR
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| maxRecords | number | Limit results (default: 100) |
| view | string | View name or ID |
| filterByFormula | string | Airtable formula filter |
| sort[0][field] | string | Sort field |
| sort[0][direction] | string | "asc" or "desc" |
| offset | string | Pagination cursor |

**Response** (200 OK):
```json
{
  "records": [
    {
      "id": "recXXXXXXXXXXXXXX",
      "createdTime": "2025-01-01T00:00:00.000Z",
      "fields": {
        "Nom du Client": "Acme Corp",
        "Statut": "Actif",
        "Date de Création": "2025-01-01",
        "Contacts": ["recYYYYYYYYYYYYYY"],
        "Projets": ["recZZZZZZZZZZZZZZ"],
        "CA Total Encaissé": 50000,
        "Santé du Client": "🟢 OK"
      }
    }
  ],
  "offset": "itrXXXXXXXXXXXXXX"
}
```

### Get Client by ID

```http
GET /v0/{baseId}/tbljVwWGbg2Yq9toR/{recordId}
```

**Response** (200 OK):
```json
{
  "id": "recXXXXXXXXXXXXXX",
  "createdTime": "2025-01-01T00:00:00.000Z",
  "fields": {
    "Nom du Client": "Acme Corp",
    "Statut": "Actif",
    ...
  }
}
```

### Create Client

```http
POST /v0/{baseId}/tbljVwWGbg2Yq9toR
```

**Request Body**:
```json
{
  "fields": {
    "Nom du Client": "New Client",
    "Statut": "Prospect"
  }
}
```

**Response** (200 OK): Created record

### Update Client

```http
PATCH /v0/{baseId}/tbljVwWGbg2Yq9toR/{recordId}
```

**Request Body**:
```json
{
  "fields": {
    "Statut": "Actif"
  }
}
```

**Response** (200 OK): Updated record

---

## Projets API

### List Projets

```http
GET /v0/{baseId}/tblwNbd9Lk8SxixAI
```

**Common Filters**:
```
# Projets en cours
filterByFormula={Statut}="En cours"

# Projets d'un client
filterByFormula=FIND("recXXXX",ARRAYJOIN({Client}))

# Projets en retard
filterByFormula=AND({Statut}!="Terminé",{Date de Fin Prévue}<TODAY())
```

**Response Fields**:
```json
{
  "Nom du Projet": "P001 - Automatisation CRM",
  "Statut": "En cours",
  "Budget Final": 15000,
  "Date de Début": "2025-01-15",
  "Date de Fin Prévue": "2025-03-15",
  "Client": ["recXXXXXXXXXXXXXX"],
  "Tâches": ["recAAAAAAAAAAAA", "recBBBBBBBBBBBB"],
  "% Tâches Terminées": 0.6,
  "Retard (jours)": 0
}
```

### Update Projet Status

```http
PATCH /v0/{baseId}/tblwNbd9Lk8SxixAI/{recordId}
```

**Request Body**:
```json
{
  "fields": {
    "Statut": "Terminé",
    "Date Fin Réelle": "2025-03-10"
  }
}
```

---

## Opportunités API

### List Opportunités

```http
GET /v0/{baseId}/tbl8QiX8vGLQfRu0G
```

**Pipeline View Filter**:
```
# Par statut pour Kanban
filterByFormula={Statut}="Lead"
filterByFormula={Statut}="Qualifié"
...

# Opportunités ouvertes (pour pipeline)
filterByFormula=AND({Statut}!="Gagnée",{Statut}!="Perdue")
```

**Response Fields**:
```json
{
  "Nom de l'Opportunité": "Projet IA pour Acme",
  "Statut": "Proposition envoyée",
  "Valeur Estimée": 25000,
  "Probabilité": 0.6,
  "Valeur Pondérée": 15000,
  "Date de Clôture Estimée": "2025-02-28",
  "Client": ["recXXXXXXXXXXXXXX"],
  "Notes": "Contact intéressé..."
}
```

### Update Opportunité Status (Drag & Drop)

```http
PATCH /v0/{baseId}/tbl8QiX8vGLQfRu0G/{recordId}
```

**Request Body**:
```json
{
  "fields": {
    "Statut": "Négociation"
  }
}
```

**Important**: Quand le statut passe à "Gagnée", le workflow N8N crée automatiquement le projet associé. L'interface doit rafraîchir les données après cette mise à jour.

---

## Tâches API

### List Tâches

```http
GET /v0/{baseId}/tbl6x2Ju4HJyh8SW2
```

**Common Filters**:
```
# Mes tâches (par membre équipe)
filterByFormula=FIND("recMEMBRE",ARRAYJOIN({Membre Équipe}))

# Tâches en retard
filterByFormula=AND({Statut}!="Terminée",{Date d'Échéance}<TODAY())

# Tâches d'un projet
filterByFormula=FIND("recPROJET",ARRAYJOIN({Projet}))

# Tâches de la semaine
filterByFormula=AND(
  {Date d'Échéance}>=TODAY(),
  {Date d'Échéance}<=DATEADD(TODAY(),7,'days'),
  {Statut}!="Terminée"
)
```

**Response Fields**:
```json
{
  "Nom de la Tâche": "Configurer webhook API",
  "Statut": "En cours",
  "Priorité": "Haute",
  "Date d'Échéance": "2025-01-20",
  "Projet": ["recXXXXXXXXXXXXXX"],
  "Membre Équipe": ["recYYYYYYYYYYYYYY"]
}
```

### Update Tâche Status (Checkbox completion)

```http
PATCH /v0/{baseId}/tbl6x2Ju4HJyh8SW2/{recordId}
```

**Request Body**:
```json
{
  "fields": {
    "Statut": "Terminée"
  }
}
```

**Note**: Le `% Tâches Terminées` du projet parent se recalcule automatiquement (rollup Airtable).

---

## Factures API

### List Factures

```http
GET /v0/{baseId}/tbl0d2o8Df9Sj827M
```

**Common Filters**:
```
# Factures en retard
filterByFormula=AND({Statut}="Envoyée",{Date d'Échéance}<TODAY())

# Factures à relancer (niveau N1+)
filterByFormula=AND({Statut}="Envoyée",{Niveau de Relance}>0)

# Factures d'un client (via projet)
filterByFormula=FIND("recCLIENT",ARRAYJOIN(ROLLUP({Client})))
```

**Response Fields**:
```json
{
  "Numéro Facture": "FAC-2025-001",
  "Statut": "Envoyée",
  "Montant HT": 5000,
  "Montant TTC": 6000,
  "Date d'Émission": "2025-01-01",
  "Date d'Échéance": "2025-01-31",
  "Niveau de Relance": "N1",
  "Niveau Relance Envoyé": 1,
  "Projet": ["recXXXXXXXXXXXXXX"]
}
```

### Update Facture (Paiement reçu)

```http
PATCH /v0/{baseId}/tbl0d2o8Df9Sj827M/{recordId}
```

**Request Body**:
```json
{
  "fields": {
    "Statut": "Payée",
    "Date de Paiement": "2025-01-25"
  }
}
```

---

## Équipe API

### List Équipe

```http
GET /v0/{baseId}/tblozWfDZEFW3Nkwv
```

**Response Fields**:
```json
{
  "Nom": "Jean Dupont",
  "Email": "jean@agence.com",
  "Rôle": "Développeur",
  "Capacité Hebdo": 35,
  "Nb Tâches En Cours": 5,
  "% Capacité Atteinte": 0.8
}
```

---

## Interactions API (Journal CRM)

### List Interactions

```http
GET /v0/{baseId}/tblUoIhmQVr3ie5BQ
```

**Filters**:
```
# Interactions d'un client
filterByFormula=FIND("recCLIENT",ARRAYJOIN({Client}))

# Dernières interactions (tri décroissant)
sort[0][field]=Date
sort[0][direction]=desc
```

### Create Interaction

```http
POST /v0/{baseId}/tblUoIhmQVr3ie5BQ
```

**Request Body**:
```json
{
  "fields": {
    "Titre": "Appel de suivi",
    "Type": "Appel",
    "Date": "2025-01-20",
    "Notes": "Discussion sur le projet en cours...",
    "Client": ["recXXXXXXXXXXXXXX"],
    "Contact": ["recYYYYYYYYYYYYYY"],
    "Membre Équipe": ["recZZZZZZZZZZZZZZ"]
  }
}
```

---

## Dashboard KPIs (Batch Queries)

Pour optimiser les requêtes dashboard, utiliser des formules agrégées:

### KPI: Projets Actifs

```http
GET /v0/{baseId}/tblwNbd9Lk8SxixAI?filterByFormula={Statut}="En cours"&maxRecords=1
```
Compter le `offset` ou faire `COUNTA` côté client.

### KPI: CA Pipeline

```http
GET /v0/{baseId}/tbl8QiX8vGLQfRu0G?filterByFormula=AND({Statut}!="Gagnée",{Statut}!="Perdue")&fields[]=Valeur%20Pondérée
```
Sommer les `Valeur Pondérée` côté client.

### KPI: CA Trimestre

```http
GET /v0/{baseId}/tblwNbd9Lk8SxixAI?filterByFormula=AND(IS_AFTER({Date de Début},DATEADD(TODAY(),-90,'days')))&fields[]=Budget%20Final
```
Sommer les `Budget Final` côté client.

### KPI: Tâches en Retard

```http
GET /v0/{baseId}/tbl6x2Ju4HJyh8SW2?filterByFormula=AND({Statut}!="Terminée",{Date d'Échéance}<TODAY())&maxRecords=1
```
Compter côté client.

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": {
    "type": "AUTHENTICATION_REQUIRED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "type": "NOT_AUTHORIZED",
    "message": "You are not permitted to perform this operation"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "type": "NOT_FOUND",
    "message": "Could not find record"
  }
}
```

### 422 Unprocessable Entity
```json
{
  "error": {
    "type": "INVALID_REQUEST",
    "message": "Invalid field name"
  }
}
```

### 429 Too Many Requests
```json
{
  "error": {
    "type": "RATE_LIMIT_REACHED",
    "message": "You have exceeded the rate limit"
  }
}
```
Header: `Retry-After: 30`

---

## Client Implementation Notes

### Retry Strategy
```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '30', 10);
      await sleep(retryAfter * 1000);
      continue;
    }
    return response;
  }
  throw new Error('Rate limit exceeded after retries');
}
```

### Optimistic Updates (Drag & Drop)
```typescript
// 1. Update UI immediately
setOpportunities(prev => moveItem(prev, dragId, newStatus));

// 2. Send API request
try {
  await updateOpportunityStatus(dragId, newStatus);
} catch (error) {
  // 3. Rollback on failure
  setOpportunities(prev => moveItem(prev, dragId, oldStatus));
  toast.error('Erreur lors de la mise à jour');
}
```

### Pagination
```typescript
async function fetchAllRecords<T>(tableId: string): Promise<T[]> {
  const records: T[] = [];
  let offset: string | undefined;

  do {
    const response = await fetchTable<T>(tableId, { offset });
    records.push(...response.records);
    offset = response.offset;
  } while (offset);

  return records;
}
```
