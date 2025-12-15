"use client";

import { useState } from "react";
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

interface CallResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect | null;
}

const CALL_RESULTS = [
  { value: "Appelé - pas répondu", label: "Pas répondu", description: "Le contact n'a pas décroché" },
  { value: "Rappeler", label: "Rappeler", description: "Planifier un nouveau contact" },
  { value: "Qualifié", label: "Qualifié", description: "Le lead est qualifié, créer une opportunité" },
  { value: "Non qualifié", label: "Non qualifié", description: "Le lead ne correspond pas" },
  { value: "Perdu", label: "Perdu", description: "Le lead n'est plus intéressé" },
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateStatus = useUpdateProspectStatus();
  const createInteraction = useCreateInteraction();

  // Fetch client details
  const clientId = prospect?.client?.[0];
  const { data: client, isLoading: clientLoading } = useClient(clientId);

  // Fetch interactions for this client
  const { data: interactions, isLoading: interactionsLoading } = useInteractions(
    clientId ? { clientId } : undefined
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
  const showDatePicker = selectedResult === "Rappeler";

  const handleSubmit = async (data: CallResultFormData) => {
    if (!prospect) return;

    setIsSubmitting(true);
    try {
      // 1. Update prospect status
      await updateStatus.mutateAsync({
        id: prospect.id,
        statut: data.resultat,
        dateRappel: data.resultat === "Rappeler" ? data.dateRappel : undefined,
        notes: data.notes
          ? `${prospect.notesProspection ? prospect.notesProspection + "\n\n" : ""}[${format(new Date(), "dd/MM/yyyy HH:mm")}] ${data.notes}`
          : undefined,
      });

      // 2. Create interaction if checked
      if (data.creerInteraction && prospect.client?.[0]) {
        await createInteraction.mutateAsync({
          objet: `Appel prospection - ${data.resultat}`,
          type: "Appel",
          date: new Date().toISOString().split("T")[0],
          resume: data.notes || `Résultat: ${data.resultat}`,
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
    onOpenChange(false);
  };

  if (!prospect) return null;

  const fullName = prospect.prenom
    ? `${prospect.prenom} ${prospect.nom}`
    : prospect.nom;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
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

        <Tabs defaultValue="lead" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="lead">Lead</TabsTrigger>
            <TabsTrigger value="company">Entreprise</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="call">Appel</TabsTrigger>
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
                  <InfoRow icon={Briefcase} label="Secteur d'activité" value={client.secteurActivite} />
                  <InfoRow
                    icon={Globe}
                    label="Site web"
                    value={client.siteWeb}
                    href={client.siteWeb?.startsWith("http") ? client.siteWeb : `https://${client.siteWeb}`}
                  />
                  <Separator className="my-2" />

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
                  {interactions.map((interaction) => (
                    <div
                      key={interaction.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{interaction.objet}</span>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {interaction.type}
                        </Badge>
                      </div>

                      {interaction.date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(interaction.date), "PPP", { locale: fr })}
                        </p>
                      )}

                      {interaction.resume && (
                        <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                          {interaction.resume}
                        </p>
                      )}

                      {interaction.prochaineTache && (
                        <p className="text-sm text-primary">
                          → Prochaine action: {interaction.prochaineTache}
                        </p>
                      )}
                    </div>
                  ))}
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

          {/* Call Result Tab */}
          <TabsContent value="call" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Result selection */}
                <div className="space-y-3">
                  <Label>Résultat de l&apos;appel *</Label>
                  <RadioGroup
                    onValueChange={(value) => form.setValue("resultat", value as CallResultFormData["resultat"])}
                    className="space-y-2"
                  >
                    {CALL_RESULTS.map((result) => (
                      <div
                        key={result.value}
                        className={cn(
                          "flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors",
                          selectedResult === result.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => form.setValue("resultat", result.value)}
                      >
                        <RadioGroupItem value={result.value} id={result.value} className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor={result.value} className="cursor-pointer font-medium">
                            {result.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {result.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                  {form.formState.errors.resultat && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.resultat.message}
                    </p>
                  )}
                </div>

                {/* Date picker for "Rappeler" */}
                {showDatePicker && (
                  <div className="space-y-2">
                    <Label>Date de rappel *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
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
                          onSelect={(date) =>
                            form.setValue("dateRappel", date ? date.toISOString().split("T")[0] : "")
                          }
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.dateRappel && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.dateRappel.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes de l&apos;appel</Label>
                  <Textarea
                    id="notes"
                    placeholder="Résumé de la conversation..."
                    {...form.register("notes")}
                    rows={3}
                  />
                </div>

                {/* Create interaction checkbox */}
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
