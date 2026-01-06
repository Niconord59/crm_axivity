"use client";

import { Phone, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { KPICard } from "@/components/shared";
import { useProspectionKPIs } from "@/hooks/use-prospects";
import { Skeleton } from "@/components/ui/skeleton";

export function ProspectionKPIs() {
  const { data: kpis, isLoading } = useProspectionKPIs();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[108px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Leads à appeler"
        value={kpis?.aAppeler || 0}
        description={`sur ${kpis?.total || 0} total`}
        icon={Phone}
        tooltip="Leads en attente d'un premier appel. Cliquez sur une carte pour lancer l'appel."
      />
      <KPICard
        title="Rappels en attente"
        value={kpis?.rappels || 0}
        description={kpis?.rappelsEnRetard ? `${kpis.rappelsEnRetard} en retard` : "Tous à jour"}
        icon={Clock}
        variant={kpis?.rappelsEnRetard && kpis.rappelsEnRetard > 0 ? "destructive" : "default"}
        tooltip="Leads à rappeler à une date planifiée. Vérifiez régulièrement pour ne pas manquer de relances."
      />
      <KPICard
        title="Taux qualification"
        value={`${kpis?.tauxQualification || 0}%`}
        description={`${kpis?.qualifies || 0} qualifiés`}
        icon={CheckCircle2}
        tooltip="Pourcentage de leads qualifiés (prêts à devenir des opportunités commerciales) sur le total traité."
      />
      <KPICard
        title="Rappels en retard"
        value={kpis?.rappelsEnRetard || 0}
        description="À traiter en priorité"
        icon={AlertTriangle}
        variant={kpis?.rappelsEnRetard && kpis.rappelsEnRetard > 0 ? "destructive" : "default"}
        tooltip="Rappels dont la date est passée. À traiter en priorité pour maintenir la relation client !"
      />
    </div>
  );
}
