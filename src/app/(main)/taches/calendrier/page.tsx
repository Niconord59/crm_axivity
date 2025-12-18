"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Calendar as CalendarIcon,
  Clock,
  User,
  FolderOpen,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PageHeader, PageLoading, StatusBadge } from "@/components/shared";
import { AppBreadcrumb } from "@/components/layout";
import { useTaches, useUpdateTacheStatut } from "@/hooks/use-taches";
import { cn, isOverdue, formatDate } from "@/lib/utils";
import type { Tache, TaskPriority } from "@/types";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Priority color mapping
const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  Critique: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  Haute: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
  Moyenne: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  Basse: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
};

function getPriorityColor(priority: TaskPriority | undefined, isCompleted: boolean) {
  if (isCompleted) {
    return { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" };
  }
  return PRIORITY_COLORS[priority || "Moyenne"];
}

export default function TachesCalendrierPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTache, setSelectedTache] = useState<Tache | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: taches, isLoading } = useTaches();
  const updateStatut = useUpdateTacheStatut();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const tachesByDate = useMemo(() => {
    if (!taches) return new Map<string, Tache[]>();

    const map = new Map<string, Tache[]>();
    taches.forEach((tache) => {
      if (tache.dateEcheance) {
        const dateKey = format(new Date(tache.dateEcheance), "yyyy-MM-dd");
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, tache]);
      }
    });
    return map;
  }, [taches]);

  const selectedDateTaches = useMemo(() => {
    if (!selectedDate || !taches) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return tachesByDate.get(dateKey) || [];
  }, [selectedDate, tachesByDate, taches]);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleTacheClick = (tache: Tache) => {
    setSelectedTache(tache);
    setSheetOpen(true);
  };

  const handleToggleStatut = () => {
    if (!selectedTache) return;
    const newStatut = selectedTache.statut === "Terminé" ? "À faire" : "Terminé";
    updateStatut.mutate(
      { id: selectedTache.id, statut: newStatut },
      {
        onSuccess: () => {
          setSelectedTache({ ...selectedTache, statut: newStatut });
        },
      }
    );
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Tâches", href: "/taches" },
          { label: "Calendrier" },
        ]}
      />

      <PageHeader
        title="Calendrier des Tâches"
        description="Visualisez vos tâches par date d'échéance"
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/taches">
            <List className="h-4 w-4 mr-2" />
            Vue Liste
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Calendar */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl capitalize">
              {format(currentDate, "MMMM yyyy", { locale: fr })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Aujourd'hui
              </Button>
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayTaches = tachesByDate.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isDayToday = isToday(day);

                return (
                  <TooltipProvider key={dateKey}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "relative h-20 p-1 text-left rounded-md border transition-colors",
                            !isCurrentMonth && "opacity-40",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:bg-muted",
                            isDayToday && "ring-2 ring-primary ring-offset-2"
                          )}
                        >
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isDayToday && "text-primary"
                            )}
                          >
                            {format(day, "d")}
                          </span>

                          {dayTaches.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {dayTaches.slice(0, 2).map((t) => {
                                const isCompleted = t.statut === "Terminé";
                                const colors = getPriorityColor(t.priorite, isCompleted);
                                return (
                                  <div
                                    key={t.id}
                                    className={cn(
                                      "text-xs truncate px-1 rounded cursor-pointer hover:opacity-80",
                                      colors.bg,
                                      colors.text
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTacheClick(t);
                                    }}
                                  >
                                    {t.nom}
                                  </div>
                                );
                              })}
                              {dayTaches.length > 2 && (
                                <div className="text-xs text-muted-foreground px-1">
                                  +{dayTaches.length - 2} autres
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                      </TooltipTrigger>
                      {dayTaches.length > 0 && (
                        <TooltipContent>
                          <p className="font-medium">
                            {dayTaches.length} tâche
                            {dayTaches.length > 1 ? "s" : ""}
                          </p>
                          <div className="mt-1 space-y-0.5 text-xs">
                            {dayTaches.slice(0, 3).map((t) => (
                              <p key={t.id} className="truncate max-w-[150px]">
                                • {t.nom}
                              </p>
                            ))}
                            {dayTaches.length > 3 && (
                              <p className="text-muted-foreground">
                                +{dayTaches.length - 3} autres
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected day details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDate
                ? format(selectedDate, "d MMMM yyyy", { locale: fr })
                : "Sélectionnez une date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">
                Cliquez sur une date pour voir les tâches associées
              </p>
            ) : selectedDateTaches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune tâche pour cette date
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateTaches.map((tache) => {
                  const enRetard =
                    tache.dateEcheance &&
                    isOverdue(tache.dateEcheance) &&
                    tache.statut !== "Terminé";
                  const colors = getPriorityColor(tache.priorite, tache.statut === "Terminé");

                  return (
                    <button
                      key={tache.id}
                      onClick={() => handleTacheClick(tache)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-colors hover:bg-muted/50",
                        enRetard && "border-destructive/50 bg-destructive/5"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                            colors.bg,
                            colors.border,
                            "border"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "font-medium text-sm truncate",
                              tache.statut === "Terminé" &&
                                "line-through text-muted-foreground"
                            )}
                          >
                            {tache.nom}
                          </p>
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
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium">Priorité:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200" />
              <span>Critique</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
              <span>Haute</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200" />
              <span>Moyenne</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
              <span>Basse</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
              <span>Terminé</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          {selectedTache && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-8">{selectedTache.nom}</SheetTitle>
                <SheetDescription>
                  Détails de la tâche
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status and Priority */}
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={selectedTache.statut || "À faire"}
                    type="task"
                  />
                  <StatusBadge
                    status={selectedTache.priorite || "Moyenne"}
                    type="priority"
                  />
                  {selectedTache.dateEcheance &&
                    isOverdue(selectedTache.dateEcheance) &&
                    selectedTache.statut !== "Terminé" && (
                      <Badge variant="destructive">En retard</Badge>
                    )}
                </div>

                {/* Description */}
                {selectedTache.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedTache.description}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Details */}
                <div className="space-y-4">
                  {/* Date */}
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Échéance</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedTache.dateEcheance
                          ? formatDate(selectedTache.dateEcheance)
                          : "Non définie"}
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  {(selectedTache.heuresEstimees || selectedTache.heuresReelles) && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Temps</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={
                              selectedTache.heuresEstimees
                                ? ((selectedTache.heuresReelles || 0) /
                                    selectedTache.heuresEstimees) *
                                  100
                                : 0
                            }
                            className="h-2 flex-1"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {selectedTache.heuresReelles || 0}h /{" "}
                            {selectedTache.heuresEstimees || 0}h
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Project link would go here if we had project info */}
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant={selectedTache.statut === "Terminé" ? "outline" : "default"}
                    onClick={handleToggleStatut}
                    disabled={updateStatut.isPending}
                  >
                    {selectedTache.statut === "Terminé"
                      ? "Rouvrir la tâche"
                      : "Marquer comme terminée"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
