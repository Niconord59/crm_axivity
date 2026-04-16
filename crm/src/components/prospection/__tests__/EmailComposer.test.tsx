/**
 * PRO-H8 — regression tests for removing the `setState`-in-`useEffect`
 * pattern in EmailComposer.
 *
 * Contract:
 * - Mount with template inputs → subject/body pre-filled from the template.
 * - Same instance + new prop (no `key`) → body does NOT silently reset.
 * - `key`-triggered remount → body reflects the new template (the voicemail
 *   switch drives this at the parent).
 * - `isPreviewMode` dead state is gone.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { EmailComposer } from "../EmailComposer";

// Mock the mutation so the component boots without network or session.
vi.mock("@/hooks/use-email", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/use-email")>(
    "@/hooks/use-email",
  );
  return {
    ...actual,
    useSendEmail: () => ({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    }),
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EmailComposer (PRO-H8)", () => {
  it("pre-fills subject + body from the template on first mount", () => {
    render(
      <EmailComposer
        prospectEmail="jean@example.com"
        prospectPrenom="Jean"
        prospectNom="Dupont"
        entreprise="Acme"
        leftVoicemail={false}
      />,
    );

    const subjectInput = screen.getByPlaceholderText(/objet de l'email/i) as HTMLInputElement;
    const bodyTextarea = screen.getByPlaceholderText(/contenu de l'email/i) as HTMLTextAreaElement;

    // Subject references the entreprise, body greets the prospect by name.
    expect(subjectInput.value).toContain("Acme");
    expect(bodyTextarea.value).toContain("Jean");
  });

  it("keeps the current body when the `leftVoicemail` prop flips without a `key` change (proves no hidden useEffect sync)", () => {
    const { rerender } = render(
      <EmailComposer
        prospectEmail="jean@example.com"
        prospectPrenom="Jean"
        prospectNom="Dupont"
        leftVoicemail={false}
      />,
    );

    const bodyBefore = (screen.getByPlaceholderText(/contenu de l'email/i) as HTMLTextAreaElement)
      .value;

    // Parent flips leftVoicemail WITHOUT remounting. With the previous
    // useEffect pattern, the body would silently flip. Now it must stick.
    rerender(
      <EmailComposer
        prospectEmail="jean@example.com"
        prospectPrenom="Jean"
        prospectNom="Dupont"
        leftVoicemail={true}
      />,
    );

    const bodyAfter = (screen.getByPlaceholderText(/contenu de l'email/i) as HTMLTextAreaElement)
      .value;

    expect(bodyAfter).toBe(bodyBefore);
  });

  it("regenerates the body when a `key`-triggered remount flips leftVoicemail", () => {
    const { rerender } = render(
      <EmailComposer
        key="nvm"
        prospectEmail="jean@example.com"
        prospectPrenom="Jean"
        prospectNom="Dupont"
        leftVoicemail={false}
      />,
    );

    const bodyBefore = (screen.getByPlaceholderText(/contenu de l'email/i) as HTMLTextAreaElement)
      .value;

    rerender(
      <EmailComposer
        key="vm"
        prospectEmail="jean@example.com"
        prospectPrenom="Jean"
        prospectNom="Dupont"
        leftVoicemail={true}
      />,
    );

    const bodyAfter = (screen.getByPlaceholderText(/contenu de l'email/i) as HTMLTextAreaElement)
      .value;

    // The two templates (voicemail vs not) should differ in content.
    expect(bodyAfter).not.toBe(bodyBefore);
  });
});
