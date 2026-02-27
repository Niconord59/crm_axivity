"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Upload, Phone as PhoneIcon, CalendarDays, Users } from "lucide-react";
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
  ProspectionAgendaView,
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

type ViewMode = "leads" | "agenda";

function ProspectionContent() {
  const [view, setView] = useState<ViewMode>("leads");
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
          {/* View toggle */}
          <div className="flex items-center rounded-lg border p-0.5">
            <Button
              variant={view === "leads" ? "default" : "ghost"}
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setView("leads")}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Leads</span>
            </Button>
            <Button
              variant={view === "agenda" ? "default" : "ghost"}
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setView("agenda")}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Agenda</span>
            </Button>
          </div>

          {view === "leads" && (
            <>
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </Button>
              <ProspectForm />
            </>
          )}
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

      {/* Conditional view: Leads or Agenda */}
      {view === "leads" ? (
        <>
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
        </>
      ) : (
        <ProspectionAgendaView
          onOpenProspect={(prospect) => {
            setSelectedProspect(prospect);
            setCallDialogOpen(true);
          }}
        />
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
