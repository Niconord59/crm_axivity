import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getCalendarEvents, createCalendarEvent } from "@/lib/services/calendar-service";
import type { CreateEventInput } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const timeMin = searchParams.get("timeMin");
  const timeMax = searchParams.get("timeMax");

  if (!timeMin || !timeMax) {
    return NextResponse.json(
      { error: "timeMin et timeMax sont requis" },
      { status: 400 }
    );
  }

  try {
    const provider = session.provider || "google";
    const result = await getCalendarEvents(provider, session.accessToken, timeMin, timeMax);

    if (result.error) {
      console.error(`${provider} Calendar API error:`, result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Return in same format as before for backwards compatibility
    return NextResponse.json({ items: result.events });
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.summary || !body.start || !body.end) {
      return NextResponse.json(
        { error: "summary, start et end sont requis" },
        { status: 400 }
      );
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
      // Determine meeting type from the body
      meetingType: body.conferenceData ? "visio" : body.location ? "presentiel" : undefined,
    };

    const result = await createCalendarEvent(provider, session.accessToken, input);

    if (result.error) {
      console.error(`${provider} Calendar API error:`, result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.event);
  } catch (error) {
    console.error("Calendar create error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
