/**
 * PRO-H12 — pins the timezone contract for the Google Calendar payload.
 *
 * The broken `toISOStringWithTimezone()` helper has been removed (it ignored
 * its `timeZone` arg and returned a UTC string). These tests lock in the
 * real contract the prod flow depends on:
 *
 *   Google Calendar interprets `start.dateTime` (ISO string, may omit the
 *   offset) using the sibling `start.timeZone` field. As long as we pass
 *   both, Google applies DST correctly for the provided zone.
 */
import { describe, it, expect } from "vitest";
import {
  DEFAULT_TIMEZONE,
  createEventPayload,
  formatEventTitle,
  formatEventDescription,
  getWeekDates,
  isSameDay,
  getEventsForDay,
  type CalendarEvent,
} from "@/lib/google-calendar";

describe("createEventPayload (PRO-H12 timezone contract)", () => {
  it("defaults timeZone to Europe/Paris on both start and end", () => {
    const payload = createEventPayload({
      summary: "RDV",
      startDateTime: "2026-04-20T10:00:00",
      endDateTime: "2026-04-20T11:00:00",
    });

    expect(payload.start.timeZone).toBe(DEFAULT_TIMEZONE);
    expect(payload.end.timeZone).toBe(DEFAULT_TIMEZONE);
    expect(DEFAULT_TIMEZONE).toBe("Europe/Paris");
  });

  it("passes through a caller-provided timeZone unchanged", () => {
    const payload = createEventPayload({
      summary: "RDV NY",
      startDateTime: "2026-04-20T10:00:00",
      endDateTime: "2026-04-20T11:00:00",
      timeZone: "America/New_York",
    });

    expect(payload.start.timeZone).toBe("America/New_York");
    expect(payload.end.timeZone).toBe("America/New_York");
  });

  it("preserves the ISO dateTime string verbatim — Google reads it as local to `timeZone`", () => {
    // Google Calendar semantics: if dateTime has no offset, Google treats it
    // as "local to start.timeZone". A string with a `Z` or offset overrides
    // that. We must not rewrite the string.
    const inputs = [
      "2026-04-20T10:00:00",           // no offset — local to timeZone
      "2026-04-20T10:00:00+02:00",     // explicit offset (summer Paris)
      "2026-04-20T08:00:00.000Z",      // UTC
    ];

    for (const startDateTime of inputs) {
      const payload = createEventPayload({
        summary: "T",
        startDateTime,
        endDateTime: startDateTime,
      });
      expect(payload.start.dateTime).toBe(startDateTime);
      expect(payload.end.dateTime).toBe(startDateTime);
    }
  });

  it("builds a visio event with a hangoutsMeet conference request and no location", () => {
    const payload = createEventPayload({
      summary: "Visio",
      startDateTime: "2026-04-20T10:00:00",
      endDateTime: "2026-04-20T11:00:00",
      meetingType: "visio",
      location: "ignored for visio",
    });

    expect(payload.location).toBeUndefined();
    expect(payload.conferenceData?.createRequest?.conferenceSolutionKey.type).toBe(
      "hangoutsMeet",
    );
  });

  it("builds a presentiel event with the passed location and no conferenceData", () => {
    const payload = createEventPayload({
      summary: "Presentiel",
      startDateTime: "2026-04-20T10:00:00",
      endDateTime: "2026-04-20T11:00:00",
      meetingType: "presentiel",
      location: "123 rue de la Paix, Paris",
    });

    expect(payload.location).toBe("123 rue de la Paix, Paris");
    expect(payload.conferenceData).toBeUndefined();
  });

  it("drops empty attendee emails and trims the kept ones", () => {
    const payload = createEventPayload({
      summary: "T",
      startDateTime: "2026-04-20T10:00:00",
      endDateTime: "2026-04-20T11:00:00",
      attendeeEmails: [" alice@example.com ", "", "   ", "bob@example.com"],
    });

    expect(payload.attendees).toEqual([
      { email: "alice@example.com" },
      { email: "bob@example.com" },
    ]);
  });

  it("omits attendees entirely when the list is empty", () => {
    const payload = createEventPayload({
      summary: "T",
      startDateTime: "2026-04-20T10:00:00",
      endDateTime: "2026-04-20T11:00:00",
      attendeeEmails: [],
    });

    expect(payload.attendees).toBeUndefined();
  });
});

describe("formatEventTitle", () => {
  it("includes the entreprise in parentheses when provided", () => {
    expect(formatEventTitle("Jean", "Dupont", "Acme")).toBe("RDV - Jean Dupont (Acme)");
  });

  it("falls back to just the name when entreprise is missing", () => {
    expect(formatEventTitle("Jean", "Dupont")).toBe("RDV - Jean Dupont");
  });

  it("drops the prenom when it's undefined", () => {
    expect(formatEventTitle(undefined, "Dupont", "Acme")).toBe("RDV - Dupont (Acme)");
  });
});

describe("formatEventDescription", () => {
  it("skips missing fields instead of emitting 'undefined'", () => {
    const desc = formatEventDescription("jean@example.com", undefined, "notes", undefined);
    expect(desc).toContain("jean@example.com");
    expect(desc).toContain("notes");
    expect(desc).not.toContain("undefined");
  });

  it("produces an empty string when all fields are missing", () => {
    expect(formatEventDescription()).toBe("");
  });
});

describe("getWeekDates", () => {
  it("returns Monday as start and Sunday as end for a mid-week date", () => {
    const wed = new Date("2026-04-22T15:00:00"); // Wed
    const { start, end, days } = getWeekDates(wed);

    expect(start.getDay()).toBe(1); // Monday
    expect(end.getDay()).toBe(0); // Sunday
    expect(days).toHaveLength(7);
  });
});

describe("isSameDay + getEventsForDay", () => {
  it("groups events by their local calendar day", () => {
    const events: CalendarEvent[] = [
      { summary: "A", start: { dateTime: "2026-04-20T09:00:00" }, end: { dateTime: "2026-04-20T10:00:00" } },
      { summary: "B", start: { dateTime: "2026-04-21T09:00:00" }, end: { dateTime: "2026-04-21T10:00:00" } },
    ];

    const day = new Date("2026-04-20T18:00:00");
    const filtered = getEventsForDay(events, day);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].summary).toBe("A");
  });

  it("isSameDay ignores the time-of-day", () => {
    expect(
      isSameDay(new Date("2026-04-20T00:00:01"), new Date("2026-04-20T23:59:59")),
    ).toBe(true);
    expect(
      isSameDay(new Date("2026-04-20T23:00:00"), new Date("2026-04-21T00:00:00")),
    ).toBe(false);
  });
});
