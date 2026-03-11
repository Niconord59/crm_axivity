// CRM Axivity - Opportunite Schema Tests
import { describe, it, expect } from "vitest";
import {
  opportuniteSchema,
  getDefaultClotureDate,
  opportuniteDefaultValues,
} from "../opportunite";

describe("opportunite schema", () => {
  describe("getDefaultClotureDate", () => {
    it("should return a date string in YYYY-MM-DD format", () => {
      const result = getDefaultClotureDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should return a date approximately 30 days in the future", () => {
      const result = getDefaultClotureDate();
      const resultDate = new Date(result);
      const now = new Date();
      const diffDays = Math.round(
        (resultDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(31);
    });
  });

  describe("opportuniteSchema validation", () => {
    it("should accept valid opportunity data", () => {
      const result = opportuniteSchema.safeParse({
        nom: "Projet IA",
        clientId: "client-123",
        valeurEstimee: 50000,
        probabilite: 60,
        statut: "Qualifié",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty nom", () => {
      const result = opportuniteSchema.safeParse({
        nom: "",
        clientId: "client-123",
        valeurEstimee: 0,
        probabilite: 20,
        statut: "Qualifié",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative valeurEstimee", () => {
      const result = opportuniteSchema.safeParse({
        nom: "Test",
        clientId: "client-123",
        valeurEstimee: -100,
        probabilite: 20,
        statut: "Qualifié",
      });
      expect(result.success).toBe(false);
    });

    it("should reject probabilite above 100", () => {
      const result = opportuniteSchema.safeParse({
        nom: "Test",
        clientId: "client-123",
        valeurEstimee: 1000,
        probabilite: 150,
        statut: "Qualifié",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid statut", () => {
      const result = opportuniteSchema.safeParse({
        nom: "Test",
        clientId: "client-123",
        valeurEstimee: 1000,
        probabilite: 50,
        statut: "InvalidStatus",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("opportuniteDefaultValues", () => {
    it("should have expected defaults", () => {
      expect(opportuniteDefaultValues.valeurEstimee).toBe(0);
      expect(opportuniteDefaultValues.probabilite).toBe(20);
      expect(opportuniteDefaultValues.statut).toBe("Qualifié");
    });
  });
});
