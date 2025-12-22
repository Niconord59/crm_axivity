# Requirements Validation Checklist - Améliorations Phase 2

**Feature**: 002-crm-ameliorations
**Date**: 2025-12-14
**Status**: En attente de validation

---

## Functional Requirements Validation

### Formulaires CRUD

| ID | Requirement | Status | Validator | Date |
|----|-------------|--------|-----------|------|
| FR-041 | Création d'opportunités via Dialog | [ ] Pending | | |
| FR-042 | Édition d'opportunités avec pré-remplissage | [ ] Pending | | |
| FR-043 | Création/édition de projets avec liaison client | [ ] Pending | | |
| FR-044 | Création/édition de tâches avec liaison projet/responsable | [ ] Pending | | |
| FR-045 | Création/édition de factures avec calcul TTC auto | [ ] Pending | | |
| FR-046 | Création/édition de clients | [ ] Pending | | |
| FR-047 | Validation Zod avant soumission | [ ] Pending | | |
| FR-048 | Erreurs de validation en français | [ ] Pending | | |

### Fiche Client 360°

| ID | Requirement | Status | Validator | Date |
|----|-------------|--------|-----------|------|
| FR-049 | Onglet Projets affiche projets liés | [ ] Pending | | |
| FR-050 | Onglet Factures affiche factures liées | [ ] Pending | | |
| FR-051 | Onglet Interactions affiche historique | [ ] Pending | | |
| FR-052 | Indicateur Santé Client (>90j = rouge) | [ ] Pending | | |

### Graphiques

| ID | Requirement | Status | Validator | Date |
|----|-------------|--------|-----------|------|
| FR-053 | Graphique CA mensuel (6 mois) sur Dashboard | [ ] Pending | | |
| FR-054 | PieChart pipeline sur page Opportunités | [ ] Pending | | |
| FR-055 | AreaChart progression sur page Rapports | [ ] Pending | | |

### Export

| ID | Requirement | Status | Validator | Date |
|----|-------------|--------|-----------|------|
| FR-056 | Bouton Exporter avec options CSV/Excel | [ ] Pending | | |
| FR-057 | Export CSV encodé UTF-8 avec séparateur ; | [ ] Pending | | |
| FR-058 | Export Excel .xlsx avec en-têtes formatés | [ ] Pending | | |

### Calendrier

| ID | Requirement | Status | Validator | Date |
|----|-------------|--------|-----------|------|
| FR-059 | Calendrier affiche tâches par date échéance | [ ] Pending | | |
| FR-060 | Couleurs par priorité (P1=rouge, P2=orange, P3=bleu) | [ ] Pending | | |
| FR-061 | Clic sur tâche ouvre détail | [ ] Pending | | |

### Portail Client

| ID | Requirement | Status | Validator | Date |
|----|-------------|--------|-----------|------|
| FR-062 | Portail affiche uniquement données du client | [ ] Pending | | |
| FR-063 | Layout distinct sans sidebar interne | [ ] Pending | | |
| FR-064 | Projets affichés avec % complétion | [ ] Pending | | |

### Recherche Globale

| ID | Requirement | Status | Validator | Date |
|----|-------------|--------|-----------|------|
| FR-065 | Recherche déclenchée par Cmd+K / Ctrl+K | [ ] Pending | | |
| FR-066 | Résultats groupés par type d'entité | [ ] Pending | | |
| FR-067 | Recherche accent/case-insensitive | [ ] Pending | | |

### Équipe

| ID | Requirement | Status | Validator | Date |
|----|-------------|--------|-----------|------|
| FR-068 | Liste membres avec rôle et tâches en cours | [ ] Pending | | |
| FR-069 | Barre de progression par membre | [ ] Pending | | |

---

## Success Criteria Validation

| ID | Criteria | Target | Actual | Status |
|----|----------|--------|--------|--------|
| SC-011 | Création opportunité | < 30s | | [ ] Pending |
| SC-012 | Modification entité sans quitter l'interface | 100% | | [ ] Pending |
| SC-013 | Affichage graphiques | < 2s | | [ ] Pending |
| SC-014 | Export Excel valide | ≤ 1000 records | | [ ] Pending |
| SC-015 | Résultats recherche | < 500ms | | [ ] Pending |
| SC-016 | Calendrier mois complet | 100% | | [ ] Pending |
| SC-017 | Isolation données portail | 100% | | [ ] Pending |
| SC-018 | Calcul % capacité | Correct | | [ ] Pending |

---

## Responsive Validation

| Page | Mobile (375px) | Tablet (768px) | Desktop (1024px+) |
|------|----------------|----------------|-------------------|
| Formulaires Dialog | [ ] | [ ] | [ ] |
| Graphiques | [ ] | [ ] | [ ] |
| Fiche Client 360° | [ ] | [ ] | [ ] |
| Calendrier Tâches | [ ] | [ ] | [ ] |
| Portail Client | [ ] | [ ] | [ ] |
| Export Button | [ ] | [ ] | [ ] |
| Recherche Globale | [ ] | [ ] | [ ] |
| Pages Équipe | [ ] | [ ] | [ ] |

---

## Supabase Integration Validation

| Operation | Table | Status | Notes |
|-----------|-------|--------|-------|
| CREATE | Opportunités | [ ] Pending | |
| UPDATE | Opportunités | [ ] Pending | |
| CREATE | Projets | [ ] Pending | |
| UPDATE | Projets | [ ] Pending | |
| CREATE | Tâches | [ ] Pending | |
| UPDATE | Tâches | [ ] Pending | |
| CREATE | Factures | [ ] Pending | |
| UPDATE | Factures | [ ] Pending | |
| CREATE | Clients | [ ] Pending | |
| UPDATE | Clients | [ ] Pending | |
| READ | Interactions | [ ] Pending | |

---

## Edge Cases Validation

| Case | Expected Behavior | Status |
|------|-------------------|--------|
| Formulaire avec données invalides | Affiche erreurs en français | [ ] Pending |
| Graphique sans données | Affiche "Aucune donnée" | [ ] Pending |
| Export > 1000 records | Message limite atteinte | [ ] Pending |
| Tâche sans échéance | Non affichée sur calendrier | [ ] Pending |
| ClientId invalide portail | Accès refusé convivial | [ ] Pending |
| Recherche sans résultat | Affiche "Aucun résultat" | [ ] Pending |
| Membre > 100% capacité | Barre rouge + warning | [ ] Pending |

---

## Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Developer | | | |
| QA | | | |
| Product Owner | | | |
