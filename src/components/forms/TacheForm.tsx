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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormDialog } from "@/components/shared/FormDialog";
import {
  tacheSchema,
  TacheFormData,
  tacheDefaultValues,
  TACHE_STATUTS,
  TACHE_PRIORITES,
} from "@/lib/schemas/tache";
import { useProjets } from "@/hooks/use-projets";
import { useEquipe } from "@/hooks/use-equipe";
import { useCreateTache, useUpdateTache } from "@/hooks/use-taches";
import type { Tache } from "@/types";

interface TacheFormProps {
  /** Tâche à éditer (si undefined, mode création) */
  tache?: Tache;
  /** Projet pré-sélectionné (pour création depuis un projet) */
  projetId?: string;
  /** Contrôle externe pour l'ouverture */
  open?: boolean;
  /** Callback de changement d'état */
  onOpenChange?: (open: boolean) => void;
  /** Trigger personnalisé */
  trigger?: React.ReactNode;
}

export function TacheForm({
  tache,
  projetId,
  open,
  onOpenChange,
  trigger,
}: TacheFormProps) {
  const { data: projets, isLoading: isLoadingProjets } = useProjets();
  const { data: equipe, isLoading: isLoadingEquipe } = useEquipe();
  const createTache = useCreateTache();
  const updateTache = useUpdateTache();

  const isEditing = !!tache;

  const defaultValues: TacheFormData = tache
    ? {
        nom: tache.nom || "",
        projetId: tache.projet?.[0] || "",
        responsableId: tache.membreEquipe?.[0] || "",
        dateEcheance: tache.dateEcheance || "",
        priorite: (tache.priorite as TacheFormData["priorite"]) || "Moyenne",
        statut: (tache.statut as TacheFormData["statut"]) || "À faire",
        heuresEstimees: tache.heuresEstimees || 0,
        description: tache.description || "",
      }
    : {
        ...tacheDefaultValues,
        projetId: projetId || "",
      } as TacheFormData;

  const handleSubmit = async (data: TacheFormData) => {
    if (isEditing && tache) {
      await updateTache.mutateAsync({
        id: tache.id,
        data: {
          nom: data.nom,
          dateEcheance: data.dateEcheance,
          priorite: data.priorite,
          statut: data.statut,
          heuresEstimees: data.heuresEstimees || undefined,
          description: data.description || undefined,
          membreEquipe: data.responsableId ? [data.responsableId] : undefined,
        },
      });
    } else {
      await createTache.mutateAsync({
        nom: data.nom,
        projet: [data.projetId],
        membreEquipe: data.responsableId ? [data.responsableId] : undefined,
        dateEcheance: data.dateEcheance,
        priorite: data.priorite,
        statut: data.statut,
        heuresEstimees: data.heuresEstimees || undefined,
        description: data.description || undefined,
      });
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Nouvelle tâche
    </Button>
  );

  return (
    <FormDialog
      title={isEditing ? "Modifier la tâche" : "Nouvelle tâche"}
      description={
        isEditing
          ? "Modifiez les informations de la tâche"
          : "Créez une nouvelle tâche"
      }
      trigger={trigger || defaultTrigger}
      schema={tacheSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Enregistrer" : "Créer"}
      successMessage={
        isEditing ? "Tâche modifiée avec succès" : "Tâche créée avec succès"
      }
      open={open}
      onOpenChange={onOpenChange}
    >
      {(form) => (
        <TacheFormFields
          form={form}
          projets={projets || []}
          equipe={equipe || []}
          isLoadingProjets={isLoadingProjets}
          isLoadingEquipe={isLoadingEquipe}
          isEditing={isEditing}
        />
      )}
    </FormDialog>
  );
}

function TacheFormFields({
  form,
  projets,
  equipe,
  isLoadingProjets,
  isLoadingEquipe,
  isEditing,
}: {
  form: UseFormReturn<TacheFormData>;
  projets: { id: string; nomProjet?: string; briefProjet?: string }[];
  equipe: { id: string; nom: string }[];
  isLoadingProjets: boolean;
  isLoadingEquipe: boolean;
  isEditing: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Nom de la tâche */}
      <FormField
        control={form.control}
        name="nom"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom de la tâche *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Maquettes page d'accueil" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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

      <div className="grid grid-cols-2 gap-4">
        {/* Responsable */}
        <FormField
          control={form.control}
          name="responsableId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsable</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingEquipe ? "Chargement..." : "Assigner à..."
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Non assigné</SelectItem>
                  {equipe.map((membre) => (
                    <SelectItem key={membre.id} value={membre.id}>
                      {membre.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      <div className="grid grid-cols-3 gap-4">
        {/* Priorité */}
        <FormField
          control={form.control}
          name="priorite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priorité *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TACHE_PRIORITES.map((priorite) => (
                    <SelectItem key={priorite} value={priorite}>
                      {priorite}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TACHE_STATUTS.map((statut) => (
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

        {/* Heures estimées */}
        <FormField
          control={form.control}
          name="heuresEstimees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heures estimées</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="4"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Détails de la tâche..."
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

export default TacheForm;
