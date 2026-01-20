"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import {
  useProspectsWithClients,
  useUpdateProspectStatus,
  useProspect,
  type ProspectFilters,
  type Prospect,
} from "@/hooks/use-prospects";
import { useProspectionRealtime } from "@/hooks/use-realtime";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// Wrapper component to handle Suspense boundary for useSearchParams
export default function ProspectionPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ProspectionContent />
    </Suspense>
  );
}

function ProspectionContent() {
  const [filters, setFilters] = useState<ProspectFilters>({});
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const leadIdFromUrl = searchParams.get("leadId");

  const queryClient = useQueryClient();
  const { data: prospects, isLoading } = useProspectsWithClients(filters);
  const { data: prospectFromUrl } = useProspect(leadIdFromUrl || undefined);

  // S'abonner aux changements Realtime pour rafraîchir automatiquement
  useProspectionRealtime();

  // Auto-open dialog if leadId is in URL
  useEffect(() => {
    if (leadIdFromUrl && prospectFromUrl) {
      setSelectedProspect(prospectFromUrl as Prospect);
      setCallDialogOpen(true);
      // Clear the URL parameter without reloading
      router.replace("/prospection", { scroll: false });
    }
  }, [leadIdFromUrl, prospectFromUrl, router]);
  const updateStatus = useUpdateProspectStatus();

  // "Tous les statuts" = vraiment tous les statuts
  const activeProspects = useMemo(() => {
    if (!prospects) return [];
    return prospects;
  }, [prospects]);

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

  // Afficher le loading uniquement au chargement initial (pas lors des refetch)
  if (isLoading && !prospects) {
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
          description="Importez vos premiers leads via le bouton 'Importer' ou créez-en un manuellement via 'Nouveau lead' ci-dessus."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeProspects.map((prospect) => (
            <LeadCard
              key={prospect.id}
              prospect={prospect}
              onCall={handleCall}
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
    </div>
  );
}
