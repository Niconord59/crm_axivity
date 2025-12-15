"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCalendarEvent } from "@/hooks/use-google-calendar";
import { useCreateInteraction } from "@/hooks/use-interactions";
import {
  formatEventTitle,
  formatEventDescription,
  DEFAULT_TIMEZONE,
} from "@/lib/google-calendar";
import { toast } from "sonner";
import { Loader2, Calendar, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProspectInfo {
  id?: string; // Contact ID for interaction
  prenom?: string;
  nom: string;
  email?: string;
  telephone?: string;
  entreprise?: string;
  clientId?: string; // Client ID for interaction
  notes?: string;
}

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: ProspectInfo;
  initialDate?: Date;
}

export function CreateEventDialog({
  open,
  onOpenChange,
  prospect,
  initialDate,
}: CreateEventDialogProps) {
  const { mutate: createEvent, isPending: isCreatingEvent } = useCreateCalendarEvent();
  const { mutateAsync: createInteraction, isPending: isCreatingInteraction } = useCreateInteraction();
  const isPending = isCreatingEvent || isCreatingInteraction;

  // Default to 1 hour from initial date or now
  const getDefaultStartDate = () => {
    const date = initialDate || new Date();
    // Round to next hour
    date.setMinutes(0, 0, 0);
    if (!initialDate) {
      date.setHours(date.getHours() + 1);
    }
    return date;
  };

  const getDefaultEndDate = (start: Date) => {
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    return end;
  };

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const defaultStart = getDefaultStartDate();
  const defaultEnd = getDefaultEndDate(defaultStart);

  const [title, setTitle] = useState(
    formatEventTitle(prospect.prenom, prospect.nom, prospect.entreprise)
  );
  const [description, setDescription] = useState(
    formatEventDescription(
      prospect.email,
      prospect.telephone,
      prospect.notes,
      typeof window !== "undefined" ? window.location.href : undefined
    )
  );
  const [startDateTime, setStartDateTime] = useState(formatDateTimeLocal(defaultStart));
  const [endDateTime, setEndDateTime] = useState(formatDateTimeLocal(defaultEnd));
  const [attendeeEmail, setAttendeeEmail] = useState(prospect.email || "");

  // Update form when dialog opens or prospect changes
  useEffect(() => {
    if (open) {
      const start = getDefaultStartDate();
      const end = getDefaultEndDate(start);
      setTitle(formatEventTitle(prospect.prenom, prospect.nom, prospect.entreprise));
      setDescription(
        formatEventDescription(
          prospect.email,
          prospect.telephone,
          prospect.notes,
          typeof window !== "undefined" ? window.location.href : undefined
        )
      );
      setStartDateTime(formatDateTimeLocal(start));
      setEndDateTime(formatDateTimeLocal(end));
      setAttendeeEmail(prospect.email || "");
    }
  }, [open, prospect, initialDate]);

  // Update end time when start time changes
  const handleStartChange = (value: string) => {
    setStartDateTime(value);
    // Auto-set end time to 1 hour after start
    const start = new Date(value);
    if (!isNaN(start.getTime())) {
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      setEndDateTime(formatDateTimeLocal(end));
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error("Les dates sont invalides");
      return;
    }

    if (end <= start) {
      toast.error("La date de fin doit être après la date de début");
      return;
    }

    createEvent(
      {
        summary: title,
        description,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        attendeeEmail: attendeeEmail || undefined,
        timeZone: DEFAULT_TIMEZONE,
      },
      {
        onSuccess: async (event) => {
          // Create interaction in CRM if we have contact/client IDs
          console.log("Prospect data for interaction:", { id: prospect.id, clientId: prospect.clientId });

          // Create interaction if we have a contact ID
          // Note: Client field in Airtable is auto-populated via Contact lookup
          if (prospect.id) {
            try {
              const formattedDate = format(start, "PPP à HH:mm", { locale: fr });
              await createInteraction({
                objet: `RDV planifié - ${title}`,
                type: "Réunion",
                date: start.toISOString().split("T")[0],
                resume: `RDV prévu le ${formattedDate}\n\n${description}${event.htmlLink ? `\n\nLien Google Calendar: ${event.htmlLink}` : ""}`,
                contact: [prospect.id],
                // Client is auto-populated via Contact lookup in Airtable
              });
              toast.success("Interaction ajoutée à l'historique");
            } catch (error) {
              console.error("Failed to create interaction:", error);
              toast.error("Erreur lors de l'ajout à l'historique", {
                description: error instanceof Error ? error.message : "Erreur inconnue",
              });
            }
          } else {
            console.warn("Cannot create interaction - missing contact ID:", { id: prospect.id });
            toast.warning("RDV créé sans historique", {
              description: "Le prospect n'est pas lié à un contact",
            });
          }

          toast.success("RDV créé avec succès", {
            description: event.summary,
            action: event.htmlLink
              ? {
                  label: "Voir",
                  onClick: () => window.open(event.htmlLink, "_blank"),
                }
              : undefined,
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error("Erreur lors de la création", {
            description: error.message,
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Créer un RDV
          </DialogTitle>
          <DialogDescription>
            Créer un événement dans votre Google Calendar avec les informations du prospect.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Titre
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="RDV - Nom du prospect"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Début
              </Label>
              <Input
                id="start"
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => handleStartChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end">Fin</Label>
              <Input
                id="end"
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="attendee" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Email invité (optionnel)
            </Label>
            <Input
              id="attendee"
              type="email"
              value={attendeeEmail}
              onChange={(e) => setAttendeeEmail(e.target.value)}
              placeholder="email@exemple.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Détails du RDV..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer le RDV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
