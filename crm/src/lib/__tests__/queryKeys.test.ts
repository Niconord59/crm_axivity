// CRM Axivity - Query Keys Factory Tests
import { describe, it, expect } from "vitest";
import { queryKeys } from "../queryKeys";

describe("queryKeys", () => {
  describe("prospects", () => {
    it("pastRdv should return correct key", () => {
      expect(queryKeys.prospects.pastRdv()).toEqual(["prospects", "past-rdv"]);
    });

    it("upcomingRdv should return correct key", () => {
      expect(queryKeys.prospects.upcomingRdv()).toEqual(["prospects", "upcoming-rdv"]);
    });

    it("rappelsAujourdhui should include userId", () => {
      expect(queryKeys.prospects.rappelsAujourdhui("user-1")).toEqual([
        "prospects",
        "rappels-aujourdhui",
        "user-1",
      ]);
    });

    it("rdvAujourdhui should include userId", () => {
      expect(queryKeys.prospects.rdvAujourdhui("user-1")).toEqual([
        "prospects",
        "rdv-aujourdhui",
        "user-1",
      ]);
    });

    it("kpis should include prospect ids", () => {
      expect(queryKeys.prospects.kpis(["p1", "p2"])).toEqual([
        "prospects",
        "kpis",
        ["p1", "p2"],
      ]);
    });

    it("byClient should include clientId", () => {
      expect(queryKeys.prospects.byClient("client-1")).toEqual([
        "prospects",
        "by-client",
        "client-1",
      ]);
    });
  });

  describe("calendar", () => {
    it("events should include date range", () => {
      const range = { start: "2026-01-01", end: "2026-01-31" };
      expect(queryKeys.calendar.events(range)).toEqual([
        "calendar",
        "events",
        range,
      ]);
    });

    it("status should return correct key", () => {
      expect(queryKeys.calendar.status()).toEqual(["calendar", "status"]);
    });
  });

  describe("emailTemplates", () => {
    it("lists should return correct key", () => {
      expect(queryKeys.emailTemplates.lists()).toEqual(["email-templates", "list"]);
    });

    it("list should return correct key", () => {
      expect(queryKeys.emailTemplates.list()).toEqual(["email-templates", "list"]);
    });

    it("details should return correct key", () => {
      expect(queryKeys.emailTemplates.details()).toEqual(["email-templates", "detail"]);
    });

    it("detail should include id", () => {
      expect(queryKeys.emailTemplates.detail("tpl-1")).toEqual([
        "email-templates",
        "detail",
        "tpl-1",
      ]);
    });
  });

  describe("services", () => {
    it("categories should return correct key", () => {
      expect(queryKeys.services.categories()).toEqual(["services", "categories"]);
    });
  });

  describe("projetMembres", () => {
    it("nonAssignes should return correct key", () => {
      expect(queryKeys.projetMembres.nonAssignes()).toEqual([
        "projet-membres",
        "non-assignes",
      ]);
    });
  });

  describe("equipe", () => {
    it("charge should return correct key", () => {
      expect(queryKeys.equipe.charge()).toEqual(["equipe", "charge"]);
    });
  });

  describe("dashboard", () => {
    it("lifecycleFunnel should return correct key", () => {
      expect(queryKeys.dashboard.lifecycleFunnel()).toEqual([
        "dashboard",
        "lifecycle-funnel",
      ]);
    });
  });
});
