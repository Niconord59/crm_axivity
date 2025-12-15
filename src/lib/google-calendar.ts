// Google Calendar API Types and Helpers

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: { email: string; displayName?: string }[];
  htmlLink?: string;
  status?: string;
  reminders?: {
    useDefault?: boolean;
    overrides?: { method: string; minutes: number }[];
  };
}

export interface CalendarEventsResponse {
  items: CalendarEvent[];
  nextPageToken?: string;
  summary?: string;
  timeZone?: string;
}

export interface CreateEventInput {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  attendeeEmail?: string;
  timeZone?: string;
}

// Default timezone for Paris
export const DEFAULT_TIMEZONE = "Europe/Paris";

// Generate week dates (Mon-Sun) from a given date
export function getWeekDates(date: Date): { start: Date; end: Date; days: Date[] } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday

  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    days.push(dayDate);
  }

  return { start: monday, end: sunday, days };
}

// Format date to ISO string with timezone
export function toISOStringWithTimezone(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  return date.toISOString();
}

// Create event payload for Google Calendar API
export function createEventPayload(input: CreateEventInput): Omit<CalendarEvent, "id" | "htmlLink" | "status"> {
  const timeZone = input.timeZone || DEFAULT_TIMEZONE;

  return {
    summary: input.summary,
    description: input.description,
    start: {
      dateTime: input.startDateTime,
      timeZone,
    },
    end: {
      dateTime: input.endDateTime,
      timeZone,
    },
    attendees: input.attendeeEmail ? [{ email: input.attendeeEmail }] : undefined,
    reminders: {
      useDefault: true,
    },
  };
}

// Format event title from prospect info
export function formatEventTitle(
  prenom: string | undefined,
  nom: string,
  entreprise?: string
): string {
  const fullName = prenom ? `${prenom} ${nom}` : nom;
  return entreprise ? `RDV - ${fullName} (${entreprise})` : `RDV - ${fullName}`;
}

// Format event description from prospect info
export function formatEventDescription(
  email?: string,
  telephone?: string,
  notes?: string,
  crmUrl?: string
): string {
  const lines: string[] = [];

  if (email) lines.push(`Email: ${email}`);
  if (telephone) lines.push(`Tél: ${telephone}`);
  if (notes) lines.push(`\nNotes:\n${notes}`);
  if (crmUrl) lines.push(`\nCRM: ${crmUrl}`);

  return lines.join("\n");
}

// Get hours array for calendar display (8h-20h)
export function getHoursArray(): number[] {
  return Array.from({ length: 13 }, (_, i) => i + 8);
}

// Format time for display (HH:mm)
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format date for display (Lun 16)
export function formatDayShort(date: Date): string {
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  return `${dayNames[date.getDay()]} ${date.getDate()}`;
}

// Check if two dates are the same day
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Get events for a specific day
export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.start.dateTime);
    return isSameDay(eventStart, day);
  });
}

// Calculate event position (top) based on start time
export function getEventTopPosition(startTime: Date): number {
  const hours = startTime.getHours();
  const minutes = startTime.getMinutes();
  const startHour = 8; // Calendar starts at 8h
  return ((hours - startHour) * 60 + minutes) * (60 / 60); // 60px per hour
}

// Calculate event height based on duration
export function getEventHeight(startTime: Date, endTime: Date): number {
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  return Math.max(durationMinutes, 30); // Minimum 30 minutes height
}
