"use client";

import { UseFormReturn } from "react-hook-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormDialog } from "@/components/shared/FormDialog";
import {
  factureSchema,
  FactureFormData,
  factureDefaultValues,
  FACTURE_STATUTS,
  calculerMontantTTC,
} from "@/lib/schemas/facture";
import { useProjets } from "@/hooks/use-projets";
import { useCreateFacture, useUpdateFacture } from "@/hooks/use-factures";
import { formatCurrency } from "@/lib/utils";
import type { Facture } from "@/types";

interface FactureFormProps {
  /** Facture à éditer (si undefined, mode création) */
  facture?: Facture;
  /** Projet pré-sélectionné */
  projetId?: string;
  /** Contrôle externe pour l'ouverture */
  open?: boolean;
  /** Callback de changement d'état */
  onOpenChange?: (open: boolean) => void;
  /** Trigger personnalisé */
  trigger?: React.ReactNode;
}

export function FactureForm({
  facture,
  projetId,
  open,
  onOpenChange,
  trigger,
}: FactureFormProps) {
  const { data: projets, isLoading: isLoadingProjets } = useProjets();
  const createFacture = useCreateFacture();
  const updateFacture = useUpdateFacture();

  const isEditing = !!facture;

  const defaultValues: FactureFormData = facture
    ? {
        numero: facture.numero || "",
        projetId: facture.projet?.[0] || "",
        montantHT: facture.montantHT || 0,
        dateEmission: facture.dateEmission || new Date().toISOString().split("T")[0],
        dateEcheance: facture.dateEcheance || "",
        statut: (facture.statut as FactureFormData["statut"]) || "Brouillon",
        notes: facture.notes || "",
      }
    : {
        ...factureDefaultValues,
        projetId: projetId || "",
      } as FactureFormData;

  const handleSubmit = async (data: FactureFormData) => {
    if (isEditing && facture) {
      await updateFacture.mutateAsync({
        id: facture.id,
        data: {
          numero: data.numero || undefined,
          montantHT: data.montantHT,
          dateEmission: data.dateEmission,
          dateEcheance: data.dateEcheance,
          statut: data.statut,
          notes: data.notes || undefined,
        },
      });
    } else {
      // Trouver le client du projet sélectionné
      const projetSelectionne = projets?.find((p) => p.id === data.projetId);
      const clientId = projetSelectionne?.client?.[0];

      await createFacture.mutateAsync({
        numero: data.numero || undefined,
        projet: [data.projetId],
        client: clientId ? [clientId] : undefined,
        montantHT: data.montantHT,
        dateEmission: data.dateEmission,
        dateEcheance: data.dateEcheance,
        statut: data.statut,
        notes: data.notes || undefined,
      });
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Nouvelle facture
    </Button>
  );

  return (
    <FormDialog
      title={isEditing ? "Modifier la facture" : "Nouvelle facture"}
      description={
        isEditing
          ? "Modifiez les informations de la facture"
          : "Créez une nouvelle facture"
      }
      trigger={trigger || defaultTrigger}
      schema={factureSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Enregistrer" : "Créer"}
      successMessage={
        isEditing ? "Facture modifiée avec succès" : "Facture créée avec succès"
      }
      open={open}
      onOpenChange={onOpenChange}
    >
      {(form) => (
        <FactureFormFields
          form={form}
          projets={projets || []}
          isLoadingProjets={isLoadingProjets}
          isEditing={isEditing}
        />
      )}
    </FormDialog>
  );
}

function FactureFormFields({
  form,
  projets,
  isLoadingProjets,
  isEditing,
}: {
  form: UseFormReturn<FactureFormData>;
  projets: { id: string; nomProjet?: string; briefProjet?: string }[];
  isLoadingProjets: boolean;
  isEditing: boolean;
}) {
  const montantHT = form.watch("montantHT");
  const montantTTC = calculerMontantTTC(montantHT || 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Numéro de facture */}
        <FormField
          control={form.control}
          name="numero"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de facture</FormLabel>
              <FormControl>
                <Input placeholder="FAC-2024-001" {...field} />
              </FormControl>
              <FormDescription>Optionnel, auto-généré si vide</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Statut */}
        <FormField
          control={form.control}
          name="statut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FACTURE_STATUTS.map((statut) => (
                    <SelectItem key={statut} value={statut}>
                      {statut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Projet (seulement en création) */}
      {!isEditing && (
        <FormField
          control={form.control}
          name="projetId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Projet *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingProjets ? "Chargement..." : "Sélectionner un projet"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projets.map((projet) => (
                    <SelectItem key={projet.id} value={projet.id}>
                      {projet.nomProjet || projet.briefProjet || "Projet sans nom"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Montant HT avec affichage TTC */}
      <FormField
        control={form.control}
        name="montantHT"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Montant HT (€) *</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="5000"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            <FormDescription>
              Montant TTC (TVA 20%) : {formatCurrency(montantTTC)}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Date d'émission */}
        <FormField
          control={form.control}
          name="dateEmission"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date d'émission *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date d'échéance */}
        <FormField
          control={form.control}
          name="dateEcheance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date d'échéance *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Notes */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Détails de facturation, conditions..."
                className="min-h-[80px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export default FactureForm;
