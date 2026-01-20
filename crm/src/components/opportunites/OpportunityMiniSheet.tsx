"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  User,
  Euro,
  Loader2,
  History,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useOpportunite, useUpdateOpportunite } from "@/hooks/use-opportunites";
import { useInteractions, useCreateInteraction } from "@/hooks/use-interactions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { OpportunityInfoTab, OpportunityHistoryTab } from "./tabs";

interface OpportunityMiniSheetProps {
  opportuniteId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenQuoteEditor?: () => void;
}

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

  const handleAddNote = async (note: string) => {
    if (!contactId || !clientId) return;

    await createInteraction.mutateAsync({
      objet: "Note manuelle",
      type: "Note",
      date: new Date().toISOString(),
      resume: note,
      contact: [contactId],
      client: [clientId],
    });

    toast.success("Note ajoutée");
  };

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
              <TabsContent value="infos" className="mt-4">
                <OpportunityInfoTab
                  montant={montant}
                  onMontantChange={setMontant}
                  probabilite={probabilite}
                  onProbabiliteChange={setProbabilite}
                  dateCloture={dateCloture}
                  onDateClotureChange={setDateCloture}
                  notes={notes}
                  onNotesChange={setNotes}
                  hasChanges={hasChanges}
                  isSaving={updateOpportunite.isPending}
                  onSave={handleSave}
                  onOpenQuoteEditor={onOpenQuoteEditor}
                />
              </TabsContent>

              {/* Historique Tab */}
              <TabsContent value="historique" className="mt-4">
                <OpportunityHistoryTab
                  interactions={interactions}
                  isLoading={interactionsLoading}
                  contactId={contactId}
                  onAddNote={handleAddNote}
                />
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
