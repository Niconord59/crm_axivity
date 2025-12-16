"use client";

import { useState, useMemo } from "react";
import { Upload, Phone as PhoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, PageLoading, EmptyState } from "@/components/shared";
import {
  ProspectionKPIs,
  LeadCard,
  ProspectionFilters,
  CallResultDialog,
  ProspectForm,
  LeadImportDialog,
  PastRdvNotifications,
} from "@/components/prospection";
import { OpportuniteForm } from "@/components/forms";
import {
  useProspectsWithClients,
  useUpdateProspectStatus,
  type ProspectFilters,
  type Prospect,
} from "@/hooks/use-prospects";
import { useConvertToOpportunity } from "@/hooks/use-convert-opportunity";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { OpportuniteFormData } from "@/lib/schemas/opportunite";

export default function ProspectionPage() {
  const [filters, setFilters] = useState<ProspectFilters>({});
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [opportunityDialogOpen, setOpportunityDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  const queryClient = useQueryClient();
  const { data: prospects, isLoading } = useProspectsWithClients(filters);
  const updateStatus = useUpdateProspectStatus();
  const convertToOpportunity = useConvertToOpportunity();

  // Filter out qualified/non-qualified/lost prospects by default
  const activeProspects = useMemo(() => {
    if (!prospects) return [];
    // If no status filter is set, hide completed statuses
    if (!filters.statut) {
      return prospects.filter(
        (p) =>
          p.statutProspection !== "Qualifié" &&
          p.statutProspection !== "Non qualifié" &&
          p.statutProspection !== "Perdu"
      );
    }
    return prospects;
  }, [prospects, filters.statut]);

  const handleCall = async (prospect: Prospect) => {
    // Copy phone to clipboard
    if (prospect.telephone) {
      await navigator.clipboard.writeText(prospect.telephone);
      toast.success("Numéro copié dans le presse-papier", {
        description: prospect.telephone,
      });
    }
    // Open CallResultDialog
    setSelectedProspect(prospect);
    setCallDialogOpen(true);
  };

  const handleQualify = (prospect: Prospect) => {
    // Open OpportuniteForm with pre-filled data
    setSelectedProspect(prospect);
    setOpportunityDialogOpen(true);
  };

  const handleOpportunitySuccess = async (opportuniteId: string) => {
    if (!selectedProspect || !selectedProspect.client?.[0]) return;

    try {
      // Update contact status to "Qualifié" and client status to "Actif"
      await convertToOpportunity.mutateAsync({
        contactId: selectedProspect.id,
        clientId: selectedProspect.client[0],
      });

      toast.success("Opportunité créée avec succès !", {
        description: "Le lead a été qualifié.",
        action: {
          label: "Voir",
          onClick: () => {
            window.location.href = "/opportunites";
          },
        },
      });

      // Close dialog and reset
      setOpportunityDialogOpen(false);
      setSelectedProspect(null);
    } catch {
      toast.error("Erreur lors de la mise à jour du lead");
    }
  };

  const handleNotQualified = async (prospect: Prospect) => {
    try {
      await updateStatus.mutateAsync({
        id: prospect.id,
        statut: "Non qualifié",
      });
      toast.success("Lead marqué comme non qualifié");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleLost = async (prospect: Prospect) => {
    try {
      await updateStatus.mutateAsync({
        id: prospect.id,
        statut: "Perdu",
      });
      toast.success("Lead marqué comme perdu");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Prepare initial data for OpportuniteForm based on selected prospect
  const opportunityInitialData: Partial<OpportuniteFormData> | undefined =
    selectedProspect
      ? {
          clientId: selectedProspect.client?.[0] || "",
          source: selectedProspect.sourceLead || "",
          notes: selectedProspect.notesProspection || "",
          statut: "Qualifié",
        }
      : undefined;

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospection"
        description="Gérez vos leads et suivez vos appels"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <ProspectForm />
        </div>
      </PageHeader>

      {/* KPIs */}
      <ProspectionKPIs />

      {/* Past RDV Notifications */}
      <PastRdvNotifications
        onOpenProspect={(prospect) => {
          setSelectedProspect(prospect);
          setCallDialogOpen(true);
        }}
      />

      {/* Filters */}
      <ProspectionFilters filters={filters} onFiltersChange={setFilters} />

      {/* Leads List */}
      {!activeProspects || activeProspects.length === 0 ? (
        <EmptyState
          icon={PhoneIcon}
          title="Aucun lead à prospecter"
          description="Importez vos premiers leads ou créez-en un manuellement."
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importer un fichier
            </Button>
            <ProspectForm />
          </div>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeProspects.map((prospect) => (
            <LeadCard
              key={prospect.id}
              prospect={prospect}
              onCall={handleCall}
              onQualify={handleQualify}
              onNotQualified={handleNotQualified}
              onLost={handleLost}
            />
          ))}
        </div>
      )}

      {/* Call Result Dialog */}
      <CallResultDialog
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
        prospect={selectedProspect}
      />

      {/* Lead Import Dialog */}
      <LeadImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["prospects"] });
          queryClient.invalidateQueries({ queryKey: ["prospects-with-clients"] });
          queryClient.invalidateQueries({ queryKey: ["prospection-kpis"] });
        }}
      />

      {/* Opportunity Creation Dialog (for lead conversion) */}
      <OpportuniteForm
        open={opportunityDialogOpen}
        onOpenChange={(open) => {
          setOpportunityDialogOpen(open);
          if (!open) setSelectedProspect(null);
        }}
        initialData={opportunityInitialData}
        onSuccess={handleOpportunitySuccess}
      />
    </div>
  );
}
