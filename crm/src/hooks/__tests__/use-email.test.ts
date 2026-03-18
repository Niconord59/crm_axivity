// CRM Axivity - Email Hook Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { generateFollowUpEmail, useSendEmail } from "../use-email";

// Mock fetch for useSendEmail
const mockFetch = vi.fn();
global.fetch = mockFetch;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("use-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateFollowUpEmail", () => {
    it("should generate email with full params", () => {
      const result = generateFollowUpEmail({
        prospectPrenom: "Jean",
        prospectNom: "Dupont",
        entreprise: "Acme Corp",
        userNom: "Marie Martin",
        userTelephone: "06 12 34 56 78",
        leftVoicemail: true,
      });

      expect(result.subject).toBe("Suite à mon appel - Acme Corp");
      expect(result.body).toContain("Bonjour Jean");
      expect(result.body).toContain("message vocal");
      expect(result.body).toContain("au 06 12 34 56 78");
      expect(result.body).toContain("Marie Martin");
    });

    it("should generate email without optional params", () => {
      const result = generateFollowUpEmail({
        prospectNom: "Dupont",
      });

      expect(result.subject).toBe("Suite à mon appel");
      expect(result.body).toContain("Bonjour,");
      expect(result.body).not.toContain("message vocal");
      expect(result.body).toContain("L'équipe Axivity");
    });

    it("should not mention voicemail when leftVoicemail is false", () => {
      const result = generateFollowUpEmail({
        prospectPrenom: "Pierre",
        prospectNom: "Martin",
        leftVoicemail: false,
      });

      expect(result.body).not.toContain("message vocal");
    });

    it("should include entreprise in subject when provided", () => {
      const result = generateFollowUpEmail({
        prospectNom: "Test",
        entreprise: "TechCo",
      });

      expect(result.subject).toBe("Suite à mon appel - TechCo");
    });

    it("should not include phone when userTelephone is not provided", () => {
      const result = generateFollowUpEmail({
        prospectNom: "Test",
        userNom: "Agent",
      });

      expect(result.body).toContain("N'hésitez pas à me recontacter ou");
      expect(result.body).not.toContain("au 06");
    });

    it("should include Axivity signature", () => {
      const result = generateFollowUpEmail({
        prospectNom: "Test",
      });

      expect(result.body).toContain("Axivity - Solutions IA pour entreprises");
    });
  });

  describe("useSendEmail", () => {
    it("should call fetch with correct params on mutate", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, messageId: "msg-123" }),
      });

      const { result } = renderHook(() => useSendEmail(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          to: "test@example.com",
          subject: "Test",
          body: "Hello",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFetch).toHaveBeenCalledWith("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "test@example.com",
          subject: "Test",
          body: "Hello",
        }),
      });
    });

    it("should throw on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Unauthorized" }),
      });

      const { result } = renderHook(() => useSendEmail(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          to: "test@example.com",
          subject: "Test",
          body: "Hello",
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe("Unauthorized");
    });
  });
});
