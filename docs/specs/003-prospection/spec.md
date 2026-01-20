# Feature Specification: Module Prospection

**Feature Branch**: `003-prospection`
**Created**: 2025-12-15
**Updated**: 2025-12-19
**Status**: Implemented (Phase 11 - UI Improvements completed)
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

### Tables Supabase impactées

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

### API Supabase - Batch Import

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
| Champs Supabase (T2-Contacts) | 0.5h |
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

### Modifications Supabase requises

Avant de coder, créer manuellement dans Supabase :

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

## Phase 8 : Email de suivi Gmail (IMPLEMENTÉE)

### US-007: Envoyer un email de suivi après "Pas répondu" (P1)

**En tant que** commercial
**Je veux** envoyer un email de suivi directement depuis la plateforme après un appel sans réponse
**Afin de** maximiser mes chances de contact sans quitter le CRM

#### Acceptance Criteria

1. **Given** l'utilisateur sélectionne "Pas répondu" dans le CallResultDialog, **When** il voit les options, **Then** il peut indiquer s'il a laissé un message vocal
2. **Given** l'utilisateur a sélectionné "Pas répondu", **When** il active "Envoyer un email de suivi", **Then** un composeur d'email apparaît avec un template pré-rempli
3. **Given** le composeur d'email est affiché, **When** l'utilisateur clique "Envoyer", **Then** l'email est envoyé via Gmail API et une interaction de type "Email" est créée automatiquement
4. **Given** un email a été envoyé, **When** l'utilisateur consulte l'onglet Historique, **Then** il peut relire le contenu complet de l'email (objet, destinataire, corps)
5. **Given** l'utilisateur a envoyé un email, **When** il clique "Enregistrer", **Then** le résumé des actions affiche correctement ce qui a été fait (voicemail, email)

### Architecture technique

#### Gmail API Integration

| Élément | Description |
|---------|-------------|
| **Scope OAuth** | `https://www.googleapis.com/auth/gmail.send` ajouté à NextAuth |
| **Endpoint** | `POST /api/gmail/send` |
| **Encoding** | RFC 2822 format, base64url pour Gmail API |

#### Nouveaux fichiers

| Fichier | Description |
|---------|-------------|
| `src/app/api/gmail/send/route.ts` | API route pour envoyer des emails via Gmail |
| `src/hooks/use-gmail.ts` | Hook `useSendEmail` + fonction `generateFollowUpEmail` |
| `src/components/prospection/EmailComposer.tsx` | Composant UI de composition d'email |
| `src/components/ui/switch.tsx` | Composant Switch (shadcn/ui) |

#### Composant EmailComposer

```typescript
interface EmailComposerProps {
  prospectEmail: string;
  prospectPrenom?: string;
  prospectNom: string;
  entreprise?: string;
  leftVoicemail?: boolean;
  onEmailSent?: (data: EmailSentData) => void;
  onCancel?: () => void;
}

interface EmailSentData {
  messageId: string;
  to: string;
  subject: string;
  body: string;
}
```

#### Template email pré-rempli

```
Objet: Suite à mon appel - {Entreprise}

Bonjour {Prénom},

Je viens d'essayer de vous joindre par téléphone sans succès.
{Si voicemail: "Je vous ai également laissé un message vocal."}

Je souhaitais échanger avec vous au sujet de nos solutions d'intelligence artificielle...

Cordialement,
L'équipe Axivity
```

### Stockage de l'email dans l'historique

Quand un email est envoyé, une interaction de type "Email" est créée automatiquement avec :

```
📧 OBJET: {subject}

📬 DESTINATAIRE: {to}

📝 CONTENU:
{body complet}
```

### Affichage dans l'onglet Historique

Les interactions de type "Email" ont un style distinct :
- **Fond** : bleu clair (`bg-blue-50/30`)
- **Bordure** : bleu (`border-blue-200`)
- **Badge** : "Email" en bleu
- **Icône** : Mail au lieu de MessageSquare
- **Contenu** : Zone blanche avec le texte complet de l'email

### Résumé des actions "Pas répondu"

Box bleue affichant dynamiquement :
- ✓ Message vocal laissé (si activé)
- ✓ Email de suivi envoyé (si envoyé)

Message de prévisualisation de l'interaction mis à jour en temps réel.

---

## Phase 9 : Champs de facturation Clients (IMPLEMENTÉE)

### US-008: Importer et afficher les informations de facturation (P1)

**En tant que** commercial
**Je veux** importer et stocker les informations de facturation des entreprises
**Afin de** générer des devis et factures conformes sans ressaisie

#### Acceptance Criteria

1. **Given** l'utilisateur importe un CSV, **When** il mappe les colonnes, **Then** il peut mapper SIRET, Adresse, Code Postal, Ville, Pays vers les champs clients
2. **Given** l'utilisateur ouvre un CallResultDialog, **When** il consulte l'onglet "Entreprise", **Then** il voit le SIRET et l'adresse complète
3. **Given** un client existant est importé avec de nouvelles infos, **When** l'import se termine, **Then** les champs de facturation sont mis à jour

### Nouveaux champs Supabase (T1-Clients)

| Champ | Type | Field ID | Description |
|-------|------|----------|-------------|
| `SIRET` | Single Line Text | fldZgaJF1qX8ET6rB | Numéro SIRET (14 chiffres) |
| `Adresse` | Single Line Text | fldqMSAyY8HpixRYR | Adresse postale |
| `Code Postal` | Single Line Text | fldCiJH5siBzOG76C | Code postal |
| `Ville` | Single Line Text | fldjqFUUbbdu6qBIy | Ville |
| `Pays` | Single Line Text | flddcrsO7cVZDECMi | Pays (défaut: France) |

### Mapping CSV étendu

Le mapping CSV supporte maintenant 17 champs :

**Champs Client (7):**
- Entreprise* (obligatoire)
- SIRET
- Adresse
- Code Postal
- Ville
- Pays
- Secteur d'activité
- Site Web

**Champs Contact (8):**
- Nom Complet* (obligatoire)
- Email* (obligatoire)
- Téléphone
- Rôle / Poste
- LinkedIn
- Source Lead
- Notes Prospection

### Fichier modèle CSV

Un fichier `modele_import_leads.csv` est disponible à la racine du projet Interface avec les colonnes :

```csv
Entreprise,SIRET,Adresse,Code Postal,Ville,Pays,Secteur activite,Site Web,Nom Complet,Email,Telephone,Role,LinkedIn,Source Lead,Notes Prospection
```

### Affichage dans CallResultDialog

L'onglet "Entreprise" affiche maintenant :
- Nom de l'entreprise
- **SIRET** (nouveau)
- Secteur d'activité
- Site web
- **Adresse complète** (nouveau) : Adresse, CP Ville, Pays (si différent de France)
- CA Total, Santé client, etc.

---

## Phase 10 : UX Améliorée LeadCard et Sidebar (IMPLEMENTÉE)

### US-009: Bouton d'action dynamique selon statut (P1)

**En tant que** commercial
**Je veux** voir un bouton d'action adapté au statut du lead
**Afin de** savoir immédiatement quelle est la prochaine action à effectuer

#### Acceptance Criteria

1. **Given** un lead avec statut "À appeler", **When** la carte s'affiche, **Then** le bouton principal dit "Appeler" avec icône téléphone
2. **Given** un lead avec statut "Rappeler", **When** la carte s'affiche, **Then** le bouton principal dit "Rappeler" avec icône téléphone sortant
3. **Given** un lead avec statut "RDV planifié", **When** la carte s'affiche, **Then** le bouton principal dit "Voir RDV" avec icône calendrier
4. **Given** un lead avec statut "Qualifié", **When** la carte s'affiche, **Then** le bouton principal dit "Convertir" avec icône flèche

### Mapping bouton dynamique

| Statut | Label | Icône | Variant |
|--------|-------|-------|---------|
| À appeler | "Appeler" | Phone | default |
| Appelé - pas répondu | "Rappeler" | PhoneCall | default |
| Rappeler | "Rappeler" | PhoneCall | default |
| RDV planifié | "Voir RDV" | Calendar | secondary |
| Qualifié | "Convertir" | ArrowRight | default |
| Non qualifié | "Voir fiche" | FileText | outline |
| Perdu | "Voir fiche" | FileText | outline |

### Simplifications UX

#### Suppression du bouton "Qualifier" sur LeadCard

Le bouton vert avec icône check à côté du bouton principal a été supprimé car :
- La qualification se fait dans le CallResultDialog (onglet Résultat)
- Le flow complet est : sélectionner "Qualifié" → Remplir notes → Cliquer "Convertir en Opportunité"
- Avoir un raccourci direct créait de la confusion

#### Suppression du formulaire OpportuniteForm de la page

Le dialog `OpportuniteForm` qui s'ouvrait depuis la page a été supprimé car :
- Jamais ouvert (le trigger `handleQualify` avait déjà été supprimé)
- Code mort : `opportunityDialogOpen`, `handleOpportunitySuccess`, `opportunityInitialData`
- La conversion se fait désormais exclusivement via le bouton "Convertir en Opportunité" dans CallResultDialog

#### Header CallResultDialog simplifié

- **Avant** : "Appel - {Prénom} {Nom}" avec icône Phone
- **Après** : "{Prénom} {Nom}" avec icône User

Plus représentatif car le dialog est une fiche lead complète (pas juste un appel).

### Logo Axivity dans la Sidebar

Le logo Axivity a été ajouté à la sidebar :

| Avant | Après |
|-------|-------|
| "A" (badge) + "CRM Axivity" (texte) | Logo `logo-axivity.png` |

#### Structure fichiers

```
public/
└── images/
    └── logo-axivity.png
```

#### Implémentation

```tsx
// Sidebar.tsx
import Image from "next/image";

<Image
  src="/images/logo-axivity.png"
  alt="Axivity"
  width={160}
  height={48}
  className="h-10 w-auto"
  priority
/>
```

---

## Phase 11 : UI Improvements (IMPLEMENTÉE)

### US-010: Améliorer l'UX de la page Prospection (P2)

**En tant que** commercial
**Je veux** une interface fluide sans scroll inutile
**Afin de** naviguer efficacement entre les leads

#### Acceptance Criteria

1. **Given** l'utilisateur ouvre le CallResultDialog, **When** le modal s'affiche, **Then** il n'y a pas de scroll sur la page entière (modal en flexbox)
2. **Given** l'utilisateur consulte la liste des leads, **When** les LeadCards s'affichent, **Then** tous les boutons d'action sont alignés verticalement
3. **Given** l'utilisateur sélectionne "Tous les statuts", **When** la liste se met à jour, **Then** tous les prospects sont affichés (y compris Qualifié, Non qualifié, Perdu)
4. **Given** l'utilisateur veut fermer le dialog, **When** il cherche la croix, **Then** elle est clairement visible et pas superposée à d'autres éléments

### Améliorations techniques

#### CallResultDialog Flexbox Layout

Le modal utilise maintenant un layout flexbox qui évite le scroll de la page :

```tsx
<DialogContent className="sm:max-w-[750px] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
  <div className="shrink-0 p-6 pb-4 pr-14 border-b">
    {/* Header avec padding pour la croix */}
  </div>
  <Tabs className="flex-1 flex flex-col overflow-hidden">
    <TabsList className="shrink-0" />
    <TabsContent className="flex-1 overflow-y-auto" />
  </Tabs>
</DialogContent>
```

#### LeadCard Button Alignment

Les boutons sont maintenant alignés grâce à flexbox :

```tsx
<Card className="h-full flex flex-col">
  <CardContent className="p-4 flex flex-col flex-1">
    {/* Contenu */}
    <div className="flex-1" /> {/* Spacer */}
    <Button className="mt-auto">Action</Button>
  </CardContent>
</Card>
```

#### Filter Fix

Le bug de filtre a été corrigé dans `useProspectsWithClients` :

**Avant (buggy):**
```typescript
enabled: !!prospects && prospects.length > 0,
placeholderData: keepPreviousData,
```

**Après (fixé):**
```typescript
enabled: !prospectsLoading && prospects !== undefined,
// keepPreviousData retiré
```

La page n'applique plus de filtre sur "Tous les statuts" :
```typescript
const activeProspects = useMemo(() => {
  if (!prospects) return [];
  return prospects; // Tous les prospects, sans filtre
}, [prospects]);
```

### Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/components/prospection/CallResultDialog.tsx` | Layout flexbox, header padding |
| `src/components/prospection/LeadCard.tsx` | Flexbox alignment pour boutons |
| `src/hooks/use-prospects.ts` | Fix condition enabled, retrait keepPreviousData |
| `src/app/(main)/prospection/page.tsx` | Suppression filtre "Tous les statuts" |

---

*Spec créée le 15 décembre 2025*
*Mise à jour : 19 décembre 2025 (Phase 11 UI Improvements)*
*Version : 1.5*
