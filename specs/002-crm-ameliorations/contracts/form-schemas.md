# Form Schemas Contract - Améliorations Phase 2

**Feature**: 002-crm-ameliorations
**Date**: 2025-12-14

Ce document définit les schémas Zod pour tous les formulaires CRUD.

---

## 1. Opportunité Schema

**File**: `src/lib/schemas/opportunite.ts`

```typescript
import { z } from "zod";

export const opportuniteSchema = z.object({
  // Champ obligatoire - Nom de l'opportunité
  nom: z
    .string()
    .min(1, "Le nom de l'opportunité est requis")
    .max(200, "Le nom ne peut pas dépasser 200 caractères"),

  // Lien vers Client (ID Airtable)
  clientId: z
    .string()
    .min(1, "Veuillez sélectionner un client"),

  // Valeur estimée en euros
  valeurEstimee: z
    .number()
    .min(0, "La valeur doit être positive")
    .max(10000000, "La valeur ne peut pas dépasser 10 000 000 €"),

  // Probabilité de conversion (0-100%)
  probabilite: z
    .number()
    .min(0, "La probabilité doit être entre 0 et 100")
    .max(100, "La probabilité doit être entre 0 et 100"),

  // Date de clôture prévue
  dateCloturePrevu: z
    .date()
    .refine((date) => date >= new Date(), {
      message: "La date de clôture doit être dans le futur",
    }),

  // Statut pipeline
  statut: z.enum([
    "Lead",
    "Qualifié",
    "Proposition envoyée",
    "Négociation",
    "Gagnée",
    "Perdue"
  ], {
    errorMap: () => ({ message: "Veuillez sélectionner un statut valide" }),
  }),

  // Notes (optionnel)
  notes: z
    .string()
    .max(5000, "Les notes ne peuvent pas dépasser 5000 caractères")
    .optional(),
});

export type OpportuniteFormData = z.infer<typeof opportuniteSchema>;

// Schéma pour l'édition (id requis)
export const opportuniteUpdateSchema = opportuniteSchema.extend({
  id: z.string().min(1),
});
```

### Mapping Airtable

| Form Field | Airtable Field | Type |
|------------|----------------|------|
| nom | Nom Opportunité | Text |
| clientId | Client | Link to Clients |
| valeurEstimee | Valeur Estimée | Currency |
| probabilite | Probabilité | Percent |
| dateCloturePrevu | Date Clôture Prévue | Date |
| statut | Statut | Single Select |
| notes | Notes | Long Text |

---

## 2. Projet Schema

**File**: `src/lib/schemas/projet.ts`

```typescript
import { z } from "zod";

export const projetSchema = z.object({
  // Brief du projet (devient le nom via formula)
  briefProjet: z
    .string()
    .min(1, "Le brief du projet est requis")
    .max(500, "Le brief ne peut pas dépasser 500 caractères"),

  // Lien vers Client
  clientId: z
    .string()
    .min(1, "Veuillez sélectionner un client"),

  // Budget total en euros
  budgetTotal: z
    .number()
    .min(0, "Le budget doit être positif")
    .max(10000000, "Le budget ne peut pas dépasser 10 000 000 €"),

  // Date de début
  dateDebut: z.date({
    required_error: "La date de début est requise",
  }),

  // Date de fin prévue
  dateFinPrevue: z.date({
    required_error: "La date de fin prévue est requise",
  }),

  // Statut du projet
  statut: z.enum([
    "Planification",
    "En cours",
    "En revue",
    "Terminé",
    "Facturé"
  ], {
    errorMap: () => ({ message: "Veuillez sélectionner un statut valide" }),
  }),

  // Responsable (lien vers Équipe) - optionnel
  responsableId: z
    .string()
    .optional(),

  // Description détaillée (optionnel)
  description: z
    .string()
    .max(10000, "La description ne peut pas dépasser 10000 caractères")
    .optional(),
}).refine((data) => data.dateFinPrevue >= data.dateDebut, {
  message: "La date de fin doit être après la date de début",
  path: ["dateFinPrevue"],
});

export type ProjetFormData = z.infer<typeof projetSchema>;
```

### Mapping Airtable

| Form Field | Airtable Field | Type |
|------------|----------------|------|
| briefProjet | Brief Projet | Text |
| clientId | Client | Link to Clients |
| budgetTotal | Budget Total | Currency |
| dateDebut | Date Début | Date |
| dateFinPrevue | Date Fin Prévue | Date |
| statut | Statut | Single Select |
| responsableId | Responsable | Link to Équipe |
| description | Description | Long Text |

---

## 3. Tâche Schema

**File**: `src/lib/schemas/tache.ts`

```typescript
import { z } from "zod";

export const tacheSchema = z.object({
  // Nom de la tâche
  nom: z
    .string()
    .min(1, "Le nom de la tâche est requis")
    .max(300, "Le nom ne peut pas dépasser 300 caractères"),

  // Lien vers Projet
  projetId: z
    .string()
    .min(1, "Veuillez sélectionner un projet"),

  // Responsable (lien vers Équipe)
  responsableId: z
    .string()
    .min(1, "Veuillez assigner un responsable"),

  // Date d'échéance
  dateEcheance: z.date({
    required_error: "La date d'échéance est requise",
  }),

  // Priorité
  priorite: z.enum(["P1", "P2", "P3"], {
    errorMap: () => ({ message: "Veuillez sélectionner une priorité" }),
  }),

  // Statut
  statut: z.enum([
    "À faire",
    "En cours",
    "En revue",
    "Terminée",
    "Bloquée"
  ], {
    errorMap: () => ({ message: "Veuillez sélectionner un statut valide" }),
  }),

  // Heures estimées (optionnel)
  heuresEstimees: z
    .number()
    .min(0, "Les heures doivent être positives")
    .max(1000, "Les heures ne peuvent pas dépasser 1000")
    .optional(),

  // Description (optionnel)
  description: z
    .string()
    .max(5000, "La description ne peut pas dépasser 5000 caractères")
    .optional(),
});

export type TacheFormData = z.infer<typeof tacheSchema>;
```

### Mapping Airtable

| Form Field | Airtable Field | Type |
|------------|----------------|------|
| nom | Nom Tâche | Text |
| projetId | Projet | Link to Projets |
| responsableId | Membre Équipe | Link to Équipe |
| dateEcheance | Date Échéance | Date |
| priorite | Priorité | Single Select |
| statut | Statut | Single Select |
| heuresEstimees | Heures Estimées | Number |
| description | Description | Long Text |

---

## 4. Facture Schema

**File**: `src/lib/schemas/facture.ts`

```typescript
import { z } from "zod";

export const factureSchema = z.object({
  // Référence unique
  reference: z
    .string()
    .min(1, "La référence est requise")
    .max(50, "La référence ne peut pas dépasser 50 caractères")
    .regex(/^FAC-\d{4}-\d{3}$/, "Format attendu: FAC-YYYY-NNN"),

  // Lien vers Projet
  projetId: z
    .string()
    .min(1, "Veuillez sélectionner un projet"),

  // Montant HT
  montantHT: z
    .number()
    .min(0, "Le montant doit être positif")
    .max(10000000, "Le montant ne peut pas dépasser 10 000 000 €"),

  // Date d'émission
  dateEmission: z.date({
    required_error: "La date d'émission est requise",
  }),

  // Date d'échéance
  dateEcheance: z.date({
    required_error: "La date d'échéance est requise",
  }),

  // Statut
  statut: z.enum([
    "Brouillon",
    "Envoyée",
    "Payée",
    "Annulée"
  ], {
    errorMap: () => ({ message: "Veuillez sélectionner un statut valide" }),
  }),

  // Notes (optionnel)
  notes: z
    .string()
    .max(2000, "Les notes ne peuvent pas dépasser 2000 caractères")
    .optional(),
}).refine((data) => data.dateEcheance >= data.dateEmission, {
  message: "La date d'échéance doit être après la date d'émission",
  path: ["dateEcheance"],
});

export type FactureFormData = z.infer<typeof factureSchema>;

// Champ calculé (non dans le form, affiché seulement)
export const calculerMontantTTC = (montantHT: number): number => {
  return montantHT * 1.2; // TVA 20%
};
```

### Mapping Airtable

| Form Field | Airtable Field | Type |
|------------|----------------|------|
| reference | Référence | Text |
| projetId | Projet | Link to Projets |
| montantHT | Montant HT | Currency |
| dateEmission | Date Émission | Date |
| dateEcheance | Date Échéance | Date |
| statut | Statut | Single Select |
| notes | Notes | Long Text |

**Note**: `Montant TTC` est une formule Airtable (`{Montant HT} * 1.2`), non éditable.

---

## 5. Client Schema

**File**: `src/lib/schemas/client.ts`

```typescript
import { z } from "zod";

export const clientSchema = z.object({
  // Nom de l'entreprise
  nom: z
    .string()
    .min(1, "Le nom du client est requis")
    .max(200, "Le nom ne peut pas dépasser 200 caractères"),

  // Email principal
  email: z
    .string()
    .email("Veuillez entrer un email valide")
    .optional()
    .or(z.literal("")),

  // Téléphone
  telephone: z
    .string()
    .regex(/^(\+33|0)[1-9](\d{2}){4}$/, "Format attendu: +33XXXXXXXXX ou 0XXXXXXXXX")
    .optional()
    .or(z.literal("")),

  // Secteur d'activité (optionnel)
  secteur: z
    .string()
    .max(100, "Le secteur ne peut pas dépasser 100 caractères")
    .optional(),

  // Statut client
  statut: z.enum([
    "Prospect",
    "Actif",
    "Ancien"
  ], {
    errorMap: () => ({ message: "Veuillez sélectionner un statut valide" }),
  }),

  // Site web (optionnel)
  siteWeb: z
    .string()
    .url("Veuillez entrer une URL valide")
    .optional()
    .or(z.literal("")),

  // Adresse (optionnel)
  adresse: z
    .string()
    .max(500, "L'adresse ne peut pas dépasser 500 caractères")
    .optional(),

  // Notes (optionnel)
  notes: z
    .string()
    .max(5000, "Les notes ne peuvent pas dépasser 5000 caractères")
    .optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
```

### Mapping Airtable

| Form Field | Airtable Field | Type |
|------------|----------------|------|
| nom | Nom | Text (Primary) |
| email | Email | Email |
| telephone | Téléphone | Phone |
| secteur | Secteur | Text |
| statut | Statut | Single Select |
| siteWeb | Site Web | URL |
| adresse | Adresse | Long Text |
| notes | Notes | Long Text |

---

## FormDialog Component Contract

**File**: `src/components/shared/FormDialog.tsx`

```typescript
interface FormDialogProps<T extends FieldValues> {
  // Titre du dialog
  title: string;

  // Description sous le titre (optionnel)
  description?: string;

  // Élément déclencheur (bouton)
  trigger: React.ReactNode;

  // Schéma Zod pour validation
  schema: z.ZodSchema<T>;

  // Valeurs par défaut (pour édition)
  defaultValues?: DefaultValues<T>;

  // Callback à la soumission
  onSubmit: (data: T) => Promise<void>;

  // Champs du formulaire
  children: React.ReactNode;

  // État de chargement
  isLoading?: boolean;

  // Texte du bouton de soumission
  submitLabel?: string;
}
```

### Comportement Attendu

1. **Ouverture**: Le trigger ouvre le Dialog
2. **Validation**: Zod valide en temps réel à chaque blur
3. **Erreurs**: Affichées sous chaque champ en rouge
4. **Soumission**: Désactive le bouton et affiche un spinner
5. **Succès**: Ferme le Dialog et affiche un toast de confirmation
6. **Erreur**: Affiche un toast d'erreur, reste ouvert

### Styles

- Dialog fullscreen sur mobile (< 768px)
- Dialog centré avec max-width 500px sur desktop
- Boutons alignés à droite (Annuler | Soumettre)
- Scrollable si contenu dépasse la hauteur

---

## Messages d'Erreur Standardisés

| Type | Message FR |
|------|------------|
| required | "Ce champ est requis" |
| email | "Veuillez entrer un email valide" |
| url | "Veuillez entrer une URL valide" |
| phone | "Format attendu: +33XXXXXXXXX ou 0XXXXXXXXX" |
| min (string) | "Ce champ doit contenir au moins {min} caractères" |
| max (string) | "Ce champ ne peut pas dépasser {max} caractères" |
| min (number) | "La valeur doit être au moins {min}" |
| max (number) | "La valeur ne peut pas dépasser {max}" |
| date.future | "La date doit être dans le futur" |
| date.after | "La date de fin doit être après la date de début" |
| select | "Veuillez sélectionner une option" |
