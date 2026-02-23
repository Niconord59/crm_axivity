# Feature Specification: Filtrage Clients Réels

**Feature Branch**: `010-clients-filtering`
**Created**: 2026-01-29
**Updated**: 2026-01-29
**Status**: Completed
**Priority**: P2 - Medium (Amélioration UX)

---

## Roles utilisateur (reference)

Les User Stories utilisent les roles existants du CRM Axivity (definis dans `supabase/migrations/11_update_user_roles.sql`) :

| Role | Label UI | Description |
|------|----------|-------------|
| `admin` | Admin | Acces total, gestion des profils et utilisateurs |
| `developpeur_nocode` | Developpeur NoCode | Lecture + modification taches assignees |
| `developpeur_automatisme` | Developpeur Automatisme | Lecture + modification taches assignees |
| `commercial` | Commercial | Pipeline, prospection, ses clients (owner_id) |
| `client` | Client | Portail client (lecture seule) |

---

## Contexte

### Probleme actuel

La page `/clients` affiche actuellement **tous les comptes** de la base de donnees, incluant :

1. **Prospects** : Contacts/entreprises jamais convertis
2. **Clients en cours** : Devis envoye mais pas encore paye
3. **Clients reels** : Au moins une facture payee

**Besoin metier** : L'utilisateur veut pouvoir filtrer pour ne voir que les **clients reels** (ceux avec qui Axivity a deja realise une prestation payee).

### Definition metier : Qu'est-ce qu'un "Client Reel" ?

Selon le cycle de vie Axivity :

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PROSPECT   │ →  │    DEVIS     │ →  │    DEVIS     │ →  │   FACTURE    │ →  │   CLIENT     │
│   (Lead)     │    │    ENVOYÉ    │    │   ACCEPTÉ    │    │    PAYÉE     │    │    RÉEL      │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

**Critere de definition** : Un client reel est une entreprise/contact pour lequel **au moins une facture a le statut "Payee"**.

> Note : `caTotal > 0` n'est pas suffisant car il peut inclure des factures envoyees mais non payees.

---

## Solution proposee

### Approche retenue : Calcul Frontend (Option A)

Apres analyse des options (voir section Architecture), l'approche retenue est :

1. **Calcul cote frontend** : Croiser les donnees `clients` et `factures`
2. **Toggle UI explicite** : L'utilisateur choisit d'activer le filtre
3. **Pas de modification backend** : Pas de migration SQL, pas de nouveau champ

Cette approche est :
- **Rapide a implementer** (~2h)
- **Sans risque** (pas de modification du modele de donnees)
- **Evolutive** (peut migrer vers un trigger DB si necessaire)

### Comportement attendu

| Etat du toggle | Clients affiches |
|----------------|------------------|
| Desactive (defaut) | Tous les clients (comportement actuel) |
| Active | Seulement les clients avec au moins 1 facture "Payee" |

---

## Architecture des donnees

### Tables impliquees

| Table | Champs utilises | Role |
|-------|-----------------|------|
| `clients` | `id`, `nom`, `statut`, etc. | Liste des clients |
| `factures` | `id`, `client_id`, `statut` | Verification paiement |

### Statuts factures existants

```typescript
// src/types/constants.ts
FACTURE_STATUSES = ["Brouillon", "Envoyée", "En retard", "Payée", "Annulée"]
```

### Logique de filtrage

```typescript
// Pseudo-code
const clientsWithPaidInvoice = new Set(
  factures
    .filter(f => f.statut === 'Payée')
    .map(f => f.clientId)
);

const isRealClient = (clientId: string) => clientsWithPaidInvoice.has(clientId);
```

---

## Options architecturales evaluees

### Option A : Calcul Frontend (RETENUE)

```typescript
// Dans la page clients
const { data: factures } = useFactures();
const paidClientIds = new Set(
  factures?.filter(f => f.statut === 'Payée').map(f => f.clientId)
);
```

| Avantages | Inconvenients |
|-----------|---------------|
| Pas de migration SQL | Requete factures supplementaire |
| Implementation rapide | Calcul a chaque chargement |
| Facilement reversible | Performance si beaucoup de factures |

### Option B : Colonne calculee SQL

```sql
ALTER TABLE clients ADD COLUMN has_paid_invoice BOOLEAN
  GENERATED ALWAYS AS (
    EXISTS (SELECT 1 FROM factures WHERE client_id = clients.id AND statut = 'Payée')
  ) STORED;
```

| Avantages | Inconvenients |
|-----------|---------------|
| Performance optimale | Migration SQL requise |
| Source de verite en DB | Complexite ajoutee |

### Option C : Trigger Supabase

```sql
CREATE TRIGGER update_client_has_invoice
AFTER INSERT OR UPDATE ON factures
FOR EACH ROW EXECUTE FUNCTION update_client_invoice_status();
```

| Avantages | Inconvenients |
|-----------|---------------|
| Temps reel | Logique metier en DB |
| Automatique | Maintenance triggers |

**Decision** : Option A pour la v1. Migration vers B ou C si problemes de performance.

---

## User Stories

### US-001: Filtrer les clients avec facture payee (P1)

**En tant que** admin ou commercial
**Je veux** filtrer la liste des clients pour voir uniquement ceux qui ont paye
**Afin de** me concentrer sur mes vrais clients et exclure les prospects

#### Acceptance Criteria

1. **Given** je suis sur la page `/clients`, **When** la page charge, **Then** je vois tous les clients (toggle desactive par defaut)
2. **Given** je vois le toggle "Clients factures uniquement", **When** je l'active, **Then** seuls les clients avec au moins 1 facture "Payee" s'affichent
3. **Given** le toggle est active, **When** je le desactive, **Then** tous les clients reapparaissent
4. **Given** le toggle est active, **When** j'applique d'autres filtres (secteur, statut), **Then** les filtres se combinent (AND)

#### Mockup UI

```
┌─────────────────────────────────────────────────────────────────┐
│  Clients                                           [Export] [+] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ☐ Afficher uniquement les clients facturés             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [🔍 Rechercher un client...]  [Secteur ▼]  [Statut ▼]         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Client A    │  │ Client B    │  │ Client C    │             │
│  │ Tech/IT     │  │ Finance     │  │ E-commerce  │             │
│  │ CA: 15 000€ │  │ CA: 8 500€  │  │ CA: 0€      │ ← Masque si │
│  └─────────────┘  └─────────────┘  └─────────────┘   toggle ON │
└─────────────────────────────────────────────────────────────────┘
```

---

### US-002: Indication visuelle du statut facturation (P2)

**En tant que** admin ou commercial
**Je veux** voir rapidement si un client a deja paye une facture
**Afin de** identifier les vrais clients sans activer le filtre

#### Acceptance Criteria

1. **Given** un client a au moins 1 facture "Payee", **When** je vois sa carte, **Then** un badge "Client" ou une icone specifique est visible
2. **Given** un client n'a aucune facture "Payee", **When** je vois sa carte, **Then** aucun badge supplementaire n'apparait

#### Badge propose

| Statut | Badge | Couleur |
|--------|-------|---------|
| Client facture | ✓ Client | Green |
| Prospect/Non facture | (aucun) | - |

---

### US-003: Compteur clients filtres (P3)

**En tant que** admin
**Je veux** voir le nombre de clients affiches vs total
**Afin de** comprendre la proportion de vrais clients

#### Acceptance Criteria

1. **Given** le toggle est active, **When** la liste est filtree, **Then** je vois "12 clients factures sur 45 total"

---

## Specifications techniques

### Modification de la page Clients

**Fichier** : `src/app/(main)/clients/page.tsx`

```typescript
// Ajout du hook useFactures
import { useFactures } from "@/hooks/use-factures";

// Nouvel etat pour le toggle
const [showOnlyPaidClients, setShowOnlyPaidClients] = useState(false);

// Calcul des clients avec facture payee
const { data: factures } = useFactures();

const paidClientIds = useMemo(() => {
  if (!factures) return new Set<string>();
  return new Set(
    factures
      .filter(f => f.statut === 'Payée')
      .map(f => f.clientId)
  );
}, [factures]);

// Ajout du filtre dans filteredClients
const filteredClients = clients?.filter((client) => {
  // Filtre toggle "clients factures"
  if (showOnlyPaidClients && !paidClientIds.has(client.id)) {
    return false;
  }
  // ... filtres existants (search, secteur, statut)
});
```

### Composant Toggle

**Composant Shadcn** : `Checkbox` ou `Switch`

```tsx
<div className="flex items-center space-x-2 mb-4">
  <Checkbox
    id="paid-clients-filter"
    checked={showOnlyPaidClients}
    onCheckedChange={(checked) => setShowOnlyPaidClients(!!checked)}
  />
  <label
    htmlFor="paid-clients-filter"
    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    Afficher uniquement les clients facturés
  </label>
</div>
```

### Badge Client (optionnel - US-002)

**Fichier** : `src/app/(main)/clients/page.tsx` (dans le rendu des cartes)

```tsx
{paidClientIds.has(client.id) && (
  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
    <CheckCircle className="h-3 w-3 mr-1" />
    Client
  </Badge>
)}
```

---

## Plan de migration

### Phase 1 : Implementation du toggle (sans breaking change)

1. Ajouter le hook `useFactures` dans la page
2. Calculer le Set des clients avec facture payee
3. Ajouter le toggle UI
4. Ajouter le filtre conditionnel

**Risque** : Aucun (additif uniquement)

### Phase 2 : Badge visuel (optionnel)

1. Ajouter le badge "Client" sur les cartes
2. Mettre a jour les styles

**Risque** : Faible (visuel uniquement)

### Phase 3 : Evolution vers backend (futur)

Si performance insuffisante :
1. Ajouter colonne `has_paid_invoice` en DB
2. Creer trigger de mise a jour automatique
3. Modifier le filtre pour utiliser cette colonne

---

## Criteres de succes

| Metrique | Cible |
|----------|-------|
| Toggle fonctionnel | ✓ |
| Filtrage correct (pas de faux positifs/negatifs) | 100% |
| Temps de chargement page | < 1s (avec factures) |
| Combinaison avec filtres existants | OK |

---

## Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Performance (beaucoup de factures) | Moyen | useMemo + evolution vers backend si besoin |
| Double requete (clients + factures) | Faible | Les deux hooks sont deja optimises React Query |
| Confusion UX ("pourquoi ce client disparait?") | Faible | Label explicite sur le toggle |

---

*Specification creee le 29 janvier 2026*
*Issue de la discussion Party Mode avec l'equipe BMAD*
*Version : 1.0*

---

## Review Notes

- Adversarial review completed
- Findings: 10 total, 5 fixed, 5 skipped (noise/optimization)
- Resolution approach: Auto-fix all real issues
- Fixes applied:
  - F1: Commentaire corrigé ("Payée" → "Payé")
  - F2: Loading state ajouté pour désactiver le toggle pendant le chargement
  - F4: Classe CSS inutile supprimée
  - F7: flex-wrap ajouté pour mobile
  - F9: Badge texte changé de "Client" à "Facturé"

*Implementation completed: 30 janvier 2026*
