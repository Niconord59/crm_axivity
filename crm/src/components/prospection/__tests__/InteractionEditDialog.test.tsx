/**
 * PRO-H7 — regression tests for removing the `setState`-in-`useEffect`
 * anti-pattern in InteractionEditDialog.
 *
 * Contract:
 * - First mount with `interaction=A` → fields reflect A.
 * - Remount via `key` prop with `interaction=B` → fields reflect B.
 * - Re-render without changing `key` and only the `interaction` prop →
 *   fields DO NOT magically resync (by design — the parent owns reset via
 *   `key`, which avoids the "extra render pass" bug from the useEffect sync).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { InteractionEditDialog } from "../InteractionEditDialog";
import type { Interaction } from "@/types";

// Mock the update mutation so the component boots without touching Supabase.
vi.mock("@/hooks/use-interactions", () => ({
  useUpdateInteraction: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeInteraction(overrides: Partial<Interaction> = {}): Interaction {
  return {
    id: "int-1",
    objet: "Premier appel",
    type: "Appel",
    date: "2026-04-16T10:30:00.000Z",
    resume: "Discussion initiale",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("InteractionEditDialog (PRO-H7)", () => {
  it("initializes the form from the interaction prop without any useEffect sync", () => {
    const interaction = makeInteraction({ objet: "RDV prep", resume: "Notes de prep" });

    render(
      <InteractionEditDialog
        open
        onOpenChange={() => {}}
        interaction={interaction}
      />,
    );

    expect(screen.getByLabelText(/objet/i)).toHaveValue("RDV prep");
    expect(screen.getByLabelText(/résumé/i)).toHaveValue("Notes de prep");
  });

  it("shows the new interaction's values after a `key`-triggered remount", () => {
    const first = makeInteraction({ id: "int-1", objet: "First", resume: "A" });
    const second = makeInteraction({ id: "int-2", objet: "Second", resume: "B" });

    const { rerender } = render(
      <InteractionEditDialog
        key={first.id}
        open
        onOpenChange={() => {}}
        interaction={first}
      />,
    );

    expect(screen.getByLabelText(/objet/i)).toHaveValue("First");

    // Parent switches to another interaction; the key change forces a remount
    // which re-runs the lazy useState initializers.
    rerender(
      <InteractionEditDialog
        key={second.id}
        open
        onOpenChange={() => {}}
        interaction={second}
      />,
    );

    expect(screen.getByLabelText(/objet/i)).toHaveValue("Second");
    expect(screen.getByLabelText(/résumé/i)).toHaveValue("B");
  });

  it("keeps the initial values when the interaction prop changes WITHOUT a key change (confirms no hidden useEffect sync)", () => {
    const first = makeInteraction({ id: "int-1", objet: "Keep me" });
    const second = makeInteraction({ id: "int-2", objet: "Do not overwrite" });

    const { rerender } = render(
      <InteractionEditDialog
        open
        onOpenChange={() => {}}
        interaction={first}
      />,
    );
    expect(screen.getByLabelText(/objet/i)).toHaveValue("Keep me");

    // Same React instance (no key), new prop value. If a useEffect → setState
    // pair still existed, the field would silently flip to "Do not overwrite".
    rerender(
      <InteractionEditDialog
        open
        onOpenChange={() => {}}
        interaction={second}
      />,
    );

    expect(screen.getByLabelText(/objet/i)).toHaveValue("Keep me");
  });

  it("renders null when no interaction is passed (dialog closed state)", () => {
    const { container } = render(
      <InteractionEditDialog open={false} onOpenChange={() => {}} interaction={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("initializes with safe defaults when the interaction has no date", () => {
    const interaction = makeInteraction({ date: undefined });

    render(
      <InteractionEditDialog open onOpenChange={() => {}} interaction={interaction} />,
    );

    // The time input defaults to 09:00 per computeInitialValues.
    expect(screen.getByDisplayValue("09:00")).toBeInTheDocument();
  });
});
