# Feature Specification: Lifecycle Model Evolution

**Feature Branch**: `009-lifecycle-model`
**Created**: 2026-01-20
**Updated**: 2026-01-28
**Status**: In Progress (Phase 1-3 Complete, 62%)
**Priority**: P2 - Medium (Evolution structurelle)

---

## Roles utilisateur (reference)

Les User Stories utilisent les roles existants du CRM Axivity :

| Role | Description | Acces |
|------|-------------|-------|
| `admin` | Administrateur | Acces total, dashboard, configuration |
| `developpeur_nocode` | Developpeur NoCode | Projets, taches |
| `developpeur_automatisme` | Developpeur Automatisme | Projets, taches, workflows |
| `commercial` | Commercial | Pipeline, prospection, opportunites |
| `client` | Client externe | Portail client (lecture seule) |

---

## Contexte

### Probleme actuel

Le CRM Axivity utilise actuellement un modele simplifie pour la gestion des prospects et opportunites :

```
Prospect (Contact avec statut_prospection)
    |
    v  [Conversion = disparition du prospect]
Opportunite (1:1 avec Contact via contact_id)
```

**Limitations identifiees** :

1. **Relation 1:1** : Un contact ne peut avoir qu'une seule opportunite active (la conversion le fait disparaitre)
2. **Pas de lifecycle stages** : Le statut du contact est binaire (prospect ou qualifie), pas de suivi granulaire
3. **Perte de visibilite** : Les prospects convertis disparaissent de la liste, impossible de les recontacter pour de nouvelles opportunites
4. **Pas de multi-contacts par deal** : Une opportunite ne peut impliquer qu'un seul contact decisionnaire

### Modele de reference : HubSpot CRM

HubSpot utilise un modele plus sophistique :

| Concept | HubSpot | CRM Axivity (actuel) |
|---------|---------|----------------------|
| Contact → Deal | N:N (plusieurs deals par contact) | 1:1 (via conversion) |
| Deal → Contacts | N:N (plusieurs contacts par deal) | 1:1 (contact_id unique) |
| Lifecycle Stage | 8 etapes (Lead → Customer) | Statut binaire |
| Visibilite post-conversion | Contact reste visible | Contact disparait |

### Solution proposee

Evoluer vers un modele inspire de HubSpot avec :

1. **Lifecycle Stages** sur les contacts (Lead → MQL → SQL → Opportunity → Customer)
2. **Relations N:N** entre contacts et opportunites
3. **Contacts toujours visibles** quel que soit leur lifecycle stage
4. **Multi-deals par contact** explicitement supporte

---

## Architecture des donnees

### Phase 1 : Lifecycle Stages (Contacts)

#### Nouveau champ : `lifecycle_stage`

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `lifecycle_stage` | ENUM | Lead, MQL, SQL, Opportunity, Customer, Evangelist, Churned | Etape du cycle de vie |

#### Mapping des etapes

```
Lead           → Contact importe, jamais contacte
     ↓
MQL            → Marketing Qualified Lead (a interagi avec du contenu)
     ↓
SQL            → Sales Qualified Lead (contacte par un commercial)
     ↓
Opportunity    → Au moins une opportunite active liee
     ↓
Customer       → Au moins une opportunite "Gagne" liee
     ↓
Evangelist     → Client satisfait, potentiel ambassadeur
     |
Churned        → Client perdu (tous deals fermes sans succes)
```

#### Cohabitation avec `statut_prospection`

| Champ existant | Usage | Maintenu ? |
|----------------|-------|------------|
| `statut_prospection` | Suivi tactique des appels (A appeler, Rappeler, etc.) | Oui |
| `lifecycle_stage` | Position strategique dans le funnel | Nouveau |

Les deux champs coexistent :
- `lifecycle_stage` = position macro (ou en est le contact dans le funnel global)
- `statut_prospection` = statut micro (quand est le prochain appel)

### Phase 2 : Relations N:N (Contacts ↔ Opportunites)

#### Nouvelle table pivot : `opportunite_contacts`

```sql
CREATE TABLE opportunite_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunite_id UUID REFERENCES opportunites(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'Participant', -- Decideur, Influenceur, Utilisateur, Participant
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(opportunite_id, contact_id)
);
```

#### Roles des contacts dans un deal

| Role | Description |
|------|-------------|
| Decideur | Pouvoir de decision final |
| Influenceur | Recommande mais ne decide pas |
| Utilisateur | Utilisera le produit/service |
| Participant | Implique sans role specifique |

### Phase 3 : Automatisations Lifecycle

#### Regles de transition automatique

| Evenement | Transition lifecycle_stage |
|-----------|----------------------------|
| Contact cree via import | → Lead |
| Premier appel effectue | → SQL (si etait Lead ou MQL) |
| Opportunite creee et liee | → Opportunity |
| Opportunite passee a "Gagne" | → Customer |
| Toutes opportunites fermees sans succes | → Churned (si etait Customer) |

#### Protection contre le downgrade

Comme HubSpot, le lifecycle_stage ne devrait jamais regresser automatiquement :
- Customer ne redevient jamais SQL
- Exception : Churned (regression explicite apres analyse)

---

## User Stories

### US-001: Affichage du Lifecycle Stage (P1)

**En tant que** commercial
**Je veux** voir le lifecycle stage de chaque contact
**Afin de** comprendre ou il en est dans le funnel global

#### Acceptance Criteria

1. **Given** un contact est affiche (LeadCard, Fiche Client), **When** je le consulte, **Then** je vois son lifecycle stage avec un badge colore
2. **Given** je filtre les contacts, **When** je selectionne un lifecycle stage, **Then** seuls les contacts de cette etape s'affichent
3. **Given** un contact est au stage "Customer", **When** je le vois dans la prospection, **Then** il reste visible avec son statut

#### Badge colors

| Stage | Couleur | Icone |
|-------|---------|-------|
| Lead | Gray | UserPlus |
| MQL | Blue | Target |
| SQL | Indigo | Phone |
| Opportunity | Purple | TrendingUp |
| Customer | Green | CheckCircle |
| Evangelist | Gold | Star |
| Churned | Red | XCircle |

---

### US-002: Transition manuelle du Lifecycle Stage (P1)

**En tant que** commercial
**Je veux** pouvoir changer manuellement le lifecycle stage
**Afin de** corriger les erreurs ou gerer des cas speciaux

#### Acceptance Criteria

1. **Given** je consulte un contact, **When** je clique sur le badge lifecycle, **Then** un dropdown me permet de changer l'etape
2. **Given** je tente de regresser un Customer vers Lead, **When** je valide, **Then** un warning me demande confirmation
3. **Given** je change le lifecycle stage, **When** la modification est enregistree, **Then** une interaction de type "Changement de statut" est creee

---

### US-003: Multi-contacts par Opportunite (P2)

**En tant que** commercial
**Je veux** associer plusieurs contacts a une opportunite
**Afin de** suivre tous les decideurs impliques dans un deal

#### Acceptance Criteria

1. **Given** je consulte une opportunite, **When** je vais dans l'onglet Contacts, **Then** je vois la liste des contacts associes avec leurs roles
2. **Given** je veux ajouter un contact, **When** je clique "Ajouter un contact", **Then** je peux rechercher et selectionner un contact existant
3. **Given** j'ajoute un contact, **When** je le selectionne, **Then** je dois choisir son role (Decideur, Influenceur, etc.)
4. **Given** une opportunite a plusieurs contacts, **When** un contact est marque "is_primary", **Then** il apparait en premier et avec un badge "Principal"

---

### US-004: Multi-opportunites par Contact (P2)

**En tant que** commercial
**Je veux** qu'un contact puisse avoir plusieurs opportunites
**Afin de** suivre plusieurs projets avec le meme interlocuteur

#### Acceptance Criteria

1. **Given** je consulte un contact, **When** je vais dans l'onglet Opportunites, **Then** je vois toutes ses opportunites (actives et fermees)
2. **Given** un contact a deja une opportunite active, **When** je cree une nouvelle opportunite, **Then** elle est creee sans erreur
3. **Given** un contact a 3 opportunites, **When** je consulte sa fiche, **Then** je vois un resume : "2 actives, 1 gagnee"

---

### US-005: Conversion Prospect → Opportunite (evolution) (P1)

**En tant que** commercial
**Je veux** que la conversion d'un prospect cree une opportunite sans le faire disparaitre
**Afin de** pouvoir creer d'autres opportunites avec lui plus tard

#### Acceptance Criteria

1. **Given** je convertis un prospect, **When** l'opportunite est creee, **Then** le contact passe en lifecycle_stage "Opportunity"
2. **Given** le contact est converti, **When** je retourne sur la page prospection, **Then** le contact reste visible avec son nouveau stage
3. **Given** je veux creer une 2eme opportunite pour le meme contact, **When** je clique "Nouvelle opportunite", **Then** je peux le faire depuis sa fiche

#### Changement de comportement

| Aspect | Avant | Apres |
|--------|-------|-------|
| Statut apres conversion | "Qualifie" (disparait des filtres) | lifecycle_stage = "Opportunity" |
| Visibilite prospection | Disparait | Reste visible avec badge "Opportunity" |
| Lien Contact-Opportunite | contact_id unique | Table pivot N:N |

---

### US-006: Dashboard Funnel Lifecycle (P2)

**En tant que** admin
**Je veux** voir la repartition des contacts par lifecycle stage
**Afin de** piloter la sante du pipeline global

#### Acceptance Criteria

1. **Given** j'accede au Dashboard, **When** je consulte le widget "Funnel Lifecycle", **Then** je vois un graphique en entonnoir
2. **Given** le funnel est affiche, **When** je clique sur une etape, **Then** je suis redirige vers la liste filtree par cette etape

#### Metriques du funnel

| Metrique | Calcul |
|----------|--------|
| Taux Lead → SQL | COUNT(SQL) / COUNT(Lead) * 100 |
| Taux SQL → Opportunity | COUNT(Opportunity) / COUNT(SQL) * 100 |
| Taux Opportunity → Customer | COUNT(Customer) / COUNT(Opportunity) * 100 |
| Cycle moyen Lead → Customer | AVG(customer_date - created_at) |

---

## Specifications techniques

### Migration SQL

```sql
-- Migration 24_lifecycle_stages.sql

-- 1. Ajouter l'enum lifecycle_stage
CREATE TYPE lifecycle_stage_enum AS ENUM (
  'Lead',
  'MQL',
  'SQL',
  'Opportunity',
  'Customer',
  'Evangelist',
  'Churned'
);

-- 2. Ajouter la colonne aux contacts
ALTER TABLE contacts
ADD COLUMN lifecycle_stage lifecycle_stage_enum DEFAULT 'Lead';

-- 3. Ajouter la date de transition
ALTER TABLE contacts
ADD COLUMN lifecycle_stage_changed_at TIMESTAMPTZ DEFAULT now();

-- 4. Migrer les donnees existantes
UPDATE contacts
SET lifecycle_stage = CASE
  WHEN statut_prospection = 'Qualifie' THEN 'Opportunity'::lifecycle_stage_enum
  WHEN statut_prospection IN ('A appeler', 'Appele - pas repondu', 'Rappeler') THEN 'SQL'::lifecycle_stage_enum
  WHEN statut_prospection = 'RDV planifie' THEN 'SQL'::lifecycle_stage_enum
  WHEN statut_prospection IN ('Non qualifie', 'Perdu') THEN 'Lead'::lifecycle_stage_enum
  ELSE 'Lead'::lifecycle_stage_enum
END;

-- 5. Creer la table pivot opportunite_contacts
CREATE TABLE opportunite_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunite_id UUID NOT NULL REFERENCES opportunites(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'Participant' CHECK (role IN ('Decideur', 'Influenceur', 'Utilisateur', 'Participant')),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(opportunite_id, contact_id)
);

-- 6. Migrer les liens existants (contact_id dans opportunites)
INSERT INTO opportunite_contacts (opportunite_id, contact_id, role, is_primary)
SELECT id, contact_id, 'Decideur', true
FROM opportunites
WHERE contact_id IS NOT NULL;

-- 7. Index pour performance
CREATE INDEX idx_opportunite_contacts_opportunite ON opportunite_contacts(opportunite_id);
CREATE INDEX idx_opportunite_contacts_contact ON opportunite_contacts(contact_id);
CREATE INDEX idx_contacts_lifecycle_stage ON contacts(lifecycle_stage);

-- 8. Trigger pour mettre a jour lifecycle_stage_changed_at
CREATE OR REPLACE FUNCTION update_lifecycle_stage_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.lifecycle_stage IS DISTINCT FROM NEW.lifecycle_stage THEN
    NEW.lifecycle_stage_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lifecycle_stage_changed
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_lifecycle_stage_changed_at();
```

### Nouveaux types TypeScript

```typescript
// src/types/index.ts

export type LifecycleStage =
  | "Lead"
  | "MQL"
  | "SQL"
  | "Opportunity"
  | "Customer"
  | "Evangelist"
  | "Churned";

export type ContactRole =
  | "Decideur"
  | "Influenceur"
  | "Utilisateur"
  | "Participant";

export interface OpportuniteContact {
  id: string;
  opportuniteId: string;
  contactId: string;
  role: ContactRole;
  isPrimary: boolean;
  createdAt: string;
  // Relations chargees
  contact?: Contact;
  opportunite?: Opportunite;
}

export interface Contact {
  // ... champs existants
  lifecycleStage: LifecycleStage;
  lifecycleStageChangedAt: string;
  // Relation N:N
  opportuniteContacts?: OpportuniteContact[];
}
```

### Nouveaux hooks

#### `use-lifecycle-stage.ts` ✅ IMPLEMENTED

| Hook/Function | Description |
|---------------|-------------|
| `useUpdateLifecycleStage` | Met a jour le lifecycle_stage d'un contact (avec protection downgrade) |
| `useBatchUpdateLifecycleStage` | Met a jour plusieurs contacts en batch |
| `isLifecycleDowngrade()` | Verifie si une transition est un retrogradage |
| `getNextLifecycleStage()` | Retourne le prochain stage suggere |

#### `use-opportunite-contacts.ts` ✅ IMPLEMENTED

| Hook | Description |
|------|-------------|
| `useOpportuniteContacts` | Liste les contacts lies a une opportunite (avec details) |
| `useContactOpportunites` | Liste les opportunites d'un contact (avec details) |
| `useAddContactToOpportunite` | Ajoute un contact avec role |
| `useUpdateOpportuniteContact` | Modifie role/isPrimary |
| `useRemoveContactFromOpportunite` | Supprime un contact de l'opportunite |
| `useSetPrimaryContact` | Definit le contact principal |
| `useContactOpportunitySummary` | Resume stats (active, won, lost, total value) |

#### A implementer (Phase 7)

| Hook | Description |
|------|-------------|
| `useLifecycleFunnel` | Statistiques du funnel (taux conversion, cycle moyen) |

### Nouveaux composants

| Composant | Chemin | Description |
|-----------|--------|-------------|
| `LifecycleStageBadge` | `src/components/shared/` | Badge colore avec icone |
| `LifecycleStageSelect` | `src/components/shared/` | Dropdown de selection |
| `OpportunityContactsTab` | `src/components/opportunites/tabs/` | Onglet contacts dans OpportunityMiniSheet |
| `ContactOpportunitiesTab` | `src/components/clients/tabs/` | Onglet opportunites dans fiche contact |
| `LifecycleFunnelChart` | `src/components/charts/` | Graphique en entonnoir |

### Modifications des hooks existants

#### `use-convert-opportunity.ts`

```typescript
// AVANT
await supabase
  .from("contacts")
  .update({ statut_prospection: "Qualifie" })
  .eq("id", contactId);

// APRES
await supabase
  .from("contacts")
  .update({
    lifecycle_stage: "Opportunity",
    // statut_prospection reste inchange pour l'historique
  })
  .eq("id", contactId);

// Creer le lien N:N
await supabase
  .from("opportunite_contacts")
  .insert({
    opportunite_id: opportunity.id,
    contact_id: contactId,
    role: "Decideur",
    is_primary: true,
  });
```

#### `use-prospects.ts`

```typescript
// AVANT : filtre sur statut_prospection != 'Qualifie'
// APRES : pas de filtre sur lifecycle_stage, tous les contacts sont visibles

// Le filtre "A prospecter" utilise maintenant :
.in("lifecycle_stage", ["Lead", "MQL", "SQL"])
.neq("statut_prospection", "Qualifie") // Pour compatibilite
```

---

## Plan de migration

### Phase 1 : Infrastructure (sans breaking change)

1. Migration SQL (ajouter colonnes et table pivot)
2. Mapper les donnees existantes
3. Ajouter types TypeScript
4. Creer hooks de base (read-only)

**Risque** : Aucun (additif uniquement)

### Phase 2 : UI Lifecycle Stage

1. Ajouter `LifecycleStageBadge` aux LeadCard et fiches
2. Ajouter filtres par lifecycle_stage
3. Ajouter `LifecycleStageSelect` pour modification manuelle

**Risque** : Faible (nouveau UI sans casser l'existant)

### Phase 3 : Conversion et liens N:N

1. Modifier `useConvertToOpportunity` pour utiliser la table pivot
2. Ajouter onglet "Contacts" dans OpportunityMiniSheet
3. Ajouter onglet "Opportunites" dans fiche Contact

**Risque** : Moyen (modification du flux de conversion)

### Phase 4 : Dashboard et automatisations

1. Widget Funnel Lifecycle sur Dashboard
2. Automatisations lifecycle (triggers Supabase ou N8N)
3. Deprecation progressive de `contact_id` dans opportunites

**Risque** : Faible

---

## Retrocompatibilite

### Champs depreces (mais maintenus)

| Champ | Table | Statut |
|-------|-------|--------|
| `contact_id` | opportunites | Maintenu pour compatibilite, mais `opportunite_contacts.is_primary` fait foi |
| `statut_prospection` = "Qualifie" | contacts | Maintenu, mais `lifecycle_stage` fait foi |

### Double-ecriture

Pendant la transition, les modifications ecrivent dans les deux systemes :
- Mise a jour `contact_id` ET `opportunite_contacts`
- Mise a jour `statut_prospection` ET `lifecycle_stage`

---

## Criteres de succes

| Metrique | Cible |
|----------|-------|
| Migration des donnees existantes | 100% sans perte |
| Contacts avec lifecycle_stage | 100% |
| Opportunites avec au moins 1 contact lie (N:N) | 100% |
| Temps de chargement liste contacts | < 500ms |
| Tests unitaires nouveaux hooks | > 80% couverture |

---

## Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Confusion UX (2 systemes de statut) | Moyen | Documentation claire, tooltips explicatifs |
| Performance (table pivot) | Faible | Index, eager loading |
| Donnees incoherentes (migration) | Moyen | Script de verification post-migration |
| Regression conversion prospect | Haut | Tests E2E sur le flux de conversion |

---

*Specification creee le 20 janvier 2026*
*Inspiree du modele HubSpot CRM*
*Version : 1.0*
