"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  User,
  Calendar,
  Euro,
  TrendingUp,
  FileText,
  Plus,
  Minus,
  StickyNote,
  Target,
  Loader2,
  History,
  Phone,
  Mail,
  Video,
  MessageSquare,
  Clock,
  ArrowRight,
  Send,
  AlertCircle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useOpportunite, useUpdateOpportunite } from "@/hooks/use-opportunites";
import { useInteractions, useCreateInteraction } from "@/hooks/use-interactions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface OpportunityMiniSheetProps {
  opportuniteId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenQuoteEditor?: () => void;
}

// Quick amount presets
const AMOUNT_PRESETS = [5000, 10000, 25000, 50000, 100000, 200000];

// Quick increment amounts
const INCREMENT_AMOUNTS = [1000, 5000, 10000, 25000];

export function OpportunityMiniSheet({
  opportuniteId,
  isOpen,
  onClose,
  onOpenQuoteEditor,
}: OpportunityMiniSheetProps) {
  const { data: opportunity, isLoading } = useOpportunite(opportuniteId);
  const updateOpportunite = useUpdateOpportunite();
  const createInteraction = useCreateInteraction();

  // Get contact ID from opportunity
  const contactId = opportunity?.contact?.[0];
  const clientId = opportunity?.client?.[0];

  // Fetch interactions for this contact
  const { data: interactions, isLoading: interactionsLoading } = useInteractions(
    contactId ? { contactId } : undefined
  );

  // State for manual note in History tab
  const [manualNote, setManualNote] = useState("");
  const [isSavingManualNote, setIsSavingManualNote] = useState(false);

  // Local state for editing
  const [montant, setMontant] = useState<number>(0);
  const [probabilite, setProbabilite] = useState<number>(50);
  const [notes, setNotes] = useState<string>("");
  const [dateCloture, setDateCloture] = useState<Date | undefined>(undefined);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch client and contact info
  const { data: clientInfo } = useQuery({
    queryKey: ["opportunity-client", opportunity?.client?.[0]],
    queryFn: async () => {
      if (!opportunity?.client?.[0]) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("id, nom, secteur_activite")
        .eq("id", opportunity.client[0])
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!opportunity?.client?.[0],
  });

  const { data: contactInfo } = useQuery({
    queryKey: ["opportunity-contact", opportunity?.contact?.[0]],
    queryFn: async () => {
      if (!opportunity?.contact?.[0]) return null;
      const { data, error } = await supabase
        .from("contacts")
        .select("id, nom, prenom, poste")
        .eq("id", opportunity.contact[0])
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!opportunity?.contact?.[0],
  });

  // Sync local state with opportunity data
  useEffect(() => {
    if (opportunity) {
      setMontant(opportunity.valeurEstimee || 0);
      setProbabilite(opportunity.probabilite || 50);
      setNotes(opportunity.notes || "");
      setDateCloture(
        opportunity.dateClotureEstimee
          ? new Date(opportunity.dateClotureEstimee)
          : undefined
      );
      setHasChanges(false);
    }
  }, [opportunity]);

  // Check for changes
  useEffect(() => {
    if (!opportunity) return;
    const changed =
      montant !== (opportunity.valeurEstimee || 0) ||
      probabilite !== (opportunity.probabilite || 50) ||
      notes !== (opportunity.notes || "") ||
      dateCloture?.toISOString().split("T")[0] !==
        opportunity.dateClotureEstimee;
    setHasChanges(changed);
  }, [montant, probabilite, notes, dateCloture, opportunity]);

  const handleSave = async () => {
    try {
      await updateOpportunite.mutateAsync({
        id: opportuniteId,
        data: {
          valeurEstimee: montant,
          probabilite,
          notes,
          dateClotureEstimee: dateCloture?.toISOString().split("T")[0],
        },
      });
      toast.success("Opportunité mise à jour");
      setHasChanges(false);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleAmountChange = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
    setMontant(isNaN(num) ? 0 : num);
  };

  const handlePresetClick = (amount: number) => {
    setMontant(amount);
  };

  const handleIncrement = (amount: number) => {
    setMontant((prev) => prev + amount);
  };

  const handleDecrement = (amount: number) => {
    setMontant((prev) => Math.max(0, prev - amount));
  };

  const handleSaveManualNote = async () => {
    if (!manualNote.trim() || !contactId || !clientId) return;

    setIsSavingManualNote(true);
    try {
      await createInteraction.mutateAsync({
        objet: "Note manuelle",
        type: "Note",
        date: new Date().toISOString(),
        resume: manualNote.trim(),
        contact: [contactId],
        client: [clientId],
      });

      toast.success("Note ajoutée");
      setManualNote("");
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la note");
      console.error(error);
    } finally {
      setIsSavingManualNote(false);
    }
  };

  const valeurPonderee = montant * (probabilite / 100);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="sm:max-w-md overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Opportunité</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : opportunity ? (
          <div className="space-y-6 py-6">
            {/* Opportunity Name */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg leading-tight">
                {opportunity.nom}
              </h3>
              <Badge variant="outline" className="text-xs">
                {opportunity.statut}
              </Badge>
            </div>

            {/* Client & Contact Info */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              {clientInfo && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{clientInfo.nom}</p>
                    {clientInfo.secteur_activite && (
                      <p className="text-xs text-muted-foreground">
                        {clientInfo.secteur_activite}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {contactInfo && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {contactInfo.prenom} {contactInfo.nom}
                    </p>
                    {contactInfo.poste && (
                      <p className="text-xs text-muted-foreground">
                        {contactInfo.poste}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {!clientInfo && !contactInfo && (
                <p className="text-sm text-muted-foreground">
                  Aucun client ou contact associé
                </p>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="infos" className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="infos" className="text-xs gap-1.5">
                  <Euro className="h-3.5 w-3.5" />
                  Infos
                </TabsTrigger>
                <TabsTrigger value="historique" className="text-xs gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  Historique
                </TabsTrigger>
              </TabsList>

              {/* Infos Tab */}
              <TabsContent value="infos" className="mt-4 space-y-6">
                {/* Amount Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Euro className="h-5 w-5 text-emerald-600" />
                    <Label className="text-base font-semibold">Montant estimé</Label>
                  </div>

                  {/* Main Amount Input */}
                  <div className="relative">
                    <Input
                      type="text"
                      value={montant.toLocaleString("fr-FR")}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="text-2xl font-bold h-14 pr-10 text-right"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                      €
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Montants rapides</p>
                    <div className="flex flex-wrap gap-2">
                      {AMOUNT_PRESETS.map((amount) => (
                        <Button
                          key={amount}
                          type="button"
                          variant={montant === amount ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePresetClick(amount)}
                          className="text-xs"
                        >
                          {formatCurrency(amount)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Increment/Decrement Buttons */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {INCREMENT_AMOUNTS.slice(0, 2).map((amount) => (
                        <Button
                          key={`add-${amount}`}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleIncrement(amount)}
                          className="flex-1 text-xs text-emerald-600"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {amount >= 1000 ? `${amount / 1000}k` : amount}
                        </Button>
                      ))}
                    </div>
                    <div className="flex-1 flex gap-1">
                      {INCREMENT_AMOUNTS.slice(0, 2).map((amount) => (
                        <Button
                          key={`sub-${amount}`}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDecrement(amount)}
                          className="flex-1 text-xs text-red-600"
                          disabled={montant < amount}
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          {amount >= 1000 ? `${amount / 1000}k` : amount}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Probability Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <Label className="text-base font-semibold">Probabilité</Label>
                    </div>
                    <span className="text-xl font-bold">{probabilite}%</span>
                  </div>

                  <Slider
                    value={[probabilite]}
                    onValueChange={(value) => setProbabilite(value[0])}
                    max={100}
                    step={5}
                    className="py-2"
                  />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Faible</span>
                    <span>Moyen</span>
                    <span>Fort</span>
                  </div>

                  {/* Weighted Value */}
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Valeur pondérée</span>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(valeurPonderee)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Closing Date */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <Label className="text-base font-semibold">
                      Clôture estimée
                    </Label>
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateCloture && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateCloture
                          ? format(dateCloture, "PPP", { locale: fr })
                          : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateCloture}
                        onSelect={setDateCloture}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Separator />

                {/* Notes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-5 w-5 text-amber-600" />
                    <Label className="text-base font-semibold">Notes</Label>
                  </div>

                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes sur l'opportunité, budget annoncé par le client..."
                    rows={4}
                    className="resize-y min-h-[100px]"
                  />
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges || updateOpportunite.isPending}
                    className="w-full"
                  >
                    {updateOpportunite.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Enregistrer
                  </Button>

                  {/* Open Quote Editor */}
                  {onOpenQuoteEditor && (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        if (hasChanges) {
                          handleSave().then(() => onOpenQuoteEditor());
                        } else {
                          onOpenQuoteEditor();
                        }
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Éditer le devis détaillé
                    </Button>
                  )}
                </div>
              </TabsContent>

              {/* Historique Tab */}
              <TabsContent value="historique" className="mt-4">
                {/* Manual Note Form */}
                <div className="mb-6 p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <StickyNote className="h-4 w-4 text-amber-600" />
                    </div>
                    <Label className="font-medium text-amber-900">Ajouter une note</Label>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Écrire une note..."
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      className="min-h-[60px] resize-y bg-white"
                      rows={2}
                    />
                    <Button
                      onClick={handleSaveManualNote}
                      disabled={isSavingManualNote || !manualNote.trim() || !contactId}
                      size="icon"
                      className="h-[60px] w-12 shrink-0 bg-amber-600 hover:bg-amber-700"
                    >
                      {isSavingManualNote ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {!contactId && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Cette opportunité doit être liée à un contact pour ajouter des notes
                    </p>
                  )}
                </div>

                {/* Interactions Timeline */}
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

                      {interactions.map((interaction) => {
                        const isEmail = interaction.type === "Email";
                        const isCall = interaction.type === "Appel";
                        const isMeeting = interaction.type === "Réunion";
                        const isNote = interaction.type === "Note";

                        const iconBg = isEmail
                          ? "bg-blue-100 text-blue-600"
                          : isCall
                          ? "bg-orange-100 text-orange-600"
                          : isMeeting
                          ? "bg-violet-100 text-violet-600"
                          : isNote
                          ? "bg-amber-100 text-amber-600"
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
                              ) : isNote ? (
                                <StickyNote className="h-4 w-4" />
                              ) : (
                                <MessageSquare className="h-4 w-4" />
                              )}
                            </div>

                            <div className={cn(
                              "p-4 rounded-xl border transition-colors",
                              isEmail
                                ? "bg-blue-50/50 border-blue-200"
                                : isNote
                                ? "bg-amber-50/50 border-amber-200"
                                : "bg-muted/30"
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
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Opportunité non trouvée</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
