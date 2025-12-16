"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  Phone,
  Building2,
  User,
  Mail,
  Globe,
  Linkedin,
  Briefcase,
  MapPin,
  Clock,
  MessageSquare,
  FileText,
  ExternalLink,
  Target,
  ArrowRight,
  Video,
  Loader2,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { callResultSchema, type CallResultFormData } from "@/lib/schemas/prospect";
import {
  useUpdateProspectStatus,
  type Prospect,
} from "@/hooks/use-prospects";
import { useCreateInteraction, useInteractions } from "@/hooks/use-interactions";
import { useClient } from "@/hooks/use-clients";
import { AgendaTab } from "./agenda";
import { ProspectProgressStepper } from "./ProspectProgressStepper";
import { EmailComposer } from "./EmailComposer";
import { Switch } from "@/components/ui/switch";

interface CallResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect | null;
}

// Options pour un appel classique (avant RDV)
const CALL_RESULTS = [
  { value: "Appelé - pas répondu", label: "Pas répondu", description: "Le contact n'a pas décroché" },
  { value: "Rappeler", label: "Rappeler", description: "Planifier un rappel" },
  { value: "RDV planifié", label: "RDV planifié", description: "Un rendez-vous a été programmé" },
  { value: "Qualifié", label: "Qualifié", description: "Le lead est qualifié, créer une opportunité" },
  { value: "Non qualifié", label: "Non qualifié", description: "Le lead ne correspond pas" },
  { value: "Perdu", label: "Perdu", description: "Le lead n'est plus intéressé" },
] as const;

// Options pour le résultat d'un RDV (quand statut = "RDV planifié")
const RDV_RESULTS = [
  { value: "RDV effectué", label: "RDV effectué", description: "Le rendez-vous a eu lieu" },
  { value: "Reporter", label: "Reporter le RDV", description: "Décaler le rendez-vous à une autre date" },
  { value: "Qualifié", label: "Qualifié", description: "Lead qualifié suite au RDV, créer une opportunité" },
  { value: "Non qualifié", label: "Non qualifié", description: "Le lead ne correspond pas à nos critères" },
  { value: "Perdu", label: "Perdu", description: "Le prospect n'est plus intéressé" },
] as const;

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  href?: string;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {value}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="text-sm break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;

  const colorMap: Record<string, string> = {
    "À appeler": "bg-blue-100 text-blue-800",
    "Appelé - pas répondu": "bg-yellow-100 text-yellow-800",
    "Rappeler": "bg-orange-100 text-orange-800",
    "RDV planifié": "bg-purple-100 text-purple-800",
    "RDV effectué": "bg-indigo-100 text-indigo-800",
    "Qualifié": "bg-green-100 text-green-800",
    "Non qualifié": "bg-gray-100 text-gray-800",
    "Perdu": "bg-red-100 text-red-800",
    "Prospect": "bg-blue-100 text-blue-800",
    "Actif": "bg-green-100 text-green-800",
    "Inactif": "bg-gray-100 text-gray-800",
    "Churned": "bg-red-100 text-red-800",
  };

  return (
    <Badge className={cn("font-normal", colorMap[status] || "bg-gray-100 text-gray-800")}>
      {status}
    </Badge>
  );
}

export function CallResultDialog({
  open,
  onOpenChange,
  prospect,
}: CallResultDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateStatus = useUpdateProspectStatus();
  const createInteraction = useCreateInteraction();

  // Fetch client details
  const clientId = prospect?.client?.[0];
  const { data: client, isLoading: clientLoading } = useClient(clientId);

  // Fetch interactions for this contact (prospect)
  // Note: ARRAYJOIN on link fields returns names, not IDs - so we filter by full name
  const contactFullName = prospect?.prenom
    ? `${prospect.prenom} ${prospect.nom}`
    : prospect?.nom;
  const { data: interactions, isLoading: interactionsLoading } = useInteractions(
    contactFullName ? { contactName: contactFullName } : undefined
  );

  const form = useForm<CallResultFormData>({
    resolver: zodResolver(callResultSchema),
    defaultValues: {
      resultat: undefined,
      dateRappel: "",
      notes: "",
      creerInteraction: true,
    },
  });

  const selectedResult = form.watch("resultat");

  // Determine if we're in RDV context (prospect has a planned meeting)
  const isRdvContext = prospect?.statutProspection === "RDV planifié";

  // Determine if it's a visio RDV (show live meeting view)
  const isVisioRdv = isRdvContext && prospect?.typeRdv === "Visio";

  // State for live notes during meeting
  const [liveNotes, setLiveNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // State for "Pas répondu" options
  const [leftVoicemail, setLeftVoicemail] = useState(false);
  const [wantToSendEmail, setWantToSendEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Use appropriate result options based on context
  const resultOptions = isRdvContext ? RDV_RESULTS : CALL_RESULTS;

  const showDatePicker = selectedResult === "Rappeler" || selectedResult === "Reporter";
  const showNotes = selectedResult !== "RDV planifié" && selectedResult !== "Appelé - pas répondu" && selectedResult !== "Reporter";
  const showInteractionCheckbox = selectedResult !== "RDV planifié" && selectedResult !== "Reporter";

  // Auto-uncheck interaction creation for "RDV planifié" (details are in calendar)
  // Auto-check interaction creation for "Reporter" (we'll create it automatically)
  useEffect(() => {
    if (selectedResult === "RDV planifié" || selectedResult === "Reporter") {
      form.setValue("creerInteraction", false);
    }
  }, [selectedResult, form]);

  const handleSubmit = async (data: CallResultFormData) => {
    if (!prospect) return;

    setIsSubmitting(true);
    try {
      // Special handling for "Reporter" - keep status as "RDV planifié" but update date
      if (data.resultat === "Reporter") {
        // Update only the RDV date, keeping status as "RDV planifié"
        await updateStatus.mutateAsync({
          id: prospect.id,
          statut: "RDV planifié",
          dateRdvPrevu: data.dateRappel, // Use the new date for the RDV
        });

        // Create interaction to record the rescheduling
        if (prospect.client?.[0]) {
          const newDate = data.dateRappel ? format(new Date(data.dateRappel), "PPP 'à' HH:mm", { locale: fr }) : "";
          await createInteraction.mutateAsync({
            objet: "RDV reporté",
            type: "Réunion",
            date: new Date().toISOString(),
            resume: `RDV reporté au ${newDate}`,
            contact: [prospect.id],
            client: prospect.client,
          });
        }

        toast.success("RDV reporté", {
          description: `Nouveau RDV: ${data.dateRappel ? format(new Date(data.dateRappel), "PPP 'à' HH:mm", { locale: fr }) : ""}`,
        });

        form.reset();
        onOpenChange(false);
        return;
      }

      // 1. Update prospect status (normal flow)
      await updateStatus.mutateAsync({
        id: prospect.id,
        statut: data.resultat,
        dateRappel: data.resultat === "Rappeler" ? data.dateRappel : undefined,
        // Clear dateRdvPrevu if RDV is done or lead is qualified/lost
        dateRdvPrevu: ["RDV effectué", "Qualifié", "Non qualifié", "Perdu"].includes(data.resultat)
          ? undefined
          : undefined,
        notes: data.notes
          ? `${prospect.notesProspection ? prospect.notesProspection + "\n\n" : ""}[${format(new Date(), "dd/MM/yyyy HH:mm")}] ${data.notes}`
          : undefined,
      });

      // 2. Create interaction if checked
      if (data.creerInteraction && prospect.client?.[0]) {
        // Use specific messages for certain statuses
        const now = format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr });
        let interactionResume: string;
        if (data.resultat === "RDV planifié") {
          interactionResume = "RDV planifié - voir Google Calendar pour les détails";
        } else if (data.resultat === "Appelé - pas répondu") {
          const parts = [`Tentative d'appel le ${now} - pas de réponse`];
          if (leftVoicemail) {
            parts.push("Message vocal laissé");
          }
          if (emailSent) {
            parts.push("Email de suivi envoyé");
          }
          interactionResume = parts.join(". ");
        } else {
          interactionResume = data.notes || `Résultat: ${data.resultat}`;
        }

        await createInteraction.mutateAsync({
          objet: isRdvContext ? `RDV - ${data.resultat}` : `Appel prospection - ${data.resultat}`,
          type: isRdvContext ? "Réunion" : "Appel",
          date: new Date().toISOString(), // Full ISO with time
          resume: interactionResume,
          contact: [prospect.id],
          client: prospect.client,
        });
      }

      toast.success("Résultat enregistré", {
        description: `Statut mis à jour: ${data.resultat}`,
      });

      // Reset form and close
      form.reset();
      onOpenChange(false);

      // If qualified, suggest creating opportunity
      if (data.resultat === "Qualifié") {
        toast.info("Lead qualifié !", {
          description: "Pensez à créer une opportunité pour ce lead.",
          duration: 5000,
        });
      }
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setLiveNotes("");
    setLeftVoicemail(false);
    setWantToSendEmail(false);
    setEmailSent(false);
    onOpenChange(false);
  };

  // Save live notes during meeting
  const handleSaveLiveNotes = async () => {
    if (!prospect || !liveNotes.trim()) return;

    setIsSavingNotes(true);
    try {
      const timestamp = format(new Date(), "dd/MM/yyyy HH:mm");
      const newNotes = prospect.notesProspection
        ? `${prospect.notesProspection}\n\n[${timestamp} - Notes RDV]\n${liveNotes}`
        : `[${timestamp} - Notes RDV]\n${liveNotes}`;

      await updateStatus.mutateAsync({
        id: prospect.id,
        statut: "RDV planifié", // Keep status unchanged
        notes: newNotes,
      });

      toast.success("Notes sauvegardées");
      setLiveNotes("");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
      console.error(error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (!prospect) return null;

  const fullName = prospect.prenom
    ? `${prospect.prenom} ${prospect.nom}`
    : prospect.nom;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Appel - {fullName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {prospect.clientNom || "Entreprise inconnue"}
            {prospect.telephone && (
              <>
                <span className="mx-2">•</span>
                <span className="text-primary font-medium">{prospect.telephone}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Stepper */}
        <ProspectProgressStepper currentStatus={prospect.statutProspection} className="py-2" />

        <Tabs defaultValue={isVisioRdv ? "meeting" : "lead"} className="w-full">
          <TabsList className={cn(
            "grid w-full",
            isVisioRdv ? "grid-cols-5" : isRdvContext ? "grid-cols-4" : "grid-cols-5"
          )}>
            <TabsTrigger value="lead">Lead</TabsTrigger>
            <TabsTrigger value="company">Entreprise</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            {!isRdvContext && <TabsTrigger value="agenda">Agenda</TabsTrigger>}
            {isVisioRdv && <TabsTrigger value="meeting">RDV en cours</TabsTrigger>}
            <TabsTrigger value="call">{isRdvContext ? "Résultat RDV" : "Résultat"}</TabsTrigger>
          </TabsList>

          {/* Lead Info Tab */}
          <TabsContent value="lead" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{fullName}</h3>
                  <StatusBadge status={prospect.statutProspection} />
                </div>

                <InfoRow icon={User} label="Nom complet" value={fullName} />
                <InfoRow icon={Briefcase} label="Poste" value={prospect.poste} />
                <Separator className="my-2" />

                <InfoRow icon={Phone} label="Téléphone" value={prospect.telephone} />
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={prospect.email}
                  href={prospect.email ? `mailto:${prospect.email}` : undefined}
                />
                <InfoRow
                  icon={Linkedin}
                  label="LinkedIn"
                  value={prospect.linkedin ? "Voir le profil" : undefined}
                  href={prospect.linkedin}
                />
                <Separator className="my-2" />

                <InfoRow icon={MapPin} label="Source" value={prospect.sourceLead} />
                {prospect.dateRappel && (
                  <InfoRow
                    icon={CalendarIcon}
                    label="Date de rappel"
                    value={format(new Date(prospect.dateRappel), "PPP", { locale: fr })}
                  />
                )}

                {prospect.notesProspection && (
                  <>
                    <Separator className="my-2" />
                    <div className="pt-2">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs">Notes de prospection</span>
                      </div>
                      <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap">
                        {prospect.notesProspection}
                      </div>
                    </div>
                  </>
                )}

                {prospect.notes && (
                  <>
                    <Separator className="my-2" />
                    <div className="pt-2">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs">Notes générales</span>
                      </div>
                      <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap">
                        {prospect.notes}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Company Info Tab */}
          <TabsContent value="company" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {clientLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Chargement...
                </div>
              ) : client ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{client.nom}</h3>
                    <StatusBadge status={client.statut} />
                  </div>

                  <InfoRow icon={Building2} label="Nom" value={client.nom} />
                  <InfoRow icon={FileText} label="SIRET" value={client.siret} />
                  <InfoRow icon={Briefcase} label="Secteur d'activité" value={client.secteurActivite} />
                  <InfoRow
                    icon={Globe}
                    label="Site web"
                    value={client.siteWeb}
                    href={client.siteWeb?.startsWith("http") ? client.siteWeb : `https://${client.siteWeb}`}
                  />
                  <Separator className="my-2" />

                  {/* Adresse */}
                  {(client.adresse || client.ville) && (
                    <>
                      <div className="flex items-start gap-3 py-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Adresse</p>
                          <p className="text-sm">
                            {client.adresse && <span>{client.adresse}<br /></span>}
                            {client.codePostal && <span>{client.codePostal} </span>}
                            {client.ville && <span>{client.ville}</span>}
                            {client.pays && client.pays !== "France" && <span><br />{client.pays}</span>}
                          </p>
                        </div>
                      </div>
                      <Separator className="my-2" />
                    </>
                  )}

                  {client.caTotal !== undefined && client.caTotal > 0 && (
                    <InfoRow
                      icon={FileText}
                      label="CA Total"
                      value={new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(client.caTotal)}
                    />
                  )}

                  <InfoRow icon={Clock} label="Santé client" value={client.santeClient} />

                  {client.dateCreation && (
                    <InfoRow
                      icon={CalendarIcon}
                      label="Client depuis"
                      value={format(new Date(client.dateCreation), "PPP", { locale: fr })}
                    />
                  )}

                  {client.notes && (
                    <>
                      <Separator className="my-2" />
                      <div className="pt-2">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-xs">Notes entreprise</span>
                        </div>
                        <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap">
                          {client.notes}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stats */}
                  <Separator className="my-2" />
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <p className="text-2xl font-bold">{client.contacts?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Contacts</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <p className="text-2xl font-bold">{client.projets?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Projets</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <p className="text-2xl font-bold">{client.opportunites?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Opportunités</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Building2 className="h-8 w-8 mb-2 opacity-50" />
                  <p>Aucune entreprise liée</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Interaction History Tab */}
          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {interactionsLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Chargement...
                </div>
              ) : interactions && interactions.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {interactions.length} interaction{interactions.length > 1 ? "s" : ""} enregistrée{interactions.length > 1 ? "s" : ""}
                  </p>
                  {interactions.map((interaction) => {
                    const isEmail = interaction.type === "Email";
                    const iconClass = isEmail ? "text-blue-500" : "text-muted-foreground";
                    const borderClass = isEmail ? "border-blue-200 bg-blue-50/30" : "";
                    const badgeClass = isEmail ? "bg-blue-100 text-blue-700 border-blue-200" : "";

                    return (
                      <div
                        key={interaction.id}
                        className={cn("border rounded-lg p-4 space-y-2", borderClass)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {isEmail ? (
                              <Mail className={cn("h-4 w-4", iconClass)} />
                            ) : (
                              <MessageSquare className={cn("h-4 w-4", iconClass)} />
                            )}
                            <span className="font-medium">{interaction.objet}</span>
                          </div>
                          <Badge variant="outline" className={cn("shrink-0", badgeClass)}>
                            {interaction.type}
                          </Badge>
                        </div>

                        {interaction.date && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(interaction.date), "PPP 'à' HH:mm", { locale: fr })}
                          </p>
                        )}

                        {interaction.resume && (
                          <div className={cn(
                            "text-sm rounded p-3 whitespace-pre-wrap",
                            isEmail
                              ? "bg-white border border-blue-100 text-foreground"
                              : "bg-muted/50 text-muted-foreground"
                          )}>
                            {interaction.resume}
                          </div>
                        )}

                        {interaction.prochaineTache && (
                          <p className="text-sm text-primary">
                            → Prochaine action: {interaction.prochaineTache}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                  <p>Aucune interaction enregistrée</p>
                  <p className="text-xs mt-1">Les appels seront enregistrés ici</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Agenda Tab - hidden when in RDV context (prospect already has a meeting planned) */}
          {!isRdvContext && (
            <TabsContent value="agenda" className="mt-4">
              <div className="h-[400px]">
                <AgendaTab
                  prospect={{
                    id: prospect.id,
                    prenom: prospect.prenom,
                    nom: prospect.nom,
                    email: prospect.email,
                    telephone: prospect.telephone,
                    entreprise: prospect.clientNom,
                    clientId: prospect.client?.[0],
                    notes: prospect.notesProspection,
                  }}
                />
              </div>
            </TabsContent>
          )}

          {/* Live Meeting Tab - only for visio RDV */}
          {isVisioRdv && (
            <TabsContent value="meeting" className="mt-4">
              <div className="h-[400px] flex flex-col">
                {/* Meeting Info Header */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Video className="h-5 w-5 text-primary" />
                        RDV Visio en cours
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {prospect.dateRdvPrevu
                          ? format(new Date(prospect.dateRdvPrevu), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
                          : "Date non définie"}
                      </p>
                    </div>
                    {prospect.lienVisio && (
                      <Button
                        onClick={() => window.open(prospect.lienVisio, "_blank")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Rejoindre
                      </Button>
                    )}
                  </div>
                  {prospect.lienVisio && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Lien Meet :</span>
                      <a
                        href={prospect.lienVisio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {prospect.lienVisio}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Live Notes Section */}
                <div className="flex-1 flex flex-col">
                  <Label className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    Prise de notes en direct
                  </Label>
                  <Textarea
                    placeholder="Prenez des notes pendant le RDV..."
                    value={liveNotes}
                    onChange={(e) => setLiveNotes(e.target.value)}
                    className="flex-1 min-h-[180px] resize-none"
                  />
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-muted-foreground">
                      Les notes seront ajoutées aux notes de prospection
                    </p>
                    <Button
                      onClick={handleSaveLiveNotes}
                      disabled={isSavingNotes || !liveNotes.trim()}
                      size="sm"
                    >
                      {isSavingNotes && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Sauvegarder les notes
                    </Button>
                  </div>
                </div>

                {/* Quick action to go to results */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    RDV terminé ? Rendez-vous dans l&apos;onglet &quot;Résultat RDV&quot; pour enregistrer le résultat.
                  </p>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Call Result Tab */}
          <TabsContent value="call" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Result selection */}
                <div className="space-y-3">
                  <Label>{isRdvContext ? "Résultat du RDV *" : "Résultat de l'appel *"}</Label>
                  <RadioGroup
                    value={selectedResult ?? ""}
                    onValueChange={(value) => form.setValue("resultat", value as CallResultFormData["resultat"])}
                    className="space-y-2"
                  >
                    {resultOptions.map((result) => (
                      <label
                        key={result.value}
                        htmlFor={result.value}
                        className={cn(
                          "flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors",
                          selectedResult === result.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <RadioGroupItem value={result.value} id={result.value} className="mt-0.5" />
                        <div className="flex-1">
                          <span className="font-medium">
                            {result.label}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {result.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                  {form.formState.errors.resultat && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.resultat.message}
                    </p>
                  )}
                </div>

                {/* Options spéciales pour "Pas répondu" */}
                {selectedResult === "Appelé - pas répondu" && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                    {/* Voicemail checkbox */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <Phone className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Message vocal laissé</Label>
                          <p className="text-xs text-muted-foreground">
                            J&apos;ai laissé un message sur la boîte vocale
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={leftVoicemail}
                        onCheckedChange={setLeftVoicemail}
                      />
                    </div>

                    <Separator />

                    {/* Email toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Envoyer un email de suivi</Label>
                          <p className="text-xs text-muted-foreground">
                            Envoyer un email au prospect depuis votre Gmail
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={wantToSendEmail}
                        onCheckedChange={setWantToSendEmail}
                        disabled={!prospect?.email}
                      />
                    </div>

                    {!prospect?.email && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 ml-11">
                        <Mail className="h-3 w-3" />
                        Aucun email renseigné pour ce contact
                      </p>
                    )}

                    {/* Email Composer */}
                    {wantToSendEmail && prospect?.email && (
                      <EmailComposer
                        prospectEmail={prospect.email}
                        prospectPrenom={prospect.prenom}
                        prospectNom={prospect.nom}
                        entreprise={prospect.clientNom}
                        leftVoicemail={leftVoicemail}
                        onEmailSent={(emailData) => {
                          // Marquer l'email comme envoyé (pour l'affichage du résumé)
                          setEmailSent(true);

                          // Créer l'interaction email dans l'historique
                          if (prospect?.client?.[0]) {
                            const emailContent = `📧 OBJET: ${emailData.subject}

📬 DESTINATAIRE: ${emailData.to}

📝 CONTENU:
${emailData.body}`;

                            // Utiliser mutate (fire and forget) pour ne pas bloquer l'UI
                            createInteraction.mutate({
                              objet: `Email: ${emailData.subject}`,
                              type: "Email",
                              date: new Date().toISOString(),
                              resume: emailContent,
                              contact: [prospect.id],
                              client: prospect.client,
                            });
                          }
                        }}
                        onCancel={() => setWantToSendEmail(false)}
                        className="mt-2"
                      />
                    )}
                  </div>
                )}

                {/* Date and time picker for "Rappeler" or "Reporter" */}
                {showDatePicker && (
                  <div className="space-y-2">
                    <Label>
                      {selectedResult === "Reporter"
                        ? "Nouvelle date et heure du RDV *"
                        : "Date et heure de rappel *"}
                    </Label>
                    <div className="flex gap-2">
                      {/* Date picker */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "flex-1 justify-start text-left font-normal",
                              !form.watch("dateRappel") && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.watch("dateRappel")
                              ? format(new Date(form.watch("dateRappel")!), "PPP", { locale: fr })
                              : "Sélectionner une date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.watch("dateRappel") ? new Date(form.watch("dateRappel")!) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                // Preserve existing time or default to 9:00 AM
                                const currentValue = form.watch("dateRappel");
                                if (currentValue) {
                                  const existingDate = new Date(currentValue);
                                  date.setHours(existingDate.getHours(), existingDate.getMinutes(), 0, 0);
                                } else {
                                  date.setHours(9, 0, 0, 0);
                                }
                                form.setValue("dateRappel", date.toISOString());
                              } else {
                                form.setValue("dateRappel", "");
                              }
                            }}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      {/* Time picker */}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <input
                          type="time"
                          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                          value={form.watch("dateRappel")
                            ? format(new Date(form.watch("dateRappel")!), "HH:mm")
                            : "09:00"
                          }
                          onChange={(e) => {
                            const currentValue = form.watch("dateRappel");
                            if (currentValue) {
                              const date = new Date(currentValue);
                              const [hours, minutes] = e.target.value.split(":").map(Number);
                              date.setHours(hours, minutes, 0, 0);
                              form.setValue("dateRappel", date.toISOString());
                            }
                          }}
                          disabled={!form.watch("dateRappel")}
                        />
                      </div>
                    </div>
                    {form.formState.errors.dateRappel && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.dateRappel.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Notes - hidden for RDV planifié since details are in the calendar event */}
                {showNotes && (
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes de l&apos;appel</Label>
                    <Textarea
                      id="notes"
                      placeholder="Résumé de la conversation..."
                      {...form.register("notes")}
                      rows={3}
                    />
                  </div>
                )}

                {/* Create interaction checkbox - hidden for RDV planifié (details in calendar) */}
                {showInteractionCheckbox && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="creerInteraction"
                        checked={form.watch("creerInteraction")}
                        onCheckedChange={(checked) =>
                          form.setValue("creerInteraction", checked as boolean)
                        }
                      />
                      <Label htmlFor="creerInteraction" className="text-sm cursor-pointer">
                        Créer une interaction dans le CRM
                      </Label>
                    </div>

                    {/* Résumé des actions pour "Pas répondu" */}
                    {selectedResult === "Appelé - pas répondu" && (
                      <div className="ml-6 space-y-2">
                        {/* Résumé des actions effectuées */}
                        {(leftVoicemail || emailSent) && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 mb-2">Actions effectuées :</p>
                            <ul className="text-sm text-blue-700 space-y-1">
                              {leftVoicemail && (
                                <li className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  Message vocal laissé
                                </li>
                              )}
                              {emailSent && (
                                <li className="flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  Email de suivi envoyé
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Prévisualisation du message d'interaction */}
                        {form.watch("creerInteraction") && (
                          <div className="p-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
                            <span className="font-medium">Message qui sera enregistré :</span>{" "}
                            &quot;Tentative d&apos;appel le {format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })} - pas de réponse
                            {leftVoicemail && ". Message vocal laissé"}
                            {emailSent && ". Email de suivi envoyé"}&quot;
                          </div>
                        )}

                        {/* Message si aucune action et pas d'interaction */}
                        {!leftVoicemail && !emailSent && !form.watch("creerInteraction") && (
                          <p className="text-xs text-amber-600">
                            Aucune action enregistrée. Cochez la case ci-dessus pour tracer cet appel.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* CTA pour créer une opportunité quand Qualifié */}
                {selectedResult === "Qualifié" && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-green-800">
                      <Target className="h-5 w-5" />
                      <span className="font-semibold">Lead qualifié !</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Ce prospect est prêt à passer à l&apos;étape suivante. Créez une opportunité pour suivre le deal dans votre pipeline commercial.
                    </p>
                    <Button
                      type="button"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        // Sauvegarder d'abord, puis rediriger
                        form.handleSubmit(async (data) => {
                          await handleSubmit(data);
                          router.push(`/opportunites?create=true&client=${prospect?.client?.[0]}&contact=${prospect?.id}&nom=${encodeURIComponent(prospect?.clientNom || "")}`);
                        })();
                      }}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Enregistrer et créer une opportunité
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </DialogFooter>
              </form>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
