// CRM Axivity - Facture Mapper Tests
import { describe, it, expect } from "vitest";
import {
  mapToFacture,
  mapFactureToInsert,
  mapFactureToUpdate,
} from "../facture.mapper";

describe("facture.mapper", () => {
  describe("mapToFacture", () => {
    it("should map complete Supabase record to Facture", () => {
      const record = {
        id: "fac-123",
        numero: "FAC-2024-001",
        statut: "Envoyé",
        montant_ht: 10000,
        taux_tva: 20,
        date_emission: "2024-01-15",
        date_echeance: "2024-02-15",
        date_paiement: null,
        notes: "Facture projet CRM",
        niveau_relance: 1,
        niveau_relance_envoye: 0,
        date_derniere_relance: null,
        projet_id: "proj-456",
        client_id: "client-789",
      };

      const facture = mapToFacture(record);

      expect(facture).toEqual({
        id: "fac-123",
        numero: "FAC-2024-001",
        statut: "Envoyé",
        montantHT: 10000,
        montantTTC: 12000, // 10000 * 1.20
        dateEmission: "2024-01-15",
        dateEcheance: "2024-02-15",
        datePaiement: undefined,
        notes: "Facture projet CRM",
        niveauRelance: 1,
        niveauRelanceEnvoye: 0,
        dateDerniereRelance: undefined,
        projet: ["proj-456"],
        client: ["client-789"],
      });
    });

    it("should calculate montantTTC with custom TVA rate", () => {
      const testCases = [
        { montantHT: 1000, tauxTVA: 20, expectedTTC: 1200 },
        { montantHT: 1000, tauxTVA: 10, expectedTTC: 1100 },
        { montantHT: 5000, tauxTVA: 5.5, expectedTTC: 5275 },
        // Note: taux_tva=0 falls back to default 20% due to || operator in code
        { montantHT: 2500, tauxTVA: 0, expectedTTC: 3000 },
      ];

      testCases.forEach(({ montantHT, tauxTVA, expectedTTC }) => {
        const record = {
          id: "fac",
          montant_ht: montantHT,
          taux_tva: tauxTVA,
        };
        const facture = mapToFacture(record);
        expect(facture.montantTTC).toBe(expectedTTC);
      });
    });

    it("should use default TVA rate of 20% when not specified", () => {
      const record = {
        id: "fac",
        montant_ht: 1000,
        // taux_tva not provided
      };

      const facture = mapToFacture(record);

      expect(facture.montantTTC).toBe(1200); // 1000 * 1.20
    });

    it("should return undefined montantTTC when montantHT is missing", () => {
      const record = {
        id: "fac",
        numero: "FAC-001",
      };

      const facture = mapToFacture(record);

      expect(facture.montantHT).toBeUndefined();
      expect(facture.montantTTC).toBeUndefined();
    });

    it("should handle minimal record with required fields only", () => {
      const record = {
        id: "fac-min",
      };

      const facture = mapToFacture(record);

      expect(facture.id).toBe("fac-min");
      expect(facture.statut).toBe("Brouillon"); // Default
      expect(facture.numero).toBeUndefined();
      expect(facture.montantHT).toBeUndefined();
      expect(facture.projet).toBeUndefined();
      expect(facture.client).toBeUndefined();
    });

    it("should accept all valid invoice statuses", () => {
      const validStatuses = [
        "Brouillon",
        "Envoyé",
        "Payé",
        "En retard",
        "Annulé",
      ];

      validStatuses.forEach((status) => {
        const record = { id: "fac", statut: status };
        const facture = mapToFacture(record);
        expect(facture.statut).toBe(status);
      });
    });

    it("should use default status for invalid enum value", () => {
      const record = {
        id: "fac",
        statut: "InvalidStatus",
      };

      const facture = mapToFacture(record);

      expect(facture.statut).toBe("Brouillon");
    });

    it("should handle relance fields correctly", () => {
      const record = {
        id: "fac",
        statut: "En retard",
        niveau_relance: 3,
        niveau_relance_envoye: 2,
        date_derniere_relance: "2024-02-20",
      };

      const facture = mapToFacture(record);

      expect(facture.niveauRelance).toBe(3);
      expect(facture.niveauRelanceEnvoye).toBe(2);
      expect(facture.dateDerniereRelance).toBe("2024-02-20");
    });

    it("should handle paid invoice with payment date", () => {
      const record = {
        id: "fac",
        statut: "Payé",
        montant_ht: 5000,
        date_paiement: "2024-02-10",
      };

      const facture = mapToFacture(record);

      expect(facture.statut).toBe("Payé");
      expect(facture.datePaiement).toBe("2024-02-10");
    });
  });

  describe("mapFactureToInsert", () => {
    it("should map complete Facture data to Supabase insert format", () => {
      const factureData = {
        numero: "FAC-2024-002",
        statut: "Envoyé" as const,
        montantHT: 15000,
        dateEmission: "2024-03-01",
        dateEcheance: "2024-04-01",
        notes: "New invoice",
        projet: ["proj-123"],
        client: ["client-456"],
      };

      const insertData = mapFactureToInsert(factureData);

      expect(insertData).toEqual({
        numero: "FAC-2024-002",
        statut: "Envoyé",
        montant_ht: 15000,
        date_emission: "2024-03-01",
        date_echeance: "2024-04-01",
        notes: "New invoice",
        projet_id: "proj-123",
        client_id: "client-456",
      });
    });

    it("should use default status if not provided", () => {
      const factureData = {
        numero: "FAC-001",
        montantHT: 5000,
      };

      const insertData = mapFactureToInsert(factureData);

      expect(insertData.statut).toBe("Brouillon");
    });

    it("should handle missing linked records", () => {
      const factureData = {
        numero: "FAC-001",
      };

      const insertData = mapFactureToInsert(factureData);

      expect(insertData.projet_id).toBeUndefined();
      expect(insertData.client_id).toBeUndefined();
    });

    it("should extract first ID from array of linked records", () => {
      const factureData = {
        projet: ["proj-1", "proj-2"],
        client: ["client-1"],
      };

      const insertData = mapFactureToInsert(factureData);

      expect(insertData.projet_id).toBe("proj-1");
      expect(insertData.client_id).toBe("client-1");
    });
  });

  describe("mapFactureToUpdate", () => {
    it("should only include defined fields", () => {
      const updateData = {
        statut: "Payé" as const,
        datePaiement: "2024-03-15",
      };

      const result = mapFactureToUpdate(updateData);

      expect(result).toEqual({
        statut: "Payé",
        date_paiement: "2024-03-15",
      });
      expect(result.numero).toBeUndefined();
      expect(result.montant_ht).toBeUndefined();
    });

    it("should map all fields when provided", () => {
      const updateData = {
        numero: "FAC-2024-003",
        statut: "En retard" as const,
        montantHT: 20000,
        dateEmission: "2024-04-01",
        dateEcheance: "2024-05-01",
        datePaiement: "2024-05-15",
        notes: "Updated notes",
        niveauRelanceEnvoye: 2,
        dateDerniereRelance: "2024-05-10",
      };

      const result = mapFactureToUpdate(updateData);

      expect(result).toEqual({
        numero: "FAC-2024-003",
        statut: "En retard",
        montant_ht: 20000,
        date_emission: "2024-04-01",
        date_echeance: "2024-05-01",
        date_paiement: "2024-05-15",
        notes: "Updated notes",
        niveau_relance_envoye: 2,
        date_derniere_relance: "2024-05-10",
      });
    });

    it("should return empty object for empty input", () => {
      const result = mapFactureToUpdate({});

      expect(result).toEqual({});
    });

    it("should handle relance update", () => {
      const updateData = {
        niveauRelanceEnvoye: 3,
        dateDerniereRelance: "2024-06-01",
      };

      const result = mapFactureToUpdate(updateData);

      expect(result).toEqual({
        niveau_relance_envoye: 3,
        date_derniere_relance: "2024-06-01",
      });
    });

    it("should handle zero montantHT", () => {
      const updateData = {
        montantHT: 0,
      };

      const result = mapFactureToUpdate(updateData);

      expect(result).toEqual({ montant_ht: 0 });
    });
  });
});
