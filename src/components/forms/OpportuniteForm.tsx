"use client";

import { useEffect } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormDialog } from "@/components/shared/FormDialog";
import {
  opportuniteSchema,
  OpportuniteFormData,
  opportuniteDefaultValues,
  OPPORTUNITE_STATUTS,
} from "@/lib/schemas/opportunite";
import { useClients } from "@/hooks/use-clients";
import { useCreateOpportunite, useUpdateOpportunite } from "@/hooks/use-opportunites";
import type { Opportunite } from "@/types";

interface OpportuniteFormProps {
  /** Opportunité à éditer (si undefined, mode création) */
  opportunite?: Opportunite;
  /** Contrôle externe pour l'ouverture */
  open?: boolean;
  /** Callback de changement d'état */
  onOpenChange?: (open: boolean) => void;
  /** Trigger personnalisé (si non fourni, bouton par défaut) */
  trigger?: React.ReactNode;
}

export function OpportuniteForm({
  opportunite,
  open,
  onOpenChange,
  trigger,
}: OpportuniteFormProps) {
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const createOpportunite = useCreateOpportunite();
  const updateOpportunite = useUpdateOpportunite();

  const isEditing = !!opportunite;

  const defaultValues: OpportuniteFormData = opportunite
    ? {
        nom: opportunite.nom || "",
        clientId: opportunite.client?.[0] || "",
        valeurEstimee: opportunite.valeurEstimee || 0,
        probabilite: opportunite.probabilite || 50,
        dateClotureEstimee: opportunite.dateClotureEstimee || "",
        statut: opportunite.statut || "Lead",
        source: opportunite.source || "",
        notes: opportunite.notes || "",
      }
    : (opportuniteDefaultValues as OpportuniteFormData);

  const handleSubmit = async (data: OpportuniteFormData) => {
    if (isEditing && opportunite) {
      await updateOpportunite.mutateAsync({
        id: opportunite.id,
        data: {
          nom: data.nom,
          client: [data.clientId],
          valeurEstimee: data.valeurEstimee,
          probabilite: data.probabilite,
          dateClotureEstimee: data.dateClotureEstimee,
          statut: data.statut,
          source: data.source || undefined,
          notes: data.notes || undefined,
        },
      });
    } else {
      await createOpportunite.mutateAsync({
        nom: data.nom,
        client: [data.clientId],
        valeurEstimee: data.valeurEstimee,
        probabilite: data.probabilite,
        dateClotureEstimee: data.dateClotureEstimee,
        statut: data.statut,
        source: data.source || undefined,
        notes: data.notes || undefined,
      });
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Nouvelle opportunité
    </Button>
  );

  return (
    <FormDialog
      title={isEditing ? "Modifier l'opportunité" : "Nouvelle opportunité"}
      description={
        isEditing
          ? "Modifiez les informations de l'opportunité"
          : "Créez une nouvelle opportunité dans le pipeline commercial"
      }
      trigger={trigger || defaultTrigger}
      schema={opportuniteSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Enregistrer" : "Créer"}
      successMessage={
        isEditing
          ? "Opportunité modifiée avec succès"
          : "Opportunité créée avec succès"
      }
      open={open}
      onOpenChange={onOpenChange}
    >
      {(form) => <OpportuniteFormFields form={form} clients={clients || []} isLoadingClients={isLoadingClients} />}
    </FormDialog>
  );
}

function OpportuniteFormFields({
  form,
  clients,
  isLoadingClients,
}: {
  form: UseFormReturn<OpportuniteFormData>;
  clients: { id: string; nom: string }[];
  isLoadingClients: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Nom */}
      <FormField
        control={form.control}
        name="nom"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom de l'opportunité *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Refonte site web Acme Corp" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Client */}
      <FormField
        control={form.control}
        name="clientId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Client *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingClients ? "Chargement..." : "Sélectionner un client"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Valeur Estimée */}
        <FormField
          control={form.control}
          name="valeurEstimee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valeur estimée (€) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="10000"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Probabilité */}
        <FormField
          control={form.control}
          name="probabilite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Probabilité (%) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="50"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Date de clôture */}
        <FormField
          control={form.control}
          name="dateClotureEstimee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de clôture prévue *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
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
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {OPPORTUNITE_STATUTS.map((statut) => (
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

      {/* Source */}
      <FormField
        control={form.control}
        name="source"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Source</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Salon, Site web, Recommandation..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Notes */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Informations complémentaires..."
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

export default OpportuniteForm;
