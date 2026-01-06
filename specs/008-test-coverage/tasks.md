# Taches : Couverture de Tests Progressive

**Feature** : 008-test-coverage
**Total** : 89 taches
**Status** : 100% (89/89) ✅

---

## Phase 1 : Hooks Critiques et Mappers [27/27] ✅

*Objectif : Couvrir le code metier le plus critique*

### T1.1 - Tests Mappers [9/9] ✅

- [x] Creer `src/lib/mappers/__tests__/base.mapper.test.ts` (62 tests)
  - [x] Tester `parseDate()` (null, string valide, invalide)
  - [x] Tester `parseNumber()` (null, number, string)
  - [x] Tester `parseLinkedIds()` (array, null)
  - [x] Tester `parseString()` (null, string)
- [x] Creer `src/lib/mappers/__tests__/client.mapper.test.ts` (14 tests)
  - [x] Tester `mapClient()` avec donnees completes
  - [x] Tester `mapClient()` avec donnees partielles (nulls)
  - [x] Tester `mapClientFormToSupabase()`
- [x] Creer `src/lib/mappers/__tests__/opportunite.mapper.test.ts` (17 tests)
  - [x] Tester `mapOpportunite()` avec relations
  - [x] Tester calcul `valeurPonderee`
- [x] Creer `src/lib/mappers/__tests__/facture.mapper.test.ts` (18 tests)
  - [x] Tester `mapFacture()` avec montants
  - [x] Tester gestion des statuts (type narrowing)
- [x] Creer `src/lib/mappers/__tests__/projet.mapper.test.ts` (20 tests)
  - [x] Tester `mapProjet()` avec pourcentages
- [x] Creer `src/lib/mappers/__tests__/tache.mapper.test.ts` (23 tests)
  - [x] Tester `mapTache()` avec relations

### T1.2 - Tests useOpportunites [6/6] ✅

- [x] Creer `src/hooks/__tests__/use-opportunites.test.ts` (30 tests)
- [x] Tester `useOpportunites()` - fetch all avec filtres
- [x] Tester `useOpportunitesParStatut()` - groupement Kanban
- [x] Tester `useOpportunite(id)` - fetch single
- [x] Tester `useUpdateOpportunite()` - mutation avec optimistic update
- [x] Tester `useUpdateOpportuniteStatut()` - changement Kanban
- [x] Tester `useCreateOpportunite()` - creation

### T1.3 - Tests useFactures [5/5] ✅

- [x] Creer `src/hooks/__tests__/use-factures.test.ts` (35 tests)
- [x] Tester `useFactures()` - fetch all avec filtres (statut, clientId, projetId)
- [x] Tester `useFacturesImpayees()` et `useFacturesARelancer()`
- [x] Tester `useFacture(id)` - fetch single
- [x] Tester `useCreateFacture()`, `useUpdateFacture()` - mutations
- [x] Tester `useMarquerFacturePayee()` et `useEnvoyerRelance()` - actions metier

### T1.4 - Tests useDevis [4/4] ✅

- [x] Creer `src/hooks/__tests__/use-devis.test.ts` (43 tests)
- [x] Tester `useDevisForOpportunite(opportuniteId)` - fetch devis par opportunite
- [x] Tester mutations (create, update, delete, updateStatus, uploadPDF, duplicateLines)
- [x] Tester calcul totaux (HT, TVA, TTC) et mapper business logic

### T1.5 - Tests useProspects [3/3] ✅

- [x] Creer `src/hooks/__tests__/use-prospects.test.ts` (36 tests)
- [x] Tester `useProspects()` - fetch all avec filtres (statut, source, search)
- [x] Tester `useUpdateProspectStatus()` - changement statut
- [x] Tester `useProspectionKPIs()` - calcul KPIs
- [x] Tester hooks specialises (useRappelsAujourdhui, useRdvAujourdhui, usePastRdvProspects)

---

## Phase 2 : APIs et Hooks Restants [25/25] ✅

*Objectif : Couvrir les API routes et hooks secondaires*

### T2.1 - Tests API /devis/generate [5/5] ✅

- [x] Creer `src/app/api/devis/generate/__tests__/route.test.ts` (18 tests)
- [x] Tester validation body (Zod)
- [x] Tester opportunite non trouvee (404)
- [x] Tester generation numero sequentiel
- [x] Tester erreur Supabase (500)
- [x] Mock PDF generation (skip Puppeteer)

### T2.2 - Tests API /factures/generate [5/5] ✅

- [x] Creer `src/app/api/factures/generate/__tests__/route.test.ts` (19 tests)
- [x] Tester validation body
- [x] Tester devis non trouve (404)
- [x] Tester devis deja converti (409 Conflict)
- [x] Tester generation facture
- [x] Mock PDF generation

### T2.3 - Tests API /devis/send [4/4] ✅

- [x] Creer `src/app/api/devis/send/__tests__/route.test.ts` (13 tests)
- [x] Tester validation email
- [x] Tester devis non trouve
- [x] Tester erreur Resend (502)
- [x] Tester succes envoi

### T2.4 - Tests API /factures/relance [3/3] ✅

- [x] Creer `src/app/api/factures/relance/__tests__/route.test.ts` (11 tests)
- [x] Tester facture non trouvee
- [x] Tester niveau relance invalide
- [x] Tester succes envoi

### T2.5 - Tests useProjets [3/3] ✅

- [x] Creer `src/hooks/__tests__/use-projets.test.ts` (30 tests)
- [x] Tester `useProjets()` - fetch all
- [x] Tester `useProjet(id)` - fetch single avec taches
- [x] Tester `useUpdateProjet()` - mutation

### T2.6 - Tests useTaches [3/3] ✅

- [x] Creer `src/hooks/__tests__/use-taches.test.ts` (37 tests)
- [x] Tester `useTaches()` - fetch all
- [x] Tester `useTachesByProjet(projetId)`
- [x] Tester `useUpdateTacheStatut()` - optimistic update

### T2.7 - Tests useInteractions [2/2] ✅

- [x] Creer `src/hooks/__tests__/use-interactions.test.ts` (26 tests)
- [x] Tester `useInteractionsByContact(contactId)`
- [x] Tester `useCreateInteraction()`

---

## Phase 3 : Composants Metier [25/25] ✅

*Objectif : Couvrir les composants avec logique complexe*

### T3.1 - Tests OpportunityCard [5/5] ✅

- [x] Creer `src/components/opportunites/__tests__/OpportunityCard.test.tsx` (41 tests)
- [x] Tester rendu avec props minimales
- [x] Tester affichage montant et probabilite
- [x] Tester badge statut
- [x] Tester callback onClick
- [x] Tester React.memo (pas de re-render inutile)

### T3.2 - Tests OpportunityMiniSheet Widgets [5/5] ✅

- [x] Creer `src/components/opportunites/widgets/__tests__/widgets.test.tsx` (60 tests)
- [x] Verifier couverture `AmountSelector` >= 80%
- [x] Verifier couverture `ProbabilitySlider` >= 80%
- [x] Verifier couverture `InteractionTimeline` >= 80%
- [x] Ajouter tests `ManualNoteForm`
- [x] Ajouter tests edge cases (valeurs extremes)

### T3.3 - Tests LeadCard [4/4] ✅

- [x] Creer `src/components/prospection/__tests__/LeadCard.test.tsx` (40 tests)
- [x] Tester rendu avec prospect complet
- [x] Tester affichage statut prospection
- [x] Tester date rappel (surligné si passée)
- [x] Tester callback onClick

### T3.4 - Tests QuoteLinesTable [4/4] ✅

- [x] Creer `src/components/devis/__tests__/QuoteLinesTable.test.tsx` (22 tests)
- [x] Tester rendu lignes vides
- [x] Tester ajout ligne
- [x] Tester calcul montant (quantite * prix - remise)
- [x] Tester suppression ligne

### T3.5 - Tests ServiceSelector [3/3] ✅

- [x] Creer `src/components/devis/__tests__/ServiceSelector.test.tsx` (23 tests)
- [x] Tester chargement services
- [x] Tester selection service
- [x] Tester filtre par categorie

### T3.6 - Tests ProspectionKPIs [4/4] ✅

- [x] Creer `src/components/prospection/__tests__/ProspectionKPIs.test.tsx` (17 tests)
- [x] Tester affichage 4 KPIs
- [x] Tester calcul "A appeler"
- [x] Tester calcul "Rappels en retard"
- [x] Tester taux de qualification

---

## Phase 4 : Integration et CI/CD [15/15] ✅

*Objectif : Automatisation et monitoring*

### T4.1 - Tests Integration Devis Flow [5/5] ✅

- [x] Creer `src/__tests__/integration/devis-flow.test.ts` (29 tests)
- [x] Tester creation lignes → preview → generate
- [x] Tester envoi email avec mock Resend
- [x] Tester conversion devis → facture
- [x] Tester statut devis apres conversion

### T4.2 - Tests Integration Pipeline [4/4] ✅

- [x] Creer `src/__tests__/integration/pipeline-flow.test.ts` (34 tests)
- [x] Tester drag & drop opportunite (mock @hello-pangea/dnd)
- [x] Tester changement statut → refresh Kanban
- [x] Tester edition rapide via MiniSheet

### T4.3 - Configuration CI/CD [4/4] ✅

- [x] Creer `.github/workflows/test.yml`
  - [x] Trigger sur PR vers main/develop
  - [x] Run `npm test`
  - [x] Fail si couverture < seuil
- [x] Configurer seuil couverture dans `vitest.config.ts`
  - [x] Global: 60%
  - [x] Branches: 55%
  - [x] Functions/Lines: 60%
- [x] Upload coverage artifact sur GitHub
- [x] Configurer rapport couverture sur PR

### T4.4 - Documentation et Maintenance [4/4] ✅

- [x] Mettre a jour `docs/TESTING.md` avec nouvelles conventions
- [x] Ajouter guide "Comment ecrire un test"
- [x] Documenter les mocks disponibles
- [x] Creer checklist PR (tests requis)

---

## Resume par Phase

| Phase | Taches | Couverture Cible |
|-------|--------|------------------|
| Phase 1 : Hooks Critiques & Mappers | 24 | 20% |
| Phase 2 : APIs & Hooks Restants | 25 | 40% |
| Phase 3 : Composants Metier | 25 | 60% |
| Phase 4 : Integration & CI/CD | 15 | 80% |
| **Total** | **89** | **80%** |

---

## Fichiers a Creer

### Phase 1

| Fichier | Tests estimes | Reels |
|---------|---------------|-------|
| `src/lib/mappers/__tests__/base.mapper.test.ts` | 15 | **62** ✅ |
| `src/lib/mappers/__tests__/client.mapper.test.ts` | 8 | **14** ✅ |
| `src/lib/mappers/__tests__/opportunite.mapper.test.ts` | 6 | **17** ✅ |
| `src/lib/mappers/__tests__/facture.mapper.test.ts` | 6 | **18** ✅ |
| `src/lib/mappers/__tests__/projet.mapper.test.ts` | 4 | **20** ✅ |
| `src/lib/mappers/__tests__/tache.mapper.test.ts` | 4 | **23** ✅ |
| `src/hooks/__tests__/use-opportunites.test.ts` | 12 | **30** ✅ |
| `src/hooks/__tests__/use-factures.test.ts` | 8 | **35** ✅ |
| `src/hooks/__tests__/use-devis.test.ts` | 10 | **43** ✅ |
| `src/hooks/__tests__/use-prospects.test.ts` | 8 | **36** ✅ |

### Phase 2

| Fichier | Tests estimes | Reels |
|---------|---------------|-------|
| `src/app/api/devis/generate/__tests__/route.test.ts` | 8 | **18** ✅ |
| `src/app/api/factures/generate/__tests__/route.test.ts` | 8 | **19** ✅ |
| `src/app/api/devis/send/__tests__/route.test.ts` | 6 | **13** ✅ |
| `src/app/api/factures/relance/__tests__/route.test.ts` | 5 | **11** ✅ |
| `src/hooks/__tests__/use-projets.test.ts` | 8 | **30** ✅ |
| `src/hooks/__tests__/use-taches.test.ts` | 8 | **37** ✅ |
| `src/hooks/__tests__/use-interactions.test.ts` | 5 | **26** ✅ |

### Phase 3

| Fichier | Tests estimes | Reels |
|---------|---------------|-------|
| `src/components/opportunites/__tests__/OpportunityCard.test.tsx` | 10 | **41** ✅ |
| `src/components/opportunites/widgets/__tests__/widgets.test.tsx` | 20 | **60** ✅ |
| `src/components/prospection/__tests__/LeadCard.test.tsx` | 8 | **40** ✅ |
| `src/components/devis/__tests__/QuoteLinesTable.test.tsx` | 10 | **22** ✅ |
| `src/components/devis/__tests__/ServiceSelector.test.tsx` | 6 | **23** ✅ |
| `src/components/prospection/__tests__/ProspectionKPIs.test.tsx` | 8 | **17** ✅ |

### Phase 4

| Fichier | Tests estimes | Reels |
|---------|---------------|-------|
| `src/__tests__/integration/devis-flow.test.ts` | 8 | **29** ✅ |
| `src/__tests__/integration/pipeline-flow.test.ts` | 6 | **34** ✅ |
| `.github/workflows/test.yml` | - | ✅ |
| `docs/TESTING.md` (update) | - | ✅ |

---

## Estimation Totale

| Metrique | Valeur |
|----------|--------|
| Fichiers de test a creer | ~25 |
| Tests a ecrire | ~200 |
| Tests existants | 125 |
| **Tests mappers ajoutes** | **+154** |
| **Tests useOpportunites ajoutes** | **+30** |
| **Tests useFactures ajoutes** | **+35** |
| **Tests useDevis ajoutes** | **+43** |
| **Tests useProspects ajoutes** | **+36** |
| **Tests API devis/generate ajoutes** | **+18** |
| **Tests API factures/generate ajoutes** | **+19** |
| **Tests API devis/send ajoutes** | **+13** |
| **Tests API factures/relance ajoutes** | **+11** |
| **Tests useProjets ajoutes** | **+30** |
| **Tests useTaches ajoutes** | **+37** |
| **Tests useInteractions ajoutes** | **+26** |
| **Tests OpportunityCard ajoutes** | **+41** |
| **Tests widgets ajoutes** | **+60** |
| **Tests LeadCard ajoutes** | **+40** |
| **Tests QuoteLinesTable ajoutes** | **+22** |
| **Tests ServiceSelector ajoutes** | **+23** |
| **Tests ProspectionKPIs ajoutes** | **+17** |
| **Tests integration devis-flow ajoutes** | **+29** |
| **Tests integration pipeline-flow ajoutes** | **+34** |
| **Total Final** | **843** ✅ |
| Couverture cible | 80% |

---

*Taches creees le 6 janvier 2026*
*Issue identifiee lors du code review BMAD*
*Approche : Progressive, priorisee par criticite metier*

## Historique des completions

| Date | Tache | Tests ajoutes |
|------|-------|---------------|
| 2026-01-06 | T1.1 - Tests Mappers | +154 (62+14+17+18+20+23) |
| 2026-01-06 | T1.2 - Tests useOpportunites | +30 |
| 2026-01-06 | T1.3 - Tests useFactures | +35 |
| 2026-01-06 | T1.4 - Tests useDevis | +43 |
| 2026-01-06 | T1.5 - Tests useProspects | +36 |
| 2026-01-06 | T2.1 - Tests API /devis/generate | +18 |
| 2026-01-06 | T2.2 - Tests API /factures/generate | +19 |
| 2026-01-06 | T2.3 - Tests API /devis/send | +13 |
| 2026-01-06 | T2.4 - Tests API /factures/relance | +11 |
| 2026-01-06 | T2.5 - Tests useProjets | +30 |
| 2026-01-06 | T2.6 - Tests useTaches | +37 |
| 2026-01-06 | T2.7 - Tests useInteractions | +26 |
| 2026-01-06 | T3.1 - Tests OpportunityCard | +41 |
| 2026-01-06 | T3.2 - Tests Widgets | +60 |
| 2026-01-06 | T3.3 - Tests LeadCard | +40 |
| 2026-01-06 | T3.4 - Tests QuoteLinesTable | +22 |
| 2026-01-06 | T3.5 - Tests ServiceSelector | +23 |
| 2026-01-06 | T3.6 - Tests ProspectionKPIs | +17 |
| 2026-01-06 | T4.1 - Tests Integration Devis Flow | +29 |
| 2026-01-06 | T4.2 - Tests Integration Pipeline | +34 |
| 2026-01-06 | T4.3 - Configuration CI/CD | - |
| 2026-01-06 | T4.4 - Documentation TESTING.md | - |

---

## 🎉 Epic 008-test-coverage COMPLET

**Résumé final :**
- **843 tests** dans **33 fichiers**
- **4 phases** complétées
- **GitHub Actions CI/CD** configuré
- **Documentation TESTING.md** mise à jour
