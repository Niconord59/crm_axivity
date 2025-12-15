# Feature Specification: Module Prospection

**Feature Branch**: `003-prospection`
**Created**: 2025-12-15
**Updated**: 2025-12-15
**Status**: Implemented (Phase 7 - Google Calendar added)
**Priority**: P1 - Haute

---

## Contexte

### Problème actuel

L'import de leads se fait actuellement via la page **Opportunités**, ce qui implique que chaque lead importé devient automatiquement une opportunité commerciale. Or, dans un vrai cycle de vente :

```
Leads (froids) → Qualification (appels) → Opportunités (chauds) → Pipeline → Closing
```

Un lead importé n'est pas encore une opportunité. Il faut d'abord le contacter, le qualifier, puis créer une opportunité si le besoin est confirmé.

### Solution proposée

Créer une page `/prospection` dédiée qui permet :
1. **Import CSV** de leads avec mapping manuel des colonnes
2. **Suivi des appels** avec statuts de prospection
3. **Conversion** en Opportunité quand le lead est qualifié

---

## Architecture des données

### Tables Airtable impactées

| Table | Modifications |
|-------|---------------|
| **T1-Clients** | Aucune (utilise le statut "Prospect" existant) |
| **T2-Contacts** | Ajout de 4 nouveaux champs |
| **T8-Interactions** | Aucune (utilisation existante) |

### Nouveaux champs sur T2-Contacts

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `Statut Prospection` | Single Select | À appeler, Appelé - pas répondu, Rappeler, RDV planifié, Qualifié, Non qualifié, Perdu | État dans le cycle de prospection |
| `Date Rappel` | Date | - | Date de rappel programmée |
| `Source Lead` | Single Select | LinkedIn, Site web, Salon, Recommandation, Achat liste, Autre | Origine du lead |
| `Notes Prospection` | Long Text | - | Notes rapides pour le suivi |

### Flux de données

```
Import CSV
    ↓
┌─────────────────────────────────┐
│ Création/Mise à jour            │
│ T1-Clients (Statut: Prospect)   │
│         +                       │
│ T2-Contacts (Statut: À appeler) │
└─────────────────────────────────┘
    ↓
Appels & Qualification
    ↓
┌─────────────────────────────────┐
│ Si Qualifié:                    │
│ - Client → Statut: Actif        │
│ - Création T3-Opportunité       │
│ - Contact → Statut: Qualifié    │
└─────────────────────────────────┘
```

---

## User Stories

### US-001: Import CSV avec mapping manuel (P1-CRITIQUE)

**En tant que** commercial
**Je veux** importer une liste de leads depuis un fichier CSV
**Afin de** charger rapidement mes prospects sans saisie manuelle

#### Acceptance Criteria

1. **Given** l'utilisateur clique sur "Importer CSV", **When** il sélectionne un fichier, **Then** les colonnes du fichier sont détectées et affichées
2. **Given** les colonnes sont affichées, **When** l'utilisateur mappe chaque colonne vers un champ, **Then** il peut choisir parmi : Entreprise*, Contact*, Email*, Téléphone, Source, Notes (*obligatoires)
3. **Given** le mapping est configuré, **When** l'utilisateur clique sur "Aperçu", **Then** il voit les 5 premières lignes avec les données mappées
4. **Given** l'aperçu est validé, **When** l'utilisateur clique sur "Importer", **Then** une barre de progression affiche l'avancement
5. **Given** l'import est terminé, **When** le résumé s'affiche, **Then** il voit : X créés, Y mis à jour, Z erreurs

#### Règles métier

- **Dédoublonnage** : Si un contact avec le même email existe déjà, il est mis à jour (pas de doublon)
- **Création Client** : Si l'entreprise n'existe pas, elle est créée avec statut "Prospect"
- **Liaison automatique** : Le contact est automatiquement lié au client (entreprise)
- **Statut initial** : Tous les contacts importés ont le statut "À appeler"

#### Format CSV supporté

```csv
Entreprise,Nom Contact,Email,Telephone,Source,Notes
Acme Corp,Jean Dupont,jean@acme.fr,0612345678,LinkedIn,CEO intéressé IA
TechStart,Marie Martin,m.martin@techstart.io,0698765432,Salon,Rencontrée au Web Summit
```

---

### US-002: Liste des leads à prospecter (P1)

**En tant que** commercial
**Je veux** voir tous mes leads à appeler dans une liste filtrable
**Afin de** organiser ma prospection efficacement

#### Acceptance Criteria

1. **Given** l'utilisateur accède à `/prospection`, **When** la page s'affiche, **Then** il voit la liste des contacts avec statut prospection non nul
2. **Given** la liste est affichée, **When** l'utilisateur filtre par "À appeler", **Then** seuls les leads à appeler s'affichent
3. **Given** un lead a une date de rappel aujourd'hui, **When** la liste s'affiche, **Then** ce lead est mis en évidence (badge "Rappel aujourd'hui")
4. **Given** la liste est affichée, **When** l'utilisateur recherche "Acme", **Then** les résultats filtrent par nom d'entreprise ou de contact

#### Filtres disponibles

| Filtre | Options |
|--------|---------|
| Statut | Tous, À appeler, Appelé - pas répondu, Rappeler, Qualifié, Non qualifié, Perdu |
| Source | Tous, LinkedIn, Site web, Salon, Recommandation, Achat liste, Autre |
| Date rappel | Aujourd'hui, Cette semaine, En retard, Tous |

#### Colonnes affichées

| Colonne | Source |
|---------|--------|
| Entreprise | T1-Clients.Nom |
| Contact | T2-Contacts.Nom |
| Email | T2-Contacts.Email |
| Téléphone | T2-Contacts.Téléphone |
| Statut | T2-Contacts.Statut Prospection |
| Source | T2-Contacts.Source Lead |
| Rappel | T2-Contacts.Date Rappel |
| Notes | T2-Contacts.Notes Prospection (tronquées) |

---

### US-003: Actions de prospection (P1)

**En tant que** commercial
**Je veux** effectuer des actions rapides sur chaque lead
**Afin de** mettre à jour le statut après mes appels

#### Acceptance Criteria

1. **Given** l'utilisateur clique sur "Appeler" d'un lead, **When** l'action s'exécute, **Then** le numéro est copié dans le presse-papier et un dialog s'ouvre pour noter le résultat
2. **Given** le dialog "Résultat d'appel" est ouvert, **When** l'utilisateur sélectionne "Pas répondu", **Then** le statut passe à "Appelé - pas répondu"
3. **Given** le dialog est ouvert, **When** l'utilisateur sélectionne "Rappeler" et choisit une date, **Then** le statut passe à "Rappeler" et la date est enregistrée
4. **Given** le dialog est ouvert, **When** l'utilisateur sélectionne "Qualifié", **Then** un formulaire de création d'opportunité s'ouvre pré-rempli

#### Actions disponibles

| Action | Icône | Comportement |
|--------|-------|--------------|
| Appeler | 📞 | Copie téléphone + ouvre dialog résultat |
| Qualifié | ✅ | Ouvre formulaire création opportunité |
| Non qualifié | ⛔ | Change statut + demande raison |
| Perdu | ❌ | Change statut + demande raison |
| Modifier | ✏️ | Ouvre formulaire édition contact |

#### Dialog "Résultat d'appel"

```
┌─────────────────────────────────────────┐
│  Résultat de l'appel                    │
│  Jean Dupont - Acme Corp                │
├─────────────────────────────────────────┤
│  ○ Pas répondu                          │
│  ○ Répondu - Rappeler le [date picker]  │
│  ○ Qualifié - Créer opportunité         │
│  ○ Non qualifié - Pas le bon profil     │
│  ○ Perdu - Pas intéressé                │
├─────────────────────────────────────────┤
│  Notes:                                 │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  ☐ Créer une interaction dans le CRM   │
├─────────────────────────────────────────┤
│           [Annuler]  [Enregistrer]      │
└─────────────────────────────────────────┘
```

---

### US-004: Conversion Lead → Opportunité (P1)

**En tant que** commercial
**Je veux** convertir un lead qualifié en opportunité
**Afin de** le suivre dans le pipeline commercial

#### Acceptance Criteria

1. **Given** l'utilisateur clique sur "Qualifié" d'un lead, **When** le formulaire s'ouvre, **Then** les champs Client et Contact sont pré-remplis
2. **Given** l'utilisateur remplit le formulaire opportunité, **When** il valide, **Then** :
   - Une opportunité est créée (statut "Lead")
   - Le contact passe en statut "Qualifié"
   - Le client passe en statut "Actif" (si était "Prospect")
3. **Given** l'opportunité est créée, **When** l'utilisateur ferme le dialog, **Then** il voit un lien "Voir l'opportunité" et le lead disparaît de la liste prospection

#### Champs pré-remplis

| Champ Opportunité | Source |
|-------------------|--------|
| Client | T1-Clients (lien) |
| Contact principal | T2-Contacts (lookup) |
| Source | T2-Contacts.Source Lead |
| Notes | T2-Contacts.Notes Prospection |

---

### US-005: Tableau de bord prospection (P2)

**En tant que** manager commercial
**Je veux** voir des statistiques de prospection
**Afin de** piloter l'activité de l'équipe

#### KPIs affichés

| KPI | Calcul |
|-----|--------|
| Leads à appeler | COUNT(Statut = "À appeler") |
| Appels aujourd'hui | COUNT(Interactions type="Appel" date=aujourd'hui) |
| Taux de qualification | Qualifiés / Total appelés * 100 |
| Rappels en retard | COUNT(Date Rappel < Aujourd'hui AND Statut = "Rappeler") |

---

## Wireframes

### Page principale `/prospection`

```
┌─────────────────────────────────────────────────────────────────────┐
│  PROSPECTION                                                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │ 45      │ │ 12      │ │ 28%     │ │ 3       │                   │
│  │À appeler│ │Appelés  │ │Taux     │ │Rappels  │                   │
│  │         │ │aujourd' │ │qualif.  │ │en retard│                   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                   │
├─────────────────────────────────────────────────────────────────────┤
│  [Statut ▼] [Source ▼] [Rappel ▼]  🔍 ______    [Importer CSV] [+] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ 🏢 Acme Corp                                      À appeler     ││
│  │    👤 Jean Dupont · jean@acme.fr · 06 12 34 56 78              ││
│  │    📍 LinkedIn · Importé le 15/12                              ││
│  │    💬 "CEO intéressé par l'IA générative"                      ││
│  │                                                                 ││
│  │    [📞 Appeler]  [✅ Qualifié]  [⛔ Non qualifié]  [❌ Perdu]  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ 🏢 TechStart SAS                           🔔 Rappel aujourd'hui││
│  │    👤 Marie Martin · m.martin@techstart.io · 06 98 76 54 32    ││
│  │    📍 Salon · Importé le 10/12                                 ││
│  │    💬 "Intéressée, rappeler après son board"                   ││
│  │                                                                 ││
│  │    [📞 Appeler]  [✅ Qualifié]  [⛔ Non qualifié]  [❌ Perdu]  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Dialog Import CSV

```
┌─────────────────────────────────────────────────────────────────────┐
│  Importer des leads                                         [X]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Étape 1/3 : Sélection du fichier                                  │
│  ─────────────────────────────────────────                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                                                                 ││
│  │     📁 Glissez votre fichier CSV ici                           ││
│  │        ou cliquez pour sélectionner                            ││
│  │                                                                 ││
│  │     Formats acceptés : .csv, .xlsx                             ││
│  │                                                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│                                              [Annuler]  [Suivant →] │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Importer des leads                                         [X]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Étape 2/3 : Mapping des colonnes                                  │
│  ─────────────────────────────────────────                         │
│                                                                     │
│  Colonne du fichier          →    Champ CRM                        │
│  ─────────────────────────────────────────────────                 │
│  "Société"                   →    [Entreprise *        ▼]          │
│  "Nom"                       →    [Contact *           ▼]          │
│  "Mail"                      →    [Email *             ▼]          │
│  "Tel"                       →    [Téléphone           ▼]          │
│  "Origine"                   →    [Source              ▼]          │
│  "Commentaire"               →    [Notes               ▼]          │
│  "Date RDV"                  →    [-- Ignorer --       ▼]          │
│                                                                     │
│  * Champs obligatoires                                             │
│                                                                     │
│                                   [← Retour]  [Aperçu →]           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Importer des leads                                         [X]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Étape 3/3 : Aperçu et validation                                  │
│  ─────────────────────────────────────────                         │
│                                                                     │
│  📊 52 lignes détectées                                            │
│                                                                     │
│  ┌──────────────┬────────────┬─────────────────┬──────────────────┐│
│  │ Entreprise   │ Contact    │ Email           │ Téléphone        ││
│  ├──────────────┼────────────┼─────────────────┼──────────────────┤│
│  │ Acme Corp    │ J. Dupont  │ jean@acme.fr    │ 06 12 34 56 78   ││
│  │ TechStart    │ M. Martin  │ m.martin@ts.io  │ 06 98 76 54 32   ││
│  │ DataFlow     │ P. Durand  │ p.durand@df.com │ 07 11 22 33 44   ││
│  │ ...          │ ...        │ ...             │ ...              ││
│  └──────────────┴────────────┴─────────────────┴──────────────────┘│
│                                                                     │
│  ⚠️ 2 emails en doublon seront mis à jour                          │
│                                                                     │
│                                   [← Retour]  [Importer 52 leads]  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Spécifications techniques

### Nouveaux composants

| Composant | Chemin | Description |
|-----------|--------|-------------|
| `ProspectionPage` | `src/app/prospection/page.tsx` | Page principale |
| `LeadCard` | `src/components/prospection/LeadCard.tsx` | Carte d'un lead |
| `LeadImportDialog` | `src/components/prospection/LeadImportDialog.tsx` | Dialog import CSV |
| `CallResultDialog` | `src/components/prospection/CallResultDialog.tsx` | Dialog résultat appel |
| `ProspectionKPIs` | `src/components/prospection/ProspectionKPIs.tsx` | KPIs en haut de page |

### Nouveaux hooks

| Hook | Description |
|------|-------------|
| `useProspects` | Récupère les contacts avec statut prospection |
| `useUpdateProspectStatus` | Met à jour le statut d'un contact |
| `useImportLeads` | Gère l'import CSV avec création batch |
| `useConvertToOpportunity` | Convertit un lead en opportunité |

### Schémas Zod

```typescript
// src/lib/schemas/prospect.ts

export const PROSPECT_STATUTS = [
  "À appeler",
  "Appelé - pas répondu",
  "Rappeler",
  "RDV planifié",
  "Qualifié",
  "Non qualifié",
  "Perdu",
] as const;

export const PROSPECT_SOURCES = [
  "LinkedIn",
  "Site web",
  "Salon",
  "Recommandation",
  "Achat liste",
  "Autre",
] as const;

export const prospectSchema = z.object({
  entreprise: z.string().min(1, "Entreprise requise"),
  contact: z.string().min(1, "Nom du contact requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  source: z.enum(PROSPECT_SOURCES).optional(),
  notes: z.string().optional(),
});

export const callResultSchema = z.object({
  resultat: z.enum([
    "pas_repondu",
    "rappeler",
    "qualifie",
    "non_qualifie",
    "perdu",
  ]),
  dateRappel: z.string().optional(),
  notes: z.string().optional(),
  creerInteraction: z.boolean().default(true),
});
```

### API Airtable - Batch Import

```typescript
// Création batch (max 10 records par requête)
async function importLeads(leads: LeadData[]) {
  const BATCH_SIZE = 10;
  const results = { created: 0, updated: 0, errors: 0 };

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);

    for (const lead of batch) {
      // 1. Chercher si le contact existe (par email)
      const existingContact = await findContactByEmail(lead.email);

      if (existingContact) {
        // Mise à jour
        await updateContact(existingContact.id, lead);
        results.updated++;
      } else {
        // 2. Chercher/créer le client
        let clientId = await findClientByName(lead.entreprise);
        if (!clientId) {
          clientId = await createClient({
            nom: lead.entreprise,
            statut: "Prospect",
          });
        }

        // 3. Créer le contact
        await createContact({
          nom: lead.contact,
          email: lead.email,
          telephone: lead.telephone,
          client: [clientId],
          statutProspection: "À appeler",
          sourceLead: lead.source,
          notesProspection: lead.notes,
        });
        results.created++;
      }
    }

    // Rate limiting
    await delay(200);
  }

  return results;
}
```

---

## Routes et navigation

### Nouvelle route

| Route | Page | Description |
|-------|------|-------------|
| `/prospection` | ProspectionPage | Liste des leads et import |

### Mise à jour sidebar

Ajouter dans la navigation principale :

```
Dashboard
Prospection  ← NOUVEAU (entre Dashboard et Opportunités)
Opportunités
Projets
...
```

---

## Estimation

| Tâche | Effort |
|-------|--------|
| Champs Airtable (T2-Contacts) | 0.5h |
| Hook useProspects | 1h |
| Hook useImportLeads | 2h |
| Page /prospection | 2h |
| Composant LeadCard | 1h |
| Composant LeadImportDialog (3 étapes) | 3h |
| Composant CallResultDialog | 1h |
| Composant ProspectionKPIs | 1h |
| Hook useConvertToOpportunity | 1h |
| Intégration création Interaction | 1h |
| Tests et ajustements | 1.5h |
| **Total** | **~15h** |

---

## Dépendances

### Librairies existantes (déjà installées)

- `papaparse` : Parsing CSV
- `xlsx` : Support fichiers Excel
- `react-hook-form` + `zod` : Formulaires et validation
- `@tanstack/react-query` : Gestion des requêtes

### Modifications Airtable requises

Avant de coder, créer manuellement dans Airtable :

1. **T2-Contacts** : Ajouter les 4 champs
   - `Statut Prospection` (Single Select)
   - `Date Rappel` (Date)
   - `Source Lead` (Single Select)
   - `Notes Prospection` (Long Text)

---

## Critères de succès

| Métrique | Cible |
|----------|-------|
| Import 100 leads | < 60 secondes |
| Temps création opportunité depuis lead | < 15 secondes |
| Dédoublonnage | 100% par email |
| Mobile responsive | Fonctionnel sur 375px |

---

---

## Phase 7 : Intégration Google Calendar (IMPLEMENTÉE)

### US-006: Planifier un RDV depuis le CallResultDialog (P1)

**En tant que** commercial
**Je veux** planifier un RDV Google Calendar directement depuis le dialog d'appel
**Afin de** ne pas basculer entre plusieurs outils

#### Acceptance Criteria

1. **Given** l'utilisateur ouvre le CallResultDialog, **When** il clique sur l'onglet "Agenda", **Then** il voit son calendrier Google de la semaine
2. **Given** l'utilisateur n'est pas connecté à Google, **When** il accède à l'onglet Agenda, **Then** il voit un bouton "Connecter Google Calendar"
3. **Given** l'utilisateur est connecté, **When** il clique sur "Créer un RDV", **Then** le formulaire est pré-rempli avec les infos du lead
4. **Given** l'utilisateur sélectionne "RDV planifié" dans l'onglet Résultat, **When** il enregistre, **Then** les notes et la checkbox interaction sont masquées (infos déjà dans le calendar)

### Architecture technique

#### Stack Authentication

| Technologie | Usage |
|-------------|-------|
| **NextAuth.js v5** | OAuth2 avec Google, gestion tokens |
| **JWT Server-side** | Stockage sécurisé des tokens |
| **React Query** | Cache et mutations |

#### Nouveaux fichiers

| Fichier | Description |
|---------|-------------|
| `src/lib/auth.ts` | Configuration NextAuth (Google provider + calendar scope) |
| `src/app/api/auth/[...nextauth]/route.ts` | Handler NextAuth |
| `src/app/api/calendar/events/route.ts` | API GET/POST events |
| `src/providers/session-provider.tsx` | SessionProvider wrapper |
| `src/hooks/use-google-calendar.ts` | Hooks React Query (useCalendarEvents, useCreateCalendarEvent) |
| `src/components/prospection/agenda/` | Composants UI (AgendaTab, WeekCalendar, EventCard, CreateEventDialog, GoogleAuthButton) |

#### Variables d'environnement requises

```env
AUTH_SECRET=<openssl rand -base64 32>
AUTH_GOOGLE_ID=<Google OAuth Client ID>
AUTH_GOOGLE_SECRET=<Google OAuth Client Secret>
```

#### Pré-remplissage Event

```typescript
{
  summary: "RDV - {Prénom} {Nom} ({Entreprise})",
  description: `
    Email: {email}
    Tél: {telephone}
    Notes: {notesProspection}
    CRM: https://crm.axivity.com/prospection
  `,
  attendees: [{ email: "{email}" }],
  start: { dateTime: "...", timeZone: "Europe/Paris" },
  end: { dateTime: "...", timeZone: "Europe/Paris" }
}
```

### Comportement "RDV planifié"

Quand l'utilisateur sélectionne "RDV planifié" dans l'onglet Résultat :
- **Notes** : Champ masqué (infos déjà dans le calendar event)
- **Checkbox "Créer une interaction"** : Masquée et décochée automatiquement
- **Statut prospect** : Mis à jour vers "RDV planifié"

Cela évite les doublons entre les détails du RDV (dans Google Calendar) et les notes/interactions du CRM.

---

*Spec créée le 15 décembre 2025*
*Mise à jour : 15 décembre 2025 (Phase 7 Google Calendar)*
*Version : 1.1*
