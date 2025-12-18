"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  StatusBadge,
  PageLoading,
  EmptyState,
  ExportButton,
} from "@/components/shared";
import { projetExportColumns } from "@/lib/export";
import { ProjetForm } from "@/components/forms";
import { useProjets } from "@/hooks/use-projets";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import { PROJECT_STATUSES, type ProjectStatus } from "@/types";

type ViewMode = "grid" | "list";

export default function ProjetsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { data: projets, isLoading } = useProjets(
    statusFilter !== "all" ? { statut: statusFilter as ProjectStatus } : undefined
  );

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projets"
        description="Gérez vos projets et suivez leur progression"
      >
        <div className="flex items-center gap-2">
          <ExportButton
            data={projets || []}
            columns={projetExportColumns}
            filename="projets"
            sheetName="Projets"
          />
          <ProjetForm />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {PROJECT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden sm:flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </PageHeader>

      {!projets || projets.length === 0 ? (
        <EmptyState
          title="Aucun projet"
          description="Créez votre premier projet pour commencer à suivre vos activités."
        >
          <ProjetForm />
        </EmptyState>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projets.map((projet) => {
            const enRetard =
              projet.dateFinPrevue &&
              isOverdue(projet.dateFinPrevue) &&
              projet.statut === "En cours";

            return (
              <Link key={projet.id} href={`/projets/${projet.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2">
                        {projet.nomProjet || projet.briefProjet || "Sans nom"}
                      </CardTitle>
                      <StatusBadge
                        status={projet.statut || "En cours"}
                        type="project"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
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

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-medium">
                          {formatCurrency(projet.budget)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tâches</p>
                        <p className="font-medium">
                          {projet.nbTachesTerminees || 0}/{projet.nbTaches || 0}
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Échéance</span>
                      <span
                        className={
                          enRetard ? "text-destructive font-medium" : ""
                        }
                      >
                        {projet.dateFinPrevue
                          ? formatDate(projet.dateFinPrevue)
                          : "Non définie"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {projets.map((projet) => {
                const enRetard =
                  projet.dateFinPrevue &&
                  isOverdue(projet.dateFinPrevue) &&
                  projet.statut === "En cours";

                return (
                  <Link
                    key={projet.id}
                    href={`/projets/${projet.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {projet.nomProjet || projet.briefProjet || "Sans nom"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge
                          status={projet.statut || "En cours"}
                          type="project"
                        />
                        <span className="text-xs text-muted-foreground">
                          {projet.nbTachesTerminees || 0}/{projet.nbTaches || 0}{" "}
                          tâches
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:block w-32">
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
                    <div className="hidden md:block text-right">
                      <p className="font-medium">
                        {formatCurrency(projet.budget)}
                      </p>
                      <p className="text-xs text-muted-foreground">Budget</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm ${
                          enRetard ? "text-destructive font-medium" : ""
                        }`}
                      >
                        {projet.dateFinPrevue
                          ? formatDate(projet.dateFinPrevue)
                          : "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">Échéance</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
