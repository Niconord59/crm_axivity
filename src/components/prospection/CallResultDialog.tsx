"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
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
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PhoneCall,
  Users,
  TrendingUp,
  Copy,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  { value: "Appelé - pas répondu", label: "Pas répondu", description: "Le contact n'a pas décroché", icon: PhoneCall, color: "text-slate-500" },
  { value: "Rappeler", label: "Rappeler", description: "Planifier un rappel", icon: Clock, color: "text-orange-500" },
  { value: "RDV planifié", label: "RDV planifié", description: "Un rendez-vous a été programmé", icon: CalendarIcon, color: "text-violet-500" },
  { value: "Qualifié", label: "Qualifié", description: "Le lead est qualifié, créer une opportunité", icon: CheckCircle2, color: "text-emerald-500" },
  { value: "Non qualifié", label: "Non qualifié", description: "Le lead ne correspond pas", icon: AlertCircle, color: "text-amber-500" },
  { value: "Perdu", label: "Perdu", description: "Le lead n'est plus intéressé", icon: XCircle, color: "text-red-500" },
] as const;

// Options pour le résultat d'un RDV (quand statut = "RDV planifié")
const RDV_RESULTS = [
  { value: "RDV effectué", label: "RDV effectué", description: "Le rendez-vous a eu lieu", icon: CheckCircle2, color: "text-indigo-500" },
  { value: "Reporter", label: "Reporter le RDV", description: "Décaler le rendez-vous à une autre date", icon: Clock, color: "text-orange-500" },
  { value: "Qualifié", label: "Qualifié", description: "Lead qualifié suite au RDV, créer une opportunité", icon: Target, color: "text-emerald-500" },
  { value: "Non qualifié", label: "Non qualifié", description: "Le lead ne correspond pas à nos critères", icon: AlertCircle, color: "text-amber-500" },
  { value: "Perdu", label: "Perdu", description: "Le prospect n'est plus intéressé", icon: XCircle, color: "text-red-500" },
] as const;

// Configuration des couleurs par statut (cohérent avec LeadCard)
function getStatusConfig(status: string | undefined) {
  switch (status) {
    case "À appeler":
      return { badge: "bg-blue-100 text-blue-800 border-blue-200", avatar: "bg-blue-100 text-blue-700" };
    case "Appelé - pas répondu":
      return { badge: "bg-slate-100 text-slate-700 border-slate-200", avatar: "bg-slate-100 text-slate-600" };
    case "Rappeler":
      return { badge: "bg-orange-100 text-orange-800 border-orange-200", avatar: "bg-orange-100 text-orange-700" };
    case "RDV planifié":
      return { badge: "bg-violet-100 text-violet-800 border-violet-200", avatar: "bg-violet-100 text-violet-700" };
    case "RDV effectué":
      return { badge: "bg-indigo-100 text-indigo-800 border-indigo-200", avatar: "bg-indigo-100 text-indigo-700" };
    case "Qualifié":
      return { badge: "bg-emerald-100 text-emerald-800 border-emerald-200", avatar: "bg-emerald-100 text-emerald-700" };
    case "Non qualifié":
      return { badge: "bg-amber-100 text-amber-800 border-amber-200", avatar: "bg-amber-100 text-amber-700" };
    case "Perdu":
      return { badge: "bg-red-100 text-red-800 border-red-200", avatar: "bg-red-100 text-red-700" };
    case "Prospect":
    case "Actif":
      return { badge: "bg-green-100 text-green-800 border-green-200", avatar: "bg-green-100 text-green-700" };
    case "Inactif":
    case "Churned":
      return { badge: "bg-gray-100 text-gray-700 border-gray-200", avatar: "bg-gray-100 text-gray-600" };
    default:
      return { badge: "bg-gray-100 text-gray-700 border-gray-200", avatar: "bg-gray-100 text-gray-600" };
  }
}

function InfoCard({
  icon: Icon,
  label,
  value,
  href,
  copyable,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  href?: string;
  copyable?: boolean;
}) {
  if (!value) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success("Copié dans le presse-papier");
  };

  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <span className="truncate">{value}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          <p className="text-sm font-medium truncate">{value}</p>
        )}
      </div>
      {copyable && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="text-center p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border">
      <div className={cn("flex items-center justify-center mb-2", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
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
  const { data: interactions, isLoading: interactionsLoading } = useInteractions(
    prospect?.id ? { contactId: prospect.id } : undefined
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
        await updateStatus.mutateAsync({
          id: prospect.id,
          statut: "RDV planifié",
          dateRdvPrevu: data.dateRappel,
        });

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
        dateRdvPrevu: ["RDV effectué", "Qualifié", "Non qualifié", "Perdu"].includes(data.resultat)
          ? undefined
          : undefined,
        notes: data.notes
          ? `${prospect.notesProspection ? prospect.notesProspection + "\n\n" : ""}[${format(new Date(), "dd/MM/yyyy HH:mm")}] ${data.notes}`
          : undefined,
      });

      // 2. Create interaction if checked
      if (data.creerInteraction && prospect.client?.[0]) {
        const now = format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr });
        let interactionResume: string;
        if (data.resultat === "RDV planifié") {
          interactionResume = "RDV planifié - voir Google Calendar pour les détails";
        } else if (data.resultat === "Appelé - pas répondu") {
          const parts = [`Tentative d'appel le ${now} - pas de réponse`];
          if (leftVoicemail) parts.push("Message vocal laissé");
          if (emailSent) parts.push("Email de suivi envoyé");
          interactionResume = parts.join(". ");
        } else {
          interactionResume = data.notes || `Résultat: ${data.resultat}`;
        }

        await createInteraction.mutateAsync({
          objet: isRdvContext ? `RDV - ${data.resultat}` : `Appel prospection - ${data.resultat}`,
          type: isRdvContext ? "Réunion" : "Appel",
          date: new Date().toISOString(),
          resume: interactionResume,
          contact: [prospect.id],
          client: prospect.client,
        });
      }

      toast.success("Résultat enregistré", {
        description: `Statut mis à jour: ${data.resultat}`,
      });

      form.reset();
      onOpenChange(false);

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
        statut: "RDV planifié",
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

  const initials = prospect.prenom
    ? `${prospect.prenom[0]}${prospect.nom[0]}`
    : prospect.nom.slice(0, 2);

  const statusConfig = getStatusConfig(prospect.statutProspection);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[750px] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header amélioré - fixe */}
        <div className="shrink-0 p-6 pb-4 pr-14 border-b bg-gradient-to-r from-muted/30 to-transparent">
          <div className="flex items-start gap-4">
            <Avatar className={cn("h-14 w-14 shrink-0 ring-2 ring-background shadow-lg", statusConfig.avatar)}>
              <AvatarFallback className={cn("text-lg font-bold", statusConfig.avatar)}>
                {initials.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <DialogTitle className="text-xl font-bold">{fullName}</DialogTitle>
                <Badge variant="outline" className={cn("shrink-0", statusConfig.badge)}>
                  {prospect.statutProspection || "N/A"}
                </Badge>
              </div>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Building2 className="h-4 w-4" />
                <span>{prospect.clientNom || "Entreprise inconnue"}</span>
              </DialogDescription>
              {/* Contact rapide */}
              <div className="flex items-center gap-4 mt-3">
                {prospect.telephone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(prospect.telephone!);
                      toast.success("Numéro copié");
                    }}
                  >
                    <Phone className="h-3 w-3 mr-1.5" />
                    {prospect.telephone}
                  </Button>
                )}
                {prospect.email && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(prospect.email!);
                      toast.success("Email copié");
                    }}
                  >
                    <Mail className="h-3 w-3 mr-1.5" />
                    <span className="truncate max-w-[150px]">{prospect.email}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Progress Stepper */}
          <ProspectProgressStepper currentStatus={prospect.statutProspection} className="mt-4" />
        </div>

        {/* Tabs avec icônes - flex pour remplir l'espace */}
        <Tabs defaultValue={isVisioRdv ? "meeting" : "lead"} className="flex-1 flex flex-col min-h-0">
          <div className="shrink-0 px-6 pt-2 border-b">
            <TabsList className={cn(
              "grid w-full h-10",
              isVisioRdv ? "grid-cols-5" : isRdvContext ? "grid-cols-4" : "grid-cols-5"
            )}>
              <TabsTrigger value="lead" className="text-xs gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lead</span>
              </TabsTrigger>
              <TabsTrigger value="company" className="text-xs gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Entreprise</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs gap-1.5">
                <History className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Historique</span>
              </TabsTrigger>
              {!isRdvContext && (
                <TabsTrigger value="agenda" className="text-xs gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Agenda</span>
                </TabsTrigger>
              )}
              {isVisioRdv && (
                <TabsTrigger value="meeting" className="text-xs gap-1.5">
                  <Video className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">RDV</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="call" className="text-xs gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isRdvContext ? "Résultat" : "Résultat"}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Lead Info Tab */}
          <TabsContent value="lead" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6">
              <div className="space-y-3">
                <InfoCard icon={User} label="Nom complet" value={fullName} />
                <InfoCard icon={Briefcase} label="Poste" value={prospect.poste} />

                <Separator className="my-4" />

                <InfoCard icon={Phone} label="Téléphone" value={prospect.telephone} copyable />
                <InfoCard
                  icon={Mail}
                  label="Email"
                  value={prospect.email}
                  href={prospect.email ? `mailto:${prospect.email}` : undefined}
                  copyable
                />
                <InfoCard
                  icon={Linkedin}
                  label="LinkedIn"
                  value={prospect.linkedin ? "Voir le profil" : undefined}
                  href={prospect.linkedin}
                />

                <Separator className="my-4" />

                <InfoCard icon={MapPin} label="Source" value={prospect.sourceLead} />
                {prospect.dateRappel && (
                  <InfoCard
                    icon={CalendarIcon}
                    label="Date de rappel"
                    value={format(parseISO(prospect.dateRappel), "PPP", { locale: fr })}
                  />
                )}

                {prospect.notesProspection && (
                  <>
                    <Separator className="my-4" />
                    <div className="p-4 bg-muted/30 rounded-xl border">
                      <div className="flex items-center gap-2 text-muted-foreground mb-3">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">Notes de prospection</span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {prospect.notesProspection}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Company Info Tab */}
          <TabsContent value="company" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6">
              {clientLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : client ? (
                <div className="space-y-3">
                  {/* Header entreprise */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{client.nom}</h3>
                      {client.secteurActivite && (
                        <p className="text-sm text-muted-foreground">{client.secteurActivite}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={getStatusConfig(client.statut).badge}>
                      {client.statut || "Prospect"}
                    </Badge>
                  </div>

                  <InfoCard icon={FileText} label="SIRET" value={client.siret} copyable />
                  <InfoCard
                    icon={Globe}
                    label="Site web"
                    value={client.siteWeb}
                    href={client.siteWeb?.startsWith("http") ? client.siteWeb : `https://${client.siteWeb}`}
                  />

                  {/* Adresse */}
                  {(client.adresse || client.ville) && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Adresse</p>
                          <p className="text-sm font-medium">
                            {client.adresse && <span>{client.adresse}<br /></span>}
                            {client.codePostal && <span>{client.codePostal} </span>}
                            {client.ville && <span>{client.ville}</span>}
                            {client.pays && client.pays !== "France" && <span><br />{client.pays}</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <Separator className="my-4" />
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard
                      icon={Users}
                      label="Contacts"
                      value={client.contacts?.length || 0}
                      color="text-blue-500"
                    />
                    <StatCard
                      icon={Briefcase}
                      label="Projets"
                      value={client.projets?.length || 0}
                      color="text-emerald-500"
                    />
                    <StatCard
                      icon={Target}
                      label="Opportunités"
                      value={client.opportunites?.length || 0}
                      color="text-violet-500"
                    />
                  </div>

                  {client.caTotal !== undefined && client.caTotal > 0 && (
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-transparent border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600 font-medium">CA Total</p>
                          <p className="text-xl font-bold text-emerald-700">
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            }).format(client.caTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Building2 className="h-10 w-10 mb-3 opacity-30" />
                  <p className="font-medium">Aucune entreprise liée</p>
                  <p className="text-xs mt-1">Ce lead n&apos;est pas rattaché à un client</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Interaction History Tab */}
          <TabsContent value="history" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6">
              {interactionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : interactions && interactions.length > 0 ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium">
                      {interactions.length} interaction{interactions.length > 1 ? "s" : ""}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      <History className="h-3 w-3 mr-1" />
                      Historique
                    </Badge>
                  </div>

                  {/* Timeline */}
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                    {interactions.map((interaction, index) => {
                      const isEmail = interaction.type === "Email";
                      const isCall = interaction.type === "Appel";
                      const isMeeting = interaction.type === "Réunion";

                      const iconBg = isEmail
                        ? "bg-blue-100 text-blue-600"
                        : isCall
                        ? "bg-orange-100 text-orange-600"
                        : isMeeting
                        ? "bg-violet-100 text-violet-600"
                        : "bg-gray-100 text-gray-600";

                      return (
                        <div key={interaction.id} className="relative pl-10 pb-6 last:pb-0">
                          {/* Timeline dot */}
                          <div className={cn(
                            "absolute left-0 top-0 h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-background",
                            iconBg
                          )}>
                            {isEmail ? (
                              <Mail className="h-4 w-4" />
                            ) : isCall ? (
                              <Phone className="h-4 w-4" />
                            ) : isMeeting ? (
                              <Video className="h-4 w-4" />
                            ) : (
                              <MessageSquare className="h-4 w-4" />
                            )}
                          </div>

                          <div className={cn(
                            "p-4 rounded-xl border transition-colors",
                            isEmail ? "bg-blue-50/50 border-blue-200" : "bg-muted/30"
                          )}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="font-medium text-sm">{interaction.objet}</span>
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                {interaction.type}
                              </Badge>
                            </div>

                            {interaction.date && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(interaction.date), "PPP 'à' HH:mm", { locale: fr })}
                              </p>
                            )}

                            {interaction.resume && (
                              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-background/50 rounded-lg p-3 border">
                                {interaction.resume}
                              </div>
                            )}

                            {interaction.prochaineTache && (
                              <p className="text-sm text-primary mt-2 flex items-center gap-1">
                                <ArrowRight className="h-3 w-3" />
                                {interaction.prochaineTache}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
                  <p className="font-medium">Aucune interaction</p>
                  <p className="text-xs mt-1">Les appels et emails seront enregistrés ici</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Agenda Tab */}
          {!isRdvContext && (
            <TabsContent value="agenda" className="mt-0 flex-1 overflow-hidden p-6">
              <div className="h-full">
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

          {/* Live Meeting Tab */}
          {isVisioRdv && (
            <TabsContent value="meeting" className="mt-0 flex-1 overflow-hidden p-6">
              <div className="h-full flex flex-col">
                {/* Meeting Info Header */}
                <div className="bg-gradient-to-r from-violet-50 to-transparent border border-violet-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                        <Video className="h-6 w-6 text-violet-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-violet-900">RDV Visio en cours</h3>
                        <p className="text-sm text-violet-600">
                          {prospect.dateRdvPrevu
                            ? format(parseISO(prospect.dateRdvPrevu), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
                            : "Date non définie"}
                        </p>
                      </div>
                    </div>
                    {prospect.lienVisio && (
                      <Button
                        onClick={() => window.open(prospect.lienVisio, "_blank")}
                        className="bg-green-600 hover:bg-green-700 shadow-lg"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Rejoindre
                      </Button>
                    )}
                  </div>
                  {prospect.lienVisio && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="text-violet-600">Lien :</span>
                      <a
                        href={prospect.lienVisio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-700 hover:underline flex items-center gap-1 font-medium"
                      >
                        {prospect.lienVisio}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Live Notes Section */}
                <div className="flex-1 flex flex-col">
                  <Label className="flex items-center gap-2 mb-2 font-medium">
                    <FileText className="h-4 w-4" />
                    Prise de notes en direct
                  </Label>
                  <Textarea
                    placeholder="Prenez des notes pendant le RDV..."
                    value={liveNotes}
                    onChange={(e) => setLiveNotes(e.target.value)}
                    className="flex-1 min-h-[150px] resize-none"
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
                      Sauvegarder
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Call Result Tab */}
          <TabsContent value="call" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Result selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {isRdvContext ? "Résultat du RDV" : "Résultat de l'appel"}
                  </Label>
                  <RadioGroup
                    value={selectedResult ?? ""}
                    onValueChange={(value) => form.setValue("resultat", value as CallResultFormData["resultat"])}
                    className="grid grid-cols-2 gap-2"
                  >
                    {resultOptions.map((result) => {
                      const Icon = result.icon;
                      return (
                        <label
                          key={result.value}
                          htmlFor={result.value}
                          className={cn(
                            "relative flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                            selectedResult === result.value
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "hover:bg-muted/50 hover:border-muted-foreground/20"
                          )}
                        >
                          <RadioGroupItem value={result.value} id={result.value} className="mt-0.5 sr-only" />
                          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                            selectedResult === result.value ? "bg-primary/10" : "bg-muted"
                          )}>
                            <Icon className={cn("h-4 w-4", result.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm block">{result.label}</span>
                            <p className="text-xs text-muted-foreground line-clamp-1">{result.description}</p>
                          </div>
                          {selectedResult === result.value && (
                            <CheckCircle2 className="h-5 w-5 text-primary absolute top-3 right-3" />
                          )}
                        </label>
                      );
                    })}
                  </RadioGroup>
                  {form.formState.errors.resultat && (
                    <p className="text-sm text-destructive">{form.formState.errors.resultat.message}</p>
                  )}
                </div>

                {/* Options spéciales pour "Pas répondu" */}
                {selectedResult === "Appelé - pas répondu" && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-xl border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <Phone className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Message vocal laissé</Label>
                          <p className="text-xs text-muted-foreground">J&apos;ai laissé un message sur la boîte vocale</p>
                        </div>
                      </div>
                      <Switch checked={leftVoicemail} onCheckedChange={setLeftVoicemail} />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Envoyer un email de suivi</Label>
                          <p className="text-xs text-muted-foreground">Envoyer un email au prospect</p>
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
                        <AlertCircle className="h-3 w-3" />
                        Aucun email renseigné pour ce contact
                      </p>
                    )}

                    {wantToSendEmail && prospect?.email && (
                      <EmailComposer
                        prospectEmail={prospect.email}
                        prospectPrenom={prospect.prenom}
                        prospectNom={prospect.nom}
                        entreprise={prospect.clientNom}
                        leftVoicemail={leftVoicemail}
                        onEmailSent={(emailData) => {
                          setEmailSent(true);
                          if (prospect?.client?.[0]) {
                            const emailContent = `OBJET: ${emailData.subject}\n\nDESTINATAIRE: ${emailData.to}\n\nCONTENU:\n${emailData.body}`;
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

                {/* Date picker */}
                {showDatePicker && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {selectedResult === "Reporter" ? "Nouvelle date du RDV" : "Date de rappel"}
                    </Label>
                    <div className="flex gap-2">
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
                  </div>
                )}

                {/* Notes */}
                {showNotes && (
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Résumé de la conversation..."
                      {...form.register("notes")}
                      rows={3}
                    />
                  </div>
                )}

                {/* Interaction checkbox */}
                {showInteractionCheckbox && (
                  <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                    <Checkbox
                      id="creerInteraction"
                      checked={form.watch("creerInteraction")}
                      onCheckedChange={(checked) => form.setValue("creerInteraction", checked as boolean)}
                    />
                    <Label htmlFor="creerInteraction" className="text-sm cursor-pointer">
                      Créer une interaction dans le CRM
                    </Label>
                  </div>
                )}

                {/* CTA Qualifié */}
                {selectedResult === "Qualifié" && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-transparent border border-emerald-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Target className="h-5 w-5" />
                      <span className="font-bold">Lead qualifié !</span>
                    </div>
                    <p className="text-sm text-emerald-700">
                      Créez une opportunité pour suivre le deal dans votre pipeline.
                    </p>
                    <Button
                      type="button"
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        form.handleSubmit(async (data) => {
                          await handleSubmit(data);
                          router.push(`/opportunites?create=true&client=${prospect?.client?.[0]}&contact=${prospect?.id}&nom=${encodeURIComponent(prospect?.clientNom || "")}`);
                        })();
                      }}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Créer une opportunité
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                <DialogFooter className="pt-4 border-t sm:justify-between">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Enregistrer
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
