"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, Clock, AlertTriangle, CheckCircle2, Circle, Loader2, Eye, Users, List, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  PageHeader,
  StatusBadge,
  PageLoading,
  EmptyState,
} from "@/components/shared";
import { TacheForm } from "@/components/forms";
import { useTaches, useUpdateTacheStatut } from "@/hooks/use-taches";
import { useProjets } from "@/hooks/use-projets";
import { useProfiles } from "@/hooks/use-profiles";
import { formatDate, isOverdue } from "@/lib/utils";
import { TASK_STATUSES, TASK_PRIORITIES, type TaskStatus, type TaskPriority, type Tache } from "@/types";

type ViewMode = "list" | "by-user";

export default function TachesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const { data: taches, isLoading } = useTaches(
    statusFilter !== "all" ? { statut: statusFilter as TaskStatus } : undefined
  );
  const { data: projets } = useProjets();
  const { data: profiles } = useProfiles();
  const updateStatut = useUpdateTacheStatut();

  // Map projet IDs to names
  const projetNamesMap = new Map(
    projets?.map((p) => [p.id, p.nomProjet || p.briefProjet || "Sans nom"]) || []
  );

  // Map profile IDs to profile info
  const profilesMap = useMemo(() => {
    return new Map(profiles?.map((p) => [p.id, p]) || []);
  }, [profiles]);

  const filteredTaches = taches?.filter((t) => {
    if (priorityFilter !== "all" && t.priorite !== priorityFilter) {
      return false;
    }
    return true;
  });

  // Group tasks by assignee for "by-user" view
  const tasksByUser = useMemo(() => {
    if (!filteredTaches || !profiles) return [];

    const grouped = new Map<string, Tache[]>();
    const unassigned: Tache[] = [];

    filteredTaches.forEach((tache) => {
      const assigneeId = tache.membreEquipe?.[0];
      if (assigneeId) {
        const existing = grouped.get(assigneeId) || [];
        existing.push(tache);
        grouped.set(assigneeId, existing);
      } else {
        unassigned.push(tache);
      }
    });

    // Convert to array with user info
    const result: { userId: string | null; user: typeof profiles[0] | null; tasks: Tache[] }[] = [];

    profiles.forEach((profile) => {
      const userTasks = grouped.get(profile.id);
      if (userTasks && userTasks.length > 0) {
        result.push({ userId: profile.id, user: profile, tasks: userTasks });
      }
    });

    // Add unassigned tasks at the end
    if (unassigned.length > 0) {
      result.push({ userId: null, user: null, tasks: unassigned });
    }

    // Sort by number of tasks (most tasks first)
    result.sort((a, b) => b.tasks.length - a.tasks.length);

    return result;
  }, [filteredTaches, profiles]);

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

          {/* Toggle Vue Liste / Par utilisateur */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-1" />
              Liste
            </Button>
            <Button
              variant={viewMode === "by-user" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("by-user")}
            >
              <Users className="h-4 w-4 mr-1" />
              Par utilisateur
            </Button>
          </div>

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

      {/* Stats rapides */}
      {filteredTaches && filteredTaches.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <Circle className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredTaches.filter(t => t.statut === "À faire").length}</p>
                <p className="text-xs text-muted-foreground">À faire</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Loader2 className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredTaches.filter(t => t.statut === "En cours").length}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredTaches.filter(t => t.statut === "Terminé").length}</p>
                <p className="text-xs text-muted-foreground">Terminées</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredTaches.filter(t => t.dateEcheance && isOverdue(t.dateEcheance) && t.statut !== "Terminé").length}</p>
                <p className="text-xs text-muted-foreground">En retard</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {!filteredTaches || filteredTaches.length === 0 ? (
        <EmptyState
          title="Aucune tâche"
          description="Créez votre première tâche pour commencer."
        >
          <TacheForm />
        </EmptyState>
      ) : viewMode === "by-user" ? (
        /* Vue par utilisateur */
        <div className="grid gap-6">
          {tasksByUser.map(({ userId, user, tasks }) => {
            const completedCount = tasks.filter(t => t.statut === "Terminé").length;
            const inProgressCount = tasks.filter(t => t.statut === "En cours").length;
            const todoCount = tasks.filter(t => t.statut === "À faire").length;
            const overdueCount = tasks.filter(t => t.dateEcheance && isOverdue(t.dateEcheance) && t.statut !== "Terminé").length;
            const progressPercent = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

            return (
              <Card key={userId || "unassigned"} className="overflow-hidden">
                <CardHeader className="pb-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={user ? "bg-primary text-primary-foreground" : "bg-muted"}>
                          {user ? (
                            <>
                              {user.prenom?.[0] || user.nom[0]}
                              {user.nom[0]}
                            </>
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {user ? (user.prenom ? `${user.prenom} ${user.nom}` : user.nom) : "Non assigné"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {tasks.length} tâche{tasks.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="gap-1">
                          <Circle className="h-3 w-3 text-slate-500" />
                          {todoCount}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Loader2 className="h-3 w-3 text-blue-500" />
                          {inProgressCount}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {completedCount}
                        </Badge>
                        {overdueCount > 0 && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {overdueCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progression</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className={tasks.length > 5 ? "h-[300px]" : ""}>
                    <div className="divide-y">
                      {tasks.map((tache) => {
                        const enRetard = tache.dateEcheance && isOverdue(tache.dateEcheance) && tache.statut !== "Terminé";
                        const isCompleted = tache.statut === "Terminé";

                        return (
                          <div
                            key={tache.id}
                            className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${
                              isCompleted ? "opacity-60" : ""
                            } ${enRetard ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}
                          >
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => handleToggleComplete(tache.id, tache.statut)}
                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                                {tache.nom}
                              </p>
                              {tache.projet?.[0] && (
                                <Link
                                  href={`/projets/${tache.projet[0]}`}
                                  className="text-xs text-primary hover:underline"
                                >
                                  {projetNamesMap.get(tache.projet[0]) || "Projet"}
                                </Link>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  tache.priorite === "Critique" ? "border-red-500 text-red-600" :
                                  tache.priorite === "Haute" ? "border-orange-500 text-orange-600" :
                                  tache.priorite === "Moyenne" ? "border-blue-500 text-blue-600" :
                                  "border-slate-400 text-slate-500"
                                }`}
                              >
                                {tache.priorite || "Moyenne"}
                              </Badge>
                              {tache.dateEcheance && (
                                <span className={`text-xs flex items-center gap-1 ${enRetard ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                                  {enRetard && <AlertTriangle className="h-3 w-3" />}
                                  {formatDate(tache.dateEcheance)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Vue liste classique */
        <div className="grid gap-3">
          {filteredTaches.map((tache) => {
            const enRetard =
              tache.dateEcheance &&
              isOverdue(tache.dateEcheance) &&
              tache.statut !== "Terminé";
            const isCompleted = tache.statut === "Terminé";
            const progressPercent = tache.heuresEstimees
              ? Math.min(100, ((tache.heuresReelles || 0) / tache.heuresEstimees) * 100)
              : 0;

            // Couleurs de priorité
            const priorityColors: Record<string, string> = {
              "Critique": "border-l-red-500",
              "Haute": "border-l-orange-500",
              "Moyenne": "border-l-blue-500",
              "Basse": "border-l-slate-400",
            };

            return (
              <label
                key={tache.id}
                className={`
                  group relative flex items-start gap-4 rounded-xl border-l-4 bg-card p-4
                  transition-all duration-200 cursor-pointer
                  hover:shadow-md hover:bg-accent/30
                  ${priorityColors[tache.priorite || "Moyenne"]}
                  ${isCompleted ? "opacity-60" : ""}
                  ${enRetard ? "bg-red-50/50 dark:bg-red-950/20 border-l-red-500" : ""}
                  has-[[data-state=checked]]:bg-green-50/50 dark:has-[[data-state=checked]]:bg-green-950/20
                  has-[[data-state=checked]]:border-l-green-500
                `}
              >
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={() => handleToggleComplete(tache.id, tache.statut)}
                  className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />

                <div className="min-w-0 flex-1 space-y-2">
                  {/* Header: Titre + Projet */}
                  <div>
                    <p className={`font-semibold text-base ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                      {tache.nom}
                    </p>
                    {tache.projet?.[0] && (
                      <Link
                        href={`/projets/${tache.projet[0]}`}
                        className="text-sm text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {projetNamesMap.get(tache.projet[0]) || "Projet"}
                      </Link>
                    )}
                  </div>

                  {/* Description avec HoverCard */}
                  {tache.description && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <p className="text-sm text-muted-foreground line-clamp-1 cursor-help">
                          {tache.description}
                        </p>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">{tache.description}</p>
                      </HoverCardContent>
                    </HoverCard>
                  )}

                  {/* Footer: Badges + Progress */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        tache.statut === "Terminé" ? "default" :
                        tache.statut === "En cours" ? "secondary" :
                        "outline"
                      }
                      className={`text-xs ${
                        tache.statut === "Terminé" ? "bg-green-600" :
                        tache.statut === "En cours" ? "bg-blue-600 text-white" :
                        tache.statut === "En revue" ? "bg-purple-600 text-white" : ""
                      }`}
                    >
                      {tache.statut || "À faire"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        tache.priorite === "Critique" ? "border-red-500 text-red-600" :
                        tache.priorite === "Haute" ? "border-orange-500 text-orange-600" :
                        tache.priorite === "Moyenne" ? "border-blue-500 text-blue-600" :
                        "border-slate-400 text-slate-500"
                      }`}
                    >
                      {tache.priorite || "Moyenne"}
                    </Badge>

                    {/* Progress bar pour les heures */}
                    {tache.heuresEstimees && tache.heuresEstimees > 0 && (
                      <div className="hidden sm:flex items-center gap-2 ml-auto">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <div className="w-20">
                          <Progress value={progressPercent} className="h-1.5" />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {tache.heuresReelles || 0}h / {tache.heuresEstimees}h
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Date */}
                <div className="hidden sm:flex flex-col items-end gap-2 min-w-[100px]">
                  <div className={`flex items-center gap-1.5 text-sm ${
                    enRetard ? "text-red-600 font-semibold" : "text-muted-foreground"
                  }`}>
                    {enRetard && <AlertTriangle className="h-4 w-4" />}
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {tache.dateEcheance ? formatDate(tache.dateEcheance) : "—"}
                    </span>
                  </div>
                  {enRetard && (
                    <Badge variant="destructive" className="text-xs">
                      En retard
                    </Badge>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
