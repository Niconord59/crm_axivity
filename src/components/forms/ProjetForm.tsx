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
  projetSchema,
  ProjetFormData,
  projetDefaultValues,
  PROJET_STATUTS,
  PROJET_PRIORITES,
} from "@/lib/schemas/projet";
import { useClients } from "@/hooks/use-clients";
import { useCreateProjet, useUpdateProjet } from "@/hooks/use-projets";
import { useAssignableUsers } from "@/hooks/use-profiles";
import type { Projet } from "@/types";

interface ProjetFormProps {
  /** Projet à éditer (si undefined, mode création) */
  projet?: Projet;
  /** Contrôle externe pour l'ouverture */
  open?: boolean;
  /** Callback de changement d'état */
  onOpenChange?: (open: boolean) => void;
  /** Trigger personnalisé */
  trigger?: React.ReactNode;
}

export function ProjetForm({
  projet,
  open,
  onOpenChange,
  trigger,
}: ProjetFormProps) {
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const { data: users, isLoading: isLoadingUsers } = useAssignableUsers();
  const createProjet = useCreateProjet();
  const updateProjet = useUpdateProjet();

  const isEditing = !!projet;

  // Cast projet to include ownerId
  const projetWithOwner = projet as (Projet & { ownerId?: string }) | undefined;

  const defaultValues: ProjetFormData = projetWithOwner
    ? {
        briefProjet: projetWithOwner.briefProjet || "",
        clientId: projetWithOwner.client?.[0] || "",
        ownerId: projetWithOwner.ownerId || "",
        budget: projetWithOwner.budget || 0,
        dateDebut: projetWithOwner.dateDebut || "",
        dateFinPrevue: projetWithOwner.dateFinPrevue || "",
        statut: (projetWithOwner.statut as ProjetFormData["statut"]) || "Cadrage",
        priorite: (projetWithOwner.priorite as ProjetFormData["priorite"]) || "Moyenne",
        notes: projetWithOwner.notes || "",
      }
    : (projetDefaultValues as ProjetFormData);

  const handleSubmit = async (data: ProjetFormData) => {
    // Convertir "__none__" en undefined pour l'ownerId
    const ownerId = data.ownerId === "__none__" || !data.ownerId ? undefined : data.ownerId;

    if (isEditing && projet) {
      await updateProjet.mutateAsync({
        id: projet.id,
        data: {
          briefProjet: data.briefProjet,
          budget: data.budget,
          dateDebut: data.dateDebut,
          dateFinPrevue: data.dateFinPrevue,
          statut: data.statut,
          priorite: data.priorite || undefined,
          notes: data.notes || undefined,
          ownerId: ownerId,
        },
      });
    } else {
      await createProjet.mutateAsync({
        briefProjet: data.briefProjet,
        client: [data.clientId],
        budget: data.budget,
        dateDebut: data.dateDebut,
        dateFinPrevue: data.dateFinPrevue,
        statut: data.statut,
        priorite: data.priorite || undefined,
        notes: data.notes || undefined,
        ownerId: ownerId,
      });
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Nouveau projet
    </Button>
  );

  return (
    <FormDialog
      title={isEditing ? "Modifier le projet" : "Nouveau projet"}
      description={
        isEditing
          ? "Modifiez les informations du projet"
          : "Créez un nouveau projet client"
      }
      trigger={trigger || defaultTrigger}
      schema={projetSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Enregistrer" : "Créer"}
      successMessage={
        isEditing ? "Projet modifié avec succès" : "Projet créé avec succès"
      }
      open={open}
      onOpenChange={onOpenChange}
    >
      {(form) => (
        <ProjetFormFields
          form={form}
          clients={clients || []}
          users={users || []}
          isLoadingClients={isLoadingClients}
          isLoadingUsers={isLoadingUsers}
          isEditing={isEditing}
        />
      )}
    </FormDialog>
  );
}

function ProjetFormFields({
  form,
  clients,
  users,
  isLoadingClients,
  isLoadingUsers,
  isEditing,
}: {
  form: UseFormReturn<ProjetFormData>;
  clients: { id: string; nom: string }[];
  users: { id: string; nom: string; prenom: string | null; email: string }[];
  isLoadingClients: boolean;
  isLoadingUsers: boolean;
  isEditing: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Brief du projet */}
      <FormField
        control={form.control}
        name="briefProjet"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brief du projet *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Refonte site web avec IA intégrée" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Client (seulement en création) */}
      {!isEditing && (
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingClients ? "Chargement..." : "Sélectionner un client"
                      }
                    />
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
      )}

      {/* Responsable du projet */}
      <FormField
        control={form.control}
        name="ownerId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Responsable</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingUsers ? "Chargement..." : "Sélectionner un responsable"
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="__none__">Aucun responsable</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.prenom ? `${user.prenom} ${user.nom}` : user.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Budget */}
        <FormField
          control={form.control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget (€) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="15000"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Priorité */}
        <FormField
          control={form.control}
          name="priorite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priorité</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PROJET_PRIORITES.map((priorite) => (
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Date de début */}
        <FormField
          control={form.control}
          name="dateDebut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de début *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date de fin prévue */}
        <FormField
          control={form.control}
          name="dateFinPrevue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de fin prévue *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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
                {PROJET_STATUTS.map((statut) => (
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

      {/* Notes */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Contexte, objectifs, contraintes..."
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

export default ProjetForm;
