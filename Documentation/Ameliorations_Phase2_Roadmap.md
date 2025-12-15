# Roadmap Améliorations CRM Axivity - Phase 2

**Date de création** : 14 décembre 2025
**Dernière mise à jour** : 15 décembre 2025
**Statut** : En cours (60% - Phases 1-3 + Onboarding terminées)
**Specs techniques** : `Interface/specs/002-crm-ameliorations/`

---

## Vue d'Ensemble

Ce document présente la roadmap des améliorations identifiées suite à l'audit de la Phase 1 de l'interface CRM Axivity. L'objectif est de transformer l'application de **lecture-seule** en **outil opérationnel complet**.

### Contexte

**Phase 1 (Complétée)** : 105 tâches, application fonctionnelle en lecture
- Dashboard avec KPIs
- Pipeline Kanban drag-and-drop
- Pages de consultation (Projets, Clients, Tâches, Factures)
- Design responsive mobile-first

**Phase 2 (Planifiée)** : 51 tâches, fonctionnalités CRUD et visualisations
- Formulaires de création/édition pour toutes les entités
- Graphiques et visualisations de données
- Export CSV/Excel
- Fonctionnalités avancées (recherche, calendrier, portail client)

---

## Matrice des Améliorations

| ID | Amélioration | Impact Business | Effort | Priorité | Statut |
|----|--------------|-----------------|--------|----------|--------|
| A1 | Formulaires CRUD | Critique - outil de travail | 8-10h | P1 CRITIQUE | ✅ Terminé |
| A2 | Fiche Client 360° | Haut - vision unifiée | 3-4h | P1 | 📋 À faire |
| A3 | Graphiques Dashboard | Haut - aide à la décision | 2-3h | P1 | ✅ Terminé |
| A4 | Export CSV/Excel | Moyen - autonomie reporting | 2h | P2 | 📋 À faire |
| A5 | Calendrier Tâches | Moyen - planification visuelle | 3-4h | P2 | 📋 À faire |
| A6 | Portail Client | Moyen - satisfaction client | 4-5h | P2 | 📋 À faire |
| A7 | Recherche Globale | Bas - navigation | 2-3h | P3 | 📋 À faire |
| A8 | Gestion Équipe | Bas - ressources | 3-4h | P3 | 📋 À faire |
| A9 | Tour Guidé Onboarding | Haut - adoption utilisateur | 2-3h | P1 | ✅ Terminé |

**Effort total estimé** : 27-36 heures
**Effort réalisé** : ~13 heures (Phases 1-3 + A9)

---

## Détail des Améliorations

### A1 - Formulaires CRUD (CRITIQUE) ✅ TERMINÉ

**Problème initial** : L'application ne permettait que la consultation. Toute création/modification nécessitait d'ouvrir Airtable.

**Solution implémentée** : Formulaires Dialog pour chaque entité :

| Entité | Champs éditables | Validation | Statut |
|--------|------------------|------------|--------|
| Opportunité | Nom, Client, Valeur, Probabilité, Date, Statut | Zod | ✅ |
| Projet | Brief, Client, Budget, Dates, Statut, Priorité | Zod | ✅ |
| Tâche | Nom, Projet, Responsable, Échéance, Priorité | Zod | ✅ |
| Facture | Numéro, Projet, Montant HT, Dates, Statut | Zod | ✅ |
| Client | Nom, Secteur, Statut, Site Web, Notes | Zod | ✅ |

**Composant réutilisable créé** : `FormDialog` générique (`src/components/shared/FormDialog.tsx`) avec :
- Validation temps réel (Zod + react-hook-form)
- Messages d'erreur en français
- Mode création et édition
- Toast de confirmation (sonner)
- Support controlled/uncontrolled

**Fichiers créés** :
- `src/components/shared/FormDialog.tsx` - Composant Dialog générique
- `src/components/ui/form.tsx` - Composants Form react-hook-form
- `src/components/ui/label.tsx` - Composant Label Radix
- `src/components/ui/textarea.tsx` - Composant Textarea
- `src/lib/schemas/client.ts` - Schéma Zod Client
- `src/lib/schemas/opportunite.ts` - Schéma Zod Opportunité
- `src/lib/schemas/projet.ts` - Schéma Zod Projet
- `src/lib/schemas/tache.ts` - Schéma Zod Tâche
- `src/lib/schemas/facture.ts` - Schéma Zod Facture
- `src/components/forms/ClientForm.tsx` - Formulaire Client
- `src/components/forms/OpportuniteForm.tsx` - Formulaire Opportunité
- `src/components/forms/ProjetForm.tsx` - Formulaire Projet
- `src/components/forms/TacheForm.tsx` - Formulaire Tâche
- `src/components/forms/FactureForm.tsx` - Formulaire Facture

**Bénéfice** : Les utilisateurs peuvent maintenant créer et modifier toutes les entités directement depuis l'interface web.

**Date de complétion** : 14 décembre 2025

---

### A2 - Fiche Client 360°

**Problème actuel** : La page client existe mais les onglets sont vides.

**Solution** : Implémenter les 4 onglets avec données réelles :

```
┌─────────────────────────────────────────┐
│  [Avatar] Nom Client                    │
│  🟢 Actif | Santé: À relancer          │
├─────────────────────────────────────────┤
│  [Infos] [Projets] [Factures] [Interactions]
├─────────────────────────────────────────┤
│  Contenu de l'onglet actif              │
└─────────────────────────────────────────┘
```

**Indicateur Santé Client** :
- 🟢 Bon : interaction < 30 jours
- 🟡 À surveiller : 30-90 jours
- 🔴 À relancer : > 90 jours

**Bénéfice** : Vision complète de la relation client en un seul endroit.

---

### A3 - Graphiques Dashboard (Priorité HAUTE) ✅ TERMINÉ

**Problème initial** : Recharts était installé mais aucun graphique n'était affiché.

**Solution implémentée** : 3 visualisations clés avec Recharts :

| Graphique | Type | Page | Statut |
|-----------|------|------|--------|
| CA Mensuel | BarChart | Dashboard (/) | ✅ |
| Pipeline | PieChart | Opportunités, Rapports | ✅ |
| Progression | AreaChart | Rapports | ✅ |

**Fichiers créés** :
- `src/components/shared/ChartContainer.tsx` - Wrapper responsive pour graphiques
- `src/components/charts/CAMensuelChart.tsx` - BarChart CA mensuel (6 derniers mois)
- `src/components/charts/PipelineChart.tsx` - PieChart pipeline par statut
- `src/components/charts/ProgressionChart.tsx` - AreaChart progression projets
- `src/components/charts/index.ts` - Barrel export

**Pages modifiées** :
- `src/app/page.tsx` - Ajout CAMensuelChart après KPIs
- `src/app/opportunites/page.tsx` - Ajout PipelineChart (toggle "Afficher les statistiques")
- `src/app/rapports/page.tsx` - Section Visualisations avec les 3 graphiques

**Bénéfice** : ✅ Visualisation immédiate des tendances business.

**Date de complétion** : 14 décembre 2025

---

### A4 - Export CSV/Excel

**Problème actuel** : xlsx et papaparse sont installés mais non utilisés.

**Solution** : Composant `ExportButton` réutilisable :

```tsx
<ExportButton
  data={projets}
  filename="projets-export"
  columns={[
    { key: "nom", label: "Nom du Projet" },
    { key: "client", label: "Client" },
    { key: "budgetTotal", label: "Budget", format: "currency" },
    { key: "statut", label: "Statut" },
  ]}
/>
```

**Formats** :
- CSV : UTF-8, séparateur point-virgule
- Excel : .xlsx avec en-têtes en gras

**Bénéfice** : Autonomie pour le reporting externe.

---

### A5 - Calendrier Tâches

**Problème actuel** : La page `/taches/calendrier` est vide.

**Solution** : Implémenter avec react-big-calendar :

- Vue mensuelle par défaut
- Tâches positionnées par date d'échéance
- Code couleur : P1=rouge, P2=orange, P3=bleu
- Clic → Sheet avec détails de la tâche

**Bénéfice** : Planification visuelle de la semaine/mois.

---

### A6 - Portail Client Externe

**Problème actuel** : Les 3 pages portail sont des placeholders.

**Solution** : Interface simplifiée pour les clients :

| Page | Contenu |
|------|---------|
| Dashboard | Projets actifs, factures en attente, prochaines échéances |
| Projets | Liste avec % complétion (sans détail des tâches internes) |
| Factures | Liste avec statut paiement |

**Layout distinct** : Pas de sidebar interne, header client-branded

**Sécurité** : Vérification stricte du clientId pour isolation des données

**Bénéfice** : Réduction des demandes de suivi par email.

---

### A7 - Recherche Globale

**Problème actuel** : Le composant SearchCommand existe mais n'est pas connecté.

**Solution** : Hook `useSearch` avec recherche multi-entités :

```tsx
const { results, isLoading } = useSearch(query);
// results = { clients: [], projets: [], opportunites: [], taches: [] }
```

**Fonctionnalités** :
- Déclenchement : Cmd+K / Ctrl+K
- Debounce 300ms
- Résultats groupés par type
- Navigation directe sur clic

**Bénéfice** : Navigation rapide dans l'application.

---

### A8 - Gestion Équipe

**Problème actuel** : Pages équipe en placeholder.

**Solution** :

**Page /equipe** :
- Liste des membres avec avatar, rôle, email
- Nombre de tâches en cours par membre
- Lien vers les tâches assignées

**Page /equipe/charge** :
- Barres de progression par membre
- Calcul : heures assignées / capacité semaine
- Badge rouge si > 100%

**Bénéfice** : Équilibrage des ressources de l'équipe.

---

### A9 - Tour Guidé Onboarding ✅ TERMINÉ

**Problème initial** : Les nouveaux utilisateurs découvrent l'application sans guidance, ce qui ralentit l'adoption.

**Solution implémentée** : Système de tour guidé custom (react-joyride incompatible React 19) :

| Composant | Fichier | Description |
|-----------|---------|-------------|
| OnboardingTour | `components/onboarding/OnboardingTour.tsx` | Overlay avec Card, Progress, navigation |
| TourTrigger | `components/onboarding/TourTrigger.tsx` | Bouton d'aide avec pulse animation |
| useOnboardingTour | `hooks/use-onboarding-tour.ts` | Hook de gestion d'état |
| tour-steps | `lib/tour-steps.ts` | Configuration des 11 étapes |
| OnboardingProvider | `providers/onboarding-provider.tsx` | Context provider |

**Fonctionnalités** :
- **Auto-démarrage** : Le tour se lance automatiquement pour les nouveaux utilisateurs (après 1s)
- **11 étapes** : Welcome, Dashboard, Prospection, Projets, Opportunités, Tâches, Clients, Factures, Recherche, Notifications, Fin
- **Navigation clavier** : `→` Suivant, `←` Précédent, `Espace` Suivant, `Esc` Fermer, `?` Relancer
- **Persistance localStorage** : État sauvegardé (hasCompletedTour, hasSkippedTour, lastSeenVersion)
- **Effet spotlight** : Animation pulse sur les éléments de navigation mis en surbrillance
- **Dots navigation** : Indicateurs de progression cliquables
- **Versioning** : Possibilité de relancer le tour lors de mises à jour majeures

**CSS ajouté** (`globals.css`) :
```css
.tour-spotlight {
  box-shadow: 0 0 0 4px hsl(var(--primary) / 0.3);
  animation: tour-pulse 2s ease-in-out infinite;
}
```

**Bénéfice** : ✅ Adoption rapide par les nouveaux utilisateurs, réduction du support.

**Date de complétion** : 15 décembre 2025

---

## Planning Recommandé

### Semaine 1 : P1 (CRITIQUE) - ✅ Partiellement terminé

| Jour | Tâches | Durée | Statut |
|------|--------|-------|--------|
| Lun | Infrastructure (FormDialog, Schemas Zod) | 3h | ✅ Terminé |
| Mar | Formulaire Opportunités + Projets | 4h | ✅ Terminé |
| Mer | Formulaire Tâches + Factures + Clients | 4h | ✅ Terminé |
| Jeu | Graphiques (CA, Pipeline, Progression) | 3h | 📋 À faire |
| Ven | Fiche Client 360° complète | 4h | 📋 À faire |

**Livrable Semaine 1** : ~~Application CRUD complète + visualisations~~ → CRUD terminé, visualisations en attente

### Semaine 2 : P2-P3

| Jour | Tâches | Durée | Statut |
|------|--------|-------|--------|
| Lun | Export CSV/Excel sur toutes les pages | 2h | 📋 À faire |
| Mar | Calendrier Tâches | 4h | 📋 À faire |
| Mer-Jeu | Portail Client (3 pages) | 5h | 📋 À faire |
| Ven | Recherche Globale + Pages Équipe | 4h | 📋 À faire |

**Livrable Semaine 2** : Application complète Phase 2

---

## Critères de Succès

| Métrique | Cible | Mesure |
|----------|-------|--------|
| Création d'entité | < 30s | Chrono utilisateur |
| Affichage graphiques | < 2s | Performance |
| Export Excel | ≤ 1000 records | Test fonctionnel |
| Recherche | < 500ms | Performance |
| Isolation portail | 100% | Test sécurité |

---

## Risques et Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Rate limiting Airtable | Batch échoue | Max 10 records, délai 200ms |
| Conflits modification | Données écrasées | Refresh après save |
| Performance graphiques | Lenteur | Pagination, memoization |
| Sécurité portail | Fuite données | Vérification stricte clientId |

---

## Documentation Technique

- **Spec complète** : `specs/002-crm-ameliorations/spec.md`
- **Plan d'implémentation** : `specs/002-crm-ameliorations/plan.md`
- **Tâches détaillées** : `specs/002-crm-ameliorations/tasks.md`
- **Schémas Zod** : `specs/002-crm-ameliorations/contracts/form-schemas.md`
- **Checklist QA** : `specs/002-crm-ameliorations/checklists/requirements.md`
- **Quickstart** : `specs/002-crm-ameliorations/quickstart.md`

---

*Document créé le 14 décembre 2025*
*Dernière mise à jour : 15 décembre 2025*
*Version : 1.2* - Ajout Tour Guidé Onboarding (A9) terminé
