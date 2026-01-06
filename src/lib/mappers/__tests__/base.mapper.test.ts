// CRM Axivity - Base Mapper Tests
import { describe, it, expect } from "vitest";
import {
  parseString,
  parseOptionalString,
  parseNumber,
  parseOptionalNumber,
  parseBoolean,
  parseDate,
  parseLinkedIds,
  parseLinkedId,
  parseEnum,
} from "../base.mapper";

describe("base.mapper", () => {
  describe("parseString", () => {
    it("should return string for valid string input", () => {
      expect(parseString("hello")).toBe("hello");
    });

    it("should return empty string for null", () => {
      expect(parseString(null)).toBe("");
    });

    it("should return empty string for undefined", () => {
      expect(parseString(undefined)).toBe("");
    });

    it("should use custom default value", () => {
      expect(parseString(null, "default")).toBe("default");
    });

    it("should convert number to string", () => {
      expect(parseString(123)).toBe("123");
    });

    it("should convert boolean to string", () => {
      expect(parseString(true)).toBe("true");
    });
  });

  describe("parseOptionalString", () => {
    it("should return string for valid string input", () => {
      expect(parseOptionalString("hello")).toBe("hello");
    });

    it("should return undefined for null", () => {
      expect(parseOptionalString(null)).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(parseOptionalString(undefined)).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      expect(parseOptionalString("")).toBeUndefined();
    });

    it("should convert number to string", () => {
      expect(parseOptionalString(42)).toBe("42");
    });
  });

  describe("parseNumber", () => {
    it("should return number for valid number input", () => {
      expect(parseNumber(42)).toBe(42);
    });

    it("should return 0 for null", () => {
      expect(parseNumber(null)).toBe(0);
    });

    it("should return 0 for undefined", () => {
      expect(parseNumber(undefined)).toBe(0);
    });

    it("should use custom default value", () => {
      expect(parseNumber(null, 10)).toBe(10);
    });

    it("should parse string number", () => {
      expect(parseNumber("123")).toBe(123);
    });

    it("should parse string float", () => {
      expect(parseNumber("123.45")).toBe(123.45);
    });

    it("should return default for invalid string", () => {
      expect(parseNumber("not a number")).toBe(0);
    });

    it("should return default for NaN", () => {
      expect(parseNumber(NaN, 5)).toBe(5);
    });

    it("should handle negative numbers", () => {
      expect(parseNumber(-42)).toBe(-42);
    });
  });

  describe("parseOptionalNumber", () => {
    it("should return number for valid number input", () => {
      expect(parseOptionalNumber(42)).toBe(42);
    });

    it("should return undefined for null", () => {
      expect(parseOptionalNumber(null)).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(parseOptionalNumber(undefined)).toBeUndefined();
    });

    it("should parse string number", () => {
      expect(parseOptionalNumber("123")).toBe(123);
    });

    it("should return undefined for invalid string", () => {
      expect(parseOptionalNumber("not a number")).toBeUndefined();
    });

    it("should handle zero", () => {
      expect(parseOptionalNumber(0)).toBe(0);
    });
  });

  describe("parseBoolean", () => {
    it("should return true for boolean true", () => {
      expect(parseBoolean(true)).toBe(true);
    });

    it("should return false for boolean false", () => {
      expect(parseBoolean(false)).toBe(false);
    });

    it("should return false for null", () => {
      expect(parseBoolean(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(parseBoolean(undefined)).toBe(false);
    });

    it("should use custom default value", () => {
      expect(parseBoolean(null, true)).toBe(true);
    });

    it("should parse string 'true'", () => {
      expect(parseBoolean("true")).toBe(true);
    });

    it("should parse string 'TRUE' (case insensitive)", () => {
      expect(parseBoolean("TRUE")).toBe(true);
    });

    it("should return false for string 'false'", () => {
      expect(parseBoolean("false")).toBe(false);
    });

    it("should return true for truthy number", () => {
      expect(parseBoolean(1)).toBe(true);
    });

    it("should return false for zero", () => {
      expect(parseBoolean(0)).toBe(false);
    });
  });

  describe("parseDate", () => {
    it("should return ISO date string as-is", () => {
      expect(parseDate("2024-01-15")).toBe("2024-01-15");
    });

    it("should return ISO datetime string as-is", () => {
      expect(parseDate("2024-01-15T10:30:00Z")).toBe("2024-01-15T10:30:00Z");
    });

    it("should return undefined for null", () => {
      expect(parseDate(null)).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(parseDate(undefined)).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      expect(parseDate("")).toBeUndefined();
    });

    it("should convert number to string", () => {
      expect(parseDate(20240115)).toBe("20240115");
    });
  });

  describe("parseLinkedIds", () => {
    it("should return array for array input", () => {
      expect(parseLinkedIds(["id1", "id2"])).toEqual(["id1", "id2"]);
    });

    it("should return single-element array for string input", () => {
      expect(parseLinkedIds("id1")).toEqual(["id1"]);
    });

    it("should return undefined for null", () => {
      expect(parseLinkedIds(null)).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(parseLinkedIds(undefined)).toBeUndefined();
    });

    it("should filter empty strings from array", () => {
      expect(parseLinkedIds(["id1", "", "id2"])).toEqual(["id1", "id2"]);
    });

    it("should convert numbers in array to strings", () => {
      expect(parseLinkedIds([1, 2, 3])).toEqual(["1", "2", "3"]);
    });

    it("should return undefined for empty string", () => {
      expect(parseLinkedIds("")).toBeUndefined();
    });
  });

  describe("parseLinkedId", () => {
    it("should return string for valid string input", () => {
      expect(parseLinkedId("abc-123")).toBe("abc-123");
    });

    it("should return undefined for null", () => {
      expect(parseLinkedId(null)).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(parseLinkedId(undefined)).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      expect(parseLinkedId("")).toBeUndefined();
    });

    it("should convert number to string", () => {
      expect(parseLinkedId(123)).toBe("123");
    });
  });

  describe("parseEnum", () => {
    const validStatuses = ["Active", "Inactive", "Pending"] as const;

    it("should return value if it is in valid values", () => {
      expect(parseEnum("Active", validStatuses)).toBe("Active");
    });

    it("should return undefined for null without default", () => {
      expect(parseEnum(null, validStatuses)).toBeUndefined();
    });

    it("should return undefined for undefined without default", () => {
      expect(parseEnum(undefined, validStatuses)).toBeUndefined();
    });

    it("should return default value for null", () => {
      expect(parseEnum(null, validStatuses, "Pending")).toBe("Pending");
    });

    it("should return default value for invalid enum value", () => {
      expect(parseEnum("Unknown", validStatuses, "Pending")).toBe("Pending");
    });

    it("should return undefined for invalid value without default", () => {
      expect(parseEnum("Unknown", validStatuses)).toBeUndefined();
    });

    it("should handle case-sensitive comparison", () => {
      expect(parseEnum("active", validStatuses)).toBeUndefined();
    });

    it("should convert number to string and match", () => {
      const numericStatuses = ["1", "2", "3"] as const;
      expect(parseEnum(2, numericStatuses)).toBe("2");
    });
  });
});
