"use client";

import { ReactNode, useState } from "react";
import { useForm, FieldValues, DefaultValues, UseFormReturn, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { toast } from "sonner";

interface FormDialogProps<T extends FieldValues> {
  /** Titre du dialog */
  title: string;
  /** Description sous le titre (optionnel) */
  description?: string;
  /** Élément déclencheur (bouton) - optionnel si contrôlé via open/onOpenChange */
  trigger?: ReactNode;
  /** Schéma Zod pour validation */
  schema: z.ZodSchema<T>;
  /** Valeurs par défaut (pour édition) */
  defaultValues?: DefaultValues<T>;
  /** Callback à la soumission */
  onSubmit: (data: T) => Promise<void>;
  /** Fonction qui reçoit le form et retourne les champs */
  children: (form: UseFormReturn<T>) => ReactNode;
  /** Texte du bouton de soumission */
  submitLabel?: string;
  /** Message de succès */
  successMessage?: string;
  /** Contrôle externe de l'ouverture */
  open?: boolean;
  /** Callback de changement d'état */
  onOpenChange?: (open: boolean) => void;
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
  successMessage = "Enregistré avec succès",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: FormDialogProps<T>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Support pour controlled et uncontrolled
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (data: T) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      toast.success(successMessage);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {children(form)}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Enregistrement..." : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
