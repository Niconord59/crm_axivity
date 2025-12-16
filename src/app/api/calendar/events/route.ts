import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

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
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events?` +
        new URLSearchParams({
          timeMin,
          timeMax,
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "50",
        }),
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Google Calendar API error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des événements" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
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

    // Build URL with conferenceDataVersion if conference is requested
    const url = new URL(`${GOOGLE_CALENDAR_API}/calendars/primary/events`);
    if (body.conferenceData) {
      url.searchParams.set("conferenceDataVersion", "1");
    }
    // Send email notifications to attendees
    if (body.attendees?.length) {
      url.searchParams.set("sendUpdates", "all");
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: body.summary,
        description: body.description,
        location: body.location,
        start: body.start,
        end: body.end,
        attendees: body.attendees,
        conferenceData: body.conferenceData,
        reminders: body.reminders || {
          useDefault: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Google Calendar API error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'événement" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Calendar create error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
