"use client";

import ExcelJS from "exceljs";
import Papa from "papaparse";

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  format?: (value: unknown, row: T) => string | number;
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns: ExportColumn<T>[]
): void {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Transform data according to columns
  const transformedData = data.map((row) => {
    const newRow: Record<string, string | number> = {};
    columns.forEach((col) => {
      const key = col.key as string;
      const value = getNestedValue(row, key);
      newRow[col.header] = col.format ? col.format(value, row) : formatValue(value);
    });
    return newRow;
  });

  // Generate CSV
  const csv = Papa.unparse(transformedData, {
    quotes: true,
    delimiter: ";", // French Excel compatibility
  });

  // Add BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });

  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to Excel file
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns: ExportColumn<T>[],
  sheetName: string = "Données"
): Promise<void> {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Transform data according to columns
  const transformedData = data.map((row) => {
    const newRow: Record<string, string | number> = {};
    columns.forEach((col) => {
      const key = col.key as string;
      const value = getNestedValue(row, key);
      newRow[col.header] = col.format ? col.format(value, row) : formatValue(value);
    });
    return newRow;
  });

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Set column headers with auto-width
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.header,
    width: Math.max(
      col.header.length,
      ...transformedData.map((row) => String(row[col.header] || "").length)
    ) + 2,
  }));

  // Add data rows
  transformedData.forEach((row) => {
    worksheet.addRow(row);
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };

  // Generate Excel file
  const excelBuffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadBlob(blob, `${filename}.xlsx`);
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Format value for export
 */
function formatValue(value: unknown): string | number {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value instanceof Date) {
    return value.toLocaleDateString("fr-FR");
  }
  return String(value);
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// Pre-configured export columns for entities
// ============================================

import type { Client, Projet, Opportunite, Facture } from "@/types";

export const clientExportColumns: ExportColumn<Client>[] = [
  { key: "nom", header: "Nom" },
  { key: "email", header: "Email" },
  { key: "telephone", header: "Téléphone" },
  { key: "adresse", header: "Adresse" },
  { key: "statut", header: "Statut" },
  { key: "santeClient", header: "Santé Client" },
  {
    key: "caTotal",
    header: "CA Total (€)",
    format: (value) => (typeof value === "number" ? value : 0),
  },
  { key: "notes", header: "Notes" },
];

export const projetExportColumns: ExportColumn<Projet>[] = [
  { key: "nom", header: "Nom du Projet" },
  { key: "statut", header: "Statut" },
  { key: "dateDebut", header: "Date Début" },
  { key: "dateFinPrevue", header: "Date Fin Prévue" },
  { key: "dateFinReelle", header: "Date Fin Réelle" },
  {
    key: "pourcentageComplete",
    header: "% Terminé",
    format: (value) => (typeof value === "number" ? `${Math.round(value * 100)}%` : "0%"),
  },
  {
    key: "montantFacture",
    header: "Montant Facturé (€)",
    format: (value) => (typeof value === "number" ? value : 0),
  },
  {
    key: "budgetTempsConsomme",
    header: "Budget Temps Consommé (%)",
    format: (value) => (typeof value === "number" ? `${Math.round(value * 100)}%` : "0%"),
  },
];

export const opportuniteExportColumns: ExportColumn<Opportunite>[] = [
  { key: "nom", header: "Nom" },
  { key: "statut", header: "Statut" },
  {
    key: "valeurEstimee",
    header: "Valeur Estimée (€)",
    format: (value) => (typeof value === "number" ? value : 0),
  },
  {
    key: "probabilite",
    header: "Probabilité (%)",
    format: (value) => (typeof value === "number" ? `${value}%` : "0%"),
  },
  {
    key: "valeurPonderee",
    header: "Valeur Pondérée (€)",
    format: (value) => (typeof value === "number" ? value : 0),
  },
  { key: "dateCloturePrevu", header: "Date Clôture Prévue" },
  { key: "source", header: "Source" },
  { key: "notes", header: "Notes" },
];

export const factureExportColumns: ExportColumn<Facture>[] = [
  { key: "numeroFacture", header: "N° Facture" },
  { key: "statut", header: "Statut" },
  { key: "dateEmission", header: "Date Émission" },
  { key: "dateEcheance", header: "Date Échéance" },
  {
    key: "montantHT",
    header: "Montant HT (€)",
    format: (value) => (typeof value === "number" ? value : 0),
  },
  {
    key: "montantTTC",
    header: "Montant TTC (€)",
    format: (value) => (typeof value === "number" ? value : 0),
  },
  {
    key: "niveauRelance",
    header: "Niveau Relance",
    format: (value) => (typeof value === "number" && value > 0 ? `N${value}` : "-"),
  },
  { key: "datePaiement", header: "Date Paiement" },
];
