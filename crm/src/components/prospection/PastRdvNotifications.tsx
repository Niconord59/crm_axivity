"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarCheck,
  CalendarX,
  User,
  Building2,
  ChevronRight,
  X,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  usePastRdvProspects,
  useUpdateProspectStatus,
  type Prospect,
} from "@/hooks/use-prospects";

interface PastRdvNotificationsProps {
  onOpenProspect?: (prospect: Prospect) => void;
  className?: string;
}

export function PastRdvNotifications({
  onOpenProspect,
  className,
}: PastRdvNotificationsProps) {
  const { data: pastRdvProspects, isLoading } = usePastRdvProspects();
  const updateStatus = useUpdateProspectStatus();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Filter out dismissed prospects
  const visibleProspects = pastRdvProspects?.filter(
    (p) => !dismissedIds.has(p.id)
  );

  // Don't show anything if no past RDV or loading
  if (isLoading || !visibleProspects || visibleProspects.length === 0) {
    return null;
  }

  const handleMarkAsDone = async (prospect: Prospect) => {
    setUpdatingIds((prev) => new Set(prev).add(prospect.id));

    try {
      await updateStatus.mutateAsync({
        id: prospect.id,
        statut: "RDV effectué",
        dateRdvPrevu: undefined, // Clear the RDV date
      });

      toast.success("RDV marqué comme effectué", {
        description: `${prospect.prenom ? prospect.prenom + " " : ""}${prospect.nom}`,
      });
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(prospect.id);
        return newSet;
      });
    }
  };

  const handleDismiss = (prospectId: string) => {
    setDismissedIds((prev) => new Set(prev).add(prospectId));
  };

  const handleOpenProspect = (prospect: Prospect) => {
    if (onOpenProspect) {
      onOpenProspect(prospect);
    }
  };

  return (
    <Card className={cn("border-amber-200 bg-amber-50/50", className)}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-full bg-amber-100">
            <Bell className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="font-semibold text-amber-800">
            RDV passés en attente
          </h3>
          <Badge variant="secondary" className="bg-amber-200 text-amber-800">
            {visibleProspects.length}
          </Badge>
        </div>

        {/* List of past RDV */}
        <div className="space-y-2">
          {visibleProspects.map((prospect) => {
            const fullName = prospect.prenom
              ? `${prospect.prenom} ${prospect.nom}`
              : prospect.nom;
            const isUpdating = updatingIds.has(prospect.id);

            // Format the time since RDV
            const rdvDate = prospect.dateRdvPrevu
              ? new Date(prospect.dateRdvPrevu)
              : null;
            const timeSince = rdvDate
              ? formatDistanceToNow(rdvDate, { locale: fr, addSuffix: true })
              : null;

            return (
              <div
                key={prospect.id}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-100 shadow-sm"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {prospect.clientNom || "Entreprise inconnue"}
                    </span>
                  </div>
                  {timeSince && (
                    <p className="text-xs text-amber-600 mt-1">
                      RDV prévu {timeSince}
                      {rdvDate && (
                        <span className="text-muted-foreground ml-1">
                          ({format(rdvDate, "d MMM", { locale: fr })})
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 h-8"
                    disabled={isUpdating}
                    onClick={() => handleMarkAsDone(prospect)}
                  >
                    <CalendarCheck className="h-4 w-4 mr-1" />
                    Effectué
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={isUpdating}
                    onClick={() => handleOpenProspect(prospect)}
                  >
                    Voir
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleDismiss(prospect.id)}
                    title="Masquer temporairement"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info text */}
        <p className="text-xs text-amber-600/80 mt-3">
          Ces prospects ont un RDV planifié dans le passé. Mettez à jour leur statut pour continuer le suivi.
        </p>
      </div>
    </Card>
  );
}
