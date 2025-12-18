"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Edit, Calendar, Clock, Euro, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge, PageLoading } from "@/components/shared";
import { AppBreadcrumb } from "@/components/layout";
import { useProjet } from "@/hooks/use-projets";
import { useTaches } from "@/hooks/use-taches";
import { useProfiles } from "@/hooks/use-profiles";
import { formatCurrency, formatDate, formatPercentage } from "@/lib/utils";

export default function ProjetDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: projet, isLoading: loadingProjet } = useProjet(id);
  const { data: taches, isLoading: loadingTaches } = useTaches({ projetId: id });
  const { data: profiles } = useProfiles();

  // Récupérer le responsable du projet
  const projetWithOwner = projet as (typeof projet & { ownerId?: string }) | undefined;
  const owner = projetWithOwner?.ownerId
    ? profiles?.find(p => p.id === projetWithOwner.ownerId)
    : null;

  const isLoading = loadingProjet || loadingTaches;

  if (isLoading) {
    return <PageLoading />;
  }

  if (!projet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-lg font-semibold">Projet non trouvé</h2>
        <p className="text-muted-foreground mt-1">
          Ce projet n'existe pas ou a été supprimé.
        </p>
        <Button asChild className="mt-4">
          <Link href="/projets">Retour aux projets</Link>
        </Button>
      </div>
    );
  }

  const tachesParStatut = {
    "À faire": taches?.filter((t) => t.statut === "À faire") || [],
    "En cours": taches?.filter((t) => t.statut === "En cours") || [],
    "En revue": taches?.filter((t) => t.statut === "En revue") || [],
    Terminé: taches?.filter((t) => t.statut === "Terminé") || [],
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Projets", href: "/projets" },
          { label: projet.nomProjet || projet.briefProjet || "Sans nom" },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {projet.nomProjet || projet.briefProjet || "Sans nom"}
              </h1>
              <StatusBadge status={projet.statut || "En cours"} type="project" />
            </div>
            {projet.briefProjet && projet.nomProjet && (
              <p className="text-muted-foreground mt-1">{projet.briefProjet}</p>
            )}
            {/* Responsable du projet */}
            {owner && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {owner.prenom?.[0] || owner.nom[0]}
                    {owner.nom[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  Responsable : <span className="font-medium text-foreground">{owner.prenom ? `${owner.prenom} ${owner.nom}` : owner.nom}</span>
                </span>
              </div>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progression</p>
                <p className="text-xl font-bold">
                  {formatPercentage(projet.pourcentageTachesTerminees)}
                </p>
              </div>
            </div>
            <Progress
              value={(projet.pourcentageTachesTerminees || 0) * 100}
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Euro className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-xl font-bold">
                  {formatCurrency(projet.budget)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Facturé: {formatCurrency(projet.montantTotalFacture)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-green-500/10">
                <Calendar className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Échéance</p>
                <p className="text-xl font-bold">
                  {projet.dateFinPrevue
                    ? formatDate(projet.dateFinPrevue)
                    : "N/A"}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Début: {projet.dateDebut ? formatDate(projet.dateDebut) : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-orange-500/10">
                <Users className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tâches</p>
                <p className="text-xl font-bold">
                  {projet.nbTachesTerminees || 0}/{projet.nbTaches || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Heures: {projet.totalHeuresPassees || 0}h /{" "}
              {projet.totalHeuresEstimees || 0}h estimées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tâches Kanban */}
      <Card>
        <CardHeader>
          <CardTitle>Tâches du Projet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(["À faire", "En cours", "En revue", "Terminé"] as const).map(
              (statut) => (
                <div key={statut} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{statut}</h3>
                    <span className="text-xs text-muted-foreground">
                      {tachesParStatut[statut].length}
                    </span>
                  </div>
                  <Separator />
                  <div className="space-y-2 min-h-[200px]">
                    {tachesParStatut[statut].map((tache) => (
                      <Card
                        key={tache.id}
                        className="p-3 cursor-pointer hover:shadow-sm transition-shadow"
                      >
                        <p className="font-medium text-sm line-clamp-2">
                          {tache.nom}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <StatusBadge
                            status={tache.priorite || "Moyenne"}
                            type="priority"
                          />
                          {tache.dateEcheance && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(tache.dateEcheance)}
                            </span>
                          )}
                        </div>
                      </Card>
                    ))}
                    {tachesParStatut[statut].length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        Aucune tâche
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {projet.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{projet.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
