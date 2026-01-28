// CRM Axivity - OpportuniteContact Mapper Tests
import { describe, it, expect } from "vitest";
import {
  mapToOpportuniteContact,
  mapOpportuniteContactToInsert,
  mapOpportuniteContactToUpdate,
} from "../opportunite-contact.mapper";

describe("opportunite-contact.mapper", () => {
  describe("mapToOpportuniteContact", () => {
    it("should map complete Supabase record to OpportuniteContact", () => {
      const record = {
        id: "oc-123",
        opportunite_id: "opp-456",
        contact_id: "contact-789",
        role: "Decideur",
        is_primary: true,
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-16T14:00:00Z",
      };

      const result = mapToOpportuniteContact(record);

      expect(result).toEqual({
        id: "oc-123",
        opportuniteId: "opp-456",
        contactId: "contact-789",
        role: "Decideur",
        isPrimary: true,
        createdTime: "2024-01-15T10:30:00Z",
        updatedAt: "2024-01-16T14:00:00Z",
        contact: undefined,
        opportunite: undefined,
      });
    });

    it("should handle minimal record with required fields only", () => {
      const record = {
        id: "oc-min",
        opportunite_id: "opp-1",
        contact_id: "contact-1",
      };

      const result = mapToOpportuniteContact(record);

      expect(result.id).toBe("oc-min");
      expect(result.opportuniteId).toBe("opp-1");
      expect(result.contactId).toBe("contact-1");
      expect(result.role).toBe("Participant"); // Default value
      expect(result.isPrimary).toBe(false); // Default value
      expect(result.createdTime).toBeUndefined();
      expect(result.updatedAt).toBeUndefined();
    });

    it("should accept all valid contact roles", () => {
      const validRoles = ["Decideur", "Influenceur", "Utilisateur", "Participant"];

      validRoles.forEach((role) => {
        const record = {
          id: "oc",
          opportunite_id: "opp",
          contact_id: "contact",
          role,
        };
        const result = mapToOpportuniteContact(record);
        expect(result.role).toBe(role);
      });
    });

    it("should use default role for invalid enum value", () => {
      const record = {
        id: "oc",
        opportunite_id: "opp",
        contact_id: "contact",
        role: "InvalidRole",
      };

      const result = mapToOpportuniteContact(record);

      expect(result.role).toBe("Participant");
    });

    it("should handle is_primary as false explicitly", () => {
      const record = {
        id: "oc",
        opportunite_id: "opp",
        contact_id: "contact",
        is_primary: false,
      };

      const result = mapToOpportuniteContact(record);

      expect(result.isPrimary).toBe(false);
    });

    it("should handle is_primary as true", () => {
      const record = {
        id: "oc",
        opportunite_id: "opp",
        contact_id: "contact",
        is_primary: true,
      };

      const result = mapToOpportuniteContact(record);

      expect(result.isPrimary).toBe(true);
    });

    it("should handle null values gracefully", () => {
      const record = {
        id: "oc",
        opportunite_id: "opp",
        contact_id: "contact",
        role: null,
        is_primary: null,
        created_at: null,
        updated_at: null,
      };

      const result = mapToOpportuniteContact(record);

      expect(result.role).toBe("Participant");
      expect(result.isPrimary).toBe(false);
      expect(result.createdTime).toBeUndefined();
      expect(result.updatedAt).toBeUndefined();
    });
  });

  describe("mapOpportuniteContactToInsert", () => {
    it("should map complete data to Supabase insert format", () => {
      const data = {
        opportuniteId: "opp-123",
        contactId: "contact-456",
        role: "Decideur" as const,
        isPrimary: true,
      };

      const result = mapOpportuniteContactToInsert(data);

      expect(result).toEqual({
        opportunite_id: "opp-123",
        contact_id: "contact-456",
        role: "Decideur",
        is_primary: true,
      });
    });

    it("should use default isPrimary when not provided", () => {
      const data = {
        opportuniteId: "opp-123",
        contactId: "contact-456",
        role: "Influenceur" as const,
      };

      const result = mapOpportuniteContactToInsert(data);

      expect(result.is_primary).toBe(false);
    });

    it("should handle all valid roles in insert", () => {
      const roles = ["Decideur", "Influenceur", "Utilisateur", "Participant"] as const;

      roles.forEach((role) => {
        const data = {
          opportuniteId: "opp",
          contactId: "contact",
          role,
        };
        const result = mapOpportuniteContactToInsert(data);
        expect(result.role).toBe(role);
      });
    });

    it("should handle isPrimary explicitly set to false", () => {
      const data = {
        opportuniteId: "opp",
        contactId: "contact",
        role: "Participant" as const,
        isPrimary: false,
      };

      const result = mapOpportuniteContactToInsert(data);

      expect(result.is_primary).toBe(false);
    });
  });

  describe("mapOpportuniteContactToUpdate", () => {
    it("should only include defined fields", () => {
      const updateData = {
        role: "Decideur" as const,
      };

      const result = mapOpportuniteContactToUpdate(updateData);

      expect(result).toHaveProperty("role", "Decideur");
      expect(result).toHaveProperty("updated_at");
      expect(result.is_primary).toBeUndefined();
    });

    it("should include updated_at timestamp", () => {
      const beforeUpdate = new Date().toISOString();
      const result = mapOpportuniteContactToUpdate({ role: "Influenceur" });
      const afterUpdate = new Date().toISOString();

      expect(result.updated_at).toBeDefined();
      expect(result.updated_at! >= beforeUpdate).toBe(true);
      expect(result.updated_at! <= afterUpdate).toBe(true);
    });

    it("should map all fields when provided", () => {
      const updateData = {
        role: "Utilisateur" as const,
        isPrimary: true,
      };

      const result = mapOpportuniteContactToUpdate(updateData);

      expect(result.role).toBe("Utilisateur");
      expect(result.is_primary).toBe(true);
      expect(result.updated_at).toBeDefined();
    });

    it("should handle isPrimary update to false", () => {
      const updateData = {
        isPrimary: false,
      };

      const result = mapOpportuniteContactToUpdate(updateData);

      expect(result.is_primary).toBe(false);
      expect(result.role).toBeUndefined();
    });

    it("should handle isPrimary update to true", () => {
      const updateData = {
        isPrimary: true,
      };

      const result = mapOpportuniteContactToUpdate(updateData);

      expect(result.is_primary).toBe(true);
    });

    it("should return only updated_at for empty input", () => {
      const result = mapOpportuniteContactToUpdate({});

      expect(result).toHaveProperty("updated_at");
      expect(Object.keys(result)).toHaveLength(1);
    });

    it("should handle role change to Participant", () => {
      const updateData = {
        role: "Participant" as const,
      };

      const result = mapOpportuniteContactToUpdate(updateData);

      expect(result.role).toBe("Participant");
    });
  });
});
