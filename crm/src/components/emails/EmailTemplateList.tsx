"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Search, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useEmailTemplates,
  useDeleteEmailTemplate,
} from "@/hooks/use-email-templates";
import { EmailTemplateForm } from "./EmailTemplateForm";
import type { EmailTemplate } from "@/types";

export function EmailTemplateList() {
  const { data: templates, isLoading } = useEmailTemplates();
  const deleteTemplate = useDeleteEmailTemplate();
  const [search, setSearch] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<
    EmailTemplate | undefined
  >();
  const [editOpen, setEditOpen] = useState(false);

  const filteredTemplates = templates?.filter(
    (t) =>
      t.nom.toLowerCase().includes(search.toLowerCase()) ||
      t.objet.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success("Template supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <EmailTemplateForm
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau template
            </Button>
          }
        />
      </div>

      {!filteredTemplates || filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {search ? "Aucun template trouvé" : "Aucun template créé"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? "Modifiez votre recherche"
                : "Créez votre premier template d'email"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-1">
                    {template.nom}
                  </CardTitle>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(template)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Supprimer ce template ?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Le template &quot;
                            {template.nom}&quot; sera définitivement supprimé.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(template.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                  Objet : {template.objet}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {template.contenu}
                </p>
                {template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((v) => (
                      <Badge key={v} variant="secondary" className="text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <EmailTemplateForm
        template={editingTemplate}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
