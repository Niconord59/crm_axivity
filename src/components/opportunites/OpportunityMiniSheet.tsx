"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
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
  RotateCcw,
  StickyNote,
  Target,
  Loader2,
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useOpportunite, useUpdateOpportunite } from "@/hooks/use-opportunites";
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

  const handleReset = () => {
    if (opportunity) {
      setMontant(opportunity.valeurEstimee || 0);
      setProbabilite(opportunity.probabilite || 50);
      setNotes(opportunity.notes || "");
      setDateCloture(
        opportunity.dateClotureEstimee
          ? new Date(opportunity.dateClotureEstimee)
          : undefined
      );
    }
  };

  const valeurPonderee = montant * (probabilite / 100);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
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

            <Separator />

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
              {/* Save / Reset */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || updateOpportunite.isPending}
                  className="flex-1"
                >
                  {updateOpportunite.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Enregistrer
                </Button>
              </div>

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
