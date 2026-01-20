import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getCalendarEvents, createCalendarEvent } from "@/lib/services/calendar-service";
import { handleApiError } from "@/lib/api-error-handler";
import { UnauthorizedError, ValidationError, ExternalServiceError } from "@/lib/errors";
import type { CreateEventInput } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      throw new UnauthorizedError();
    }

    const searchParams = request.nextUrl.searchParams;
    const timeMin = searchParams.get("timeMin");
    const timeMax = searchParams.get("timeMax");

    if (!timeMin || !timeMax) {
      throw new ValidationError("timeMin et timeMax sont requis", {
        timeMin: timeMin ? undefined : "Requis",
        timeMax: timeMax ? undefined : "Requis",
      });
    }

    const provider = session.provider || "google";
    const result = await getCalendarEvents(provider, session.accessToken, timeMin, timeMax);

    if (result.error) {
      throw new ExternalServiceError(`Calendar (${provider})`, { error: result.error });
    }

    return NextResponse.json({ items: result.events });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      throw new UnauthorizedError();
    }

    const body = await request.json();

    // Validate required fields
    if (!body.summary || !body.start || !body.end) {
      throw new ValidationError("summary, start et end sont requis", {
        summary: body.summary ? undefined : "Requis",
        start: body.start ? undefined : "Requis",
        end: body.end ? undefined : "Requis",
      });
    }

    const provider = session.provider || "google";

    // Convert the request body to CreateEventInput format
    const input: CreateEventInput = {
      summary: body.summary,
      description: body.description,
      startDateTime: body.start.dateTime,
      endDateTime: body.end.dateTime,
      timeZone: body.start.timeZone,
      attendeeEmails: body.attendees?.map((a: { email: string }) => a.email),
      location: body.location,
      meetingType: body.conferenceData ? "visio" : body.location ? "presentiel" : undefined,
    };

    const result = await createCalendarEvent(provider, session.accessToken, input);

    if (result.error) {
      throw new ExternalServiceError(`Calendar (${provider})`, { error: result.error });
    }

    return NextResponse.json(result.event);
  } catch (error) {
    return handleApiError(error);
  }
}
