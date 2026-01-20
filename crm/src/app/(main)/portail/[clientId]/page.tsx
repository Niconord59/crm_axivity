"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FolderKanban,
  FileText,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, PageLoading } from "@/components/shared";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useClient } from "@/hooks/use-clients";
import { useProjets } from "@/hooks/use-projets";
import { useFactures } from "@/hooks/use-factures";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PortailClientPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const { data: client, isLoading: loadingClient } = useClient(clientId);
  const { data: projets, isLoading: loadingProjets } = useProjets({
    clientId,
  });
  const { data: factures, isLoading: loadingFactures } = useFactures({
    clientId,
  });

  const isLoading = loadingClient || loadingProjets || loadingFactures;

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

  // Stats
  const projetsActifs = projets?.filter((p) => p.statut === "En cours") || [];
  const projetsTermines = projets?.filter((p) => p.statut === "Terminé") || [];
  const facturesEnAttente =
    factures?.filter((f) => f.statut === "Envoyé") || [];
  const totalFacturesEnAttente = facturesEnAttente.reduce(
    (sum, f) => sum + (f.montantTTC || 0),
    0
  );

  return (
    <div className="space-y-8">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Accueil</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Welcome Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-xl">
            {client.nom
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">Bienvenue, {client.nom}</h1>
          <p className="text-muted-foreground">
            Suivez l'avancement de vos projets et vos factures
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <FolderKanban className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projets actifs</p>
                <p className="text-2xl font-bold">{projetsActifs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projets terminés</p>
                <p className="text-2xl font-bold">{projetsTermines.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Factures en attente</p>
                <p className="text-2xl font-bold">{facturesEnAttente.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Montant dû</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalFacturesEnAttente)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Projets en cours</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/portail/${clientId}/projets`}>
              Voir tous
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {projetsActifs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun projet en cours
            </p>
          ) : (
            <div className="space-y-4">
              {projetsActifs.slice(0, 3).map((projet) => (
                <div
                  key={projet.id}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">
                      {projet.nomProjet || projet.briefProjet || "Sans nom"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge
                        status={projet.statut || "En cours"}
                        type="project"
                      />
                      <span className="text-xs text-muted-foreground">
                        Échéance:{" "}
                        {projet.dateFinPrevue
                          ? formatDate(projet.dateFinPrevue)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
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
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Factures récentes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/portail/${clientId}/factures`}>
              Voir toutes
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!factures || factures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune facture
            </p>
          ) : (
            <div className="space-y-3">
              {factures.slice(0, 5).map((facture) => (
                <div
                  key={facture.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">
                      {facture.numero || "Sans numéro"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge
                        status={facture.statut || "Brouillon"}
                        type="invoice"
                      />
                      <span className="text-xs text-muted-foreground">
                        {facture.dateEmission
                          ? formatDate(facture.dateEmission)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <p className="font-bold">{formatCurrency(facture.montantTTC)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
