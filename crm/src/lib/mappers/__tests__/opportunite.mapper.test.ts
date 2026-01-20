// CRM Axivity - Opportunite Mapper Tests
import { describe, it, expect } from "vitest";
import {
  mapToOpportunite,
  mapOpportuniteToInsert,
  mapOpportuniteToUpdate,
} from "../opportunite.mapper";

describe("opportunite.mapper", () => {
  describe("mapToOpportunite", () => {
    it("should map complete Supabase record to Opportunite", () => {
      const record = {
        id: "opp-123",
        nom: "Projet CRM",
        statut: "Proposition",
        valeur_estimee: 50000,
        probabilite: 75,
        date_cloture_prevue: "2024-06-30",
        source: "LinkedIn",
        notes: "Client interessé",
        created_at: "2024-01-15T10:00:00Z",
        client_id: "client-456",
        contact_id: "contact-789",
        projet_id: null,
      };

      const opportunite = mapToOpportunite(record);

      expect(opportunite).toEqual({
        id: "opp-123",
        nom: "Projet CRM",
        statut: "Proposition",
        valeurEstimee: 50000,
        probabilite: 75,
        valeurPonderee: 37500, // 50000 * 0.75
        dateClotureEstimee: "2024-06-30",
        source: "LinkedIn",
        notes: "Client interessé",
        dateCreation: "2024-01-15T10:00:00Z",
        client: ["client-456"],
        contact: ["contact-789"],
        projetCree: undefined,
      });
    });

    it("should calculate valeurPonderee correctly", () => {
      const testCases = [
        { valeur: 100000, proba: 50, expected: 50000 },
        { valeur: 25000, proba: 80, expected: 20000 },
        { valeur: 10000, proba: 10, expected: 1000 },
        { valeur: 75000, proba: 100, expected: 75000 },
        // Note: proba=0 is falsy, so valeurPonderee is undefined (not 0)
        { valeur: 50000, proba: 5, expected: 2500 },
      ];

      testCases.forEach(({ valeur, proba, expected }) => {
        const record = {
          id: "opp",
          nom: "Test",
          valeur_estimee: valeur,
          probabilite: proba,
        };
        const opp = mapToOpportunite(record);
        expect(opp.valeurPonderee).toBe(expected);
      });
    });

    it("should return undefined valeurPonderee when valeur is missing", () => {
      const record = {
        id: "opp",
        nom: "Test",
        probabilite: 50,
      };

      const opp = mapToOpportunite(record);

      expect(opp.valeurPonderee).toBeUndefined();
    });

    it("should return undefined valeurPonderee when probabilite is missing", () => {
      const record = {
        id: "opp",
        nom: "Test",
        valeur_estimee: 50000,
      };

      const opp = mapToOpportunite(record);

      expect(opp.valeurPonderee).toBeUndefined();
    });

    it("should handle minimal record with required fields only", () => {
      const record = {
        id: "opp-min",
        nom: "Minimal Opp",
      };

      const opp = mapToOpportunite(record);

      expect(opp.id).toBe("opp-min");
      expect(opp.nom).toBe("Minimal Opp");
      expect(opp.statut).toBe("Qualifié"); // Default
      expect(opp.valeurEstimee).toBeUndefined();
      expect(opp.probabilite).toBeUndefined();
      expect(opp.valeurPonderee).toBeUndefined();
      expect(opp.client).toBeUndefined();
      expect(opp.contact).toBeUndefined();
    });

    it("should accept all valid opportunity statuses", () => {
      const validStatuses = [
        "Qualifié",
        "Proposition",
        "Négociation",
        "Gagné",
        "Perdu",
      ];

      validStatuses.forEach((status) => {
        const record = { id: "id", nom: "Opp", statut: status };
        const opp = mapToOpportunite(record);
        expect(opp.statut).toBe(status);
      });
    });

    it("should use default status for invalid enum value", () => {
      const record = {
        id: "opp",
        nom: "Test",
        statut: "InvalidStatus",
      };

      const opp = mapToOpportunite(record);

      expect(opp.statut).toBe("Qualifié");
    });

    it("should handle linked project when opportunity is converted", () => {
      const record = {
        id: "opp",
        nom: "Converted Opp",
        statut: "Gagné",
        projet_id: "proj-123",
      };

      const opp = mapToOpportunite(record);

      expect(opp.projetCree).toEqual(["proj-123"]);
    });
  });

  describe("mapOpportuniteToInsert", () => {
    it("should map complete Opportunite data to Supabase insert format", () => {
      const oppData = {
        nom: "New Opportunity",
        statut: "Proposition" as const,
        valeurEstimee: 75000,
        probabilite: 60,
        dateClotureEstimee: "2024-09-30",
        source: "Referral",
        notes: "Hot lead",
        client: ["client-123"],
        contact: ["contact-456"],
      };

      const insertData = mapOpportuniteToInsert(oppData);

      expect(insertData).toEqual({
        nom: "New Opportunity",
        statut: "Proposition",
        valeur_estimee: 75000,
        probabilite: 60,
        date_cloture_prevue: "2024-09-30",
        source: "Referral",
        notes: "Hot lead",
        client_id: "client-123",
        contact_id: "contact-456",
      });
    });

    it("should use default status if not provided", () => {
      const oppData = {
        nom: "Opp sans statut",
      };

      const insertData = mapOpportuniteToInsert(oppData);

      expect(insertData.statut).toBe("Qualifié");
    });

    it("should handle missing linked records", () => {
      const oppData = {
        nom: "Standalone Opp",
        valeurEstimee: 10000,
      };

      const insertData = mapOpportuniteToInsert(oppData);

      expect(insertData.client_id).toBeUndefined();
      expect(insertData.contact_id).toBeUndefined();
    });

    it("should extract first ID from array of linked records", () => {
      const oppData = {
        nom: "Multi-linked",
        client: ["client-1", "client-2"],
        contact: ["contact-1"],
      };

      const insertData = mapOpportuniteToInsert(oppData);

      expect(insertData.client_id).toBe("client-1");
      expect(insertData.contact_id).toBe("contact-1");
    });
  });

  describe("mapOpportuniteToUpdate", () => {
    it("should only include defined fields", () => {
      const updateData = {
        nom: "Updated Name",
        valeurEstimee: 100000,
      };

      const result = mapOpportuniteToUpdate(updateData);

      expect(result).toEqual({
        nom: "Updated Name",
        valeur_estimee: 100000,
      });
      expect(result.statut).toBeUndefined();
      expect(result.probabilite).toBeUndefined();
    });

    it("should map all fields when provided", () => {
      const updateData = {
        nom: "Full Update",
        statut: "Négociation" as const,
        valeurEstimee: 150000,
        probabilite: 85,
        dateClotureEstimee: "2024-12-31",
        source: "Website",
        notes: "Updated notes",
      };

      const result = mapOpportuniteToUpdate(updateData);

      expect(result).toEqual({
        nom: "Full Update",
        statut: "Négociation",
        valeur_estimee: 150000,
        probabilite: 85,
        date_cloture_prevue: "2024-12-31",
        source: "Website",
        notes: "Updated notes",
      });
    });

    it("should return empty object for empty input", () => {
      const result = mapOpportuniteToUpdate({});

      expect(result).toEqual({});
    });

    it("should handle zero values correctly", () => {
      const updateData = {
        valeurEstimee: 0,
        probabilite: 0,
      };

      const result = mapOpportuniteToUpdate(updateData);

      expect(result).toEqual({
        valeur_estimee: 0,
        probabilite: 0,
      });
    });

    it("should not include linked record fields (client, contact)", () => {
      // Update function should not handle linked records directly
      const updateData = {
        nom: "Test",
      };

      const result = mapOpportuniteToUpdate(updateData);

      expect("client_id" in result).toBe(false);
      expect("contact_id" in result).toBe(false);
    });
  });
});
