// Calendar Service - Abstraction for Google Calendar and Microsoft Graph APIs

import type { OAuthProvider } from "@/lib/auth";
import type { CalendarEvent, CreateEventInput } from "@/lib/google-calendar";
import { createEventPayload } from "@/lib/google-calendar";

// Unified calendar event response
export interface CalendarEventsResult {
  events: CalendarEvent[];
  error?: string;
}

export interface CreateEventResult {
  event?: CalendarEvent;
  error?: string;
}

// ============================================
// GOOGLE CALENDAR IMPLEMENTATION
// ============================================

async function fetchGoogleCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEventsResult> {
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "50");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { events: [], error: error.error?.message || "Failed to fetch Google Calendar events" };
  }

  const data = await response.json();
  return { events: data.items || [] };
}

async function createGoogleCalendarEvent(
  accessToken: string,
  input: CreateEventInput
): Promise<CreateEventResult> {
  const eventPayload = createEventPayload(input);

  // Build URL with conference version if needed
  let url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
  const params = new URLSearchParams();

  if (eventPayload.conferenceData) {
    params.set("conferenceDataVersion", "1");
  }
  if (eventPayload.attendees?.length) {
    params.set("sendUpdates", "all");
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { error: error.error?.message || "Failed to create Google Calendar event" };
  }

  const event = await response.json();
  return { event };
}

// ============================================
// MICROSOFT GRAPH IMPLEMENTATION
// ============================================

// Convert Microsoft Graph event to unified CalendarEvent format
function microsoftEventToCalendarEvent(msEvent: MicrosoftGraphEvent): CalendarEvent {
  return {
    id: msEvent.id,
    summary: msEvent.subject,
    description: msEvent.bodyPreview || msEvent.body?.content,
    location: msEvent.location?.displayName,
    start: {
      dateTime: msEvent.start.dateTime,
      timeZone: msEvent.start.timeZone,
    },
    end: {
      dateTime: msEvent.end.dateTime,
      timeZone: msEvent.end.timeZone,
    },
    attendees: msEvent.attendees?.map((a) => ({
      email: a.emailAddress.address,
      displayName: a.emailAddress.name,
    })),
    htmlLink: msEvent.webLink,
    hangoutLink: msEvent.onlineMeeting?.joinUrl,
    status: msEvent.showAs,
  };
}

// Microsoft Graph event type
interface MicrosoftGraphEvent {
  id?: string;
  subject: string;
  body?: { contentType: string; content: string };
  bodyPreview?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  attendees?: Array<{
    emailAddress: { address: string; name?: string };
    type: string;
  }>;
  webLink?: string;
  onlineMeeting?: { joinUrl: string };
  showAs?: string;
  isOnlineMeeting?: boolean;
  onlineMeetingProvider?: string;
}

async function fetchMicrosoftCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEventsResult> {
  // Microsoft Graph calendarView endpoint handles date range natively
  // This is more reliable than using $filter on events
  const url = new URL("https://graph.microsoft.com/v1.0/me/calendarView");
  url.searchParams.set("startDateTime", timeMin);
  url.searchParams.set("endDateTime", timeMax);
  url.searchParams.set("$orderby", "start/dateTime");
  url.searchParams.set("$top", "50");
  url.searchParams.set("$select", "id,subject,bodyPreview,start,end,location,attendees,webLink,onlineMeeting,showAs");

  console.log("[Microsoft Calendar] Fetching events:", url.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="Europe/Paris"',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("[Microsoft Calendar] API Error:", error);
    return { events: [], error: error.error?.message || "Failed to fetch Microsoft Calendar events" };
  }

  const data = await response.json();
  const events = (data.value || []).map(microsoftEventToCalendarEvent);
  console.log("[Microsoft Calendar] Fetched", events.length, "events");
  return { events };
}

async function createMicrosoftCalendarEvent(
  accessToken: string,
  input: CreateEventInput
): Promise<CreateEventResult> {
  const timeZone = input.timeZone || "Europe/Paris";

  // Build Microsoft Graph event payload
  const msEvent: Partial<MicrosoftGraphEvent> = {
    subject: input.summary,
    body: input.description ? { contentType: "text", content: input.description } : undefined,
    start: { dateTime: input.startDateTime, timeZone },
    end: { dateTime: input.endDateTime, timeZone },
    location: input.location ? { displayName: input.location } : undefined,
    attendees: input.attendeeEmails?.filter(Boolean).map((email) => ({
      emailAddress: { address: email },
      type: "required",
    })),
  };

  // Add Teams meeting if visio
  // Note: Teams meetings work for both personal (teamsForConsumer) and business (teamsForBusiness) accounts
  // Microsoft Graph automatically selects the right provider based on the account type
  if (input.meetingType === "visio") {
    msEvent.isOnlineMeeting = true;
    // Don't specify provider - let Microsoft choose the right one based on account type
  }

  const response = await fetch("https://graph.microsoft.com/v1.0/me/calendar/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(msEvent),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { error: error.error?.message || "Failed to create Microsoft Calendar event" };
  }

  const createdEvent = await response.json();
  return { event: microsoftEventToCalendarEvent(createdEvent) };
}

// ============================================
// UNIFIED SERVICE FUNCTIONS
// ============================================

export async function getCalendarEvents(
  provider: OAuthProvider,
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEventsResult> {
  if (provider === "google") {
    return fetchGoogleCalendarEvents(accessToken, timeMin, timeMax);
  } else {
    return fetchMicrosoftCalendarEvents(accessToken, timeMin, timeMax);
  }
}

export async function createCalendarEvent(
  provider: OAuthProvider,
  accessToken: string,
  input: CreateEventInput
): Promise<CreateEventResult> {
  if (provider === "google") {
    return createGoogleCalendarEvent(accessToken, input);
  } else {
    return createMicrosoftCalendarEvent(accessToken, input);
  }
}
