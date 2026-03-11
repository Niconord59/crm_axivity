// CRM Axivity - Email Template Mapper Tests
import { describe, it, expect } from "vitest";
import {
  mapToEmailTemplate,
  mapEmailTemplateToInsert,
  mapEmailTemplateToUpdate,
} from "../email-template.mapper";

describe("email-template.mapper", () => {
  describe("mapToEmailTemplate", () => {
    it("should map complete Supabase record to EmailTemplate", () => {
      const record = {
        id: "tpl-123",
        nom: "Relance J+7",
        objet: "Suite à notre échange",
        contenu: "Bonjour {{prenom}}, ...",
        variables: ["prenom", "entreprise"],
        created_by: "user-1",
        created_at: "2026-01-15T10:00:00Z",
      };

      const result = mapToEmailTemplate(record);

      expect(result).toEqual({
        id: "tpl-123",
        nom: "Relance J+7",
        objet: "Suite à notre échange",
        contenu: "Bonjour {{prenom}}, ...",
        variables: ["prenom", "entreprise"],
        createdBy: "user-1",
        createdTime: "2026-01-15T10:00:00Z",
      });
    });

    it("should handle missing optional fields", () => {
      const record = {
        id: "tpl-456",
        nom: "Template simple",
        objet: "Objet",
        contenu: "Contenu",
        variables: null,
        created_by: null,
        created_at: null,
      };

      const result = mapToEmailTemplate(record);

      expect(result.variables).toEqual([]);
      expect(result.createdBy).toBeUndefined();
      expect(result.createdTime).toBeUndefined();
    });

    it("should handle non-array variables", () => {
      const record = {
        id: "tpl-789",
        nom: "Test",
        objet: "Objet",
        contenu: "Contenu",
        variables: "not-an-array",
      };

      const result = mapToEmailTemplate(record);
      expect(result.variables).toEqual([]);
    });
  });

  describe("mapEmailTemplateToInsert", () => {
    it("should map EmailTemplate to insert data", () => {
      const data = {
        nom: "Nouveau template",
        objet: "Sujet",
        contenu: "Corps du message",
        variables: ["nom", "date"],
      };

      const result = mapEmailTemplateToInsert(data);

      expect(result).toEqual({
        nom: "Nouveau template",
        objet: "Sujet",
        contenu: "Corps du message",
        variables: ["nom", "date"],
      });
    });

    it("should default variables to empty array", () => {
      const result = mapEmailTemplateToInsert({ nom: "Test" });
      expect(result.variables).toEqual([]);
    });
  });

  describe("mapEmailTemplateToUpdate", () => {
    it("should include only defined fields", () => {
      const result = mapEmailTemplateToUpdate({ nom: "Updated" });

      expect(result).toEqual({ nom: "Updated" });
      expect(result.objet).toBeUndefined();
    });

    it("should include all fields when provided", () => {
      const result = mapEmailTemplateToUpdate({
        nom: "Updated",
        objet: "New subject",
        contenu: "New content",
        variables: ["a"],
      });

      expect(result).toEqual({
        nom: "Updated",
        objet: "New subject",
        contenu: "New content",
        variables: ["a"],
      });
    });

    it("should return empty object when no fields provided", () => {
      const result = mapEmailTemplateToUpdate({});
      expect(result).toEqual({});
    });
  });
});
