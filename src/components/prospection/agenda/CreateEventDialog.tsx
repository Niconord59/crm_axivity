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
import { useUpdateProspectStatus } from "@/hooks/use-prospects";
import {
  formatEventTitle,
  formatEventDescription,
  DEFAULT_TIMEZONE,
  type MeetingType,
} from "@/lib/google-calendar";
import { toast } from "sonner";
import { Loader2, Calendar, Clock, User, FileText, Plus, X, Video, MapPin } from "lucide-react";
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
  const { mutateAsync: updateProspectStatus, isPending: isUpdatingProspect } = useUpdateProspectStatus();
  const isPending = isCreatingEvent || isCreatingInteraction || isUpdatingProspect;

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
  const [attendeeEmails, setAttendeeEmails] = useState<string[]>(prospect.email ? [prospect.email] : [""]);
  const [newEmail, setNewEmail] = useState("");
  const [meetingType, setMeetingType] = useState<MeetingType>("visio");
  const [location, setLocation] = useState("");

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
      setAttendeeEmails(prospect.email ? [prospect.email] : []);
      setNewEmail("");
      setMeetingType("visio");
      setLocation("");
    }
  }, [open, prospect, initialDate]);

  // Add a new attendee email
  const handleAddEmail = () => {
    const email = newEmail.trim();
    if (email && !attendeeEmails.includes(email)) {
      setAttendeeEmails([...attendeeEmails, email]);
      setNewEmail("");
    }
  };

  // Remove an attendee email
  const handleRemoveEmail = (emailToRemove: string) => {
    setAttendeeEmails(attendeeEmails.filter(email => email !== emailToRemove));
  };

  // Handle Enter key in email input
  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

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
        attendeeEmails: attendeeEmails.filter(e => e.trim()),
        timeZone: DEFAULT_TIMEZONE,
        meetingType,
        location: meetingType === "presentiel" ? location : undefined,
      },
      {
        onSuccess: async (event) => {
          // Create interaction in CRM if we have contact/client IDs
          console.log("Prospect data for interaction:", { id: prospect.id, clientId: prospect.clientId });

          // Build interaction resume with meeting details
          const formattedDate = format(start, "PPP à HH:mm", { locale: fr });
          const meetingInfo = meetingType === "visio"
            ? event.hangoutLink
              ? `\n\n🎥 Visio: ${event.hangoutLink}`
              : "\n\n🎥 Visio (lien Meet en création...)"
            : location
              ? `\n\n📍 Lieu: ${location}`
              : "";

          // Create interaction and update prospect status if we have a contact ID
          // Note: Client field is auto-populated via Contact lookup
          if (prospect.id) {
            try {
              // 1. Create interaction
              await createInteraction({
                objet: `RDV planifié - ${title}`,
                type: "Réunion",
                date: start.toISOString(), // Full ISO with time
                resume: `RDV prévu le ${formattedDate}${meetingInfo}\n\n${description}${event.htmlLink ? `\n\nLien Google Calendar: ${event.htmlLink}` : ""}`,
                contact: [prospect.id],
                // Client is auto-populated via Contact lookup
              });

              // 2. Update prospect status to "RDV planifié" and save the RDV date, type and link
              await updateProspectStatus({
                id: prospect.id,
                statut: "RDV planifié",
                dateRdvPrevu: start.toISOString(), // Full ISO with time
                typeRdv: meetingType === "visio" ? "Visio" : "Présentiel",
                lienVisio: meetingType === "visio" ? event.hangoutLink : undefined,
              });

              toast.success("Statut mis à jour et historique enregistré");
            } catch (error) {
              console.error("Failed to create interaction or update status:", error);
              toast.error("Erreur lors de la mise à jour", {
                description: error instanceof Error ? error.message : "Erreur inconnue",
              });
            }
          } else {
            console.warn("Cannot create interaction - missing contact ID:", { id: prospect.id });
            toast.warning("RDV créé sans historique", {
              description: "Le prospect n'est pas lié à un contact",
            });
          }

          // Show success with appropriate link
          const meetLink = event.hangoutLink;
          toast.success(
            meetingType === "visio" && meetLink
              ? "RDV visio créé avec lien Meet"
              : "RDV créé avec succès",
            {
              description: event.summary,
              action: meetLink || event.htmlLink
                ? {
                    label: meetLink ? "Rejoindre" : "Voir",
                    onClick: () => window.open(meetLink || event.htmlLink, "_blank"),
                  }
                : undefined,
            }
          );
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

          {/* Meeting type selector */}
          <div className="grid gap-2">
            <Label>Type de RDV</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMeetingType("visio")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  meetingType === "visio"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <Video className="h-5 w-5" />
                <span className="font-medium">Visio</span>
              </button>
              <button
                type="button"
                onClick={() => setMeetingType("presentiel")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  meetingType === "presentiel"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <MapPin className="h-5 w-5" />
                <span className="font-medium">Présentiel</span>
              </button>
            </div>
            {meetingType === "visio" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Video className="h-3 w-3" />
                Un lien Google Meet sera créé et envoyé aux participants
              </p>
            )}
            {meetingType === "presentiel" && (
              <div className="mt-2">
                <Input
                  placeholder="Adresse du lieu de RDV"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Participants (optionnel)
            </Label>

            {/* List of added attendees */}
            {attendeeEmails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attendeeEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input to add new attendee */}
            <div className="flex gap-2">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                placeholder="email@exemple.com"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddEmail}
                disabled={!newEmail.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Appuyez sur Entrée ou cliquez sur + pour ajouter
            </p>
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
