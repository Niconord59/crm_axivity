"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  CalendarDays,
  Plus,
  RefreshCw,
  Video,
  MapPin,
  User,
  Building2,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCalendarStatus } from "@/hooks/use-calendar";
import { useUpcomingRdvProspects, type Prospect } from "@/hooks/use-prospects";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarAuthButton } from "./agenda/CalendarAuthButton";
import { WeekCalendar } from "./agenda/WeekCalendar";
import { CreateEventDialog } from "./agenda/CreateEventDialog";

interface ProspectionAgendaViewProps {
  onOpenProspect: (prospect: Prospect) => void;
}

export function ProspectionAgendaView({ onOpenProspect }: ProspectionAgendaViewProps) {
  const { isConnected, isLoading: calendarLoading } = useCalendarStatus();
  const { data: upcomingRdv = [], isLoading: rdvLoading } = useUpcomingRdvProspects();
  const queryClient = useQueryClient();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleSlotClick = (date: Date) => {
    setSelectedDate(date);
    setCreateDialogOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedDate(undefined);
    setCreateDialogOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    queryClient.invalidateQueries({ queryKey: ["prospects"] });
  };

  // If calendar is connected, show the full WeekCalendar + Supabase RDV overlay
  if (isConnected) {
    return (
      <div className="space-y-4">
        {/* Header actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CalendarAuthButton />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleRefresh} title="Rafraîchir">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleCreateClick}>
              <Plus className="mr-1 h-4 w-4" />
              Nouveau RDV
            </Button>
          </div>
        </div>

        {/* Week Calendar (full page height) */}
        <Card className="p-4">
          <WeekCalendar onSlotClick={handleSlotClick} className="h-[500px]" />
        </Card>

        {/* Supabase RDV overlay - upcoming RDV from CRM */}
        {upcomingRdv.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">RDV CRM planifiés</h3>
              <Badge variant="secondary">{upcomingRdv.length}</Badge>
            </div>
            <RdvList prospects={upcomingRdv} onOpenProspect={onOpenProspect} />
          </Card>
        )}

        <CreateEventDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          prospect={{ nom: "", prenom: "" }}
          initialDate={selectedDate}
        />
      </div>
    );
  }

  // Calendar NOT connected - show Supabase RDV list + invite to connect
  return (
    <div className="space-y-4">
      {/* Upcoming RDV from Supabase */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Vos RDV à venir</h3>
            {!rdvLoading && (
              <Badge variant="secondary">{upcomingRdv.length}</Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} title="Rafraîchir">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {rdvLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Chargement...
          </div>
        ) : upcomingRdv.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
            <Calendar className="h-8 w-8" />
            <p className="text-sm">Aucun RDV planifié à venir</p>
          </div>
        ) : (
          <RdvList prospects={upcomingRdv} onOpenProspect={onOpenProspect} />
        )}
      </Card>

      {/* Invite to connect calendar */}
      {!calendarLoading && (
        <Card className="p-4 border-blue-200 bg-blue-50/50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-blue-100 shrink-0">
              <Info className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">
                Connectez votre calendrier pour voir la vue semaine complète
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Synchronisez Google Calendar ou Microsoft 365 pour visualiser tous vos
                événements et créer des RDV directement.
              </p>
              <div className="mt-3">
                <CalendarAuthButton />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Subcomponent: RDV List ──────────────────────────────────────────────────

function RdvList({
  prospects,
  onOpenProspect,
}: {
  prospects: Prospect[];
  onOpenProspect: (prospect: Prospect) => void;
}) {
  // Group RDV by date
  const groupedByDate = prospects.reduce<Record<string, Prospect[]>>((acc, prospect) => {
    const dateKey = prospect.dateRdvPrevu
      ? prospect.dateRdvPrevu.split("T")[0]
      : "unknown";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(prospect);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div className="space-y-4">
      {sortedDates.map((dateKey) => {
        const rdvDate = new Date(dateKey + "T00:00:00");
        const isToday =
          dateKey === new Date().toISOString().split("T")[0];

        return (
          <div key={dateKey}>
            {/* Date header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {isToday
                  ? "Aujourd'hui"
                  : format(rdvDate, "EEEE d MMMM", { locale: fr })}
              </span>
              {isToday && (
                <Badge variant="default" className="text-xs h-5">
                  Aujourd&apos;hui
                </Badge>
              )}
            </div>

            {/* RDV items for this date */}
            <div className="space-y-2">
              {groupedByDate[dateKey].map((prospect) => (
                <RdvItem
                  key={prospect.id}
                  prospect={prospect}
                  onOpenProspect={onOpenProspect}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Subcomponent: Single RDV Item ───────────────────────────────────────────

function RdvItem({
  prospect,
  onOpenProspect,
}: {
  prospect: Prospect;
  onOpenProspect: (prospect: Prospect) => void;
}) {
  const fullName = prospect.prenom
    ? `${prospect.prenom} ${prospect.nom}`
    : prospect.nom;

  const rdvTime = prospect.dateRdvPrevu
    ? format(new Date(prospect.dateRdvPrevu), "HH:mm", { locale: fr })
    : null;

  return (
    <div
      className="flex items-center gap-3 p-3 bg-card rounded-lg border hover:border-primary/50 cursor-pointer transition-colors"
      onClick={() => onOpenProspect(prospect)}
    >
      {/* Time */}
      {rdvTime && rdvTime !== "00:00" ? (
        <div className="text-sm font-mono font-medium text-primary w-12 shrink-0">
          {rdvTime}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground w-12 shrink-0">
          Journée
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm truncate">{fullName}</span>
        </div>
        {prospect.clientNom && (
          <div className="flex items-center gap-2 mt-0.5">
            <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {prospect.clientNom}
            </span>
          </div>
        )}
      </div>

      {/* Type badge */}
      <div className="flex items-center gap-2 shrink-0">
        {prospect.typeRdv === "Visio" ? (
          <Badge variant="outline" className="text-xs gap-1">
            <Video className="h-3 w-3" />
            Visio
          </Badge>
        ) : prospect.typeRdv === "Présentiel" ? (
          <Badge variant="outline" className="text-xs gap-1">
            <MapPin className="h-3 w-3" />
            Présentiel
          </Badge>
        ) : null}

        {/* Visio link */}
        {prospect.lienVisio && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              window.open(prospect.lienVisio!, "_blank");
            }}
            title="Rejoindre la visio"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}

        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
