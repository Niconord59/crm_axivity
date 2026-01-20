"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, StickyNote, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AmountSelector, ProbabilitySlider } from "../widgets";

interface OpportunityInfoTabProps {
  montant: number;
  onMontantChange: (value: number) => void;
  probabilite: number;
  onProbabiliteChange: (value: number) => void;
  dateCloture: Date | undefined;
  onDateClotureChange: (date: Date | undefined) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => Promise<void>;
  onOpenQuoteEditor?: () => void;
}

export function OpportunityInfoTab({
  montant,
  onMontantChange,
  probabilite,
  onProbabiliteChange,
  dateCloture,
  onDateClotureChange,
  notes,
  onNotesChange,
  hasChanges,
  isSaving,
  onSave,
  onOpenQuoteEditor,
}: OpportunityInfoTabProps) {
  const handleQuoteEditorClick = async () => {
    if (!onOpenQuoteEditor) return;

    if (hasChanges) {
      await onSave();
    }
    onOpenQuoteEditor();
  };

  return (
    <div className="space-y-6">
      {/* Amount Section */}
      <AmountSelector value={montant} onChange={onMontantChange} />

      <Separator />

      {/* Probability Section */}
      <ProbabilitySlider
        value={probabilite}
        onChange={onProbabiliteChange}
        montant={montant}
      />

      <Separator />

      {/* Closing Date */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-600" />
          <Label className="text-base font-semibold">Clôture estimée</Label>
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
              onSelect={onDateClotureChange}
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
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Notes sur l'opportunité, budget annoncé par le client..."
          rows={4}
          className="resize-y min-h-[100px]"
        />
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className="w-full"
        >
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Enregistrer
        </Button>

        {/* Open Quote Editor */}
        {onOpenQuoteEditor && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleQuoteEditorClick}
          >
            <FileText className="h-4 w-4 mr-2" />
            Éditer le devis détaillé
          </Button>
        )}
      </div>
    </div>
  );
}
