// CRM Axivity - Tache Mapper Tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mapToTache,
  mapTacheToInsert,
  mapTacheToUpdate,
} from "../tache.mapper";

describe("tache.mapper", () => {
  // Mock Date for consistent testing of estEnRetard
  const MOCK_TODAY = "2024-03-15";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${MOCK_TODAY}T12:00:00Z`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("mapToTache", () => {
    it("should map complete Supabase record to Tache", () => {
      const record = {
        id: "tache-123",
        titre: "Développer API",
        description: "Implémenter les endpoints REST",
        statut: "En cours",
        priorite: "Haute",
        date_echeance: "2024-03-20",
        heures_estimees: 16,
        heures_passees: 8,
        created_at: "2024-03-01T10:00:00Z",
        date_terminee: null,
        ordre: 1,
        projet_id: "proj-456",
        assignee_id: "user-789",
      };

      const tache = mapToTache(record);

      expect(tache).toEqual({
        id: "tache-123",
        nom: "Développer API",
        description: "Implémenter les endpoints REST",
        statut: "En cours",
        priorite: "Haute",
        dateEcheance: "2024-03-20",
        heuresEstimees: 16,
        heuresReelles: 8,
        dateCreation: "2024-03-01T10:00:00Z",
        dateTerminee: undefined,
        ordre: 1,
        estEnRetard: false, // Date future
        projet: ["proj-456"],
        membreEquipe: ["user-789"],
      });
    });

    it("should handle minimal record with required fields only", () => {
      const record = {
        id: "tache-min",
        titre: "Minimal Task",
      };

      const tache = mapToTache(record);

      expect(tache.id).toBe("tache-min");
      expect(tache.nom).toBe("Minimal Task");
      expect(tache.statut).toBe("À faire"); // Default
      expect(tache.priorite).toBe("Moyenne"); // Default
      expect(tache.description).toBeUndefined();
      expect(tache.dateEcheance).toBeUndefined();
      expect(tache.estEnRetard).toBe(false);
      expect(tache.projet).toBeUndefined();
      expect(tache.membreEquipe).toBeUndefined();
    });

    it("should accept all valid task statuses", () => {
      const validStatuses = [
        "À faire",
        "En cours",
        "En revue",
        "Terminé",
      ];

      validStatuses.forEach((status) => {
        const record = { id: "tache", titre: "Task", statut: status };
        const tache = mapToTache(record);
        expect(tache.statut).toBe(status);
      });
    });

    it("should use default status for invalid enum value", () => {
      const record = {
        id: "tache",
        titre: "Task",
        statut: "InvalidStatus",
      };

      const tache = mapToTache(record);

      expect(tache.statut).toBe("À faire");
    });

    it("should accept all valid task priorities", () => {
      const validPriorities = ["Basse", "Moyenne", "Haute", "Critique"];

      validPriorities.forEach((priorite) => {
        const record = { id: "tache", titre: "Task", priorite };
        const tache = mapToTache(record);
        expect(tache.priorite).toBe(priorite);
      });
    });

    describe("estEnRetard calculation", () => {
      it("should be true when dateEcheance is in the past and not completed", () => {
        const record = {
          id: "tache",
          titre: "Late Task",
          statut: "En cours",
          date_echeance: "2024-03-10", // Past date
        };

        const tache = mapToTache(record);

        expect(tache.estEnRetard).toBe(true);
      });

      it("should be false when dateEcheance is today", () => {
        const record = {
          id: "tache",
          titre: "Due Today",
          statut: "En cours",
          date_echeance: MOCK_TODAY,
        };

        const tache = mapToTache(record);

        expect(tache.estEnRetard).toBe(false);
      });

      it("should be false when dateEcheance is in the future", () => {
        const record = {
          id: "tache",
          titre: "Future Task",
          statut: "À faire",
          date_echeance: "2024-03-20",
        };

        const tache = mapToTache(record);

        expect(tache.estEnRetard).toBe(false);
      });

      it("should be false when task is completed even if past due", () => {
        const record = {
          id: "tache",
          titre: "Completed Late",
          statut: "Terminé",
          date_echeance: "2024-03-01", // Past date
        };

        const tache = mapToTache(record);

        expect(tache.estEnRetard).toBe(false);
      });

      it("should be false when no dateEcheance", () => {
        const record = {
          id: "tache",
          titre: "No Due Date",
          statut: "En cours",
        };

        const tache = mapToTache(record);

        expect(tache.estEnRetard).toBe(false);
      });
    });

    it("should handle completed task with completion date", () => {
      const record = {
        id: "tache",
        titre: "Completed Task",
        statut: "Terminé",
        date_terminee: "2024-03-14T16:30:00Z",
      };

      const tache = mapToTache(record);

      expect(tache.statut).toBe("Terminé");
      expect(tache.dateTerminee).toBe("2024-03-14T16:30:00Z");
    });

    it("should handle hours tracking", () => {
      const record = {
        id: "tache",
        titre: "Tracked Task",
        heures_estimees: 8,
        heures_passees: 12,
      };

      const tache = mapToTache(record);

      expect(tache.heuresEstimees).toBe(8);
      expect(tache.heuresReelles).toBe(12);
    });

    it("should handle ordre for sorting", () => {
      const records = [
        { id: "t1", titre: "First", ordre: 1 },
        { id: "t2", titre: "Second", ordre: 2 },
        { id: "t3", titre: "Third", ordre: 3 },
      ];

      const taches = records.map(mapToTache);

      expect(taches[0].ordre).toBe(1);
      expect(taches[1].ordre).toBe(2);
      expect(taches[2].ordre).toBe(3);
    });
  });

  describe("mapTacheToInsert", () => {
    it("should map complete Tache data to Supabase insert format", () => {
      const tacheData = {
        nom: "New Task",
        description: "Task description",
        statut: "À faire" as const,
        priorite: "Haute" as const,
        dateEcheance: "2024-04-01",
        heuresEstimees: 4,
        projet: ["proj-123"],
        membreEquipe: ["user-456"],
      };

      const insertData = mapTacheToInsert(tacheData);

      expect(insertData).toEqual({
        titre: "New Task",
        description: "Task description",
        statut: "À faire",
        priorite: "Haute",
        date_echeance: "2024-04-01",
        heures_estimees: 4,
        projet_id: "proj-123",
        assignee_id: "user-456",
      });
    });

    it("should use default status and priority if not provided", () => {
      const tacheData = {
        nom: "Task with defaults",
      };

      const insertData = mapTacheToInsert(tacheData);

      expect(insertData.statut).toBe("À faire");
      expect(insertData.priorite).toBe("Moyenne");
    });

    it("should handle missing linked records", () => {
      const tacheData = {
        nom: "Standalone Task",
      };

      const insertData = mapTacheToInsert(tacheData);

      expect(insertData.projet_id).toBeUndefined();
      expect(insertData.assignee_id).toBeUndefined();
    });

    it("should extract first ID from array of linked records", () => {
      const tacheData = {
        nom: "Multi-linked",
        projet: ["proj-1", "proj-2"],
        membreEquipe: ["user-1", "user-2"],
      };

      const insertData = mapTacheToInsert(tacheData);

      expect(insertData.projet_id).toBe("proj-1");
      expect(insertData.assignee_id).toBe("user-1");
    });
  });

  describe("mapTacheToUpdate", () => {
    it("should only include defined fields", () => {
      const updateData = {
        statut: "En cours" as const,
        heuresReelles: 2,
      };

      const result = mapTacheToUpdate(updateData);

      expect(result).toEqual({
        statut: "En cours",
        heures_passees: 2,
      });
      expect(result.titre).toBeUndefined();
      expect(result.priorite).toBeUndefined();
    });

    it("should map all fields when provided", () => {
      const updateData = {
        nom: "Updated Task",
        description: "Updated description",
        statut: "Terminé" as const,
        priorite: "Critique" as const,
        dateEcheance: "2024-04-15",
        heuresEstimees: 10,
        heuresReelles: 12,
        dateTerminee: "2024-04-14",
        ordre: 5,
        membreEquipe: ["new-user"],
      };

      const result = mapTacheToUpdate(updateData);

      expect(result).toEqual({
        titre: "Updated Task",
        description: "Updated description",
        statut: "Terminé",
        priorite: "Critique",
        date_echeance: "2024-04-15",
        heures_estimees: 10,
        heures_passees: 12,
        date_terminee: "2024-04-14",
        ordre: 5,
        assignee_id: "new-user",
      });
    });

    it("should return empty object for empty input", () => {
      const result = mapTacheToUpdate({});

      expect(result).toEqual({});
    });

    it("should handle clearing assignee with empty array", () => {
      const updateData = {
        membreEquipe: [],
      };

      const result = mapTacheToUpdate(updateData);

      expect(result.assignee_id).toBeUndefined();
    });

    it("should handle zero hours", () => {
      const updateData = {
        heuresEstimees: 0,
        heuresReelles: 0,
      };

      const result = mapTacheToUpdate(updateData);

      expect(result).toEqual({
        heures_estimees: 0,
        heures_passees: 0,
      });
    });

    it("should update ordre for reordering", () => {
      const updateData = {
        ordre: 10,
      };

      const result = mapTacheToUpdate(updateData);

      expect(result).toEqual({ ordre: 10 });
    });
  });
});
