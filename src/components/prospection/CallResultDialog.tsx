"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Phone, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { callResultSchema, type CallResultFormData } from "@/lib/schemas/prospect";
import {
  useUpdateProspectStatus,
  type Prospect,
} from "@/hooks/use-prospects";
import { useCreateInteraction } from "@/hooks/use-interactions";

interface CallResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect | null;
}

const CALL_RESULTS = [
  { value: "Appelé - pas répondu", label: "Pas répondu", description: "Le contact n'a pas décroché" },
  { value: "Rappeler", label: "Rappeler", description: "Planifier un nouveau contact" },
  { value: "Qualifié", label: "Qualifié", description: "Le lead est qualifié, créer une opportunité" },
  { value: "Non qualifié", label: "Non qualifié", description: "Le lead ne correspond pas" },
  { value: "Perdu", label: "Perdu", description: "Le lead n'est plus intéressé" },
] as const;

export function CallResultDialog({
  open,
  onOpenChange,
  prospect,
}: CallResultDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateStatus = useUpdateProspectStatus();
  const createInteraction = useCreateInteraction();

  const form = useForm<CallResultFormData>({
    resolver: zodResolver(callResultSchema),
    defaultValues: {
      resultat: undefined,
      dateRappel: "",
      notes: "",
      creerInteraction: true,
    },
  });

  const selectedResult = form.watch("resultat");
  const showDatePicker = selectedResult === "Rappeler";

  const handleSubmit = async (data: CallResultFormData) => {
    if (!prospect) return;

    setIsSubmitting(true);
    try {
      // 1. Update prospect status
      await updateStatus.mutateAsync({
        id: prospect.id,
        statut: data.resultat,
        dateRappel: data.resultat === "Rappeler" ? data.dateRappel : undefined,
        notes: data.notes
          ? `${prospect.notesProspection ? prospect.notesProspection + "\n\n" : ""}[${format(new Date(), "dd/MM/yyyy HH:mm")}] ${data.notes}`
          : undefined,
      });

      // 2. Create interaction if checked
      if (data.creerInteraction && prospect.client?.[0]) {
        await createInteraction.mutateAsync({
          objet: `Appel prospection - ${data.resultat}`,
          type: "Appel",
          date: new Date().toISOString().split("T")[0],
          resume: data.notes || `Résultat: ${data.resultat}`,
          contact: [prospect.id],
          client: prospect.client,
        });
      }

      toast.success("Résultat enregistré", {
        description: `Statut mis à jour: ${data.resultat}`,
      });

      // Reset form and close
      form.reset();
      onOpenChange(false);

      // If qualified, suggest creating opportunity
      if (data.resultat === "Qualifié") {
        toast.info("Lead qualifié !", {
          description: "Pensez à créer une opportunité pour ce lead.",
          duration: 5000,
        });
      }
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!prospect) return null;

  const fullName = prospect.prenom
    ? `${prospect.prenom} ${prospect.nom}`
    : prospect.nom;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Résultat de l&apos;appel
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-1">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {prospect.clientNom || "Entreprise inconnue"}
            </span>
            <span>{fullName}</span>
            {prospect.telephone && (
              <span className="text-primary font-medium">{prospect.telephone}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Result selection */}
          <div className="space-y-3">
            <Label>Résultat de l&apos;appel *</Label>
            <RadioGroup
              onValueChange={(value) => form.setValue("resultat", value as CallResultFormData["resultat"])}
              className="space-y-2"
            >
              {CALL_RESULTS.map((result) => (
                <div
                  key={result.value}
                  className={cn(
                    "flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors",
                    selectedResult === result.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => form.setValue("resultat", result.value)}
                >
                  <RadioGroupItem value={result.value} id={result.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={result.value} className="cursor-pointer font-medium">
                      {result.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {result.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
            {form.formState.errors.resultat && (
              <p className="text-sm text-destructive">
                {form.formState.errors.resultat.message}
              </p>
            )}
          </div>

          {/* Date picker for "Rappeler" */}
          {showDatePicker && (
            <div className="space-y-2">
              <Label>Date de rappel *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("dateRappel") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("dateRappel")
                      ? format(new Date(form.watch("dateRappel")!), "PPP", { locale: fr })
                      : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("dateRappel") ? new Date(form.watch("dateRappel")!) : undefined}
                    onSelect={(date) =>
                      form.setValue("dateRappel", date ? date.toISOString().split("T")[0] : "")
                    }
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.dateRappel && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.dateRappel.message}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes de l&apos;appel</Label>
            <Textarea
              id="notes"
              placeholder="Résumé de la conversation..."
              {...form.register("notes")}
              rows={3}
            />
          </div>

          {/* Create interaction checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="creerInteraction"
              checked={form.watch("creerInteraction")}
              onCheckedChange={(checked) =>
                form.setValue("creerInteraction", checked as boolean)
              }
            />
            <Label htmlFor="creerInteraction" className="text-sm cursor-pointer">
              Créer une interaction dans le CRM
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
