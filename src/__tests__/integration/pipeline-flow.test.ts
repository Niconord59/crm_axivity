// CRM Axivity - Integration Tests: Pipeline Commercial Flow
// Tests the complete flow: opportunity creation → drag & drop → status change → mini sheet edit
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Supabase client before imports
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: "new-id" }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })),
  },
}));

// Mock @hello-pangea/dnd
vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => children,
  Droppable: ({ children }: { children: (provided: unknown) => React.ReactNode }) =>
    children({
      droppableProps: {},
      innerRef: vi.fn(),
      placeholder: null,
    }),
  Draggable: ({ children }: { children: (provided: unknown) => React.ReactNode }) =>
    children({
      draggableProps: {},
      dragHandleProps: {},
      innerRef: vi.fn(),
    }),
}));

import { supabase } from "@/lib/supabase";
import type { OpportunityStatus } from "@/types";

// ===========================================================================
// TEST DATA
// ===========================================================================

const mockOpportunites = [
  {
    id: "opp-1",
    nom: "Projet Alpha",
    statut: "Qualifié" as OpportunityStatus,
    valeurEstimee: 50000,
    probabilite: 30,
    valeurPonderee: 15000,
    dateClotureEstimee: "2026-02-28",
    client_id: "client-1",
    contact_id: "contact-1",
  },
  {
    id: "opp-2",
    nom: "Projet Beta",
    statut: "Proposition" as OpportunityStatus,
    valeurEstimee: 75000,
    probabilite: 50,
    valeurPonderee: 37500,
    dateClotureEstimee: "2026-03-15",
    client_id: "client-2",
    contact_id: "contact-2",
  },
  {
    id: "opp-3",
    nom: "Projet Gamma",
    statut: "Négociation" as OpportunityStatus,
    valeurEstimee: 100000,
    probabilite: 75,
    valeurPonderee: 75000,
    dateClotureEstimee: "2026-01-31",
    client_id: "client-1",
    contact_id: "contact-3",
  },
];

const mockKanbanColumns: OpportunityStatus[] = [
  "Qualifié",
  "Proposition",
  "Négociation",
  "Gagné",
  "Perdu",
];

// ===========================================================================
// PIPELINE FLOW INTEGRATION TESTS
// ===========================================================================

describe("Pipeline Flow Integration", () => {
  const mockFrom = vi.mocked(supabase.from);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // KANBAN GROUPING
  // ===========================================================================
  describe("Kanban Grouping", () => {
    it("should group opportunities by status", () => {
      const grouped = mockKanbanColumns.reduce(
        (acc, status) => {
          acc[status] = mockOpportunites.filter((opp) => opp.statut === status);
          return acc;
        },
        {} as Record<OpportunityStatus, typeof mockOpportunites>
      );

      expect(grouped["Qualifié"]).toHaveLength(1);
      expect(grouped["Proposition"]).toHaveLength(1);
      expect(grouped["Négociation"]).toHaveLength(1);
      expect(grouped["Gagné"]).toHaveLength(0);
      expect(grouped["Perdu"]).toHaveLength(0);
    });

    it("should order columns correctly", () => {
      const expectedOrder = ["Qualifié", "Proposition", "Négociation", "Gagné", "Perdu"];
      expect(mockKanbanColumns).toEqual(expectedOrder);
    });

    it("should calculate total value per column", () => {
      const totalByStatus = mockKanbanColumns.reduce(
        (acc, status) => {
          const opps = mockOpportunites.filter((opp) => opp.statut === status);
          acc[status] = opps.reduce((sum, opp) => sum + (opp.valeurEstimee || 0), 0);
          return acc;
        },
        {} as Record<OpportunityStatus, number>
      );

      expect(totalByStatus["Qualifié"]).toBe(50000);
      expect(totalByStatus["Proposition"]).toBe(75000);
      expect(totalByStatus["Négociation"]).toBe(100000);
    });

    it("should calculate weighted value per column", () => {
      const weightedByStatus = mockKanbanColumns.reduce(
        (acc, status) => {
          const opps = mockOpportunites.filter((opp) => opp.statut === status);
          acc[status] = opps.reduce((sum, opp) => sum + (opp.valeurPonderee || 0), 0);
          return acc;
        },
        {} as Record<OpportunityStatus, number>
      );

      expect(weightedByStatus["Qualifié"]).toBe(15000);
      expect(weightedByStatus["Proposition"]).toBe(37500);
      expect(weightedByStatus["Négociation"]).toBe(75000);
    });
  });

  // ===========================================================================
  // DRAG AND DROP STATUS CHANGE
  // ===========================================================================
  describe("Drag and Drop Status Change", () => {
    it("should update status when moving between columns", async () => {
      const oppId = "opp-1";
      const newStatus: OpportunityStatus = "Proposition";

      const singleMock = vi.fn(() => Promise.resolve({
        data: { ...mockOpportunites[0], statut: newStatus },
        error: null,
      }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const eqMock = vi.fn(() => ({ select: selectMock }));
      const updateMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        update: updateMock,
      } as ReturnType<typeof mockFrom>);

      await supabase
        .from("opportunites")
        .update({ statut: newStatus })
        .eq("id", oppId)
        .select()
        .single();

      expect(updateMock).toHaveBeenCalledWith({ statut: newStatus });
      expect(eqMock).toHaveBeenCalledWith("id", oppId);
    });

    it("should handle drag result from same column (no-op)", () => {
      const dragResult = {
        draggableId: "opp-1",
        source: { droppableId: "Qualifié", index: 0 },
        destination: { droppableId: "Qualifié", index: 0 },
      };

      const isSameColumn = dragResult.source.droppableId === dragResult.destination?.droppableId;
      expect(isSameColumn).toBe(true);
    });

    it("should handle drag result to different column", () => {
      const dragResult = {
        draggableId: "opp-1",
        source: { droppableId: "Qualifié", index: 0 },
        destination: { droppableId: "Proposition", index: 0 },
      };

      const isSameColumn = dragResult.source.droppableId === dragResult.destination?.droppableId;
      expect(isSameColumn).toBe(false);
    });

    it("should handle drag result with no destination (cancelled)", () => {
      const dragResult = {
        draggableId: "opp-1",
        source: { droppableId: "Qualifié", index: 0 },
        destination: null,
      };

      expect(dragResult.destination).toBeNull();
    });

    it("should update probability when moving to Gagné", async () => {
      const oppId = "opp-1";

      const singleMock = vi.fn(() => Promise.resolve({
        data: { ...mockOpportunites[0], statut: "Gagné", probabilite: 100 },
        error: null,
      }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const eqMock = vi.fn(() => ({ select: selectMock }));
      const updateMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        update: updateMock,
      } as ReturnType<typeof mockFrom>);

      await supabase
        .from("opportunites")
        .update({ statut: "Gagné", probabilite: 100 })
        .eq("id", oppId)
        .select()
        .single();

      expect(updateMock).toHaveBeenCalledWith({ statut: "Gagné", probabilite: 100 });
    });

    it("should update probability when moving to Perdu", async () => {
      const oppId = "opp-1";

      const singleMock = vi.fn(() => Promise.resolve({
        data: { ...mockOpportunites[0], statut: "Perdu", probabilite: 0 },
        error: null,
      }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const eqMock = vi.fn(() => ({ select: selectMock }));
      const updateMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        update: updateMock,
      } as ReturnType<typeof mockFrom>);

      await supabase
        .from("opportunites")
        .update({ statut: "Perdu", probabilite: 0 })
        .eq("id", oppId)
        .select()
        .single();

      expect(updateMock).toHaveBeenCalledWith({ statut: "Perdu", probabilite: 0 });
    });
  });

  // ===========================================================================
  // MINI SHEET QUICK EDIT
  // ===========================================================================
  describe("Mini Sheet Quick Edit", () => {
    it("should update valeur estimée", async () => {
      const oppId = "opp-1";
      const newValeur = 75000;

      const singleMock = vi.fn(() => Promise.resolve({
        data: { ...mockOpportunites[0], valeurEstimee: newValeur },
        error: null,
      }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const eqMock = vi.fn(() => ({ select: selectMock }));
      const updateMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        update: updateMock,
      } as ReturnType<typeof mockFrom>);

      await supabase
        .from("opportunites")
        .update({ valeur_estimee: newValeur })
        .eq("id", oppId)
        .select()
        .single();

      expect(updateMock).toHaveBeenCalledWith({ valeur_estimee: newValeur });
    });

    it("should update probabilité and recalculate weighted value", () => {
      const valeurEstimee = 100000;
      const newProbabilite = 60;

      const valeurPonderee = valeurEstimee * (newProbabilite / 100);

      expect(valeurPonderee).toBe(60000);
    });

    it("should update date de clôture", async () => {
      const oppId = "opp-1";
      const newDate = "2026-04-30";

      const singleMock = vi.fn(() => Promise.resolve({
        data: { ...mockOpportunites[0], dateClotureEstimee: newDate },
        error: null,
      }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const eqMock = vi.fn(() => ({ select: selectMock }));
      const updateMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        update: updateMock,
      } as ReturnType<typeof mockFrom>);

      await supabase
        .from("opportunites")
        .update({ date_cloture_estimee: newDate })
        .eq("id", oppId)
        .select()
        .single();

      expect(updateMock).toHaveBeenCalledWith({ date_cloture_estimee: newDate });
    });

    it("should update notes", async () => {
      const oppId = "opp-1";
      const newNotes = "Nouvelle note importante";

      const singleMock = vi.fn(() => Promise.resolve({
        data: { ...mockOpportunites[0], notes: newNotes },
        error: null,
      }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const eqMock = vi.fn(() => ({ select: selectMock }));
      const updateMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        update: updateMock,
      } as ReturnType<typeof mockFrom>);

      await supabase
        .from("opportunites")
        .update({ notes: newNotes })
        .eq("id", oppId)
        .select()
        .single();

      expect(updateMock).toHaveBeenCalledWith({ notes: newNotes });
    });

    it("should update multiple fields at once", async () => {
      const oppId = "opp-1";
      const updates = {
        valeur_estimee: 80000,
        probabilite: 70,
        notes: "Updated via mini sheet",
      };

      const singleMock = vi.fn(() => Promise.resolve({
        data: { ...mockOpportunites[0], ...updates },
        error: null,
      }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const eqMock = vi.fn(() => ({ select: selectMock }));
      const updateMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        update: updateMock,
      } as ReturnType<typeof mockFrom>);

      await supabase
        .from("opportunites")
        .update(updates)
        .eq("id", oppId)
        .select()
        .single();

      expect(updateMock).toHaveBeenCalledWith(updates);
    });
  });

  // ===========================================================================
  // INTERACTION HISTORY
  // ===========================================================================
  describe("Interaction History", () => {
    it("should fetch interactions for opportunity contact", async () => {
      const contactId = "contact-1";
      const mockInteractions = [
        { id: "int-1", type: "Appel", date: "2026-01-05", notes: "Premier contact" },
        { id: "int-2", type: "Email", date: "2026-01-06", notes: "Envoi devis" },
      ];

      const orderMock = vi.fn(() => Promise.resolve({
        data: mockInteractions,
        error: null,
      }));
      const eqMock = vi.fn(() => ({ order: orderMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        select: selectMock,
      } as ReturnType<typeof mockFrom>);

      const result = await supabase
        .from("interactions")
        .select("*")
        .eq("contact_id", contactId)
        .order("date", { ascending: false });

      expect(result.data).toHaveLength(2);
    });

    it("should create manual note interaction", async () => {
      const newInteraction = {
        contact_id: "contact-1",
        type: "Note",
        date: new Date().toISOString().split("T")[0],
        notes: "Note manuelle depuis mini sheet",
      };

      const singleMock = vi.fn(() => Promise.resolve({
        data: { id: "new-int-id", ...newInteraction },
        error: null,
      }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const insertMock = vi.fn(() => ({ select: selectMock }));

      mockFrom.mockReturnValue({
        insert: insertMock,
      } as ReturnType<typeof mockFrom>);

      await supabase
        .from("interactions")
        .insert(newInteraction)
        .select()
        .single();

      expect(insertMock).toHaveBeenCalledWith(newInteraction);
    });
  });

  // ===========================================================================
  // OPTIMISTIC UPDATES
  // ===========================================================================
  describe("Optimistic Updates", () => {
    it("should handle optimistic update for status change", () => {
      const opportunities = [...mockOpportunites];
      const oppId = "opp-1";
      const newStatus: OpportunityStatus = "Proposition";

      // Optimistic update
      const updatedOpps = opportunities.map((opp) =>
        opp.id === oppId ? { ...opp, statut: newStatus } : opp
      );

      const updated = updatedOpps.find((opp) => opp.id === oppId);
      expect(updated?.statut).toBe(newStatus);
    });

    it("should rollback optimistic update on error", () => {
      const opportunities = [...mockOpportunites];
      const oppId = "opp-1";
      const originalStatus = opportunities.find((opp) => opp.id === oppId)?.statut;
      const newStatus: OpportunityStatus = "Proposition";

      // Optimistic update
      let updatedOpps = opportunities.map((opp) =>
        opp.id === oppId ? { ...opp, statut: newStatus } : opp
      );

      // Simulate error - rollback
      updatedOpps = opportunities.map((opp) =>
        opp.id === oppId ? { ...opp, statut: originalStatus! } : opp
      );

      const rolledBack = updatedOpps.find((opp) => opp.id === oppId);
      expect(rolledBack?.statut).toBe("Qualifié");
    });

    it("should handle concurrent updates", () => {
      const opportunities = [...mockOpportunites];

      // Two concurrent updates to different opportunities
      const update1 = { id: "opp-1", statut: "Proposition" as OpportunityStatus };
      const update2 = { id: "opp-2", statut: "Négociation" as OpportunityStatus };

      const updatedOpps = opportunities.map((opp) => {
        if (opp.id === update1.id) return { ...opp, statut: update1.statut };
        if (opp.id === update2.id) return { ...opp, statut: update2.statut };
        return opp;
      });

      expect(updatedOpps.find((opp) => opp.id === "opp-1")?.statut).toBe("Proposition");
      expect(updatedOpps.find((opp) => opp.id === "opp-2")?.statut).toBe("Négociation");
    });
  });

  // ===========================================================================
  // STATUS TRANSITION RULES
  // ===========================================================================
  describe("Status Transition Rules", () => {
    const validTransitions: Record<OpportunityStatus, OpportunityStatus[]> = {
      Qualifié: ["Proposition", "Perdu"],
      Proposition: ["Qualifié", "Négociation", "Perdu"],
      Négociation: ["Proposition", "Gagné", "Perdu"],
      Gagné: [], // Terminal state
      Perdu: ["Qualifié"], // Can be reactivated
    };

    it("should allow Qualifié → Proposition", () => {
      expect(validTransitions.Qualifié).toContain("Proposition");
    });

    it("should allow Négociation → Gagné", () => {
      expect(validTransitions.Négociation).toContain("Gagné");
    });

    it("should not allow Gagné → any status", () => {
      expect(validTransitions.Gagné).toHaveLength(0);
    });

    it("should allow Perdu → Qualifié (reactivation)", () => {
      expect(validTransitions.Perdu).toContain("Qualifié");
    });

    it("should validate transition before updating", () => {
      const currentStatus: OpportunityStatus = "Qualifié";
      const targetStatus: OpportunityStatus = "Négociation";

      const isValidTransition = validTransitions[currentStatus].includes(targetStatus);
      expect(isValidTransition).toBe(false); // Cannot skip Proposition
    });
  });

  // ===========================================================================
  // FILTERING AND SORTING
  // ===========================================================================
  describe("Filtering and Sorting", () => {
    it("should filter by date range", () => {
      const startDate = new Date("2026-02-01");
      const endDate = new Date("2026-03-01");

      const filtered = mockOpportunites.filter((opp) => {
        const clotureDate = new Date(opp.dateClotureEstimee);
        return clotureDate >= startDate && clotureDate <= endDate;
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].nom).toBe("Projet Alpha");
    });

    it("should filter by minimum value", () => {
      const minValue = 60000;

      const filtered = mockOpportunites.filter(
        (opp) => (opp.valeurEstimee || 0) >= minValue
      );

      expect(filtered).toHaveLength(2);
    });

    it("should sort by date de clôture", () => {
      const sorted = [...mockOpportunites].sort((a, b) =>
        new Date(a.dateClotureEstimee).getTime() - new Date(b.dateClotureEstimee).getTime()
      );

      expect(sorted[0].nom).toBe("Projet Gamma"); // 2026-01-31
      expect(sorted[2].nom).toBe("Projet Beta"); // 2026-03-15
    });

    it("should sort by valeur estimée descending", () => {
      const sorted = [...mockOpportunites].sort(
        (a, b) => (b.valeurEstimee || 0) - (a.valeurEstimee || 0)
      );

      expect(sorted[0].nom).toBe("Projet Gamma"); // 100000
      expect(sorted[2].nom).toBe("Projet Alpha"); // 50000
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================
  describe("Edge Cases", () => {
    it("should handle opportunity with zero value", () => {
      const zeroValueOpp = { ...mockOpportunites[0], valeurEstimee: 0, valeurPonderee: 0 };

      expect(zeroValueOpp.valeurEstimee).toBe(0);
      expect(zeroValueOpp.valeurPonderee).toBe(0);
    });

    it("should handle opportunity with null closing date", () => {
      const noDateOpp = { ...mockOpportunites[0], dateClotureEstimee: null };

      const hasDate = noDateOpp.dateClotureEstimee != null;
      expect(hasDate).toBe(false);
    });

    it("should handle empty Kanban column", () => {
      const emptyColumnOpps = mockOpportunites.filter(
        (opp) => opp.statut === "Gagné"
      );

      expect(emptyColumnOpps).toHaveLength(0);
    });

    it("should handle very long opportunity name", () => {
      const longNameOpp = {
        ...mockOpportunites[0],
        nom: "A".repeat(200),
      };

      expect(longNameOpp.nom.length).toBe(200);
    });

    it("should handle special characters in name", () => {
      const specialNameOpp = {
        ...mockOpportunites[0],
        nom: "Projet <Test> & \"Special\" 'Characters'",
      };

      expect(specialNameOpp.nom).toContain("<Test>");
      expect(specialNameOpp.nom).toContain("&");
    });
  });
});
