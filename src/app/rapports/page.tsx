"use client";

import {
  Euro,
  TrendingUp,
  Target,
  Users,
  FolderKanban,
  FileText,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { KPICard, PageLoading } from "@/components/shared";
import { CAMensuelChart, PipelineChart, ProgressionChart } from "@/components/charts";
import { useProjets } from "@/hooks/use-projets";
import { useOpportunites } from "@/hooks/use-opportunites";
import { useFactures } from "@/hooks/use-factures";
import { useClients } from "@/hooks/use-clients";
import { useTaches } from "@/hooks/use-taches";
import { useEquipe } from "@/hooks/use-equipe";
import { formatCurrency, formatPercentage, isOverdue } from "@/lib/utils";

export default function RapportsPage() {
  const { data: projets, isLoading: loadingProjets } = useProjets();
  const { data: opportunites, isLoading: loadingOpp } = useOpportunites();
  const { data: factures, isLoading: loadingFactures } = useFactures();
  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: taches, isLoading: loadingTaches } = useTaches();
  const { data: equipe, isLoading: loadingEquipe } = useEquipe();

  const isLoading =
    loadingProjets ||
    loadingOpp ||
    loadingFactures ||
    loadingClients ||
    loadingTaches ||
    loadingEquipe;

  if (isLoading) {
    return <PageLoading />;
  }

  // Calculate KPIs
  const projetsActifs =
    projets?.filter(
      (p) => p.statut === "En cours" || p.statut === "Cadrage"
    ) || [];
  const projetsTermines = projets?.filter((p) => p.statut === "Terminé") || [];
  const projetsEnRetard = projetsActifs.filter(
    (p) => p.dateFinPrevue && isOverdue(p.dateFinPrevue)
  );

  const oppEnCours =
    opportunites?.filter(
      (o) => o.statut && !["Gagné", "Perdu"].includes(o.statut)
    ) || [];
  const oppGagnees = opportunites?.filter((o) => o.statut === "Gagné") || [];
  const oppPerdues = opportunites?.filter((o) => o.statut === "Perdu") || [];

  const valeurPipeline = oppEnCours.reduce(
    (sum, o) => sum + (o.valeurPonderee || 0),
    0
  );
  const valeurGagnee = oppGagnees.reduce(
    (sum, o) => sum + (o.valeurEstimee || 0),
    0
  );

  const tauxConversion =
    oppGagnees.length + oppPerdues.length > 0
      ? oppGagnees.length / (oppGagnees.length + oppPerdues.length)
      : 0;

  const facturesPayees = factures?.filter((f) => f.statut === "Payé") || [];
  const facturesImpayees = factures?.filter((f) => f.statut === "Envoyé") || [];
  const caTotal = facturesPayees.reduce(
    (sum, f) => sum + (f.montantTTC || 0),
    0
  );
  const montantImpayes = facturesImpayees.reduce(
    (sum, f) => sum + (f.montantTTC || 0),
    0
  );

  const clientsActifs = clients?.filter((c) => c.statut === "Actif") || [];

  const tachesTerminees = taches?.filter((t) => t.statut === "Terminé") || [];
  const tachesEnRetard =
    taches?.filter(
      (t) =>
        t.statut !== "Terminé" && t.dateEcheance && isOverdue(t.dateEcheance)
    ) || [];

  const membresActifs = equipe?.filter((m) => m.actif) || [];
  const chargeEquipeMoyenne =
    membresActifs.length > 0
      ? membresActifs.reduce((sum, m) => {
          const charge = m.capaciteHebdo
            ? (m.heuresSemaine || 0) / m.capaciteHebdo
            : 0;
          return sum + charge;
        }, 0) / membresActifs.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Tableau de Bord CEO
        </h1>
        <p className="text-muted-foreground mt-1">
          Vue stratégique de l'activité de l'agence
        </p>
      </div>

      {/* Financial KPIs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Performance Financière</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Chiffre d'Affaires"
            value={formatCurrency(caTotal)}
            description="Total facturé"
            icon={Euro}
          />
          <KPICard
            title="Pipeline Commercial"
            value={formatCurrency(valeurPipeline)}
            description={`${oppEnCours.length} opportunités`}
            icon={Target}
          />
          <KPICard
            title="Factures Impayées"
            value={formatCurrency(montantImpayes)}
            description={`${facturesImpayees.length} factures`}
            icon={FileText}
          />
          <KPICard
            title="Taux de Conversion"
            value={formatPercentage(tauxConversion)}
            description={`${oppGagnees.length} gagnées / ${oppPerdues.length} perdues`}
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* Operational KPIs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Performance Opérationnelle</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Projets Actifs"
            value={projetsActifs.length}
            description={
              projetsEnRetard.length > 0
                ? `${projetsEnRetard.length} en retard`
                : "Tous à jour"
            }
            icon={FolderKanban}
          />
          <KPICard
            title="Clients Actifs"
            value={clientsActifs.length}
            description={`${clients?.length || 0} total`}
            icon={Users}
          />
          <KPICard
            title="Tâches Terminées"
            value={tachesTerminees.length}
            description={`${tachesEnRetard.length} en retard`}
            icon={CheckSquare}
          />
          <KPICard
            title="Charge Équipe"
            value={formatPercentage(chargeEquipeMoyenne)}
            description={`${membresActifs.length} membres actifs`}
            icon={Users}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Visualisations</h2>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <CAMensuelChart />
          <PipelineChart />
          <ProgressionChart />
        </div>
      </div>

      {/* Detailed Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline par Statut */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Commercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Lead", "Qualifié", "Proposition", "Négociation"].map((statut) => {
              const oppsStatut = opportunites?.filter(
                (o) => o.statut === statut
              ) || [];
              const valeurStatut = oppsStatut.reduce(
                (sum, o) => sum + (o.valeurEstimee || 0),
                0
              );
              const valeurPondereeStatut = oppsStatut.reduce(
                (sum, o) => sum + (o.valeurPonderee || 0),
                0
              );

              return (
                <div key={statut}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{statut}</span>
                    <span className="text-sm text-muted-foreground">
                      {oppsStatut.length} ({formatCurrency(valeurStatut)})
                    </span>
                  </div>
                  <Progress
                    value={
                      valeurPipeline > 0
                        ? (valeurPondereeStatut / valeurPipeline) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Projets par Statut */}
        <Card>
          <CardHeader>
            <CardTitle>Projets par Statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Cadrage", "En cours", "En pause", "Terminé"].map((statut) => {
              const projetsStatut = projets?.filter(
                (p) => p.statut === statut
              ) || [];
              const percentTotal =
                projets && projets.length > 0
                  ? (projetsStatut.length / projets.length) * 100
                  : 0;

              return (
                <div key={statut}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{statut}</span>
                    <span className="text-sm text-muted-foreground">
                      {projetsStatut.length}
                    </span>
                  </div>
                  <Progress value={percentTotal} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Charge de l'Équipe */}
        <Card>
          <CardHeader>
            <CardTitle>Charge de l'Équipe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {membresActifs.slice(0, 6).map((membre) => {
              const chargePercent = membre.capaciteHebdo
                ? Math.min(
                    ((membre.heuresSemaine || 0) / membre.capaciteHebdo) * 100,
                    100
                  )
                : 0;

              return (
                <div key={membre.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">
                      {membre.nom}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {membre.heuresSemaine || 0}h / {membre.capaciteHebdo || 0}h
                    </span>
                  </div>
                  <Progress
                    value={chargePercent}
                    className={`h-2 ${
                      chargePercent > 80
                        ? "[&>div]:bg-destructive"
                        : chargePercent > 60
                        ? "[&>div]:bg-yellow-500"
                        : ""
                    }`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Alertes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projetsEnRetard.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10">
                  <FolderKanban className="h-4 w-4 text-destructive" />
                  <span className="text-sm">
                    {projetsEnRetard.length} projet(s) en retard
                  </span>
                </div>
              )}
              {tachesEnRetard.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10">
                  <CheckSquare className="h-4 w-4 text-destructive" />
                  <span className="text-sm">
                    {tachesEnRetard.length} tâche(s) en retard
                  </span>
                </div>
              )}
              {facturesImpayees.filter(
                (f) => f.dateEcheance && isOverdue(f.dateEcheance)
              ).length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10">
                  <FileText className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">
                    {
                      facturesImpayees.filter(
                        (f) => f.dateEcheance && isOverdue(f.dateEcheance)
                      ).length
                    }{" "}
                    facture(s) en retard de paiement
                  </span>
                </div>
              )}
              {membresActifs.filter((m) => {
                const charge = m.capaciteHebdo
                  ? (m.heuresSemaine || 0) / m.capaciteHebdo
                  : 0;
                return charge > 0.8;
              }).length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10">
                  <Users className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">
                    {
                      membresActifs.filter((m) => {
                        const charge = m.capaciteHebdo
                          ? (m.heuresSemaine || 0) / m.capaciteHebdo
                          : 0;
                        return charge > 0.8;
                      }).length
                    }{" "}
                    membre(s) en surcharge
                  </span>
                </div>
              )}
              {projetsEnRetard.length === 0 &&
                tachesEnRetard.length === 0 &&
                facturesImpayees.filter(
                  (f) => f.dateEcheance && isOverdue(f.dateEcheance)
                ).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune alerte
                  </p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
