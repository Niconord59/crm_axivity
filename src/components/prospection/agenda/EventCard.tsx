"use client";

import { cn } from "@/lib/utils";
import { CalendarEvent, formatTime } from "@/lib/google-calendar";
import { ExternalLink } from "lucide-react";

interface EventCardProps {
  event: CalendarEvent;
  className?: string;
  compact?: boolean;
}

export function EventCard({ event, className, compact = false }: EventCardProps) {
  const startTime = new Date(event.start.dateTime);
  const endTime = new Date(event.end.dateTime);

  if (compact) {
    return (
      <div
        className={cn(
          "rounded-sm bg-primary/10 border-l-2 border-primary px-2 py-1 text-xs",
          className
        )}
      >
        <div className="font-medium truncate">{event.summary}</div>
        <div className="text-muted-foreground">
          {formatTime(startTime)} - {formatTime(endTime)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md bg-primary/10 border-l-4 border-primary p-3",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{event.summary}</h4>
          <p className="text-sm text-muted-foreground">
            {formatTime(startTime)} - {formatTime(endTime)}
          </p>
          {event.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
        {event.htmlLink && (
          <a
            href={event.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
      {event.attendees && event.attendees.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {event.attendees.slice(0, 3).map((attendee, i) => (
            <span
              key={i}
              className="text-xs bg-muted px-2 py-0.5 rounded-full truncate max-w-[150px]"
            >
              {attendee.displayName || attendee.email}
            </span>
          ))}
          {event.attendees.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{event.attendees.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
