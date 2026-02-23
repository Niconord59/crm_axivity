# Tasks: 011-facturation-acomptes

**Feature**: Facturation Acomptes (Conformité Droit Français)
**Status**: 0% - 0/24 tasks
**Priority**: P1 - High (Conformité légale)
**Last Updated**: 2026-01-30

---

## Phase 1 : Backend - Migration et Types (6 tasks)

### 1.1 Migration SQL

- [ ] **T1.1.1** Créer `supabase/migrations/25_factures_acomptes.sql`
  - Enum `facture_type` (acompte, solde, unique)
  - Colonne `type_facture` avec default 'unique'
  - Colonne `pourcentage_acompte` (DECIMAL 5,2)
  - Colonne `facture_parent_id` (UUID, FK vers factures)
  - Colonne `montant_total_projet` (DECIMAL 12,2)
  - Index sur `type_facture`, `facture_parent_id`, `devis_id`

- [ ] **T1.1.2** Exécuter la migration sur Supabase (dev puis prod)

### 1.2 Types TypeScript

- [ ] **T1.2.1** Ajouter `FactureType` dans `src/types/constants.ts`
  ```typescript
  export const FACTURE_TYPES = ['acompte', 'solde', 'unique'] as const;
  export type FactureType = typeof FACTURE_TYPES[number];
  export const FACTURE_TYPE_LABELS: Record<FactureType, string> = {
    acompte: 'Acompte',
    solde: 'Solde',
    unique: 'Unique',
  };
  ```

- [ ] **T1.2.2** Mettre à jour l'interface `Facture` dans `src/types/index.ts`
  - Ajouter `typeFacture: FactureType`
  - Ajouter `pourcentageAcompte?: number`
  - Ajouter `factureParentId?: string`
  - Ajouter `montantTotalProjet?: number`

### 1.3 Mapper et Hook

- [ ] **T1.3.1** Mettre à jour `src/lib/mappers/facture.mapper.ts`
  - Mapper les nouveaux champs snake_case → camelCase

- [ ] **T1.3.2** Ajouter `useFacturesByDevis` dans `src/hooks/use-factures.ts`
  - Query pour récupérer toutes les factures liées à un devis
  - Fonction `calculateSoldeRestant()` pour calculer le reste à facturer

---

## Phase 2 : UI - Dialog de Génération (8 tasks)

### 2.1 Composant Dialog

- [ ] **T2.1.1** Créer `src/components/factures/GenerateInvoiceDialog.tsx`
  - Props: `devisId`, `montantTotal`, `onGenerate`, `open`, `onOpenChange`
  - RadioGroup pour type de facture (unique/acompte/solde)
  - Input pour pourcentage (si acompte)
  - Calcul automatique du montant HT

- [ ] **T2.1.2** Ajouter la logique de calcul du solde
  - Récupérer les factures existantes pour ce devis
  - Calculer automatiquement le pourcentage restant
  - Afficher le récapitulatif (acomptes versés + solde dû)

- [ ] **T2.1.3** Ajouter les présets de pourcentage
  - Boutons rapides: 30%, 40%, 50%
  - Input personnalisé pour autres valeurs

### 2.2 Intégration dans le flux existant

- [ ] **T2.2.1** Modifier `src/app/(main)/factures/page.tsx`
  - Remplacer le bouton "Générer facture" par ouverture du dialog

- [ ] **T2.2.2** Modifier `src/components/devis/QuoteEditorSheet.tsx`
  - Bouton "Générer facture" ouvre le nouveau dialog

- [ ] **T2.2.3** Modifier l'API `/api/factures/generate`
  - Accepter les nouveaux champs: `type_facture`, `pourcentage_acompte`, `facture_parent_id`, `montant_total_projet`
  - Valider la cohérence (pourcentage requis si acompte)

### 2.3 Validation

- [ ] **T2.3.1** Ajouter le schema Zod `generateFactureSchema` dans `src/lib/schemas/api.ts`
  - Validation du type de facture
  - Validation du pourcentage (0-100, requis si acompte)

- [ ] **T2.3.2** Tests du dialog de génération
  - Test calcul automatique du montant
  - Test validation du pourcentage
  - Test génération avec type acompte

---

## Phase 3 : Template PDF (5 tasks)

### 3.1 Modifications template

- [ ] **T3.1.1** Modifier `src/lib/templates/facture-template.ts`
  - Ajouter paramètres: `typeFacture`, `pourcentageAcompte`, `montantTotalProjet`, `acomptesVerses`
  - Titre conditionnel: "FACTURE D'ACOMPTE" / "FACTURE DE SOLDE" / "FACTURE"

- [ ] **T3.1.2** Ajouter section "Mention acompte" (type acompte)
  ```
  Acompte de 30% sur un total de 10 000,00 € HT
  ```

- [ ] **T3.1.3** Ajouter section "Récapitulatif acomptes" (type solde)
  - Liste des factures d'acompte avec numéros, dates, montants
  - Ligne de soustraction: Total - Acomptes = Solde dû

- [ ] **T3.1.4** Mettre à jour l'API `/api/factures/generate/route.ts`
  - Récupérer les acomptes versés pour ce devis
  - Passer les données au template

### 3.2 Tests

- [ ] **T3.2.1** Tests du template PDF
  - Test génération facture acompte (mention visible)
  - Test génération facture solde (récapitulatif acomptes)
  - Test génération facture unique (pas de mention spéciale)

---

## Phase 4 : Relances et Affichage (5 tasks)

### 4.1 Workflow N8N

- [ ] **T4.1.1** Modifier `workflows/n8n/supabase_relances_factures.json`
  - Ajouter filtre: `type_facture=neq.acompte`
  - Ne relancer que les factures de type `solde` ou `unique`

### 4.2 Affichage fiche projet

- [ ] **T4.2.1** Créer `src/components/projets/ProjectBillingSection.tsx`
  - Afficher le devis lié
  - Tableau des factures (acompte/solde) avec statuts
  - Totaux: Facturé / Payé / Reste dû

- [ ] **T4.2.2** Intégrer dans `src/app/(main)/projets/[id]/page.tsx`
  - Ajouter la section après les informations projet

### 4.3 Badge acompte sur liste factures

- [ ] **T4.3.1** Modifier `src/app/(main)/factures/page.tsx`
  - Afficher badge "Acompte 30%" ou "Solde 70%" selon type
  - Couleur différente pour distinguer visuellement

### 4.4 Documentation

- [ ] **T4.4.1** Mettre à jour `crm/CLAUDE.md`
  - Section 011-facturation-acomptes
  - Nouveaux champs base de données
  - Nouveaux composants

---

## Résumé

| Phase | Tâches | Effort estimé |
|-------|--------|---------------|
| Phase 1 : Backend | 6 | 1h |
| Phase 2 : UI Dialog | 8 | 2h |
| Phase 3 : Template PDF | 5 | 1h30 |
| Phase 4 : Relances & Affichage | 5 | 1h30 |
| **Total** | **24** | **~6h** |

---

## Dépendances

### Prérequis

- Table `factures` existante ✅
- Table `devis` avec `facture_id` ✅
- API `/api/factures/generate` existante ✅
- Template PDF facture existant ✅

### Bloque

- Aucune feature bloquée

---

## Notes d'implémentation

### Ordre recommandé

1. **T1.x** : Migration SQL et types (30 min)
2. **T2.1-T2.2** : Dialog de génération (1h)
3. **T3.x** : Template PDF (1h)
4. **T2.3** : Validation et tests dialog (30 min)
5. **T4.x** : Relances et affichage (1h)

### Points d'attention

- **Migration non-destructive** : Le default `'unique'` préserve les factures existantes
- **Calcul du solde** : Bien récupérer uniquement les acomptes avec `statut = 'Payée'`
- **Mentions légales** : Le titre "FACTURE D'ACOMPTE" doit être visible et explicite
- **Chaînage factures** : `facture_parent_id` permet de tracer la chronologie

### Code de référence - Calcul solde

```typescript
// Récupérer les acomptes payés pour un devis
const acomptesPayes = factures.filter(
  f => f.devisId === devisId &&
       f.typeFacture === 'acompte' &&
       f.statut === 'Payée'
);

// Calculer le total des acomptes
const totalAcomptes = acomptesPayes.reduce(
  (sum, f) => sum + (f.montantHt || 0),
  0
);

// Calculer le solde restant
const soldeRestant = montantTotalProjet - totalAcomptes;
const pourcentageSolde = (soldeRestant / montantTotalProjet) * 100;
```

### Code de référence - Template PDF conditionnel

```typescript
function getFactureTitle(typeFacture: FactureType): string {
  switch (typeFacture) {
    case 'acompte': return 'FACTURE D\'ACOMPTE';
    case 'solde': return 'FACTURE DE SOLDE';
    default: return 'FACTURE';
  }
}

function getMentionAcompte(
  typeFacture: FactureType,
  pourcentage: number,
  montantTotal: number
): string | null {
  if (typeFacture !== 'acompte') return null;
  return `Acompte de ${pourcentage}% sur un total de ${formatCurrency(montantTotal)} HT`;
}
```

---

*Tasks créées le 30 janvier 2026*
*Issue de la spec 011-facturation-acomptes*
*Version : 1.0*
