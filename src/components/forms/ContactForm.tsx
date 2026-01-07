"use client";

import { UseFormReturn } from "react-hook-form";
import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  FormDescription,
} from "@/components/ui/form";
import { FormDialog } from "@/components/shared/FormDialog";
import {
  contactSchema,
  ContactFormData,
  contactToFormData,
} from "@/lib/schemas/contact";
import { useUpdateContact } from "@/hooks/use-prospects";
import { useClients } from "@/hooks/use-clients";
import type { Contact } from "@/types";

interface ContactFormProps {
  /** Contact to edit (required - this form is for editing only) */
  contact: Contact;
  /** External control for opening */
  open?: boolean;
  /** State change callback */
  onOpenChange?: (open: boolean) => void;
  /** Custom trigger (if not provided, default edit button) */
  trigger?: React.ReactNode;
}

export function ContactForm({
  contact,
  open,
  onOpenChange,
  trigger,
}: ContactFormProps) {
  const updateContact = useUpdateContact();
  const { data: clients } = useClients();

  const defaultValues: ContactFormData = contactToFormData(contact);

  const handleSubmit = async (data: ContactFormData) => {
    await updateContact.mutateAsync({
      id: contact.id,
      nom: data.nom,
      prenom: data.prenom || undefined,
      email: data.email || undefined,
      telephone: data.telephone || undefined,
      poste: data.poste || undefined,
      linkedin: data.linkedin || undefined,
      estPrincipal: data.estPrincipal,
      clientId: data.clientId || undefined,
    });
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Edit2 className="h-4 w-4" />
      <span className="sr-only">Modifier le contact</span>
    </Button>
  );

  return (
    <FormDialog
      title="Modifier le contact"
      description="Modifiez les informations du contact"
      trigger={trigger || defaultTrigger}
      schema={contactSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel="Enregistrer"
      successMessage="Contact modifié avec succès"
      open={open}
      onOpenChange={onOpenChange}
    >
      {(form) => <ContactFormFields form={form} clients={clients || []} />}
    </FormDialog>
  );
}

interface ContactFormFieldsProps {
  form: UseFormReturn<ContactFormData>;
  clients: Array<{ id: string; nom: string }>;
}

function ContactFormFields({ form, clients }: ContactFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* === Section: Informations de base === */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">
          Informations personnelles
        </h4>

        <div className="grid grid-cols-2 gap-4">
          {/* Nom */}
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom *</FormLabel>
                <FormControl>
                  <Input placeholder="Dupont" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Prénom */}
          <FormField
            control={form.control}
            name="prenom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input placeholder="Jean" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="jean.dupont@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Téléphone */}
          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input placeholder="06 12 34 56 78" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Poste */}
          <FormField
            control={form.control}
            name="poste"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poste</FormLabel>
                <FormControl>
                  <Input placeholder="Directeur Commercial" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* LinkedIn */}
          <FormField
            control={form.control}
            name="linkedin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://linkedin.com/in/jean-dupont"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Client association */}
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client associé</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
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

        {/* Contact principal */}
        <FormField
          control={form.control}
          name="estPrincipal"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Contact principal</FormLabel>
                <FormDescription>
                  Ce contact est le référent principal pour ce client
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export default ContactForm;
