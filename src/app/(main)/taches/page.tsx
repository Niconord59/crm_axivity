"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/shared";
import { TacheForm } from "@/components/forms";
import { useTaches, useUpdateTacheStatut } from "@/hooks/use-taches";
import { formatDate, isOverdue } from "@/lib/utils";
import { TASK_STATUSES, TASK_PRIORITIES, type TaskStatus, type TaskPriority } from "@/types";

export default function TachesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const { data: taches, isLoading } = useTaches(
    statusFilter !== "all" ? { statut: statusFilter as TaskStatus } : undefined
  );
  const updateStatut = useUpdateTacheStatut();

  const filteredTaches = taches?.filter((t) => {
    if (priorityFilter !== "all" && t.priorite !== priorityFilter) {
      return false;
    }
    return true;
  });

  const handleToggleComplete = (id: string, currentStatut: TaskStatus | undefined) => {
    const newStatut: TaskStatus =
      currentStatut === "Terminé" ? "À faire" : "Terminé";
    updateStatut.mutate({ id, statut: newStatut });
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tâches"
        description="Gérez toutes les tâches de vos projets"
      >
        <div className="flex items-center gap-2">
          <TacheForm />
          <Button variant="outline" size="sm" asChild>
            <Link href="/taches/calendrier">
              <Calendar className="h-4 w-4 mr-2" />
              Calendrier
            </Link>
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {TASK_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {TASK_PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {!filteredTaches || filteredTaches.length === 0 ? (
        <EmptyState
          title="Aucune tâche"
          description="Créez votre première tâche pour commencer."
        >
          <TacheForm />
        </EmptyState>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredTaches.map((tache) => {
                const enRetard =
                  tache.dateEcheance &&
                  isOverdue(tache.dateEcheance) &&
                  tache.statut !== "Terminé";

                return (
                  <div
                    key={tache.id}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                      enRetard ? "bg-destructive/5" : ""
                    }`}
                  >
                    <Checkbox
                      checked={tache.statut === "Terminé"}
                      onCheckedChange={() =>
                        handleToggleComplete(tache.id, tache.statut)
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-medium ${
                          tache.statut === "Terminé"
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {tache.nom}
                      </p>
                      {tache.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {tache.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge
                          status={tache.statut || "À faire"}
                          type="task"
                        />
                        <StatusBadge
                          status={tache.priorite || "Moyenne"}
                          type="priority"
                        />
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      {tache.heuresEstimees && (
                        <span className="text-xs text-muted-foreground">
                          {tache.heuresReelles || 0}h / {tache.heuresEstimees}h
                        </span>
                      )}
                      <span
                        className={`text-sm ${
                          enRetard
                            ? "text-destructive font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {tache.dateEcheance
                          ? formatDate(tache.dateEcheance)
                          : "Pas d'échéance"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
