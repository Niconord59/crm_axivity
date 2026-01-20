# 004 - Tour Guidé Onboarding

## Résumé

Système de visite guidée interactive pour les nouveaux utilisateurs du CRM Axivity, permettant de découvrir les fonctionnalités principales de l'application étape par étape.

## Statut

**IMPLÉMENTÉ** - 100% complété le 15 décembre 2025

## Objectifs

1. **Adoption rapide** : Permettre aux nouveaux utilisateurs de comprendre l'application en moins de 5 minutes
2. **Auto-guidage** : Réduire le besoin de formation et de support
3. **Découverte complète** : Présenter toutes les fonctionnalités clés du CRM
4. **Expérience fluide** : Navigation intuitive avec clavier et souris

## Contraintes Techniques

- **React 19** : react-joyride incompatible, solution custom requise
- **Shadcn/UI** : Utilisation exclusive des composants existants
- **localStorage** : Persistance côté client (pas de backend)
- **Mobile-first** : Responsive sur tous les breakpoints

## Architecture

### Composants

```
src/
├── components/onboarding/
│   ├── OnboardingTour.tsx    # Composant principal (overlay + card)
│   ├── TourTrigger.tsx       # Bouton de déclenchement
│   └── index.ts              # Barrel export
├── hooks/
│   └── use-onboarding-tour.ts # Hook de gestion d'état
├── lib/
│   └── tour-steps.ts          # Configuration des étapes
└── providers/
    └── onboarding-provider.tsx # Context provider
```

### Flow de données

```
OnboardingProvider
    └── useOnboardingTour (hook)
        ├── localStorage (persistence)
        └── TourState { currentStep, hasCompletedTour, ... }
            └── OnboardingTour (UI)
                └── tour-steps.ts (config)
```

## Fonctionnalités

### Auto-démarrage

- Détection premier visiteur via localStorage
- Délai de 1 seconde pour laisser la page se charger
- Support du versioning (relance possible après mise à jour majeure)

### 11 Étapes du Tour

| # | ID | Titre | Description |
|---|----|----|-------------|
| 1 | welcome | Bienvenue | Introduction générale |
| 2 | dashboard | Tableau de bord | KPIs et vue d'ensemble |
| 3 | prospection | Prospection | Gestion des leads |
| 4 | projets | Projets | Suivi des projets clients |
| 5 | opportunites | Pipeline Commercial | Kanban drag-and-drop |
| 6 | taches | Tâches | Organisation du travail |
| 7 | clients | Base Clients | CRM et fiche 360° |
| 8 | factures | Facturation | Gestion des factures |
| 9 | search | Recherche | Cmd+K navigation rapide |
| 10 | notifications | Notifications | Alertes et rappels |
| 11 | complete | C'est parti ! | Fin du tour |

### Navigation

| Action | Clavier | Souris |
|--------|---------|--------|
| Suivant | `→` ou `Espace` ou `Enter` | Bouton "Suivant" |
| Précédent | `←` | Bouton "Précédent" |
| Fermer | `Esc` | Bouton X ou clic backdrop |
| Relancer | `?` | Bouton aide (header) |
| Aller à étape | - | Clic sur dot |

### Persistance (localStorage)

```typescript
interface TourState {
  hasCompletedTour: boolean;
  hasSkippedTour: boolean;
  currentStep: number;
  lastSeenVersion: string;
}
```

Clé : `crm-axivity-tour-state`

### Effet Spotlight

Animation CSS sur les éléments de navigation :
- Box-shadow primaire avec pulse
- Z-index élevé pour sortir de l'overlay
- Classe `.tour-spotlight` appliquée dynamiquement

## UI/UX

### Overlay

- Backdrop semi-transparent (`bg-black/60`)
- Blur léger (`backdrop-blur-sm`)
- Animation fade-in

### Card (Tooltip)

- Positionnement : centré (étapes générales) ou ancré (éléments spécifiques)
- Progress bar en haut
- Icône + titre + description
- Footer avec navigation

### Responsive

- Mobile : Card en bas de l'écran, pleine largeur
- Desktop : Card positionnée selon l'étape

## Intégration

### AppLayout

```tsx
<OnboardingProvider>
  <div className="flex h-screen">
    <Sidebar />
    <main>{children}</main>
  </div>
</OnboardingProvider>
```

### Header

```tsx
<TourTrigger
  onClick={startTour}
  hasCompletedTour={hasCompletedTour}
/>
```

## Tests Manuels

- [ ] Premier visiteur : tour démarre automatiquement
- [ ] Navigation clavier : toutes les touches fonctionnent
- [ ] Navigation souris : boutons et dots cliquables
- [ ] Skip : sauvegarde l'état correctement
- [ ] Complete : sauvegarde l'état correctement
- [ ] Relancer : `?` ou bouton aide fonctionne
- [ ] Mobile : card visible et utilisable
- [ ] Navigation inter-pages : routes changent correctement

## Évolutions Futures

1. **Tours contextuels** : Mini-tours par page (ex: premier accès à Prospection)
2. **Analytics** : Tracking des étapes vues/skippées
3. **Personnalisation** : Tours différents selon le rôle utilisateur
4. **Backend** : Persistance serveur avec authentification
