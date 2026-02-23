# Feature Specification: Facturation Acomptes (Conformité Droit Français)

**Feature Branch**: `011-facturation-acomptes`
**Created**: 2026-01-30
**Updated**: 2026-01-30
**Status**: Ready for Implementation
**Priority**: P1 - High (Conformité légale)

---

## Contexte légal

### Obligations (Article 289 CGI)

Le droit français impose pour les prestations de services :

1. **Facture d'acompte obligatoire** : Toute réception de paiement avant achèvement du service doit donner lieu à une facture
2. **TVA exigible immédiatement** : Pour les prestations de services, la TVA est due dès l'encaissement de l'acompte
3. **Facture de solde** : Doit référencer explicitement les factures d'acompte précédentes

### Sources légales

- [Article 289 du Code Général des Impôts](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000021957467/)
- [BOFIP - TVA et exigibilité prestations de services](https://bofip.impots.gouv.fr/bofip/283-PGP.html)
- [BOFIP - Mentions obligatoires sur les factures](https://bofip.impots.gouv.fr/bofip/140-PGP.html)

---

## Problème actuel

Le CRM Axivity ne distingue pas les types de factures :

| Champ actuel | Limitation |
|--------------|------------|
| `statut` | Pas de notion d'acompte payé vs solde |
| `montant_ht` | Montant unique, pas de lien avec total projet |
| `devis_id` | Existe mais pas de lien entre factures |

### Conséquences

- Impossible de tracer les acomptes versés
- Pas de mention légale "Facture d'acompte" sur les PDFs
- Facture de solde ne référence pas les acomptes
- Relances potentiellement envoyées sur factures d'acompte (faux positifs)

---

## Solution proposée

### Nouveaux champs base de données

```sql
-- Enum type de facture
CREATE TYPE facture_type AS ENUM ('acompte', 'solde', 'unique');

-- Modifications table factures
ALTER TABLE factures ADD COLUMN type_facture facture_type DEFAULT 'unique';
ALTER TABLE factures ADD COLUMN pourcentage_acompte DECIMAL(5,2);
ALTER TABLE factures ADD COLUMN facture_parent_id UUID REFERENCES factures(id);
ALTER TABLE factures ADD COLUMN montant_total_projet DECIMAL(12,2);
```

| Champ | Type | Description |
|-------|------|-------------|
| `type_facture` | ENUM | `acompte`, `solde`, `unique` |
| `pourcentage_acompte` | DECIMAL | % du total (ex: 30.00) |
| `facture_parent_id` | UUID | Lien vers facture précédente (chaînage) |
| `montant_total_projet` | DECIMAL | Montant total HT du projet/devis |

### Modèle de données

```
┌─────────────────────────────────────────────────────────────────┐
│                         DEVIS                                   │
│  DEV-2026-042                                                   │
│  Montant total: 10 000€ HT                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FAC-2026-001 (type: acompte)                                   │
│  pourcentage_acompte: 30%                                       │
│  montant_ht: 3 000€                                             │
│  montant_total_projet: 10 000€                                  │
│  devis_id: DEV-2026-042                                         │
│  facture_parent_id: NULL                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FAC-2026-015 (type: solde)                                     │
│  pourcentage_acompte: 70%                                       │
│  montant_ht: 7 000€                                             │
│  montant_total_projet: 10 000€                                  │
│  devis_id: DEV-2026-042                                         │
│  facture_parent_id: FAC-2026-001                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Stories

### US-001: Créer une facture d'acompte depuis un devis (P1)

**En tant que** admin ou commercial
**Je veux** générer une facture d'acompte à partir d'un devis accepté
**Afin de** demander le versement initial avant de commencer le projet

#### Acceptance Criteria

1. **Given** un devis avec statut "Accepté", **When** je clique sur "Générer facture", **Then** je vois un choix entre "Facture unique", "Facture d'acompte", "Facture de solde"
2. **Given** je choisis "Facture d'acompte", **When** je saisis le pourcentage (ex: 30%), **Then** le montant HT est calculé automatiquement
3. **Given** la facture est générée, **When** je vois le PDF, **Then** le libellé "FACTURE D'ACOMPTE" est visible en en-tête
4. **Given** la facture est générée, **When** je vois le PDF, **Then** la mention "Acompte de 30% sur un total de 10 000€ HT" est présente

#### Mockup UI - Dialog de génération

```
┌─────────────────────────────────────────────────────────────────┐
│  Générer une facture                                       [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Devis: DEV-2026-042 - Automatisation CRM                      │
│  Montant total: 10 000€ HT                                      │
│                                                                 │
│  Type de facture:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ Facture unique (100%)                                 │   │
│  │ ● Facture d'acompte                                     │   │
│  │ ○ Facture de solde                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Pourcentage: [  30  ] %                                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Récapitulatif                                          │   │
│  │  Montant HT:  3 000,00 €                                │   │
│  │  TVA 20%:       600,00 €                                │   │
│  │  Montant TTC: 3 600,00 €                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                              [Annuler]  [Générer la facture]    │
└─────────────────────────────────────────────────────────────────┘
```

---

### US-002: Créer une facture de solde référençant les acomptes (P1)

**En tant que** admin ou commercial
**Je veux** générer une facture de solde qui liste les acomptes déjà versés
**Afin de** facturer le reste dû de manière conforme au droit français

#### Acceptance Criteria

1. **Given** un devis avec une facture d'acompte payée, **When** je génère une facture de solde, **Then** les acomptes précédents sont automatiquement listés
2. **Given** la facture de solde est générée, **When** je vois le PDF, **Then** une section "Acomptes versés" liste les factures précédentes
3. **Given** la facture de solde, **When** je vois le PDF, **Then** le calcul montre : Total projet - Acomptes = Solde dû

#### Mentions obligatoires sur facture de solde

```
┌─────────────────────────────────────────────────────────────────┐
│                      FACTURE DE SOLDE                           │
│                      FAC-2026-015                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Référence devis: DEV-2026-042                                  │
│                                                                 │
│  Prestation: Automatisation CRM Axivity                        │
│  ...                                                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  RÉCAPITULATIF                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Montant total du projet HT:              10 000,00 €           │
│                                                                 │
│  Acomptes versés:                                               │
│    • FAC-2026-001 du 15/01/2026:          -3 000,00 €           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  SOLDE DÛ HT:                              7 000,00 €           │
│  TVA 20%:                                  1 400,00 €           │
│  SOLDE DÛ TTC:                             8 400,00 €           │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### US-003: Marquer un acompte comme payé et déclencher le projet (P1)

**En tant que** admin ou commercial
**Je veux** marquer une facture d'acompte comme payée
**Afin de** déclencher le début du projet et tracker le paiement

#### Acceptance Criteria

1. **Given** une facture d'acompte avec statut "Envoyée", **When** je clique "Marquer payée", **Then** le statut passe à "Payée"
2. **Given** l'acompte est payé, **When** je vois la fiche client, **Then** le client est considéré comme "Client réel" (spec 010)
3. **Given** l'acompte est payé, **When** je consulte le projet lié, **Then** je vois l'indicateur "Acompte reçu ✓"

---

### US-004: Relances uniquement sur factures de solde en retard (P2)

**En tant que** système automatique (N8N)
**Je veux** ne relancer que les factures de solde ou uniques en retard
**Afin de** ne pas envoyer de relances inappropriées sur les acomptes

#### Acceptance Criteria

1. **Given** une facture d'acompte en retard, **When** le workflow de relance s'exécute, **Then** elle est ignorée (pas de relance)
2. **Given** une facture de solde en retard, **When** le workflow s'exécute, **Then** une relance est envoyée
3. **Given** une facture unique en retard, **When** le workflow s'exécute, **Then** une relance est envoyée (comportement actuel)

---

### US-005: Voir le statut des acomptes sur la fiche projet (P2)

**En tant que** admin ou membre équipe
**Je veux** voir l'état des acomptes sur la fiche projet
**Afin de** savoir si je peux commencer/continuer le travail

#### Acceptance Criteria

1. **Given** un projet avec devis, **When** je vois la fiche projet, **Then** je vois une section "Facturation" avec l'état des acomptes
2. **Given** l'acompte est payé, **Then** badge vert "Acompte reçu ✓"
3. **Given** l'acompte n'est pas payé, **Then** badge orange "En attente acompte"

#### Mockup - Section Facturation sur fiche projet

```
┌─────────────────────────────────────────────────────────────────┐
│  💰 Facturation                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Devis: DEV-2026-042                    Montant: 10 000€ HT     │
│                                                                 │
│  ┌─────────────┬──────────────┬────────────┬──────────────┐    │
│  │ Facture     │ Type         │ Montant    │ Statut       │    │
│  ├─────────────┼──────────────┼────────────┼──────────────┤    │
│  │ FAC-2026-001│ Acompte 30%  │ 3 000€     │ ✅ Payée     │    │
│  │ FAC-2026-015│ Solde 70%    │ 7 000€     │ 🟡 Envoyée   │    │
│  └─────────────┴──────────────┴────────────┴──────────────┘    │
│                                                                 │
│  Total facturé: 10 000€ HT    Payé: 3 000€    Reste: 7 000€    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Spécifications techniques

### Migration SQL

**Fichier**: `supabase/migrations/25_factures_acomptes.sql`

```sql
-- ============================================
-- Migration: Gestion des acomptes (conformité droit français)
-- ============================================

-- 1. Enum type de facture
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'facture_type') THEN
    CREATE TYPE facture_type AS ENUM ('acompte', 'solde', 'unique');
  END IF;
END$$;

-- 2. Nouveaux champs sur factures
ALTER TABLE factures ADD COLUMN IF NOT EXISTS type_facture facture_type DEFAULT 'unique';
ALTER TABLE factures ADD COLUMN IF NOT EXISTS pourcentage_acompte DECIMAL(5,2);
ALTER TABLE factures ADD COLUMN IF NOT EXISTS facture_parent_id UUID REFERENCES factures(id) ON DELETE SET NULL;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS montant_total_projet DECIMAL(12,2);

-- 3. Index pour les requêtes sur les acomptes
CREATE INDEX IF NOT EXISTS idx_factures_type ON factures(type_facture);
CREATE INDEX IF NOT EXISTS idx_factures_parent ON factures(facture_parent_id);
CREATE INDEX IF NOT EXISTS idx_factures_devis ON factures(devis_id);

-- 4. Commentaires
COMMENT ON COLUMN factures.type_facture IS 'Type: acompte (versement initial), solde (reste dû), unique (paiement intégral)';
COMMENT ON COLUMN factures.pourcentage_acompte IS 'Pourcentage du total projet (ex: 30.00 pour 30%)';
COMMENT ON COLUMN factures.facture_parent_id IS 'Référence à la facture précédente (chaînage acompte → solde)';
COMMENT ON COLUMN factures.montant_total_projet IS 'Montant total HT du projet/devis (pour calculs et affichage)';
```

### Modification du type TypeScript

**Fichier**: `src/types/index.ts`

```typescript
export type FactureType = 'acompte' | 'solde' | 'unique';

export interface Facture {
  id: string;
  numero: string;
  clientId: string;
  projetId?: string;
  devisId?: string;
  statut: FactureStatut;
  typeFacture: FactureType;           // NOUVEAU
  pourcentageAcompte?: number;        // NOUVEAU
  factureParentId?: string;           // NOUVEAU
  montantTotalProjet?: number;        // NOUVEAU
  dateEmission?: string;
  dateEcheance?: string;
  montantHt?: number;
  tauxTva: number;
  montantTtc?: number;
  datePaiement?: string;
  niveauRelance?: number;
  notes?: string;
}
```

### Modification du template PDF

**Fichier**: `src/lib/templates/facture-template.ts`

Ajouter les sections conditionnelles :

1. **En-tête** : "FACTURE D'ACOMPTE" ou "FACTURE DE SOLDE" selon `type_facture`
2. **Mention acompte** : "Acompte de X% sur un total de Y€ HT"
3. **Section récapitulatif** (solde uniquement) : Liste des acomptes versés avec numéros et montants

### Modification du hook useFactures

**Fichier**: `src/hooks/use-factures.ts`

Ajouter :

```typescript
// Récupérer les factures liées à un devis (pour calcul solde)
export function useFacturesByDevis(devisId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.factures.byDevis(devisId),
    queryFn: async () => {
      if (!devisId) return [];
      const { data, error } = await supabase
        .from('factures')
        .select('*')
        .eq('devis_id', devisId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data.map(mapToFacture);
    },
    enabled: !!devisId,
  });
}

// Calculer le montant restant à facturer
export function calculateSoldeRestant(
  montantTotal: number,
  facturesExistantes: Facture[]
): number {
  const totalAcomptes = facturesExistantes
    .filter(f => f.typeFacture === 'acompte' && f.statut === 'Payée')
    .reduce((sum, f) => sum + (f.montantHt || 0), 0);
  return montantTotal - totalAcomptes;
}
```

### Modification du workflow N8N relances

**Fichier**: `workflows/n8n/supabase_relances_factures.json`

Ajouter un filtre sur `type_facture`:

```
filterString: "statut=eq.Envoyée&type_facture=neq.acompte"
```

Ou en logique :
- `type_facture = 'solde'` → relancer
- `type_facture = 'unique'` → relancer
- `type_facture = 'acompte'` → ignorer (les acomptes sont payés avant de commencer le projet)

---

## Plan d'implémentation

### Phase 1: Backend (migration + types)

1. Créer la migration SQL
2. Mettre à jour les types TypeScript
3. Mettre à jour le mapper facture
4. Ajouter les query keys

### Phase 2: Génération facture (UI + PDF)

1. Modifier le dialog de génération de facture
2. Ajouter le sélecteur de type (acompte/solde/unique)
3. Ajouter le champ pourcentage
4. Mettre à jour le template PDF avec les mentions légales

### Phase 3: Affichage et relances

1. Ajouter la section facturation sur fiche projet
2. Modifier le workflow N8N de relances
3. Tester le cycle complet

---

## Critères de succès

| Métrique | Cible |
|----------|-------|
| Facture d'acompte générée avec mention légale | ✓ |
| Facture de solde référence les acomptes | ✓ |
| PDF conforme au droit français | ✓ |
| Relances ignorent les acomptes | ✓ |
| Client considéré "réel" après paiement acompte | ✓ |

---

## Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Factures existantes sans type | Moyen | Migration définit `unique` par défaut |
| Template PDF complexifié | Faible | Sections conditionnelles bien isolées |
| Workflow N8N à modifier | Faible | Filtre simple sur `type_facture` |

---

## Dépendances

### Prérequis

- Spec 006 (Module Devis) : Système de génération de factures existant ✅
- Table `devis` avec lien vers `factures` ✅

### Bloque

- Spec 010 (Filtrage clients) : Utilise `factures.statut = 'Payée'` → compatible (acompte payé = client réel)

---

*Spécification créée le 30 janvier 2026*
*Conformité Article 289 CGI - Facturation des acomptes*
*Version : 1.0*
