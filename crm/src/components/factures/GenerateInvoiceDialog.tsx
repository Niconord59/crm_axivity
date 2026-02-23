"use client";

import { useState, useMemo, useEffect } from "react";
import { Loader2, Receipt, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useFacturesByDevis, calculateSoldeRestant, getAcomptesPayes } from "@/hooks/use-factures";
import type { FactureType, Facture } from "@/types";
import { FACTURE_TYPE_LABELS } from "@/types/constants";

interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devisId: string;
  numeroDevis: string;
  montantTotal: number; // Montant total HT du devis
  tauxTva?: number;
  onGenerate: (factureId: string, factureNumero: string, pdfBlob: Blob) => void;
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Présets de pourcentage courants
const PERCENTAGE_PRESETS = [30, 40, 50];

export function GenerateInvoiceDialog({
  open,
  onOpenChange,
  devisId,
  numeroDevis,
  montantTotal,
  tauxTva = 20,
  onGenerate,
}: GenerateInvoiceDialogProps) {
  const [typeFacture, setTypeFacture] = useState<FactureType>("unique");
  const [pourcentage, setPourcentage] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);

  // Récupérer les factures existantes pour ce devis
  const { data: facturesExistantes = [], isLoading } = useFacturesByDevis(
    open ? devisId : undefined
  );

  // Calculer les acomptes déjà payés
  const acomptesPayes = useMemo(
    () => getAcomptesPayes(facturesExistantes),
    [facturesExistantes]
  );

  // Calculer le solde restant
  const soldeInfo = useMemo(
    () => calculateSoldeRestant(montantTotal, facturesExistantes),
    [montantTotal, facturesExistantes]
  );

  // Déterminer automatiquement le type de facture recommandé
  const hasAcomptesPaye = acomptesPayes.length > 0;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      // Si des acomptes existent, proposer solde par défaut
      if (hasAcomptesPaye) {
        setTypeFacture("solde");
        setPourcentage(Math.round(soldeInfo.pourcentage));
      } else {
        setTypeFacture("unique");
        setPourcentage(30);
      }
    }
  }, [open, hasAcomptesPaye, soldeInfo.pourcentage]);

  // Calculer le montant de la facture selon le type et pourcentage
  const montantFacture = useMemo(() => {
    switch (typeFacture) {
      case "acompte":
        return montantTotal * (pourcentage / 100);
      case "solde":
        return soldeInfo.montant;
      case "unique":
      default:
        return montantTotal;
    }
  }, [typeFacture, pourcentage, montantTotal, soldeInfo.montant]);

  // Calculer TVA et TTC
  const tvaAmount = montantFacture * (tauxTva / 100);
  const montantTTC = montantFacture + tvaAmount;

  // Obtenir le dernier acompte pour le chaînage
  const lastAcompte = acomptesPayes.length > 0 ? acomptesPayes[acomptesPayes.length - 1] : null;

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/factures/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          devisId,
          typeFacture,
          pourcentageAcompte: typeFacture === "acompte" ? pourcentage : undefined,
          factureParentId: typeFacture === "solde" && lastAcompte ? lastAcompte.id : undefined,
          montantTotalProjet: montantTotal,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la génération");
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Get facture info from headers
      const factureId = response.headers.get("X-Facture-Id") || "";
      const factureNumero = response.headers.get("X-Facture-Numero") || "";

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${factureNumero}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      const typeLabel = FACTURE_TYPE_LABELS[typeFacture].toLowerCase();
      toast.success(`Facture ${typeLabel} ${factureNumero} générée`);

      onGenerate(factureId, factureNumero, blob);
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error(
        error instanceof Error ? error.message : "Impossible de générer la facture"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePourcentageChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setPourcentage(num);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Générer une facture
          </DialogTitle>
          <DialogDescription>
            Devis : {numeroDevis} - Montant total : {formatCurrency(montantTotal)} HT
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Acomptes existants */}
            {acomptesPayes.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Acomptes déjà versés :</div>
                  <ul className="text-sm space-y-1">
                    {acomptesPayes.map((acompte) => (
                      <li key={acompte.id} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {acompte.numero}
                        </Badge>
                        <span>
                          {formatCurrency(acompte.montantHT || 0)} ({acompte.pourcentageAcompte}%)
                        </span>
                        <span className="text-muted-foreground">
                          du {formatDate(acompte.dateEmission || "")}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 font-medium text-green-600">
                    Reste à facturer : {formatCurrency(soldeInfo.montant)} ({Math.round(soldeInfo.pourcentage)}%)
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Type de facture */}
            <div className="space-y-3">
              <Label>Type de facture</Label>
              <RadioGroup
                value={typeFacture}
                onValueChange={(value) => setTypeFacture(value as FactureType)}
                className="space-y-2"
              >
                <div
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    typeFacture === "unique" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setTypeFacture("unique")}
                >
                  <RadioGroupItem value="unique" id="unique" />
                  <Label htmlFor="unique" className="flex-1 cursor-pointer">
                    <div className="font-medium">Facture unique (100%)</div>
                    <div className="text-sm text-muted-foreground">
                      Facture pour le montant total du devis
                    </div>
                  </Label>
                </div>

                <div
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    typeFacture === "acompte" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setTypeFacture("acompte")}
                >
                  <RadioGroupItem value="acompte" id="acompte" />
                  <Label htmlFor="acompte" className="flex-1 cursor-pointer">
                    <div className="font-medium">Facture d'acompte</div>
                    <div className="text-sm text-muted-foreground">
                      Versement partiel avant le début du projet
                    </div>
                  </Label>
                </div>

                <div
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    typeFacture === "solde" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  } ${!hasAcomptesPaye ? "opacity-50" : ""}`}
                  onClick={() => hasAcomptesPaye && setTypeFacture("solde")}
                >
                  <RadioGroupItem value="solde" id="solde" disabled={!hasAcomptesPaye} />
                  <Label
                    htmlFor="solde"
                    className={`flex-1 ${hasAcomptesPaye ? "cursor-pointer" : "cursor-not-allowed"}`}
                  >
                    <div className="font-medium">Facture de solde</div>
                    <div className="text-sm text-muted-foreground">
                      {hasAcomptesPaye
                        ? "Montant restant après déduction des acomptes"
                        : "Nécessite au moins un acompte payé"}
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Pourcentage pour acompte */}
            {typeFacture === "acompte" && (
              <div className="space-y-3">
                <Label>Pourcentage de l'acompte</Label>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {PERCENTAGE_PRESETS.map((preset) => (
                      <Button
                        key={preset}
                        variant={pourcentage === preset ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPourcentage(preset)}
                      >
                        {preset}%
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={pourcentage}
                      onChange={(e) => handlePourcentageChange(e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                {pourcentage > 50 && (
                  <Alert variant="default" className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      Un acompte supérieur à 50% est inhabituel. Vérifiez le pourcentage.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <Separator />

            {/* Récapitulatif */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Récapitulatif
              </div>

              {typeFacture === "acompte" && (
                <div className="text-sm text-muted-foreground">
                  Acompte de {pourcentage}% sur un total de {formatCurrency(montantTotal)} HT
                </div>
              )}

              {typeFacture === "solde" && acomptesPayes.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Solde après déduction de {acomptesPayes.length} acompte{acomptesPayes.length > 1 ? "s" : ""} (
                  {formatCurrency(montantTotal - soldeInfo.montant)})
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Montant HT</span>
                  <span className="font-medium">{formatCurrency(montantFacture)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>TVA ({tauxTva}%)</span>
                  <span>{formatCurrency(tvaAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Montant TTC</span>
                  <span className="text-primary">{formatCurrency(montantTTC)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || isLoading}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4 mr-2" />
                Générer la facture
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
