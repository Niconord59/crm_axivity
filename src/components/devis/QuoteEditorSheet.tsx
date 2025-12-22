"use client";

import { useState } from "react";
import { FileText, Download, Loader2, Building2, User } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOpportunite } from "@/hooks/use-opportunites";
import { useClient } from "@/hooks/use-clients";
import {
  useLignesDevis,
  useCreateLigneDevis,
  useUpdateLigneDevis,
  useDeleteLigneDevis,
  calculateQuoteTotals,
} from "@/hooks/use-lignes-devis";
import { QuoteLinesTable } from "./QuoteLinesTable";
import { QuoteTotals } from "./QuoteTotals";
import type { LigneDevis } from "@/types";

interface QuoteEditorSheetProps {
  opportuniteId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuoteEditorSheet({
  opportuniteId,
  isOpen,
  onClose,
}: QuoteEditorSheetProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch opportunity data
  const { data: opportunite, isLoading: oppLoading } = useOpportunite(
    isOpen ? opportuniteId : undefined
  );

  // Get client ID from opportunity
  const clientId = opportunite?.client?.[0];

  // Fetch client data
  const { data: client, isLoading: clientLoading } = useClient(clientId);

  // Fetch quote lines
  const { data: lignes = [], isLoading: lignesLoading } = useLignesDevis(
    isOpen ? opportuniteId : undefined
  );

  // Mutations
  const createLine = useCreateLigneDevis();
  const updateLine = useUpdateLigneDevis();
  const deleteLine = useDeleteLigneDevis();

  // Calculate totals
  const { totalHT, tva, totalTTC } = calculateQuoteTotals(lignes);

  const isLoading = oppLoading || clientLoading || lignesLoading;
  const isMutating = createLine.isPending || updateLine.isPending || deleteLine.isPending;

  const handleAddLine = async () => {
    try {
      await createLine.mutateAsync({
        opportuniteId,
        description: "Nouvelle ligne",
        quantite: 1,
        prixUnitaire: 0,
        remisePourcent: 0,
      });
    } catch {
      toast.error("Impossible d'ajouter la ligne");
    }
  };

  const handleUpdateLine = async (id: string, data: Partial<LigneDevis>) => {
    try {
      await updateLine.mutateAsync({
        id,
        opportuniteId,
        ...data,
      });
    } catch {
      toast.error("Impossible de modifier la ligne");
    }
  };

  const handleDeleteLine = async (id: string) => {
    try {
      await deleteLine.mutateAsync({ id, opportuniteId });
    } catch {
      toast.error("Impossible de supprimer la ligne");
    }
  };

  const handleGeneratePDF = async () => {
    if (lignes.length === 0) {
      toast.error("Ajoutez au moins une ligne au devis avant de générer le PDF");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/devis/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ opportuniteId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la génération");
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `devis-${opportuniteId}.pdf`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Le devis ${filename} a été téléchargé`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(error instanceof Error ? error.message : "Impossible de générer le PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-left">Devis</SheetTitle>
                <SheetDescription className="text-left">
                  {opportunite?.nom || "Chargement..."}
                </SheetDescription>
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Client & Contact Info */}
            {(client || opportunite) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {client && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Building2 className="h-4 w-4" />
                      <span>Client</span>
                    </div>
                    <p className="font-medium">{client.nom}</p>
                    {client.adresse && (
                      <p className="text-sm text-muted-foreground">
                        {client.adresse}
                        {client.codePostal && `, ${client.codePostal}`}
                        {client.ville && ` ${client.ville}`}
                      </p>
                    )}
                    {client.siret && (
                      <p className="text-xs text-muted-foreground mt-1">
                        SIRET: {client.siret}
                      </p>
                    )}
                  </div>
                )}

                {opportunite?.statut && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <User className="h-4 w-4" />
                      <span>Opportunité</span>
                    </div>
                    <p className="font-medium">{opportunite.nom}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{opportunite.statut}</Badge>
                      {opportunite.valeurEstimee && (
                        <span className="text-sm text-muted-foreground">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(opportunite.valeurEstimee)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Quote Lines */}
            <div>
              <h3 className="font-medium mb-4">Lignes du devis</h3>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <QuoteLinesTable
                  lignes={lignes}
                  onUpdateLine={handleUpdateLine}
                  onDeleteLine={handleDeleteLine}
                  onAddLine={handleAddLine}
                  isLoading={isMutating}
                />
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full sm:w-72 p-4 rounded-lg bg-muted/50">
                <QuoteTotals
                  totalHT={totalHT}
                  tva={tva}
                  totalTTC={totalTTC}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="border-t px-6 py-4 flex justify-between gap-3">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={isGenerating || lignes.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Générer PDF
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
