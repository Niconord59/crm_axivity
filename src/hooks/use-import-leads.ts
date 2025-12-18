"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { supabase } from "@/lib/supabase";
import type { ProspectSource } from "@/types";

// Field mapping for CSV import
export interface ColumnMapping {
  // Client fields
  entreprise: string;
  siret?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  secteurActivite?: string;
  siteWeb?: string;
  // Contact fields
  nom: string;
  email: string;
  telephone?: string;
  role?: string;
  linkedin?: string;
  source?: string;
  notes?: string;
}

// Parsed lead from CSV
export interface ParsedLead {
  // Client info
  entreprise: string;
  siret?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  secteurActivite?: string;
  siteWeb?: string;
  // Contact info
  nom: string;
  email: string;
  telephone?: string;
  role?: string;
  linkedin?: string;
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
          // Client fields
          entreprise: row[mapping.entreprise]?.trim() || "",
          siret: mapping.siret ? row[mapping.siret]?.trim() : undefined,
          adresse: mapping.adresse ? row[mapping.adresse]?.trim() : undefined,
          codePostal: mapping.codePostal ? row[mapping.codePostal]?.trim() : undefined,
          ville: mapping.ville ? row[mapping.ville]?.trim() : undefined,
          pays: mapping.pays ? row[mapping.pays]?.trim() : undefined,
          secteurActivite: mapping.secteurActivite ? row[mapping.secteurActivite]?.trim() : undefined,
          siteWeb: mapping.siteWeb ? row[mapping.siteWeb]?.trim() : undefined,
          // Contact fields
          nom: row[mapping.nom]?.trim() || "",
          email: row[mapping.email]?.trim().toLowerCase() || "",
          telephone: mapping.telephone ? row[mapping.telephone]?.trim() : undefined,
          role: mapping.role ? row[mapping.role]?.trim() : undefined,
          linkedin: mapping.linkedin ? row[mapping.linkedin]?.trim() : undefined,
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
        const { data: existingContacts } = await supabase
          .from("contacts")
          .select("email");

        const existingEmails = new Set(
          (existingContacts || [])
            .map((c) => c.email?.toLowerCase())
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

  // Import leads to Supabase
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
          // Client fields
          entreprise: row[mapping.entreprise]?.trim() || "",
          siret: mapping.siret ? row[mapping.siret]?.trim() : undefined,
          adresse: mapping.adresse ? row[mapping.adresse]?.trim() : undefined,
          codePostal: mapping.codePostal ? row[mapping.codePostal]?.trim() : undefined,
          ville: mapping.ville ? row[mapping.ville]?.trim() : undefined,
          pays: mapping.pays ? row[mapping.pays]?.trim() : undefined,
          secteurActivite: mapping.secteurActivite ? row[mapping.secteurActivite]?.trim() : undefined,
          siteWeb: mapping.siteWeb ? row[mapping.siteWeb]?.trim() : undefined,
          // Contact fields
          nom: row[mapping.nom]?.trim() || "",
          email: row[mapping.email]?.trim().toLowerCase() || "",
          telephone: mapping.telephone ? row[mapping.telephone]?.trim() : undefined,
          role: mapping.role ? row[mapping.role]?.trim() : undefined,
          linkedin: mapping.linkedin ? row[mapping.linkedin]?.trim() : undefined,
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
          const { data: existingContacts } = await supabase
            .from("contacts")
            .select("id, statut_prospection")
            .ilike("email", lead.email)
            .limit(1);

          if (existingContacts && existingContacts.length > 0) {
            // Update existing contact
            const contactId = existingContacts[0].id;
            const updateData: Record<string, unknown> = {
              nom: lead.nom,
              telephone: lead.telephone,
              poste: lead.role,
              notes_prospection: lead.notesProspection,
              source_lead: lead.sourceLead,
            };

            // Preserve existing status if set
            if (!existingContacts[0].statut_prospection) {
              updateData.statut_prospection = "À appeler";
            }

            await supabase
              .from("contacts")
              .update(updateData)
              .eq("id", contactId);

            results.push({
              success: true,
              lead,
              action: "updated",
            });
            updated++;
          } else {
            // Find or create client
            let clientId: string;
            const { data: existingClients } = await supabase
              .from("clients")
              .select("id")
              .eq("nom", lead.entreprise)
              .limit(1);

            if (existingClients && existingClients.length > 0) {
              clientId = existingClients[0].id;
              // Update existing client with new info if provided
              const clientUpdateData: Record<string, unknown> = {};
              if (lead.siret) clientUpdateData.siret = lead.siret;
              if (lead.adresse) clientUpdateData.adresse = lead.adresse;
              if (lead.codePostal) clientUpdateData.code_postal = lead.codePostal;
              if (lead.ville) clientUpdateData.ville = lead.ville;
              if (lead.pays) clientUpdateData.pays = lead.pays;
              if (lead.secteurActivite) clientUpdateData.secteur = lead.secteurActivite;
              if (lead.siteWeb) clientUpdateData.site_web = lead.siteWeb;

              if (Object.keys(clientUpdateData).length > 0) {
                await supabase
                  .from("clients")
                  .update(clientUpdateData)
                  .eq("id", clientId);
              }
            } else {
              const { data: newClient, error: clientError } = await supabase
                .from("clients")
                .insert({
                  nom: lead.entreprise,
                  statut: "Prospect",
                  siret: lead.siret,
                  adresse: lead.adresse,
                  code_postal: lead.codePostal,
                  ville: lead.ville,
                  pays: lead.pays || "France",
                  secteur: lead.secteurActivite,
                  site_web: lead.siteWeb,
                })
                .select()
                .single();

              if (clientError) throw clientError;
              clientId = newClient.id;
            }

            // Create contact
            const { error: contactError } = await supabase
              .from("contacts")
              .insert({
                nom: lead.nom,
                email: lead.email,
                telephone: lead.telephone,
                poste: lead.role,
                client_id: clientId,
                statut_prospection: "À appeler",
                source_lead: lead.sourceLead,
                notes_prospection: lead.notesProspection,
              });

            if (contactError) throw contactError;

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

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100));
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
