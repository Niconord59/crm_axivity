"use client";

import {
  FolderKanban,
  Target,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { KPICard, StatusBadge, PageLoading } from "@/components/shared";
import { CAMensuelChart } from "@/components/charts";
import { useProjetsActifs } from "@/hooks/use-projets";
import { useOpportunites } from "@/hooks/use-opportunites";
import { useFacturesImpayees } from "@/hooks/use-factures";
import { useTachesEnRetard } from "@/hooks/use-taches";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const { data: projetsActifs, isLoading: loadingProjets } = useProjetsActifs();
  const { data: opportunites, isLoading: loadingOpp } = useOpportunites();
  const { data: facturesImpayees, isLoading: loadingFactures } =
    useFacturesImpayees();
  const { data: tachesEnRetard, isLoading: loadingTaches } = useTachesEnRetard();

  const isLoading =
    loadingProjets || loadingOpp || loadingFactures || loadingTaches;

  if (isLoading) {
    return <PageLoading />;
  }

  // Calculate KPIs
  const nbProjetsActifs = projetsActifs?.length || 0;
  const projetsEnRetard = projetsActifs?.filter(
    (p) => p.dateFinPrevue && isOverdue(p.dateFinPrevue) && p.statut === "En cours"
  ).length || 0;

  const opportunitesEnCours = opportunites?.filter(
    (o) => o.statut && !["Gagné", "Perdu"].includes(o.statut)
  ) || [];
  const valeurPipeline = opportunitesEnCours.reduce(
    (sum, o) => sum + (o.valeurPonderee || 0),
    0
  );

  const nbFacturesImpayees = facturesImpayees?.length || 0;
  const montantImpayes = facturesImpayees?.reduce(
    (sum, f) => sum + (f.montantTTC || 0),
    0
  ) || 0;

  const nbTachesEnRetard = tachesEnRetard?.length || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Projets Actifs"
          value={nbProjetsActifs}
          description={
            projetsEnRetard > 0
              ? `${projetsEnRetard} en retard`
              : "Tous à jour"
          }
          icon={FolderKanban}
        />
        <KPICard
          title="Pipeline Commercial"
          value={formatCurrency(valeurPipeline)}
          description={`${opportunitesEnCours.length} opportunités`}
          icon={Target}
        />
        <KPICard
          title="Factures Impayées"
          value={nbFacturesImpayees}
          description={formatCurrency(montantImpayes)}
          icon={FileText}
        />
        <KPICard
          title="Tâches en Retard"
          value={nbTachesEnRetard}
          description={nbTachesEnRetard > 0 ? "Urgent" : "Aucune"}
          icon={AlertTriangle}
        />
      </div>

      {/* CA Mensuel Chart */}
      <CAMensuelChart />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Projets Récents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Projets Récents</CardTitle>
            <Link
              href="/projets"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Voir tout
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projetsActifs?.slice(0, 5).map((projet) => (
                <div
                  key={projet.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projets/${projet.id}`}
                      className="font-medium hover:underline truncate block"
                    >
                      {projet.nomProjet || projet.briefProjet || "Sans nom"}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge
                        status={projet.statut || "En cours"}
                        type="project"
                      />
                      <span className="text-xs text-muted-foreground">
                        {projet.dateFinPrevue
                          ? formatDate(projet.dateFinPrevue)
                          : "Date non définie"}
                      </span>
                    </div>
                  </div>
                  <div className="w-24 shrink-0">
                    <Progress
                      value={(projet.pourcentageTachesTerminees || 0) * 100}
                      className="h-2"
                    />
                    <span className="text-xs text-muted-foreground">
                      {Math.round(
                        (projet.pourcentageTachesTerminees || 0) * 100
                      )}
                      %
                    </span>
                  </div>
                </div>
              ))}
              {(!projetsActifs || projetsActifs.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun projet actif
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opportunités */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Opportunités en Cours</CardTitle>
            <Link
              href="/opportunites"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Voir tout
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunitesEnCours?.slice(0, 5).map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/opportunites/${opp.id}`}
                      className="font-medium hover:underline truncate block"
                    >
                      {opp.nom}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge
                        status={opp.statut || "Lead"}
                        type="opportunity"
                      />
                      <span className="text-xs text-muted-foreground">
                        {opp.dateClotureEstimee
                          ? formatDate(opp.dateClotureEstimee)
                          : "Date non définie"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-medium">
                      {formatCurrency(opp.valeurEstimee)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {opp.probabilite
                        ? `${Math.round(opp.probabilite * 100)}%`
                        : "N/A"}
                    </div>
                  </div>
                </div>
              ))}
              {opportunitesEnCours.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune opportunité en cours
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tâches en Retard */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Tâches en Retard
            </CardTitle>
            <Link
              href="/taches"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Voir tout
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tachesEnRetard?.slice(0, 5).map((tache) => (
                <div
                  key={tache.id}
                  className="flex items-center justify-between gap-4 p-2 rounded-lg bg-destructive/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{tache.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      Échéance: {formatDate(tache.dateEcheance)}
                    </p>
                  </div>
                  <StatusBadge
                    status={tache.priorite || "Moyenne"}
                    type="priority"
                  />
                </div>
              ))}
              {(!tachesEnRetard || tachesEnRetard.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune tâche en retard
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Factures à Relancer */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Factures à Relancer</CardTitle>
            <Link
              href="/factures"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Voir tout
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {facturesImpayees?.slice(0, 5).map((facture) => (
                <div
                  key={facture.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {facture.numero || "Sans numéro"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Échéance: {formatDate(facture.dateEcheance)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-medium">
                      {formatCurrency(facture.montantTTC)}
                    </div>
                    {facture.niveauRelance && facture.niveauRelance > 0 && (
                      <span className="text-xs text-destructive">
                        Relance N{facture.niveauRelance}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(!facturesImpayees || facturesImpayees.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune facture impayée
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
