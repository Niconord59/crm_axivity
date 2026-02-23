"use client";

import { UseFormReturn } from "react-hook-form";
import { FormDialog } from "@/components/shared/FormDialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  emailTemplateSchema,
  type EmailTemplateFormData,
  emailTemplateDefaultValues,
  AVAILABLE_VARIABLES,
} from "@/lib/schemas/email-template";
import {
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
} from "@/hooks/use-email-templates";
import type { EmailTemplate } from "@/types";

interface EmailTemplateFormProps {
  template?: EmailTemplate;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function EmailTemplateForm({
  template,
  open,
  onOpenChange,
  trigger,
}: EmailTemplateFormProps) {
  const isEditing = !!template;
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();

  const defaultValues: EmailTemplateFormData = template
    ? {
        nom: template.nom,
        objet: template.objet,
        contenu: template.contenu,
        variables: template.variables || [],
      }
    : emailTemplateDefaultValues;

  const handleSubmit = async (data: EmailTemplateFormData) => {
    // Auto-detect variables used in subject and body
    const usedVars = AVAILABLE_VARIABLES.filter(
      (v) =>
        data.objet.includes(`{{${v.key}}}`) ||
        data.contenu.includes(`{{${v.key}}}`)
    ).map((v) => v.key);

    const templateData = { ...data, variables: usedVars };

    if (isEditing && template) {
      await updateTemplate.mutateAsync({ id: template.id, data: templateData });
    } else {
      await createTemplate.mutateAsync(templateData);
    }
  };

  return (
    <FormDialog<EmailTemplateFormData>
      title={isEditing ? "Modifier le template" : "Nouveau template"}
      description="Utilisez les variables {{prenom}}, {{nom}}, etc. dans l'objet et le contenu."
      trigger={trigger}
      schema={emailTemplateSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Modifier" : "Créer"}
      successMessage={
        isEditing ? "Template modifié avec succès" : "Template créé avec succès"
      }
      open={open}
      onOpenChange={onOpenChange}
    >
      {(form) => <TemplateFormFields form={form} />}
    </FormDialog>
  );
}

function TemplateFormFields({
  form,
}: {
  form: UseFormReturn<EmailTemplateFormData>;
}) {
  const insertVariable = (
    fieldName: "objet" | "contenu",
    variable: string
  ) => {
    const currentValue = form.getValues(fieldName);
    form.setValue(fieldName, currentValue + `{{${variable}}}`, {
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="nom"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom du template</FormLabel>
            <FormControl>
              <Input placeholder="ex: Relance commerciale" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="objet"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Objet de l&apos;email</FormLabel>
            <FormControl>
              <Input
                placeholder="ex: Bonjour {{prenom}}, votre projet..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <p className="text-sm font-medium mb-2">Variables disponibles</p>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_VARIABLES.map((v) => (
            <Badge
              key={v.key}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => insertVariable("contenu", v.key)}
              title={`Insérer {{${v.key}}} - ${v.description}`}
            >
              {`{{${v.key}}}`}
            </Badge>
          ))}
        </div>
      </div>

      <FormField
        control={form.control}
        name="contenu"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contenu de l&apos;email</FormLabel>
            <FormControl>
              <Textarea
                placeholder={`Bonjour {{prenom}},\n\nNous vous contactons pour...\n\nCordialement,\nL'équipe {{entreprise}}`}
                className="min-h-[200px]"
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
