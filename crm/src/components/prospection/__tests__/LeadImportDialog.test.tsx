/**
 * PRO-H10 — validation MIME + size for CSV import.
 *
 * The drag-drop handler previously checked only the file extension, and the
 * file-picker handler had zero guards. A > 5 MB file would lock the UI thread
 * via PapaParse. These tests pin the `isValidCsv` contract — the same guard
 * both handlers now call.
 */
import { describe, it, expect, vi } from "vitest";

// `LeadImportDialog` transitively imports @/lib/supabase, which throws at
// load time if the public env vars are missing. Stub the module so the pure
// isValidCsv helper is importable in isolation.
vi.mock("@/hooks/use-import-leads", () => ({
  useImportLeads: () => ({
    step: "upload",
    columns: [],
    preview: [],
    duplicates: [],
    isImporting: false,
    progress: 0,
    totalLeads: 0,
    parseFile: vi.fn(),
    setMapping: vi.fn(),
    importLeads: vi.fn(),
    goBack: vi.fn(),
    reset: vi.fn(),
    enableEnrichment: false,
    setEnableEnrichment: vi.fn(),
    enrichmentProgress: 0,
  }),
}));

import { isValidCsv, MAX_CSV_BYTES } from "../LeadImportDialog";

function makeFile(name: string, sizeBytes: number): File {
  // Build a real File object — `size` is derived from the Blob bytes, and
  // the `name` field is what `isValidCsv` inspects.
  const blob = new Blob([new Uint8Array(sizeBytes)], { type: "text/csv" });
  return new File([blob], name, { type: "text/csv" });
}

describe("isValidCsv (PRO-H10)", () => {
  it("accepts a small .csv file", () => {
    expect(isValidCsv(makeFile("leads.csv", 1024))).toBe(true);
  });

  it("accepts a .CSV file with uppercase extension (case-insensitive)", () => {
    expect(isValidCsv(makeFile("LEADS.CSV", 1024))).toBe(true);
  });

  it("accepts exactly MAX_CSV_BYTES", () => {
    expect(isValidCsv(makeFile("edge.csv", MAX_CSV_BYTES))).toBe(true);
  });

  it("rejects a file larger than 5 MB", () => {
    expect(isValidCsv(makeFile("big.csv", MAX_CSV_BYTES + 1))).toBe(false);
  });

  it("rejects an empty file", () => {
    expect(isValidCsv(makeFile("empty.csv", 0))).toBe(false);
  });

  it("rejects .xlsx", () => {
    const xlsx = new File([new Uint8Array(1024)], "leads.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    expect(isValidCsv(xlsx)).toBe(false);
  });

  it("rejects a file with a non-csv extension even if MIME claims text/csv", () => {
    // A spoofed MIME type should not win against the extension check —
    // MIME is user-supplied and not a security boundary.
    const spoofed = new File([new Uint8Array(1024)], "malicious.sh", {
      type: "text/csv",
    });
    expect(isValidCsv(spoofed)).toBe(false);
  });

  it("rejects a file with no extension", () => {
    expect(isValidCsv(makeFile("README", 1024))).toBe(false);
  });
});
