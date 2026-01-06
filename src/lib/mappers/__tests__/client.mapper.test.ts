// CRM Axivity - Client Mapper Tests
import { describe, it, expect } from "vitest";
import {
  mapToClient,
  mapClientToInsert,
  mapClientToUpdate,
} from "../client.mapper";

describe("client.mapper", () => {
  describe("mapToClient", () => {
    it("should map complete Supabase record to Client", () => {
      const record = {
        id: "client-123",
        nom: "Acme Corp",
        secteur: "Technology",
        statut: "Actif",
        site_web: "https://acme.com",
        telephone: "+33123456789",
        notes: "Important client",
        created_at: "2024-01-15T10:00:00Z",
        siret: "12345678901234",
        adresse: "123 Rue de Paris",
        code_postal: "75001",
        ville: "Paris",
        pays: "France",
        sante_client: "Bon",
      };

      const client = mapToClient(record);

      expect(client).toEqual({
        id: "client-123",
        nom: "Acme Corp",
        secteurActivite: "Technology",
        statut: "Actif",
        siteWeb: "https://acme.com",
        telephone: "+33123456789",
        notes: "Important client",
        dateCreation: "2024-01-15T10:00:00Z",
        siret: "12345678901234",
        adresse: "123 Rue de Paris",
        codePostal: "75001",
        ville: "Paris",
        pays: "France",
        santeClient: "Bon",
      });
    });

    it("should handle minimal record with required fields only", () => {
      const record = {
        id: "client-456",
        nom: "Minimal Client",
      };

      const client = mapToClient(record);

      expect(client.id).toBe("client-456");
      expect(client.nom).toBe("Minimal Client");
      expect(client.statut).toBe("Prospect"); // Default
      expect(client.secteurActivite).toBeUndefined();
      expect(client.siteWeb).toBeUndefined();
      expect(client.telephone).toBeUndefined();
      expect(client.siret).toBeUndefined();
      expect(client.adresse).toBeUndefined();
    });

    it("should handle null values gracefully", () => {
      const record = {
        id: "client-789",
        nom: "Client with nulls",
        secteur: null,
        statut: null,
        site_web: null,
        telephone: null,
        notes: null,
        siret: null,
        adresse: null,
        code_postal: null,
        ville: null,
        pays: null,
      };

      const client = mapToClient(record);

      expect(client.id).toBe("client-789");
      expect(client.nom).toBe("Client with nulls");
      expect(client.statut).toBe("Prospect"); // Default for null
      expect(client.secteurActivite).toBeUndefined();
      expect(client.siteWeb).toBeUndefined();
    });

    it("should use default status for invalid enum value", () => {
      const record = {
        id: "client-abc",
        nom: "Client",
        statut: "InvalidStatus",
      };

      const client = mapToClient(record);

      expect(client.statut).toBe("Prospect");
    });

    it("should accept all valid client statuses", () => {
      const validStatuses = ["Prospect", "Actif", "Inactif", "Churned"];

      validStatuses.forEach((status) => {
        const record = { id: "id", nom: "Client", statut: status };
        const client = mapToClient(record);
        expect(client.statut).toBe(status);
      });
    });
  });

  describe("mapClientToInsert", () => {
    it("should map complete Client data to Supabase insert format", () => {
      const clientData = {
        nom: "New Client",
        secteurActivite: "Finance",
        statut: "Client" as const,
        siteWeb: "https://newclient.com",
        telephone: "+33987654321",
        notes: "New prospect",
        siret: "98765432109876",
        adresse: "456 Avenue des Champs",
        codePostal: "69001",
        ville: "Lyon",
        pays: "Belgique",
      };

      const insertData = mapClientToInsert(clientData);

      expect(insertData).toEqual({
        nom: "New Client",
        secteur: "Finance",
        statut: "Client",
        site_web: "https://newclient.com",
        telephone: "+33987654321",
        notes: "New prospect",
        siret: "98765432109876",
        adresse: "456 Avenue des Champs",
        code_postal: "69001",
        ville: "Lyon",
        pays: "Belgique",
      });
    });

    it("should use default status if not provided", () => {
      const clientData = {
        nom: "Client sans statut",
      };

      const insertData = mapClientToInsert(clientData);

      expect(insertData.statut).toBe("Prospect");
    });

    it("should use default country if not provided", () => {
      const clientData = {
        nom: "French Client",
      };

      const insertData = mapClientToInsert(clientData);

      expect(insertData.pays).toBe("France");
    });

    it("should handle empty partial data", () => {
      const insertData = mapClientToInsert({});

      expect(insertData.nom).toBeUndefined();
      expect(insertData.statut).toBe("Prospect");
      expect(insertData.pays).toBe("France");
    });
  });

  describe("mapClientToUpdate", () => {
    it("should only include defined fields", () => {
      const updateData = {
        nom: "Updated Name",
        telephone: "+33111222333",
      };

      const result = mapClientToUpdate(updateData);

      expect(result).toEqual({
        nom: "Updated Name",
        telephone: "+33111222333",
      });
      expect(result.secteur).toBeUndefined();
      expect(result.statut).toBeUndefined();
    });

    it("should map all fields when provided", () => {
      const updateData = {
        nom: "Full Update",
        secteurActivite: "Healthcare",
        statut: "Actif" as const,
        siteWeb: "https://updated.com",
        telephone: "+33444555666",
        notes: "Updated notes",
        siret: "11111111111111",
        adresse: "New Address",
        codePostal: "33000",
        ville: "Bordeaux",
        pays: "Suisse",
      };

      const result = mapClientToUpdate(updateData);

      expect(result).toEqual({
        nom: "Full Update",
        secteur: "Healthcare",
        statut: "Actif",
        site_web: "https://updated.com",
        telephone: "+33444555666",
        notes: "Updated notes",
        siret: "11111111111111",
        adresse: "New Address",
        code_postal: "33000",
        ville: "Bordeaux",
        pays: "Suisse",
      });
    });

    it("should return empty object for empty input", () => {
      const result = mapClientToUpdate({});

      expect(result).toEqual({});
    });

    it("should include field even if value is empty string", () => {
      const updateData = {
        notes: "",
      };

      const result = mapClientToUpdate(updateData);

      expect(result).toEqual({ notes: "" });
    });

    it("should handle explicitly undefined vs not present", () => {
      // Explicitly setting nom to undefined should not include it
      const updateData: { nom?: string; telephone?: string } = {};
      updateData.telephone = "+33111";
      // nom is not set at all (not even undefined)

      const result = mapClientToUpdate(updateData);

      expect(result).toEqual({ telephone: "+33111" });
      expect("nom" in result).toBe(false);
    });
  });
});
