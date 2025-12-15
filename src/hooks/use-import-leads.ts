"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { airtable, AIRTABLE_TABLES } from "@/lib/airtable";
import type { ProspectSource } from "@/types";

// Field mapping for CSV import
export interface ColumnMapping {
  entreprise: string;
  nom: string;
  email: string;
  prenom?: string;
  telephone?: string;
  source?: string;
  notes?: string;
}

// Parsed lead from CSV
export interface ParsedLead {
  entreprise: string;
  nom: string;
  email: string;
  prenom?: string;
  telephone?: string;
  sourceLead?: ProspectSource;
  notesProspection?: string;
}

// Import result for each lead
export interface ImportResult {
  success: boolean;
  lead: ParsedLead;
  action: "created" | "updated" | "error";
  message?: string;
}

// Import summary
export interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  errors: number;
  results: ImportResult[];
}

// Hook state
interface ImportState {
  step: 1 | 2 | 3;
  file: File | null;
  rawData: Record<string, string>[];
  columns: string[];
  mapping: ColumnMapping | null;
  preview: ParsedLead[];
  duplicates: string[];
  isImporting: boolean;
  progress: number;
  summary: ImportSummary | null;
}

const initialState: ImportState = {
  step: 1,
  file: null,
  rawData: [],
  columns: [],
  mapping: null,
  preview: [],
  duplicates: [],
  isImporting: false,
  progress: 0,
  summary: null,
};

// Valid sources for mapping
const VALID_SOURCES: ProspectSource[] = [
  "LinkedIn",
  "Site web",
  "Salon",
  "Recommandation",
  "Achat liste",
  "Autre",
];

export function useImportLeads() {
  const [state, setState] = useState<ImportState>(initialState);

  // Reset state
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  // Parse CSV file
  const parseFile = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        reject(new Error("Les fichiers Excel ne sont pas encore supportés. Veuillez exporter en CSV."));
        return;
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: (results) => {
          const data = results.data as Record<string, string>[];
          const columns = results.meta.fields || [];

          if (data.length === 0) {
            reject(new Error("Le fichier est vide"));
            return;
          }

          setState((prev) => ({
            ...prev,
            step: 2,
            file,
            rawData: data,
            columns,
          }));

          resolve();
        },
        error: (error) => {
          reject(new Error(`Erreur de parsing: ${error.message}`));
        },
      });
    });
  }, []);

  // Set column mapping and generate preview
  const setMapping = useCallback(
    async (mapping: ColumnMapping) => {
      const preview: ParsedLead[] = [];

      for (const row of state.rawData.slice(0, 5)) {
        const lead: ParsedLead = {
          entreprise: row[mapping.entreprise]?.trim() || "",
          nom: row[mapping.nom]?.trim() || "",
          email: row[mapping.email]?.trim().toLowerCase() || "",
          prenom: mapping.prenom ? row[mapping.prenom]?.trim() : undefined,
          telephone: mapping.telephone ? row[mapping.telephone]?.trim() : undefined,
          notesProspection: mapping.notes ? row[mapping.notes]?.trim() : undefined,
        };

        // Parse source if mapped
        if (mapping.source && row[mapping.source]) {
          const sourceValue = row[mapping.source].trim();
          const matchedSource = VALID_SOURCES.find(
            (s) => s.toLowerCase() === sourceValue.toLowerCase()
          );
          lead.sourceLead = matchedSource || "Autre";
        } else {
          lead.sourceLead = "Autre";
        }

        preview.push(lead);
      }

      // Check for duplicates (existing emails)
      const emails = state.rawData
        .map((row) => row[mapping.email]?.trim().toLowerCase())
        .filter(Boolean);

      let duplicates: string[] = [];
      try {
        const existingContacts = await airtable.getRecords<{ Email?: string }>(
          AIRTABLE_TABLES.CONTACTS,
          {
            fields: ["Email"],
          }
        );

        const existingEmails = new Set(
          existingContacts
            .map((c) => c.fields.Email?.toLowerCase())
            .filter(Boolean)
        );

        duplicates = emails.filter((email) => existingEmails.has(email));
      } catch {
        // Ignore error, just don't show duplicates
      }

      setState((prev) => ({
        ...prev,
        step: 3,
        mapping,
        preview,
        duplicates,
      }));
    },
    [state.rawData]
  );

  // Import leads to Airtable
  const importLeads = useCallback(async (): Promise<ImportSummary> => {
    if (!state.mapping) {
      throw new Error("Mapping non défini");
    }

    setState((prev) => ({ ...prev, isImporting: true, progress: 0 }));

    const results: ImportResult[] = [];
    const mapping = state.mapping;
    const total = state.rawData.length;
    let created = 0;
    let updated = 0;
    let errors = 0;

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < state.rawData.length; i += batchSize) {
      const batch = state.rawData.slice(i, i + batchSize);

      for (const row of batch) {
        const lead: ParsedLead = {
          entreprise: row[mapping.entreprise]?.trim() || "",
          nom: row[mapping.nom]?.trim() || "",
          email: row[mapping.email]?.trim().toLowerCase() || "",
          prenom: mapping.prenom ? row[mapping.prenom]?.trim() : undefined,
          telephone: mapping.telephone ? row[mapping.telephone]?.trim() : undefined,
          notesProspection: mapping.notes ? row[mapping.notes]?.trim() : undefined,
        };

        // Parse source
        if (mapping.source && row[mapping.source]) {
          const sourceValue = row[mapping.source].trim();
          const matchedSource = VALID_SOURCES.find(
            (s) => s.toLowerCase() === sourceValue.toLowerCase()
          );
          lead.sourceLead = matchedSource || "Autre";
        } else {
          lead.sourceLead = "Autre";
        }

        // Skip if required fields are missing
        if (!lead.entreprise || !lead.nom || !lead.email) {
          results.push({
            success: false,
            lead,
            action: "error",
            message: "Champs obligatoires manquants",
          });
          errors++;
          continue;
        }

        try {
          // Check if contact exists
          const existingContacts = await airtable.getRecords<{
            Email?: string;
            "Statut Prospection"?: string;
          }>(AIRTABLE_TABLES.CONTACTS, {
            filterByFormula: `LOWER({Email}) = '${lead.email.toLowerCase()}'`,
            maxRecords: 1,
          });

          if (existingContacts.length > 0) {
            // Update existing contact
            const contactId = existingContacts[0].id;
            await airtable.updateRecord(AIRTABLE_TABLES.CONTACTS, contactId, {
              "Nom": lead.nom,
              "Prénom": lead.prenom,
              "Téléphone": lead.telephone,
              "Notes Prospection": lead.notesProspection,
              "Source Lead": lead.sourceLead,
              "Statut Prospection":
                existingContacts[0].fields["Statut Prospection"] || "À appeler",
            });

            results.push({
              success: true,
              lead,
              action: "updated",
            });
            updated++;
          } else {
            // Find or create client
            let clientId: string;
            const existingClients = await airtable.getRecords<{
              "Nom du Client"?: string;
            }>(AIRTABLE_TABLES.CLIENTS, {
              filterByFormula: `{Nom du Client} = '${lead.entreprise}'`,
              maxRecords: 1,
            });

            if (existingClients.length > 0) {
              clientId = existingClients[0].id;
            } else {
              const newClient = await airtable.createRecord(
                AIRTABLE_TABLES.CLIENTS,
                {
                  "Nom du Client": lead.entreprise,
                  Statut: "Prospect",
                }
              );
              clientId = newClient.id;
            }

            // Create contact
            await airtable.createRecord(AIRTABLE_TABLES.CONTACTS, {
              "Nom": lead.nom,
              "Prénom": lead.prenom,
              "Email": lead.email,
              "Téléphone": lead.telephone,
              "Client": [clientId],
              "Statut Prospection": "À appeler",
              "Source Lead": lead.sourceLead,
              "Notes Prospection": lead.notesProspection,
            });

            results.push({
              success: true,
              lead,
              action: "created",
            });
            created++;
          }
        } catch (error) {
          results.push({
            success: false,
            lead,
            action: "error",
            message: error instanceof Error ? error.message : "Erreur inconnue",
          });
          errors++;
        }
      }

      // Update progress
      const progress = Math.round(((i + batch.length) / total) * 100);
      setState((prev) => ({ ...prev, progress }));

      // Rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const summary: ImportSummary = {
      total,
      created,
      updated,
      errors,
      results,
    };

    setState((prev) => ({
      ...prev,
      isImporting: false,
      progress: 100,
      summary,
    }));

    return summary;
  }, [state.mapping, state.rawData]);

  // Go back to previous step
  const goBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1) as 1 | 2 | 3,
    }));
  }, []);

  return {
    ...state,
    parseFile,
    setMapping,
    importLeads,
    goBack,
    reset,
    totalLeads: state.rawData.length,
  };
}
