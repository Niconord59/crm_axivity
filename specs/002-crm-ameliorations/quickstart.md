# Quickstart: Améliorations CRM Axivity - Phase 2

**Feature**: 002-crm-ameliorations
**Date**: 2025-12-14
**Prerequisite**: Phase 1 complète (branche `001-crm-axivity-interface`)

---

## Pré-requis

Avant de commencer cette phase, vérifiez que :

- [ ] L'application Phase 1 fonctionne (`npm run dev`)
- [ ] Les variables d'environnement sont configurées (`.env.local`)
- [ ] Les 18 composants Shadcn sont installés
- [ ] Les hooks de données fonctionnent (test sur le dashboard)

---

## Setup Initial

### 1. Créer la branche de développement

```bash
cd C:\Users\nicol\Desktop\APP_DEV\CRM_Axivity\Interface
git checkout -b 002-crm-ameliorations
```

### 2. Vérifier les dépendances existantes

Les dépendances suivantes sont déjà installées (Phase 1) :

```json
{
  "react-hook-form": "^7.53.0",
  "@hookform/resolvers": "^7.53.0",
  "zod": "^3.23.8",
  "recharts": "^2.13.0",
  "xlsx": "^0.18.5",
  "papaparse": "^5.5.3",
  "react-big-calendar": "^1.15.0"
}
```

### 3. Créer les nouveaux dossiers

```bash
mkdir -p src/lib/schemas
mkdir -p src/components/forms
mkdir -p src/components/charts
```

---

## Phase 1: Infrastructure (T106-T111)

### Créer le composant FormDialog

```bash
# Fichier: src/components/shared/FormDialog.tsx
```

**Template de base** :

```tsx
"use client";

import { ReactNode, useState } from "react";
import { useForm, FieldValues, DefaultValues, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

interface FormDialogProps<T extends FieldValues> {
  title: string;
  description?: string;
  trigger: ReactNode;
  schema: z.ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  onSubmit: (data: T) => Promise<void>;
  children: (form: UseFormReturn<T>) => ReactNode;
  submitLabel?: string;
}

export function FormDialog<T extends FieldValues>({
  title,
  description,
  trigger,
  schema,
  defaultValues,
  onSubmit,
  children,
  submitLabel = "Enregistrer",
}: FormDialogProps<T>) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (data: T) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {children(form)}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Créer les schémas Zod

Créer les fichiers suivants dans `src/lib/schemas/` :
- `opportunite.ts`
- `projet.ts`
- `tache.ts`
- `facture.ts`
- `client.ts`

Voir `specs/002-crm-ameliorations/contracts/form-schemas.md` pour les schémas complets.

---

## Validation des Checkpoints

### Checkpoint Phase 1: Infrastructure

```bash
# 1. Vérifier que le build passe
npm run build

# 2. Vérifier l'import des schémas
# Dans un fichier test :
import { opportuniteSchema } from "@/lib/schemas/opportunite";
console.log(opportuniteSchema.parse({
  nom: "Test",
  clientId: "rec123",
  valeurEstimee: 10000,
  probabilite: 50,
  dateCloturePrevu: new Date(),
  statut: "Lead"
}));
```

### Checkpoint Phase 2: Formulaires CRUD

Pour chaque entité, vérifier :

1. [ ] Le bouton "Nouveau X" ouvre le dialog
2. [ ] Le formulaire affiche tous les champs
3. [ ] La validation Zod fonctionne (erreurs en français)
4. [ ] La soumission crée l'enregistrement dans Supabase
5. [ ] Le dialog se ferme après succès
6. [ ] La liste se rafraîchit (invalidation React Query)

### Checkpoint Phase 3: Graphiques

1. [ ] Le graphique CA s'affiche sur le dashboard
2. [ ] Les données correspondent à Supabase
3. [ ] Le graphique est responsive
4. [ ] Les tooltips affichent les valeurs

---

## Commandes Utiles

```bash
# Lancer le dev server
npm run dev

# Build de production
npm run build

# Linting
npm run lint

# Vérifier les types
npx tsc --noEmit
```

---

## Ressources

- **Spec complète**: `specs/002-crm-ameliorations/spec.md`
- **Plan d'implémentation**: `specs/002-crm-ameliorations/plan.md`
- **Tâches détaillées**: `specs/002-crm-ameliorations/tasks.md`
- **Schémas formulaires**: `specs/002-crm-ameliorations/contracts/form-schemas.md`
- **Checklist validation**: `specs/002-crm-ameliorations/checklists/requirements.md`

---

## Troubleshooting

### Erreur Zod validation

```
ZodError: [
  { "code": "invalid_type", "expected": "date", "received": "string" }
]
```

**Solution**: Convertir les strings en Date avant validation :

```tsx
const data = {
  ...formData,
  dateEcheance: new Date(formData.dateEcheance)
};
```

### Erreur Supabase 422

```
INVALID_REQUEST_UNKNOWN
```

**Solution**: Vérifier le mapping des champs. Les noms doivent correspondre exactement aux champs Supabase.

### React Query ne rafraîchit pas

**Solution**: Invalider le cache après mutation :

```tsx
const queryClient = useQueryClient();
await queryClient.invalidateQueries({ queryKey: ["projets"] });
```

---

## Contact

Pour toute question sur cette phase, consulter :
- La documentation Phase 1 : `specs/001-crm-axivity-interface/`
- Le fichier CLAUDE.md à la racine
