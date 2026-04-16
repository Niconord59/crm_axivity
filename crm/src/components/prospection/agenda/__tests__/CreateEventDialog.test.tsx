/**
 * PRO-H11 — regression test guarding against `CreateEventDialog` mutating
 * the `initialDate` prop in place.
 *
 * Previously the component called `initialDate.setMinutes(0, 0, 0)` directly
 * on the caller's `Date` reference, rounding their in-state object under
 * their feet. The fix is a defensive clone. This test proves the prop's
 * own minute/second/ms values are untouched after the dialog mounts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@/test/utils";
import { CreateEventDialog } from "../CreateEventDialog";

// Stub every hook the component reaches for — we're testing a side-effect
// contract, not the calendar/interaction integrations.
vi.mock("@/hooks/use-calendar", () => ({
  useCreateCalendarEvent: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/use-interactions", () => ({
  useCreateInteraction: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/use-prospects", () => ({
  useUpdateProspectStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CreateEventDialog (PRO-H11)", () => {
  it("does not mutate the initialDate prop when deriving default start", () => {
    // A Date with non-zero minutes/seconds/ms — if the component mutates the
    // reference via .setMinutes(0,0,0), the assertions below will fail.
    const initialDate = new Date("2026-04-20T14:37:42.123Z");
    const beforeMs = initialDate.getTime();
    const beforeMinutes = initialDate.getMinutes();
    const beforeSeconds = initialDate.getSeconds();
    const beforeMillis = initialDate.getMilliseconds();

    render(
      <CreateEventDialog
        open
        onOpenChange={() => {}}
        prospect={{ nom: "Dupont", prenom: "Jean", email: "jean@example.com" }}
        initialDate={initialDate}
      />,
    );

    // The caller's Date must be byte-for-byte untouched.
    expect(initialDate.getTime()).toBe(beforeMs);
    expect(initialDate.getMinutes()).toBe(beforeMinutes);
    expect(initialDate.getSeconds()).toBe(beforeSeconds);
    expect(initialDate.getMilliseconds()).toBe(beforeMillis);
  });

  it("does not crash when initialDate is omitted", () => {
    // Regression guard: the component falls back to `new Date()` in that
    // case; nothing to mutate, but the code path must stay alive.
    expect(() =>
      render(
        <CreateEventDialog
          open
          onOpenChange={() => {}}
          prospect={{ nom: "Test", email: "t@example.com" }}
        />,
      ),
    ).not.toThrow();
  });
});
