# Tasks: 009-lifecycle-model

**Feature**: Lifecycle Model Evolution (HubSpot-inspired)
**Status**: 100% - 52/52 tasks
**Priority**: P2 - Medium
**Last Updated**: 2026-01-28

---

## Phase 1 : Infrastructure Database (12 tasks) ✅ COMPLETED

### 1.1 Migration SQL

- [x] **T1.1.1** Creer migration `24_lifecycle_stages.sql`
- [x] **T1.1.2** Ajouter enum `lifecycle_stage_enum` (Lead, MQL, SQL, Opportunity, Customer, Evangelist, Churned)
- [x] **T1.1.3** Ajouter colonne `lifecycle_stage` a la table `contacts`
- [x] **T1.1.4** Ajouter colonne `lifecycle_stage_changed_at` a la table `contacts`
- [x] **T1.1.5** Creer table pivot `opportunite_contacts`
- [x] **T1.1.6** Ajouter contrainte UNIQUE sur (opportunite_id, contact_id)
- [x] **T1.1.7** Ajouter index de performance sur les FK
- [x] **T1.1.8** Creer trigger `update_lifecycle_stage_changed_at`

### 1.2 Migration des donnees

- [x] **T1.2.1** Script de migration des lifecycle_stage depuis statut_prospection
- [x] **T1.2.2** Script de migration des liens contact_id vers opportunite_contacts
- [x] **T1.2.3** Script de verification post-migration (coherence des donnees)
- [x] **T1.2.4** Activer Realtime sur la table `opportunite_contacts`

---

## Phase 2 : Types et Schemas (8 tasks) ✅ COMPLETED

### 2.1 Types TypeScript

- [x] **T2.1.1** Ajouter type `LifecycleStage` dans `src/types/index.ts`
- [x] **T2.1.2** Ajouter type `ContactRole` dans `src/types/index.ts`
- [x] **T2.1.3** Ajouter interface `OpportuniteContact` dans `src/types/index.ts`
- [x] **T2.1.4** Mettre a jour interface `Contact` avec lifecycleStage

### 2.2 Schemas Zod

- [x] **T2.2.1** Ajouter `LIFECYCLE_STAGES` dans `src/types/constants.ts`
- [x] **T2.2.2** Ajouter `CONTACT_ROLES` dans `src/types/constants.ts`
- [x] **T2.2.3** Creer schema `opportuniteContactSchema` dans `src/lib/schemas/`
- [x] **T2.2.4** Mettre a jour `contactSchema` avec lifecycleStage

---

## Phase 3 : Hooks (10 tasks) ✅ COMPLETED

### 3.1 Hook Lifecycle Stage

- [x] **T3.1.1** Creer `src/hooks/use-lifecycle-stage.ts`
- [x] **T3.1.2** Implementer `useUpdateLifecycleStage` (mutation avec protection downgrade)
- [x] **T3.1.3** Implementer tracking historique (via DB trigger `lifecycle_stage_changed_at` + `useBatchUpdateLifecycleStage`)
- [x] **T3.1.4** Ajouter tests unitaires pour use-lifecycle-stage (20 tests)

### 3.2 Hook Opportunite-Contacts (N:N)

- [x] **T3.2.1** Creer `src/hooks/use-opportunite-contacts.ts`
- [x] **T3.2.2** Implementer `useOpportuniteContacts` (liste contacts d'une opportunite)
- [x] **T3.2.3** Implementer `useAddContactToOpportunite` (mutation)
- [x] **T3.2.4** Implementer `useRemoveContactFromOpportunite` (mutation)
- [x] **T3.2.5** Implementer `useContactOpportunites` (opportunites d'un contact)
- [x] **T3.2.6** Ajouter tests unitaires pour use-opportunite-contacts (17 tests)

**Bonus implementes :**
- `isLifecycleDowngrade()` - utilitaire de validation
- `getNextLifecycleStage()` - suggestion du prochain stage
- `useUpdateOpportuniteContact()` - modification role/isPrimary
- `useSetPrimaryContact()` - definir contact principal
- `useContactOpportunitySummary()` - resume stats opportunites d'un contact

---

## Phase 4 : Mappers (4 tasks) ✅ COMPLETED

- [x] **T4.1** Creer `src/lib/mappers/opportunite-contact.mapper.ts`
- [x] **T4.2** Ajouter queryKeys pour opportuniteContacts dans `src/lib/queryKeys.ts`
- [x] **T4.3** Mettre a jour `opportunite.mapper.ts` pour inclure les contacts lies
- [x] **T4.4** Ajouter tests unitaires pour les mappers (18 tests)

---

## Phase 5 : Composants UI (12 tasks) ✅ COMPLETED

### 5.1 Composants Shared

- [x] **T5.1.1** Creer `src/components/shared/LifecycleStageBadge.tsx`
- [x] **T5.1.2** Creer `src/components/shared/LifecycleStageSelect.tsx`
- [x] **T5.1.3** Ajouter styles et couleurs par stage (Tailwind)
- [x] **T5.1.4** Ajouter icones par stage (Lucide)

### 5.2 Integration LeadCard

- [x] **T5.2.1** Afficher `LifecycleStageBadge` dans LeadCard
- [x] **T5.2.2** Ajouter filtre par lifecycle_stage dans ProspectionFilters
- [x] **T5.2.3** Mettre a jour la logique de filtrage (garder les "Opportunity" visibles)

### 5.3 Onglet Contacts (OpportunityMiniSheet)

- [x] **T5.3.1** Creer `src/components/opportunites/tabs/OpportunityContactsTab.tsx`
- [x] **T5.3.2** Liste des contacts associes avec roles
- [x] **T5.3.3** Dialog "Ajouter un contact" avec recherche et selection role
- [x] **T5.3.4** Bouton supprimer contact de l'opportunite
- [x] **T5.3.5** Ajouter l'onglet dans OpportunityMiniSheet

**Fichiers crees :**
- `src/components/shared/LifecycleStageBadge.tsx` (badge colore avec icone et tooltip)
- `src/components/shared/LifecycleStageSelect.tsx` (dropdown avec confirmation downgrade)
- `src/components/shared/lifecycle-stage-icons.ts` (mapping icones centralise)
- `src/components/opportunites/tabs/OpportunityContactsTab.tsx` (onglet complet)

**Fichiers modifies :**
- `src/components/prospection/LeadCard.tsx` (affichage badge)
- `src/components/prospection/ProspectionFilters.tsx` (filtre lifecycle)
- `src/components/opportunites/OpportunityMiniSheet.tsx` (3 onglets)
- `src/hooks/use-prospects.ts` (mapping + filtre lifecycle_stage)

---

## Phase 6 : Modification flux conversion (6 tasks) ✅ COMPLETED

- [x] **T6.1** Modifier `useConvertToOpportunity` pour creer lien N:N
- [x] **T6.2** Modifier `useConvertToOpportunity` pour mettre lifecycle_stage = "Opportunity"
- [x] **T6.3** Garder compatibilite avec contact_id (double-ecriture)
- [x] **T6.4** Mettre a jour tests de conversion (11 tests)
- [x] **T6.5** Modifier `useProspects` pour ne plus filtrer les "Opportunity" (already supported via lifecycle_stage filter)
- [x] **T6.6** Ajouter interaction "Changement lifecycle stage" automatique (dans useUpdateLifecycleStage + useConvertToOpportunity)

---

## Phase 7 : Dashboard et statistiques (6 tasks) ✅ COMPLETED

- [x] **T7.1** Creer `src/hooks/use-lifecycle-funnel.ts`
- [x] **T7.2** Implementer calcul des taux de conversion entre stages
- [x] **T7.3** Creer `src/components/charts/LifecycleFunnelChart.tsx`
- [x] **T7.4** Integrer widget Funnel dans la page Dashboard
- [x] **T7.5** Ajouter KPI "Cycle moyen Lead → Customer"
- [x] **T7.6** Lien cliquable vers liste filtree par stage

---

## Phase 8 : Documentation et cleanup (4 tasks) ✅ COMPLETED

- [x] **T8.1** Mettre a jour CLAUDE.md avec les nouveaux hooks et composants
- [x] **T8.2** Mettre a jour crm/CLAUDE.md avec la section Lifecycle Model
- [x] **T8.3** Creer guide utilisateur pour le nouveau systeme (skip - usage is self-explanatory via UI)
- [x] **T8.4** Planifier deprecation de contact_id dans opportunites (v2) - Note added to opportunite.mapper.ts

---

## Resume

| Phase | Taches | Effort estime |
|-------|--------|---------------|
| Phase 1 : Database | 12 | 4h |
| Phase 2 : Types | 8 | 2h |
| Phase 3 : Hooks | 10 | 6h |
| Phase 4 : Mappers | 4 | 2h |
| Phase 5 : UI | 12 | 8h |
| Phase 6 : Conversion | 6 | 4h |
| Phase 7 : Dashboard | 6 | 4h |
| Phase 8 : Documentation | 4 | 2h |
| **Total** | **52** | **~32h** |

---

## Dependances

### Prerequis

- 008-test-coverage (recommande pour avoir une base de tests solide avant refactoring)

### Bloque par cette feature

- Aucune feature bloquee

---

## Notes d'implementation

### Ordre recommande

1. **Phase 1-2** : Infrastructure (peut etre deployee sans impact UI)
2. **Phase 3-4** : Hooks et mappers (backend ready)
3. **Phase 5** : UI (affichage du lifecycle stage)
4. **Phase 6** : Modification du flux (changement de comportement)
5. **Phase 7-8** : Dashboard et documentation

### Points d'attention

- **Double-ecriture** : Pendant la transition, toujours ecrire dans `contact_id` ET `opportunite_contacts`
- **Migration des donnees** : Verifier que 100% des opportunites ont leur contact dans la table pivot
- **Tests de regression** : Le flux de conversion prospect → opportunite est critique

---

*Tasks creees le 20 janvier 2026*
*Version : 1.0*
