"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCalendarStatus } from "@/hooks/use-calendar";
import { CalendarAuthButton } from "./CalendarAuthButton";
import { WeekCalendar } from "./WeekCalendar";
import { CreateEventDialog } from "./CreateEventDialog";
import { Calendar, Plus, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ProspectInfo {
  id?: string; // Contact ID for interaction
  prenom?: string;
  nom: string;
  email?: string;
  telephone?: string;
  entreprise?: string;
  clientId?: string; // Client ID for interaction
  notes?: string;
}

interface AgendaTabProps {
  prospect: ProspectInfo;
}

export function AgendaTab({ prospect }: AgendaTabProps) {
  const { isConnected, isLoading, hasError } = useCalendarStatus();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const queryClient = useQueryClient();

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
  };

  // Not connected state
  if (!isConnected && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Calendar className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h3 className="font-semibold">Connectez votre calendrier</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Visualisez vos disponibilités et créez des RDV directement
          </p>
        </div>
        <CalendarAuthButton />
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Calendar className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="font-semibold text-destructive">Session expirée</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Veuillez vous reconnecter à votre calendrier
          </p>
        </div>
        <CalendarAuthButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with actions */}
      <div className="flex items-center justify-between pb-3 gap-2 flex-wrap">
        <CalendarAuthButton />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleCreateClick}>
            <Plus className="mr-1 h-4 w-4" />
            Nouveau
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 min-h-0">
        <WeekCalendar onSlotClick={handleSlotClick} />
      </div>

      {/* Create Event Dialog */}
      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        prospect={prospect}
        initialDate={selectedDate}
      />
    </div>
  );
}
