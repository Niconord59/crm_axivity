"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  prospectSchema,
  type ProspectFormData,
  prospectDefaultValues,
  PROSPECT_SOURCES,
} from "@/lib/schemas/prospect";
import { useCreateProspect } from "@/hooks/use-prospects";

interface ProspectFormProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ProspectForm({ trigger, onSuccess }: ProspectFormProps) {
  const [open, setOpen] = useState(false);
  const createProspect = useCreateProspect();

  const form = useForm<ProspectFormData>({
    resolver: zodResolver(prospectSchema),
    defaultValues: prospectDefaultValues,
  });

  const handleSubmit = async (data: ProspectFormData) => {
    try {
      await createProspect.mutateAsync({
        entreprise: data.entreprise,
        nom: data.nom,
        prenom: data.prenom || undefined,
        email: data.email,
        telephone: data.telephone || undefined,
        role: data.role || undefined,
        sourceLead: data.sourceLead,
        notesProspection: data.notesProspection || undefined,
      });

      toast.success("Lead créé avec succès", {
        description: `${data.prenom ? data.prenom + " " : ""}${data.nom} - ${data.entreprise}`,
      });

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Erreur lors de la création du lead");
      console.error(error);
    }
  };

  const handleClose = () => {
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau lead
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nouveau lead
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau lead à prospecter. Les champs marqués * sont obligatoires.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Entreprise */}
          <div className="space-y-2">
            <Label htmlFor="entreprise">Entreprise *</Label>
            <Input
              id="entreprise"
              placeholder="Nom de l'entreprise"
              {...form.register("entreprise")}
            />
            {form.formState.errors.entreprise && (
              <p className="text-sm text-destructive">
                {form.formState.errors.entreprise.message}
              </p>
            )}
          </div>

          {/* Contact name (2 columns) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                placeholder="Prénom"
                {...form.register("prenom")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                placeholder="Nom"
                {...form.register("nom")}
              />
              {form.formState.errors.nom && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nom.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Phone & Role (2 columns) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="+33 6 00 00 00 00"
                {...form.register("telephone")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Input
                id="role"
                placeholder="Directeur, CEO, CTO..."
                {...form.register("role")}
              />
            </div>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="sourceLead">Source *</Label>
            <Select
              value={form.watch("sourceLead")}
              onValueChange={(value) => form.setValue("sourceLead", value as ProspectFormData["sourceLead"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une source" />
              </SelectTrigger>
              <SelectContent>
                {PROSPECT_SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.sourceLead && (
              <p className="text-sm text-destructive">
                {form.formState.errors.sourceLead.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notesProspection">Notes</Label>
            <Textarea
              id="notesProspection"
              placeholder="Informations complémentaires..."
              {...form.register("notesProspection")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={createProspect.isPending}>
              {createProspect.isPending ? "Création..." : "Créer le lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
