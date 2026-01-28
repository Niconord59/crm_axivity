import { describe, it, expect } from "vitest";
import {
  opportuniteContactSchema,
  opportuniteContactDefaultValues,
  addContactToOpportuniteSchema,
  addContactToOpportuniteDefaultValues,
  CONTACT_ROLES,
} from "../opportunite-contact";

describe("opportuniteContactSchema", () => {
  describe("opportuniteId", () => {
    it("should accept valid UUID", () => {
      const result = opportuniteContactSchema.safeParse({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
        contactId: "550e8400-e29b-41d4-a716-446655440001",
        role: "Decideur",
        isPrimary: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = opportuniteContactSchema.safeParse({
        opportuniteId: "invalid-uuid",
        contactId: "550e8400-e29b-41d4-a716-446655440001",
        role: "Decideur",
        isPrimary: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("ID opportunité invalide");
      }
    });

    it("should reject empty string", () => {
      const result = opportuniteContactSchema.safeParse({
        opportuniteId: "",
        contactId: "550e8400-e29b-41d4-a716-446655440001",
        role: "Decideur",
        isPrimary: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("contactId", () => {
    it("should accept valid UUID", () => {
      const result = opportuniteContactSchema.safeParse({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
        contactId: "550e8400-e29b-41d4-a716-446655440001",
        role: "Participant",
        isPrimary: false,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = opportuniteContactSchema.safeParse({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
        contactId: "not-a-uuid",
        role: "Participant",
        isPrimary: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("ID contact invalide");
      }
    });
  });

  describe("role", () => {
    it.each(CONTACT_ROLES)("should accept valid role: %s", (role) => {
      const result = opportuniteContactSchema.safeParse({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
        contactId: "550e8400-e29b-41d4-a716-446655440001",
        role,
        isPrimary: false,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid role", () => {
      const result = opportuniteContactSchema.safeParse({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
        contactId: "550e8400-e29b-41d4-a716-446655440001",
        role: "InvalidRole",
        isPrimary: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Veuillez sélectionner un rôle valide"
        );
      }
    });
  });

  describe("isPrimary", () => {
    it("should accept true", () => {
      const result = opportuniteContactSchema.safeParse({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
        contactId: "550e8400-e29b-41d4-a716-446655440001",
        role: "Decideur",
        isPrimary: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPrimary).toBe(true);
      }
    });

    it("should accept false", () => {
      const result = opportuniteContactSchema.safeParse({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
        contactId: "550e8400-e29b-41d4-a716-446655440001",
        role: "Participant",
        isPrimary: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPrimary).toBe(false);
      }
    });

    it("should default to false when not provided", () => {
      const result = opportuniteContactSchema.safeParse({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
        contactId: "550e8400-e29b-41d4-a716-446655440001",
        role: "Participant",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPrimary).toBe(false);
      }
    });
  });
});

describe("opportuniteContactDefaultValues", () => {
  it("should have correct default values", () => {
    expect(opportuniteContactDefaultValues).toEqual({
      opportuniteId: undefined,
      contactId: undefined,
      role: "Participant",
      isPrimary: false,
    });
  });
});

describe("addContactToOpportuniteSchema", () => {
  it("should accept valid data without opportuniteId", () => {
    const result = addContactToOpportuniteSchema.safeParse({
      contactId: "550e8400-e29b-41d4-a716-446655440001",
      role: "Influenceur",
      isPrimary: false,
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing contactId", () => {
    const result = addContactToOpportuniteSchema.safeParse({
      role: "Influenceur",
      isPrimary: false,
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid contactId", () => {
    const result = addContactToOpportuniteSchema.safeParse({
      contactId: "invalid",
      role: "Influenceur",
      isPrimary: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("ID contact invalide");
    }
  });
});

describe("addContactToOpportuniteDefaultValues", () => {
  it("should have correct default values (without opportuniteId)", () => {
    expect(addContactToOpportuniteDefaultValues).toEqual({
      contactId: undefined,
      role: "Participant",
      isPrimary: false,
    });
    // Verify opportuniteId is NOT in the defaults (it's omitted)
    expect(addContactToOpportuniteDefaultValues).not.toHaveProperty("opportuniteId");
  });
});

describe("CONTACT_ROLES", () => {
  it("should export all contact roles", () => {
    expect(CONTACT_ROLES).toEqual([
      "Decideur",
      "Influenceur",
      "Utilisateur",
      "Participant",
    ]);
  });
});
