"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession, signIn, signOut } from "next-auth/react";
import type { OAuthProvider } from "@/lib/auth";
import {
  CalendarEvent,
  CalendarEventsResponse,
  CreateEventInput,
  createEventPayload,
  getWeekDates,
} from "@/lib/google-calendar";

/**
 * Safely extract a human-readable error message from an API error response.
 *
 * PRO-H13 — `response.json()` blindly on a 502/504 HTML gateway error throws
 * `SyntaxError: Unexpected token '<'`, which then surfaces to the user as a
 * stack trace instead of an actionable message. We guard on the content-type
 * before parsing, and fall back to a status-based message.
 */
export async function parseApiError(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return `${fallbackMessage} (code ${response.status})`;
  }
  try {
    const payload = (await response.json()) as Record<string, unknown> | null;
    if (payload && typeof payload === "object") {
      const err = payload.error;
      const msg = payload.message;
      if (typeof err === "string" && err.trim() !== "") return err;
      if (typeof msg === "string" && msg.trim() !== "") return msg;
    }
    return `${fallbackMessage} (code ${response.status})`;
  } catch {
    return `${fallbackMessage} (code ${response.status})`;
  }
}

// Fetch calendar events for a date range
async function fetchCalendarEvents(
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const response = await fetch(
    `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "Erreur lors de la récupération des événements"),
    );
  }

  const data: CalendarEventsResponse = await response.json();
  return data.items || [];
}

// Create a new calendar event
async function createCalendarEvent(input: CreateEventInput): Promise<CalendarEvent> {
  const payload = createEventPayload(input);

  const response = await fetch("/api/calendar/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "Erreur lors de la création de l'événement"),
    );
  }

  return response.json();
}

// Hook to check calendar connection status (provider-agnostic)
export function useCalendarStatus() {
  const { data: session, status } = useSession();

  return {
    isConnected: !!session?.hasCalendarAccess,
    isLoading: status === "loading",
    hasError: session?.error === "RefreshTokenError",
    provider: session?.provider as OAuthProvider | undefined,
    session,
  };
}

// Hook to handle calendar authentication (supports both Google and Microsoft)
export function useCalendarAuth() {
  const { data: session, status } = useSession();

  const connectGoogle = async () => {
    await signIn("google", { callbackUrl: window.location.href });
  };

  const connectMicrosoft = async () => {
    await signIn("microsoft-entra-id", { callbackUrl: window.location.href });
  };

  const disconnect = async () => {
    await signOut({ callbackUrl: window.location.href });
  };

  return {
    isConnected: !!session?.hasCalendarAccess,
    isLoading: status === "loading",
    hasError: session?.error === "RefreshTokenError",
    provider: session?.provider as OAuthProvider | undefined,
    connectGoogle,
    connectMicrosoft,
    disconnect,
    userEmail: session?.user?.email,
    userName: session?.user?.name,
  };
}

// Hook to fetch calendar events for a week
export function useCalendarEvents(weekDate: Date, enabled: boolean = true) {
  const { isConnected } = useCalendarStatus();
  const { start, end } = getWeekDates(weekDate);

  return useQuery({
    queryKey: ["calendar-events", start.toISOString(), end.toISOString()],
    queryFn: () => fetchCalendarEvents(start.toISOString(), end.toISOString()),
    enabled: enabled && isConnected,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

// Hook to create a calendar event
export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCalendarEvent,
    onSuccess: () => {
      // Invalidate calendar events query to refetch
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}

// Hook to get events for a specific date range (custom)
export function useCalendarEventsRange(
  startDate: Date,
  endDate: Date,
  enabled: boolean = true
) {
  const { isConnected } = useCalendarStatus();

  return useQuery({
    queryKey: ["calendar-events", startDate.toISOString(), endDate.toISOString()],
    queryFn: () =>
      fetchCalendarEvents(startDate.toISOString(), endDate.toISOString()),
    enabled: enabled && isConnected,
    staleTime: 60 * 1000,
  });
}

// Legacy exports for backward compatibility
export const useGoogleCalendarStatus = useCalendarStatus;
export const useGoogleCalendarAuth = useCalendarAuth;
