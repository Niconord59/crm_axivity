"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FolderKanban, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, PageLoading, EmptyState } from "@/components/shared";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useClient } from "@/hooks/use-clients";
import { useProjets } from "@/hooks/use-projets";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PortailProjetsPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const { data: client, isLoading: loadingClient } = useClient(clientId);
  const { data: projets, isLoading: loadingProjets } = useProjets({
    clientId,
  });

  const isLoading = loadingClient || loadingProjets;

  if (isLoading) {
    return <PageLoading />;
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-lg font-semibold">Accès non autorisé</h2>
        <p className="text-muted-foreground mt-1">
          Ce portail client n'est pas disponible.
        </p>
      </div>
    );
  }

  // Group projects by status
  const projetsActifs = projets?.filter(
    (p) => p.statut === "En cours" || p.statut === "Cadrage"
  ) || [];
  const projetsTermines = projets?.filter((p) => p.statut === "Terminé") || [];

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/portail/${clientId}`}>Accueil</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Projets</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vos Projets</h1>
          <p className="text-muted-foreground">
            Suivez l'avancement de tous vos projets
          </p>
        </div>
      </div>

      {!projets || projets.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Aucun projet"
          description="Vous n'avez pas encore de projets."
        />
      ) : (
        <>
          {/* Active Projects */}
          {projetsActifs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Projets en cours</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {projetsActifs.map((projet) => (
                  <Card key={projet.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">
                          {projet.nomProjet || projet.briefProjet || "Sans nom"}
                        </CardTitle>
                        <StatusBadge
                          status={projet.statut || "En cours"}
                          type="project"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {projet.briefProjet && projet.nomProjet && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {projet.briefProjet}
                        </p>
                      )}

                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">
                            Progression
                          </span>
                          <span className="font-medium">
                            {Math.round(
                              (projet.pourcentageTachesTerminees || 0) * 100
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={(projet.pourcentageTachesTerminees || 0) * 100}
                          className="h-3"
                        />
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Échéance</p>
                            <p className="font-medium">
                              {projet.dateFinPrevue
                                ? formatDate(projet.dateFinPrevue)
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Tâches</p>
                            <p className="font-medium">
                              {projet.nbTachesTerminees || 0} /{" "}
                              {projet.nbTaches || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Budget info (if shared with client) */}
                      {projet.budget && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Budget</span>
                            <span className="font-bold">
                              {formatCurrency(projet.budget)}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Projects */}
          {projetsTermines.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Projets terminés</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projetsTermines.map((projet) => (
                  <Card key={projet.id} className="opacity-80">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium">
                          {projet.nomProjet || projet.briefProjet || "Sans nom"}
                        </h3>
                        <StatusBadge status="Terminé" type="project" />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                        <span>
                          Terminé le:{" "}
                          {projet.dateFinReelle
                            ? formatDate(projet.dateFinReelle)
                            : "N/A"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
