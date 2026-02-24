// CRM Axivity - Projet Mapper Tests
import { describe, it, expect } from "vitest";
import {
  mapToProjet,
  mapProjetToInsert,
  mapProjetToUpdate,
} from "../projet.mapper";

describe("projet.mapper", () => {
  describe("mapToProjet", () => {
    it("should map complete Supabase record to Projet", () => {
      const record = {
        id: "proj-123",
        id_projet: 42,
        brief: "Développement CRM",
        nom: "P42 - CRM Axivity",
        statut: "En cours",
        date_debut: "2024-01-15",
        date_fin_prevue: "2024-06-30",
        date_fin_reelle: null,
        budget_initial: 75000,
        notes: "Projet prioritaire",
        priorite: "Haute",
        heures_estimees: 500,
        heures_passees: 250,
        client_id: "client-456",
        chef_projet_id: "user-789",
      };

      const projet = mapToProjet(record);

      expect(projet).toEqual({
        id: "proj-123",
        idProjet: 42,
        briefProjet: "Développement CRM",
        nomProjet: "P42 - CRM Axivity",
        statut: "En cours",
        dateDebut: "2024-01-15",
        dateFinPrevue: "2024-06-30",
        dateFinReelle: undefined,
        budget: 75000,
        notes: "Projet prioritaire",
        priorite: "Haute",
        totalHeuresEstimees: 500,
        totalHeuresPassees: 250,
        client: ["client-456"],
        ownerId: "user-789",
      });
    });

    it("should handle minimal record with required fields only", () => {
      const record = {
        id: "proj-min",
      };

      const projet = mapToProjet(record);

      expect(projet.id).toBe("proj-min");
      expect(projet.statut).toBe("Cadrage"); // Default
      expect(projet.idProjet).toBeUndefined();
      expect(projet.briefProjet).toBeUndefined();
      expect(projet.nomProjet).toBeUndefined();
      expect(projet.budget).toBeUndefined();
      expect(projet.priorite).toBeUndefined();
      expect(projet.client).toBeUndefined();
      expect(projet.ownerId).toBeUndefined();
    });

    it("should accept all valid project statuses", () => {
      const validStatuses = [
        "Cadrage",
        "En cours",
        "En pause",
        "Terminé",
        "Annulé",
      ];

      validStatuses.forEach((status) => {
        const record = { id: "proj", statut: status };
        const projet = mapToProjet(record);
        expect(projet.statut).toBe(status);
      });
    });

    it("should use default status for invalid enum value", () => {
      const record = {
        id: "proj",
        statut: "InvalidStatus",
      };

      const projet = mapToProjet(record);

      expect(projet.statut).toBe("Cadrage");
    });

    it("should accept all valid task priorities for projet", () => {
      const validPriorities = ["Basse", "Moyenne", "Haute", "Critique"];

      validPriorities.forEach((priorite) => {
        const record = { id: "proj", priorite };
        const projet = mapToProjet(record);
        expect(projet.priorite).toBe(priorite);
      });
    });

    it("should handle completed project with real end date", () => {
      const record = {
        id: "proj",
        statut: "Terminé",
        date_debut: "2024-01-01",
        date_fin_prevue: "2024-03-31",
        date_fin_reelle: "2024-03-28",
      };

      const projet = mapToProjet(record);

      expect(projet.statut).toBe("Terminé");
      expect(projet.dateFinReelle).toBe("2024-03-28");
    });

    it("should handle hours tracking", () => {
      const record = {
        id: "proj",
        heures_estimees: 100,
        heures_passees: 75,
      };

      const projet = mapToProjet(record);

      expect(projet.totalHeuresEstimees).toBe(100);
      expect(projet.totalHeuresPassees).toBe(75);
    });

    it("should return undefined for missing hours", () => {
      const record = {
        id: "proj",
      };

      const projet = mapToProjet(record);

      expect(projet.totalHeuresEstimees).toBeUndefined();
      expect(projet.totalHeuresPassees).toBeUndefined();
    });
  });

  describe("mapProjetToInsert", () => {
    it("should map complete Projet data to Supabase insert format", () => {
      const projetData = {
        briefProjet: "New Project Brief",
        nomProjet: "New CRM Project",
        statut: "En cours" as const,
        dateDebut: "2024-04-01",
        dateFinPrevue: "2024-09-30",
        budget: 50000,
        notes: "Important project",
        client: ["client-123"],
        ownerId: "user-456",
      };

      const insertData = mapProjetToInsert(projetData);

      expect(insertData).toEqual({
        brief: "New Project Brief",
        nom: "New CRM Project",
        statut: "En cours",
        date_debut: "2024-04-01",
        date_fin_prevue: "2024-09-30",
        budget_initial: 50000,
        notes: "Important project",
        client_id: "client-123",
        chef_projet_id: "user-456",
      });
    });

    it("should use default status if not provided", () => {
      const projetData = {
        briefProjet: "New Brief",
      };

      const insertData = mapProjetToInsert(projetData);

      expect(insertData.statut).toBe("Cadrage");
    });

    it("should use briefProjet as nom if nomProjet not provided", () => {
      const projetData = {
        briefProjet: "Project Brief Only",
      };

      const insertData = mapProjetToInsert(projetData);

      expect(insertData.nom).toBe("Project Brief Only");
    });

    it("should handle missing linked records", () => {
      const projetData = {
        briefProjet: "Standalone Project",
      };

      const insertData = mapProjetToInsert(projetData);

      expect(insertData.client_id).toBeUndefined();
      expect("chef_projet_id" in insertData).toBe(false);
    });

    it("should include chef_projet_id when provided", () => {
      const projetData = {
        briefProjet: "Owned Project",
        ownerId: "user-owner",
      };

      const insertData = mapProjetToInsert(projetData);

      expect(insertData.chef_projet_id).toBe("user-owner");
    });

    it("should extract first ID from array of linked clients", () => {
      const projetData = {
        briefProjet: "Multi-client",
        client: ["client-1", "client-2"],
      };

      const insertData = mapProjetToInsert(projetData);

      expect(insertData.client_id).toBe("client-1");
    });
  });

  describe("mapProjetToUpdate", () => {
    it("should only include defined fields", () => {
      const updateData = {
        statut: "Terminé" as const,
        dateFinReelle: "2024-06-15",
      };

      const result = mapProjetToUpdate(updateData);

      expect(result).toEqual({
        statut: "Terminé",
        date_fin_reelle: "2024-06-15",
      });
      expect(result.brief).toBeUndefined();
      expect(result.nom).toBeUndefined();
    });

    it("should map all fields when provided", () => {
      const updateData = {
        briefProjet: "Updated Brief",
        nomProjet: "Updated Project Name",
        statut: "En pause" as const,
        dateDebut: "2024-05-01",
        dateFinPrevue: "2024-12-31",
        dateFinReelle: "2024-10-15",
        budget: 100000,
        notes: "Updated notes",
        priorite: "Critique" as const,
        ownerId: "new-owner",
      };

      const result = mapProjetToUpdate(updateData);

      expect(result).toEqual({
        brief: "Updated Brief",
        nom: "Updated Project Name",
        statut: "En pause",
        date_debut: "2024-05-01",
        date_fin_prevue: "2024-12-31",
        date_fin_reelle: "2024-10-15",
        budget_initial: 100000,
        notes: "Updated notes",
        priorite: "Critique",
        chef_projet_id: "new-owner",
      });
    });

    it("should return empty object for empty input", () => {
      const result = mapProjetToUpdate({});

      expect(result).toEqual({});
    });

    it("should handle clearing owner with empty string", () => {
      const updateData = {
        ownerId: "",
      };

      const result = mapProjetToUpdate(updateData);

      // Empty string for ownerId should set chef_projet_id to null
      expect(result.chef_projet_id).toBe(null);
    });

    it("should handle zero budget", () => {
      const updateData = {
        budget: 0,
      };

      const result = mapProjetToUpdate(updateData);

      expect(result).toEqual({ budget_initial: 0 });
    });

    it("should update priority independently", () => {
      const updateData = {
        priorite: "Haute" as const,
      };

      const result = mapProjetToUpdate(updateData);

      expect(result).toEqual({ priorite: "Haute" });
    });
  });
});
