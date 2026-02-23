"use client";

import { useState, useCallback } from "react";
import { Send, Paperclip, X, Loader2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useEmailTemplates } from "@/hooks/use-email-templates";
import { useSendEmail } from "@/hooks/use-send-email";
import { AVAILABLE_VARIABLES } from "@/lib/schemas/email-template";
import { ContactSelector } from "./ContactSelector";

export function EmailComposer() {
  const { data: templates } = useEmailTemplates();
  const sendEmail = useSendEmail();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [objet, setObjet] = useState("");
  const [contenu, setContenu] = useState("");
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleTemplateChange = useCallback(
    (templateId: string) => {
      setSelectedTemplateId(templateId);
      if (templateId && templateId !== "none") {
        const template = templates?.find((t) => t.id === templateId);
        if (template) {
          setObjet(template.objet);
          setContenu(template.contenu);
        }
      }
    },
    [templates]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error("La pièce jointe ne doit pas dépasser 25 Mo");
        return;
      }
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleSend = async () => {
    if (contactIds.length === 0) {
      toast.error("Sélectionnez au moins un destinataire");
      return;
    }
    if (!objet.trim()) {
      toast.error("L'objet est requis");
      return;
    }
    if (!contenu.trim()) {
      toast.error("Le contenu est requis");
      return;
    }

    try {
      const result = await sendEmail.mutateAsync({
        contactIds,
        objet,
        contenu,
        attachment: attachment || undefined,
      });

      if (result.sent > 0) {
        toast.success(
          `${result.sent} email${result.sent > 1 ? "s" : ""} envoyé${result.sent > 1 ? "s" : ""} avec succès`
        );
      }

      if (result.errors.length > 0) {
        toast.error(
          `${result.errors.length} erreur${result.errors.length > 1 ? "s" : ""}: ${result.errors[0]}`
        );
      }

      if (result.sent > 0) {
        // Reset form
        setObjet("");
        setContenu("");
        setContactIds([]);
        setAttachment(null);
        setSelectedTemplateId("");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'envoi"
      );
    }
  };

  // Preview: replace variables with example data
  const previewContent = contenu
    .replace(/\{\{prenom\}\}/g, "Jean")
    .replace(/\{\{nom\}\}/g, "Dupont")
    .replace(/\{\{email\}\}/g, "jean.dupont@example.com")
    .replace(/\{\{telephone\}\}/g, "06 12 34 56 78")
    .replace(/\{\{poste\}\}/g, "Directeur")
    .replace(/\{\{entreprise\}\}/g, "Acme Corp");

  const previewObjet = objet
    .replace(/\{\{prenom\}\}/g, "Jean")
    .replace(/\{\{nom\}\}/g, "Dupont")
    .replace(/\{\{email\}\}/g, "jean.dupont@example.com")
    .replace(/\{\{telephone\}\}/g, "06 12 34 56 78")
    .replace(/\{\{poste\}\}/g, "Directeur")
    .replace(/\{\{entreprise\}\}/g, "Acme Corp");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
      {/* Main form */}
      <div className="space-y-6">
        {/* Template selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Template</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedTemplateId}
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un template (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun template</SelectItem>
                {templates?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Email content */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Contenu de l&apos;email</CardTitle>
              <div className="flex gap-2">
                {/* Preview */}
                {(objet || contenu) && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Aperçu
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Aperçu de l&apos;email</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-muted-foreground">Objet</Label>
                          <p className="font-medium">{previewObjet || "(vide)"}</p>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-muted-foreground">
                            Contenu
                          </Label>
                          <div className="mt-2 whitespace-pre-wrap text-sm bg-muted/50 rounded-md p-4">
                            {previewContent || "(vide)"}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Les variables sont remplacées par des données
                          d&apos;exemple.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="objet">Objet</Label>
              <Input
                id="objet"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                placeholder="Objet de l'email..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="contenu">Message</Label>
                <div className="flex flex-wrap gap-1">
                  {AVAILABLE_VARIABLES.map((v) => (
                    <Badge
                      key={v.key}
                      variant="outline"
                      className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() =>
                        setContenu((prev) => prev + `{{${v.key}}}`)
                      }
                      title={v.description}
                    >
                      {`{{${v.key}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
              <Textarea
                id="contenu"
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                placeholder="Rédigez votre email..."
                className="min-h-[250px]"
              />
            </div>

            {/* Attachment */}
            <div>
              <Label>Pièce jointe</Label>
              {attachment ? (
                <div className="flex items-center gap-2 mt-1.5 p-2 bg-muted rounded-md">
                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">
                    {attachment.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(attachment.size / 1024 / 1024).toFixed(1)} Mo
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={removeAttachment}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="mt-1.5">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, documents, images. Max 25 Mo.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar: Contact selector + Send */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Destinataires</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactSelector
              selectedIds={contactIds}
              onSelectionChange={setContactIds}
            />
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={handleSend}
          disabled={
            sendEmail.isPending ||
            contactIds.length === 0 ||
            !objet.trim() ||
            !contenu.trim()
          }
        >
          {sendEmail.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Envoyer à {contactIds.length} contact
              {contactIds.length > 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
