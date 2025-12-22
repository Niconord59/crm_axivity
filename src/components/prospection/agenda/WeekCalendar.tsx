"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalendarEvents } from "@/hooks/use-calendar";
import {
  CalendarEvent,
  getWeekDates,
  getHoursArray,
  formatDayShort,
  isSameDay,
  getEventsForDay,
  getEventTopPosition,
  getEventHeight,
  formatTime,
} from "@/lib/google-calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeekCalendarProps {
  onSlotClick?: (date: Date) => void;
  className?: string;
}

export function WeekCalendar({ onSlotClick, className }: WeekCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: events = [], isLoading, error } = useCalendarEvents(currentDate);

  const { start, end, days } = getWeekDates(currentDate);
  const hours = getHoursArray();
  const today = new Date();

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatWeekRange = () => {
    const startMonth = start.toLocaleDateString("fr-FR", { month: "short" });
    const endMonth = end.toLocaleDateString("fr-FR", { month: "short" });
    const year = start.getFullYear();

    if (startMonth === endMonth) {
      return `${start.getDate()} - ${end.getDate()} ${startMonth} ${year}`;
    }
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${year}`;
  };

  const handleSlotClick = (day: Date, hour: number) => {
    if (onSlotClick) {
      const slotDate = new Date(day);
      slotDate.setHours(hour, 0, 0, 0);
      onSlotClick(slotDate);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Erreur lors du chargement du calendrier
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between pb-2 border-b gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={goToToday}>
            Aujourd&apos;hui
          </Button>
        </div>
        <h3 className="font-medium text-sm">{formatWeekRange()}</h3>
      </div>

      {/* Calendar grid */}
      <ScrollArea className="flex-1 mt-2">
        <div className="min-w-[450px]">
          {/* Days header */}
          <div className="grid grid-cols-8 border-b sticky top-0 bg-background z-10">
            <div className="p-2 text-sm text-muted-foreground" /> {/* Empty cell for hours */}
            {days.map((day, i) => {
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={i}
                  className={cn(
                    "p-2 text-center text-sm font-medium border-l",
                    isToday && "bg-primary/5"
                  )}
                >
                  <span className={cn(isToday && "text-primary")}>
                    {formatDayShort(day)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hours grid */}
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 h-16 border-b">
                  {/* Hour label */}
                  <div className="p-2 text-xs text-muted-foreground text-right pr-3">
                    {hour}:00
                  </div>
                  {/* Day slots */}
                  {days.map((day, dayIndex) => {
                    const isToday = isSameDay(day, today);
                    const dayEvents = getEventsForDay(events, day);
                    const slotEvents = dayEvents.filter((event) => {
                      const eventHour = new Date(event.start.dateTime).getHours();
                      return eventHour === hour;
                    });

                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "relative border-l cursor-pointer hover:bg-muted/50 transition-colors",
                          isToday && "bg-primary/5"
                        )}
                        onClick={() => handleSlotClick(day, hour)}
                      >
                        {slotEvents.map((event, eventIndex) => (
                          <EventSlot key={event.id || eventIndex} event={event} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Event slot component
function EventSlot({ event }: { event: CalendarEvent }) {
  const startTime = new Date(event.start.dateTime);
  const endTime = new Date(event.end.dateTime);
  const minutes = startTime.getMinutes();
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  const height = Math.max(Math.min(duration, 60), 20); // Min 20px, max 60px (1 hour slot)

  return (
    <div
      className="absolute left-0.5 right-0.5 bg-primary/20 border-l-2 border-primary rounded-sm px-1 text-xs overflow-hidden z-10"
      style={{
        top: `${(minutes / 60) * 100}%`,
        height: `${(height / 60) * 100}%`,
        minHeight: "20px",
      }}
      title={`${event.summary}\n${formatTime(startTime)} - ${formatTime(endTime)}`}
    >
      <div className="font-medium truncate">{event.summary}</div>
      {height > 30 && (
        <div className="text-muted-foreground truncate">
          {formatTime(startTime)}
        </div>
      )}
    </div>
  );
}
