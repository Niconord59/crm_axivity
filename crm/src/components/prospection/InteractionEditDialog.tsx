"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  Loader2,
  Phone,
  Mail,
  Video,
  MessageSquare,
  StickyNote,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUpdateInteraction } from "@/hooks/use-interactions";
import type { Interaction, InteractionType } from "@/types";

interface InteractionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interaction: Interaction | null;
}

const INTERACTION_TYPES: { value: InteractionType; label: string; icon: React.ElementType }[] = [
  { value: "Appel", label: "Appel", icon: Phone },
  { value: "Email", label: "Email", icon: Mail },
  { value: "Réunion", label: "Réunion", icon: Video },
  { value: "Note", label: "Note", icon: StickyNote },
  { value: "Autre", label: "Autre", icon: MessageSquare },
];

export function InteractionEditDialog({
  open,
  onOpenChange,
  interaction,
}: InteractionEditDialogProps) {
  const updateInteraction = useUpdateInteraction();

  const [objet, setObjet] = useState("");
  const [type, setType] = useState<InteractionType>("Note");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("09:00");
  const [resume, setResume] = useState("");

  // Populate form when interaction changes
  useEffect(() => {
    if (interaction) {
      setObjet(interaction.objet || "");
      setType(interaction.type || "Note");
      setResume(interaction.resume || "");
      if (interaction.date) {
        const d = new Date(interaction.date);
        setDate(d);
        setTime(format(d, "HH:mm"));
      } else {
        setDate(undefined);
        setTime("09:00");
      }
    }
  }, [interaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interaction) return;

    try {
      // Combine date and time
      let fullDate: string | undefined;
      if (date) {
        const [hours, minutes] = time.split(":").map(Number);
        const combined = new Date(date);
        combined.setHours(hours, minutes, 0, 0);
        fullDate = combined.toISOString();
      }

      await updateInteraction.mutateAsync({
        id: interaction.id,
        data: {
          objet,
          type,
          date: fullDate,
          resume,
        },
      });

      toast.success("Interaction modifiée");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la modification");
    }
  };

  if (!interaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;interaction</DialogTitle>
          <DialogDescription>
            Modifiez les informations de cette interaction.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Objet */}
          <div className="space-y-2">
            <Label htmlFor="objet">Objet</Label>
            <Input
              id="objet"
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
              placeholder="Objet de l'interaction"
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as InteractionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERACTION_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {t.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Date et Heure */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Heure</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Résumé */}
          <div className="space-y-2">
            <Label htmlFor="resume">Résumé / Notes</Label>
            <Textarea
              id="resume"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Détails de l'interaction..."
              rows={4}
              className="resize-y"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={updateInteraction.isPending}>
              {updateInteraction.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
