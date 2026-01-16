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
  clientSchema,
  ClientFormData,
  clientDefaultValues,
  CLIENT_STATUTS,
} from "@/lib/schemas/client";
import { useCreateClient, useUpdateClient } from "@/hooks/use-clients";
import type { Client } from "@/types";

interface ClientFormProps {
  /** Client à éditer (si undefined, mode création) */
  client?: Client;
  /** Contrôle externe pour l'ouverture */
  open?: boolean;
  /** Callback de changement d'état */
  onOpenChange?: (open: boolean) => void;
  /** Trigger personnalisé (si non fourni, bouton par défaut) */
  trigger?: React.ReactNode;
}

export function ClientForm({
  client,
  open,
  onOpenChange,
  trigger,
}: ClientFormProps) {
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const isEditing = !!client;

  const defaultValues: ClientFormData = client
    ? {
        nom: client.nom || "",
        secteurActivite: client.secteurActivite || "",
        statut: (client.statut as ClientFormData["statut"]) || "Prospect",
        siteWeb: client.siteWeb || "",
        linkedinPage: client.linkedinPage || "",
        notes: client.notes || "",
      }
    : (clientDefaultValues as ClientFormData);

  const handleSubmit = async (data: ClientFormData) => {
    if (isEditing && client) {
      await updateClient.mutateAsync({
        id: client.id,
        data: {
          nom: data.nom,
          secteurActivite: data.secteurActivite || undefined,
          statut: data.statut,
          siteWeb: data.siteWeb || undefined,
          linkedinPage: data.linkedinPage || undefined,
          notes: data.notes || undefined,
        },
      });
    } else {
      await createClient.mutateAsync({
        nom: data.nom,
        secteurActivite: data.secteurActivite || undefined,
        statut: data.statut,
        siteWeb: data.siteWeb || undefined,
        linkedinPage: data.linkedinPage || undefined,
        notes: data.notes || undefined,
      });
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Nouveau client
    </Button>
  );

  return (
    <FormDialog
      title={isEditing ? "Modifier le client" : "Nouveau client"}
      description={
        isEditing
          ? "Modifiez les informations du client"
          : "Ajoutez un nouveau client à votre CRM"
      }
      trigger={trigger || defaultTrigger}
      schema={clientSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Enregistrer" : "Créer"}
      successMessage={
        isEditing ? "Client modifié avec succès" : "Client créé avec succès"
      }
      open={open}
      onOpenChange={onOpenChange}
    >
      {(form) => <ClientFormFields form={form} />}
    </FormDialog>
  );
}

function ClientFormFields({
  form,
}: {
  form: UseFormReturn<ClientFormData>;
}) {
  return (
    <div className="space-y-4">
      {/* Nom */}
      <FormField
        control={form.control}
        name="nom"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom du client *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Acme Corporation" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
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
                  {CLIENT_STATUTS.map((statut) => (
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

        {/* Secteur d'activité */}
        <FormField
          control={form.control}
          name="secteurActivite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secteur d'activité</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Tech, Finance, Santé..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Site Web */}
      <FormField
        control={form.control}
        name="siteWeb"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Site web</FormLabel>
            <FormControl>
              <Input placeholder="https://www.example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Page LinkedIn */}
      <FormField
        control={form.control}
        name="linkedinPage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Page LinkedIn</FormLabel>
            <FormControl>
              <Input placeholder="https://www.linkedin.com/company/..." {...field} />
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
                placeholder="Informations complémentaires sur le client..."
                className="min-h-[100px]"
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

export default ClientForm;
