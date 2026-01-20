# Plan d'implémentation : Module Prospection

## Vue d'ensemble

Ce plan détaille les étapes d'implémentation du module de prospection, organisées en phases logiques avec dépendances.

---

## Phase 0 : Préparation Supabase (Prérequis)

**Durée estimée** : 30 minutes
**À faire manuellement dans Supabase**

### Étape 0.1 : Créer les champs sur T2-Contacts

| Champ | Type | Configuration |
|-------|------|---------------|
| `Statut Prospection` | Single Select | Options : À appeler, Appelé - pas répondu, Rappeler, Qualifié, Non qualifié, Perdu |
| `Date Rappel` | Date | Format : European (DD/MM/YYYY) |
| `Source Lead` | Single Select | Options : LinkedIn, Site web, Salon, Recommandation, Achat liste, Autre |
| `Notes Prospection` | Long Text | Enable rich text formatting: No |

### Étape 0.2 : Créer une vue "Prospection"

- **Table** : T2-Contacts
- **Type** : Grid
- **Filtre** : `Statut Prospection` is not empty
- **Tri** : Date Rappel (ascending), puis Statut Prospection

---

## Phase 1 : Infrastructure (Foundation)

**Durée estimée** : 3 heures
**Dépendances** : Phase 0 terminée

### Étape 1.1 : Types TypeScript

```
src/types/index.ts
- Ajouter ProspectStatut, ProspectSource
- Étendre type Contact avec nouveaux champs
```

### Étape 1.2 : Schémas Zod

```
src/lib/schemas/prospect.ts (nouveau)
- prospectSchema
- callResultSchema
- importLeadSchema
- csvMappingSchema
```

### Étape 1.3 : Mise à jour supabase-tables.ts

```
src/lib/supabase-tables.ts
- Ajouter les Field IDs des nouveaux champs T2-Contacts
```

### Étape 1.4 : Hook useProspects

```
src/hooks/use-prospects.ts (nouveau)
- useProspects() : Liste des contacts en prospection
- useProspect(id) : Détail d'un prospect
- useUpdateProspectStatus() : Mutation statut
```

---

## Phase 2 : Page principale (Core UI)

**Durée estimée** : 4 heures
**Dépendances** : Phase 1 terminée

### Étape 2.1 : Structure de la page

```
src/app/prospection/page.tsx (nouveau)
- Layout avec KPIs en haut
- Filtres
- Liste des leads
```

### Étape 2.2 : Composant ProspectionKPIs

```
src/components/prospection/ProspectionKPIs.tsx (nouveau)
- 4 cartes KPI
- Calculs depuis les données prospects
```

### Étape 2.3 : Composant LeadCard

```
src/components/prospection/LeadCard.tsx (nouveau)
- Affichage entreprise + contact
- Badges statut, source, rappel
- Boutons d'action
```

### Étape 2.4 : Filtres et recherche

```
src/components/prospection/ProspectionFilters.tsx (nouveau)
- Select statut
- Select source
- Select date rappel
- Input recherche
```

### Étape 2.5 : Navigation sidebar

```
src/components/layout/Sidebar.tsx
- Ajouter lien "Prospection" avec icône Phone
```

---

## Phase 3 : Actions et dialogs (Interactions)

**Durée estimée** : 4 heures
**Dépendances** : Phase 2 terminée

### Étape 3.1 : Dialog résultat d'appel

```
src/components/prospection/CallResultDialog.tsx (nouveau)
- Radio buttons pour résultat
- Date picker pour rappel
- Textarea pour notes
- Checkbox création interaction
```

### Étape 3.2 : Hook useLogInteraction

```
src/hooks/use-interactions.ts
- useCreateInteraction() : Créer une interaction dans T8
```

### Étape 3.3 : Logique "Appeler"

```
- Copie téléphone dans presse-papier (navigator.clipboard)
- Ouvre CallResultDialog
- Met à jour statut selon résultat
- Crée interaction si coché
```

### Étape 3.4 : Formulaire création prospect manuel

```
src/components/prospection/ProspectForm.tsx (nouveau)
- Création d'un lead sans import
- Champs : Entreprise, Contact, Email, Téléphone, Source, Notes
```

---

## Phase 4 : Import CSV (Feature clé)

**Durée estimée** : 4 heures
**Dépendances** : Phase 1 terminée (peut être parallélisé avec Phase 2-3)

### Étape 4.1 : Hook useImportLeads

```
src/hooks/use-import-leads.ts (nouveau)
- parseCSV(file) : Parse avec papaparse
- validateMapping(data, mapping) : Vérifie colonnes requises
- importBatch(leads) : Import avec dédoublonnage
- Gestion progression et erreurs
```

### Étape 4.2 : Dialog Import - Étape 1 (Upload)

```
src/components/prospection/LeadImportDialog.tsx (nouveau)
- Drag & drop zone
- Sélection fichier
- Détection colonnes
```

### Étape 4.3 : Dialog Import - Étape 2 (Mapping)

```
- Liste des colonnes détectées
- Select pour mapper vers champs CRM
- Validation champs obligatoires
```

### Étape 4.4 : Dialog Import - Étape 3 (Aperçu)

```
- Table aperçu (5 premières lignes)
- Compteur total lignes
- Détection doublons
- Bouton import avec progression
```

### Étape 4.5 : Logique dédoublonnage

```
- Recherche contact par email
- Si existe : mise à jour
- Si n'existe pas : création client + contact
```

---

## Phase 5 : Conversion en opportunité

**Durée estimée** : 2 heures
**Dépendances** : Phase 3 terminée

### Étape 5.1 : Hook useConvertToOpportunity

```
src/hooks/use-convert-opportunity.ts (nouveau)
- Crée opportunité avec données pré-remplies
- Met à jour statut contact → "Qualifié"
- Met à jour statut client → "Actif" (si Prospect)
```

### Étape 5.2 : Intégration avec OpportuniteForm

```
src/components/forms/OpportuniteForm.tsx
- Ajouter prop initialData pour pré-remplissage
- Ajouter prop onSuccess avec l'ID créé
```

### Étape 5.3 : Flux complet bouton "Qualifié"

```
1. Clic sur "Qualifié"
2. Ouvre OpportuniteForm pré-rempli
3. Utilisateur complète (valeur, probabilité...)
4. Validation → conversion
5. Toast succès avec lien vers opportunité
```

---

## Phase 6 : Polish et optimisations

**Durée estimée** : 2 heures
**Dépendances** : Phases 1-5 terminées

### Étape 6.1 : Responsive mobile

```
- LeadCard en mode compact sur mobile
- Actions en menu dropdown
- Filtres dans Sheet
```

### Étape 6.2 : États vides et loading

```
- Skeleton loading
- Empty state "Aucun lead"
- Empty state "Importez vos premiers leads"
```

### Étape 6.3 : Notifications toast

```
- Import réussi : "52 leads importés"
- Appel logué : "Statut mis à jour"
- Conversion : "Opportunité créée"
```

### Étape 6.4 : Documentation

```
- Mise à jour CLAUDE.md
- Mise à jour passation_projet_agence_ia.md
```

---

## Diagramme de dépendances

```
Phase 0 (Supabase)
    │
    ▼
Phase 1 (Infrastructure)
    │
    ├──────────────┬──────────────┐
    ▼              ▼              ▼
Phase 2        Phase 4        (parallèle)
(Page UI)      (Import CSV)
    │              │
    ▼              │
Phase 3            │
(Actions)          │
    │              │
    ├──────────────┘
    ▼
Phase 5 (Conversion)
    │
    ▼
Phase 6 (Polish)
```

---

## Ordre d'implémentation recommandé

| Jour | Phases | Livrables |
|------|--------|-----------|
| 1 matin | Phase 0 + 1 | Champs Supabase + Types + Hooks de base |
| 1 après-midi | Phase 2 | Page /prospection fonctionnelle (lecture) |
| 2 matin | Phase 3 | Actions d'appel et dialogs |
| 2 après-midi | Phase 4 | Import CSV complet |
| 3 matin | Phase 5 | Conversion lead → opportunité |
| 3 après-midi | Phase 6 | Polish, responsive, documentation |

**Total** : ~15 heures sur 3 jours

---

*Plan créé le 15 décembre 2025*
