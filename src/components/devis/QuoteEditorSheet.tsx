"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Loader2,
  Building2,
  User,
  History,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  MoreHorizontal,
  Mail,
  Copy,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOpportunite, useOpportunitesParStatut } from "@/hooks/use-opportunites";
import { useClient } from "@/hooks/use-clients";
import {
  useLignesDevis,
  useCreateLigneDevis,
  useUpdateLigneDevis,
  useDeleteLigneDevis,
  calculateQuoteTotals,
} from "@/hooks/use-lignes-devis";
import {
  useDevisForOpportunite,
  useUpdateDevisStatus,
  useDuplicateDevisLines,
  STATUT_DEVIS_CONFIG,
  type StatutDevis,
} from "@/hooks/use-devis";
import { QuoteLinesTable } from "./QuoteLinesTable";
import { QuoteTotals } from "./QuoteTotals";
import type { LigneDevis } from "@/types";

interface QuoteEditorSheetProps {
  opportuniteId: string;
  isOpen: boolean;
  onClose: () => void;
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

// Statut badge component
function DevisStatusBadge({ statut }: { statut: StatutDevis }) {
  const config = STATUT_DEVIS_CONFIG[statut];
  return (
    <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0`}>
      {config.label}
    </Badge>
  );
}

// Send email dialog state type
interface SendEmailState {
  isOpen: boolean;
  devisId: string;
  numeroDevis: string;
  recipientEmail: string;
  customMessage: string;
}

// Duplicate lines dialog state type
interface DuplicateLinesState {
  isOpen: boolean;
  targetOpportuniteId: string;
}

export function QuoteEditorSheet({
  opportuniteId,
  isOpen,
  onClose,
}: QuoteEditorSheetProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [sendEmailState, setSendEmailState] = useState<SendEmailState>({
    isOpen: false,
    devisId: "",
    numeroDevis: "",
    recipientEmail: "",
    customMessage: "",
  });
  const [duplicateState, setDuplicateState] = useState<DuplicateLinesState>({
    isOpen: false,
    targetOpportuniteId: "",
  });
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Fetch opportunity data
  const { data: opportunite, isLoading: oppLoading } = useOpportunite(
    isOpen ? opportuniteId : undefined
  );

  // Get client ID from opportunity
  const clientId = opportunite?.client?.[0];

  // Fetch client data
  const { data: client, isLoading: clientLoading } = useClient(clientId);

  // Fetch all opportunities for duplicate dialog (excludes Gagné/Perdu)
  const { data: opportunitesGrouped } = useOpportunitesParStatut();
  const allOpportunites = opportunitesGrouped
    ? [
        ...opportunitesGrouped.Qualifié,
        ...opportunitesGrouped.Proposition,
        ...opportunitesGrouped.Négociation,
      ]
    : [];

  // Filter out current opportunity from the list
  const otherOpportunites = allOpportunites.filter((o) => o.id !== opportuniteId);

  // Fetch quote lines
  const { data: lignes = [], isLoading: lignesLoading } = useLignesDevis(
    isOpen ? opportuniteId : undefined
  );

  // Fetch quote history
  const { data: devisHistory = [], isLoading: historyLoading, refetch: refetchHistory } =
    useDevisForOpportunite(isOpen ? opportuniteId : undefined);

  // Mutations
  const createLine = useCreateLigneDevis();
  const updateLine = useUpdateLigneDevis();
  const deleteLine = useDeleteLigneDevis();
  const updateStatus = useUpdateDevisStatus();
  const duplicateLines = useDuplicateDevisLines();

  // Calculate totals
  const { totalHT, tva, totalTTC } = calculateQuoteTotals(lignes);

  const isLoading = oppLoading || clientLoading || lignesLoading;
  const isMutating =
    createLine.isPending || updateLine.isPending || deleteLine.isPending;

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

  const handlePreviewPDF = async () => {
    if (lignes.length === 0) {
      toast.error("Ajoutez au moins une ligne au devis avant de prévisualiser");
      return;
    }

    setIsPreviewing(true);

    try {
      const response = await fetch("/api/devis/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ opportuniteId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la prévisualisation");
      }

      // Get the PDF blob and open in new tab
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Clean up after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error("Error previewing PDF:", error);
      toast.error(
        error instanceof Error ? error.message : "Impossible de prévisualiser le PDF"
      );
    } finally {
      setIsPreviewing(false);
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

      // Get filename and devis info from headers
      const devisNumero = response.headers.get("X-Devis-Numero");
      const filename = devisNumero ? `${devisNumero}.pdf` : `devis-${opportuniteId}.pdf`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Le devis ${filename} a été généré et sauvegardé`);

      // Refresh history
      refetchHistory();

      // Switch to history tab
      setActiveTab("history");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(
        error instanceof Error ? error.message : "Impossible de générer le PDF"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusChange = async (devisId: string, newStatus: StatutDevis) => {
    try {
      await updateStatus.mutateAsync({ id: devisId, statut: newStatus });
      toast.success(`Statut mis à jour: ${STATUT_DEVIS_CONFIG[newStatus].label}`);
      refetchHistory();
    } catch {
      toast.error("Impossible de modifier le statut");
    }
  };

  const handleViewStoredPDF = (pdfUrl: string) => {
    window.open(pdfUrl, "_blank");
  };

  const handleDownloadPDF = (pdfUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenSendEmail = (devisId: string, numeroDevis: string, contactEmail?: string) => {
    setSendEmailState({
      isOpen: true,
      devisId,
      numeroDevis,
      recipientEmail: contactEmail || "",
      customMessage: "",
    });
  };

  const handleCloseSendEmail = () => {
    setSendEmailState({
      isOpen: false,
      devisId: "",
      numeroDevis: "",
      recipientEmail: "",
      customMessage: "",
    });
  };

  const handleSendEmail = async () => {
    if (!sendEmailState.recipientEmail) {
      toast.error("Veuillez saisir une adresse email");
      return;
    }

    setIsSendingEmail(true);

    try {
      const response = await fetch("/api/devis/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          devisId: sendEmailState.devisId,
          recipientEmail: sendEmailState.recipientEmail,
          customMessage: sendEmailState.customMessage || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'envoi");
      }

      toast.success(`Le devis ${sendEmailState.numeroDevis} a été envoyé à ${sendEmailState.recipientEmail}`);
      handleCloseSendEmail();
      refetchHistory();
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(
        error instanceof Error ? error.message : "Impossible d'envoyer l'email"
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleOpenDuplicate = () => {
    setDuplicateState({
      isOpen: true,
      targetOpportuniteId: "",
    });
  };

  const handleCloseDuplicate = () => {
    setDuplicateState({
      isOpen: false,
      targetOpportuniteId: "",
    });
  };

  const handleDuplicateLines = async () => {
    if (!duplicateState.targetOpportuniteId) {
      toast.error("Veuillez sélectionner une opportunité cible");
      return;
    }

    setIsDuplicating(true);

    try {
      await duplicateLines.mutateAsync({
        sourceOpportuniteId: opportuniteId,
        targetOpportuniteId: duplicateState.targetOpportuniteId,
      });

      const targetOpp = otherOpportunites.find(
        (o) => o.id === duplicateState.targetOpportuniteId
      );

      toast.success(
        `Les lignes ont été copiées vers "${targetOpp?.nom || "l'opportunité cible"}"`
      );
      handleCloseDuplicate();
    } catch (error) {
      console.error("Error duplicating lines:", error);
      toast.error(
        error instanceof Error ? error.message : "Impossible de dupliquer les lignes"
      );
    } finally {
      setIsDuplicating(false);
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
            {devisHistory.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {devisHistory.length} devis
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-4 grid w-auto grid-cols-2">
            <TabsTrigger value="editor" className="gap-2">
              <FileText className="h-4 w-4" />
              Éditeur
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historique
              {devisHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {devisHistory.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 flex flex-col mt-0">
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
                              {formatCurrency(opportunite.valeurEstimee)}
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
                    <QuoteTotals totalHT={totalHT} tva={tva} totalTTC={totalTTC} />
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="border-t px-6 py-4 flex justify-between gap-3">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              <div className="flex gap-2">
                {lignes.length > 0 && otherOpportunites.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleOpenDuplicate}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Dupliquer vers...
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handlePreviewPDF}
                  disabled={isPreviewing || lignes.length === 0}
                >
                  {isPreviewing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Aperçu...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Prévisualiser
                    </>
                  )}
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
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 flex flex-col mt-0">
            <ScrollArea className="flex-1">
              <div className="p-6">
                {historyLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : devisHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucun devis généré</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Créez vos lignes de devis puis cliquez sur "Générer PDF"
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setActiveTab("editor")}
                    >
                      Aller à l'éditeur
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {devisHistory.map((devis) => (
                      <div
                        key={devis.id}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{devis.numeroDevis}</span>
                              <DevisStatusBadge statut={devis.statut} />
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatDate(devis.dateDevis)}
                              </span>
                              <span>Validité: {formatDate(devis.dateValidite)}</span>
                            </div>
                            <div className="mt-2 font-medium text-lg">
                              {formatCurrency(devis.totalTTC)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {devis.pdfUrl && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewStoredPDF(devis.pdfUrl!)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Voir
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDownloadPDF(
                                      devis.pdfUrl!,
                                      `${devis.numeroDevis}.pdf`
                                    )
                                  }
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenSendEmail(
                                      devis.id,
                                      devis.numeroDevis
                                    )
                                  }
                                  disabled={devis.statut === "envoye"}
                                >
                                  <Mail className="h-4 w-4 mr-1" />
                                  Envoyer
                                </Button>
                              </>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(devis.id, "envoye")}
                                  disabled={devis.statut === "envoye"}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Marquer comme envoyé
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(devis.id, "accepte")}
                                  disabled={devis.statut === "accepte"}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accepté
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(devis.id, "refuse")}
                                  disabled={devis.statut === "refuse"}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Refusé
                                </DropdownMenuItem>
                                {devis.pdfUrl && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleViewStoredPDF(devis.pdfUrl!)}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Ouvrir dans un nouvel onglet
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t px-6 py-4 flex justify-between gap-3">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("editor")}>
                <FileText className="h-4 w-4 mr-2" />
                Nouveau devis
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>

      {/* Send Email Dialog */}
      <Dialog open={sendEmailState.isOpen} onOpenChange={(open) => !open && handleCloseSendEmail()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Envoyer le devis par email</DialogTitle>
            <DialogDescription>
              Devis {sendEmailState.numeroDevis}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email du destinataire *</Label>
              <Input
                id="email"
                type="email"
                value={sendEmailState.recipientEmail}
                onChange={(e) =>
                  setSendEmailState({ ...sendEmailState, recipientEmail: e.target.value })
                }
                placeholder="client@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message personnalisé (optionnel)</Label>
              <Textarea
                id="message"
                value={sendEmailState.customMessage}
                onChange={(e) =>
                  setSendEmailState({ ...sendEmailState, customMessage: e.target.value })
                }
                placeholder="Ajoutez un message personnalisé..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseSendEmail}>
              Annuler
            </Button>
            <Button onClick={handleSendEmail} disabled={isSendingEmail}>
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Lines Dialog */}
      <Dialog open={duplicateState.isOpen} onOpenChange={(open) => !open && handleCloseDuplicate()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dupliquer les lignes du devis</DialogTitle>
            <DialogDescription>
              Copier les {lignes.length} ligne{lignes.length > 1 ? "s" : ""} vers une autre opportunité
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="targetOpp">Opportunité cible *</Label>
              <Select
                value={duplicateState.targetOpportuniteId}
                onValueChange={(value) =>
                  setDuplicateState({ ...duplicateState, targetOpportuniteId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une opportunité..." />
                </SelectTrigger>
                <SelectContent>
                  {otherOpportunites.map((opp) => (
                    <SelectItem key={opp.id} value={opp.id}>
                      <div className="flex flex-col">
                        <span>{opp.nom}</span>
                        {opp.valeurEstimee && (
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(opp.valeurEstimee)}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Les lignes existantes de l'opportunité cible seront conservées
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDuplicate}>
              Annuler
            </Button>
            <Button onClick={handleDuplicateLines} disabled={isDuplicating}>
              {isDuplicating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Duplication...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
