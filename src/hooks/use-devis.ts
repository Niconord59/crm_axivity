"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Types
export type StatutDevis = "brouillon" | "envoye" | "accepte" | "refuse" | "expire";

export interface Devis {
  id: string;
  numeroDevis: string;
  opportuniteId: string | null;
  clientId: string | null;
  contactId: string | null;
  statut: StatutDevis;
  dateDevis: string;
  dateValidite: string;
  dateEnvoi: string | null;
  dateReponse: string | null;
  totalHT: number;
  tva: number;
  totalTTC: number;
  tauxTva: number;
  conditionsPaiement: string | null;
  notes: string | null;
  pdfUrl: string | null;
  pdfFilename: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined data
  clientNom?: string;
  opportuniteNom?: string;
}

// Mapper Supabase -> Devis type
function mapToDevis(record: Record<string, unknown>): Devis {
  const client = record.clients as { nom?: string } | null;
  const opportunite = record.opportunites as { nom?: string } | null;

  return {
    id: record.id as string,
    numeroDevis: record.numero_devis as string,
    opportuniteId: record.opportunite_id as string | null,
    clientId: record.client_id as string | null,
    contactId: record.contact_id as string | null,
    statut: record.statut as StatutDevis,
    dateDevis: record.date_devis as string,
    dateValidite: record.date_validite as string,
    dateEnvoi: record.date_envoi as string | null,
    dateReponse: record.date_reponse as string | null,
    totalHT: (record.total_ht as number) || 0,
    tva: (record.tva as number) || 0,
    totalTTC: (record.total_ttc as number) || 0,
    tauxTva: (record.taux_tva as number) || 20,
    conditionsPaiement: record.conditions_paiement as string | null,
    notes: record.notes as string | null,
    pdfUrl: record.pdf_url as string | null,
    pdfFilename: record.pdf_filename as string | null,
    createdBy: record.created_by as string | null,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
    clientNom: client?.nom,
    opportuniteNom: opportunite?.nom,
  };
}

// Statut labels and colors
export const STATUT_DEVIS_CONFIG: Record<
  StatutDevis,
  { label: string; color: string; bgColor: string }
> = {
  brouillon: {
    label: "Brouillon",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
  envoye: {
    label: "Envoyé",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  accepte: {
    label: "Accepté",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  refuse: {
    label: "Refusé",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  expire: {
    label: "Expiré",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
};

// ============================================
// QUERIES
// ============================================

interface UseDevisListOptions {
  opportuniteId?: string;
  clientId?: string;
  statut?: StatutDevis;
  limit?: number;
}

export function useDevisList(options?: UseDevisListOptions) {
  return useQuery({
    queryKey: ["devis", "list", options],
    queryFn: async () => {
      let query = supabase
        .from("devis")
        .select(`
          *,
          clients (nom),
          opportunites (nom)
        `)
        .order("created_at", { ascending: false });

      if (options?.opportuniteId) {
        query = query.eq("opportunite_id", options.opportuniteId);
      }
      if (options?.clientId) {
        query = query.eq("client_id", options.clientId);
      }
      if (options?.statut) {
        query = query.eq("statut", options.statut);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToDevis);
    },
  });
}

export function useDevis(id: string | undefined) {
  return useQuery({
    queryKey: ["devis", id],
    queryFn: async () => {
      if (!id) throw new Error("Devis ID required");

      const { data, error } = await supabase
        .from("devis")
        .select(`
          *,
          clients (nom),
          opportunites (nom)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToDevis(data);
    },
    enabled: !!id,
  });
}

// Get devis for a specific opportunity
export function useDevisForOpportunite(opportuniteId: string | undefined) {
  return useQuery({
    queryKey: ["devis", "opportunite", opportuniteId],
    queryFn: async () => {
      if (!opportuniteId) throw new Error("Opportunite ID required");

      const { data, error } = await supabase
        .from("devis")
        .select(`
          *,
          clients (nom),
          opportunites (nom)
        `)
        .eq("opportunite_id", opportuniteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToDevis);
    },
    enabled: !!opportuniteId,
  });
}

// ============================================
// MUTATIONS
// ============================================

interface CreateDevisData {
  opportuniteId: string;
  clientId: string;
  contactId?: string;
  dateValidite: string;
  totalHT: number;
  tva: number;
  totalTTC: number;
  tauxTva?: number;
  conditionsPaiement?: string;
  notes?: string;
}

export function useCreateDevis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDevisData) => {
      // First, generate the sequential number
      const { data: numeroData, error: numeroError } = await supabase.rpc(
        "generer_numero_devis"
      );

      if (numeroError) throw numeroError;

      const numeroDevis = numeroData as string;

      // Create the devis record
      const insertData = {
        numero_devis: numeroDevis,
        opportunite_id: data.opportuniteId,
        client_id: data.clientId,
        contact_id: data.contactId || null,
        statut: "brouillon" as StatutDevis,
        date_devis: new Date().toISOString().split("T")[0],
        date_validite: data.dateValidite,
        total_ht: data.totalHT,
        tva: data.tva,
        total_ttc: data.totalTTC,
        taux_tva: data.tauxTva || 20,
        conditions_paiement: data.conditionsPaiement || null,
        notes: data.notes || null,
      };

      const { data: record, error } = await supabase
        .from("devis")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToDevis(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["devis"] });
      queryClient.invalidateQueries({
        queryKey: ["devis", "opportunite", variables.opportuniteId],
      });
    },
  });
}

interface UpdateDevisData {
  id: string;
  statut?: StatutDevis;
  dateEnvoi?: string;
  dateReponse?: string;
  notes?: string;
  pdfUrl?: string;
  pdfFilename?: string;
}

export function useUpdateDevis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateDevisData) => {
      const updateData: Record<string, unknown> = {};

      if (data.statut !== undefined) updateData.statut = data.statut;
      if (data.dateEnvoi !== undefined) updateData.date_envoi = data.dateEnvoi;
      if (data.dateReponse !== undefined) updateData.date_reponse = data.dateReponse;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.pdfUrl !== undefined) updateData.pdf_url = data.pdfUrl;
      if (data.pdfFilename !== undefined) updateData.pdf_filename = data.pdfFilename;

      const { data: record, error } = await supabase
        .from("devis")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToDevis(record);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["devis"] });
      queryClient.invalidateQueries({ queryKey: ["devis", result.id] });
    },
  });
}

export function useDeleteDevis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, get the devis to check for PDF
      const { data: devis } = await supabase
        .from("devis")
        .select("pdf_url, pdf_filename")
        .eq("id", id)
        .single();

      // Delete PDF from storage if exists
      if (devis?.pdf_filename) {
        await supabase.storage.from("devis-pdf").remove([devis.pdf_filename]);
      }

      // Delete the devis record
      const { error } = await supabase.from("devis").delete().eq("id", id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devis"] });
    },
  });
}

// Update status only
export function useUpdateDevisStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      statut,
    }: {
      id: string;
      statut: StatutDevis;
    }) => {
      const updateData: Record<string, unknown> = { statut };

      // Auto-set dates based on status
      if (statut === "envoye") {
        updateData.date_envoi = new Date().toISOString();
      } else if (statut === "accepte" || statut === "refuse") {
        updateData.date_reponse = new Date().toISOString();
      }

      const { data: record, error } = await supabase
        .from("devis")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToDevis(record);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["devis"] });
      queryClient.invalidateQueries({ queryKey: ["devis", result.id] });
    },
  });
}

// Upload PDF and update devis
export function useUploadDevisPDF() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      devisId,
      pdfBlob,
      filename,
    }: {
      devisId: string;
      pdfBlob: Blob;
      filename: string;
    }) => {
      // Upload to storage
      const filePath = `${devisId}/${filename}`;
      const { error: uploadError } = await supabase.storage
        .from("devis-pdf")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("devis-pdf")
        .getPublicUrl(filePath);

      // Update devis with PDF info
      const { data: record, error: updateError } = await supabase
        .from("devis")
        .update({
          pdf_url: urlData.publicUrl,
          pdf_filename: filePath,
        })
        .eq("id", devisId)
        .select()
        .single();

      if (updateError) throw updateError;
      return mapToDevis(record);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["devis"] });
      queryClient.invalidateQueries({ queryKey: ["devis", result.id] });
    },
  });
}

// Duplicate devis lines for a new opportunity (or same)
export function useDuplicateDevisLines() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sourceOpportuniteId,
      targetOpportuniteId,
    }: {
      sourceOpportuniteId: string;
      targetOpportuniteId: string;
    }) => {
      // Fetch source lines
      const { data: sourceLines, error: fetchError } = await supabase
        .from("lignes_devis")
        .select("*")
        .eq("opportunite_id", sourceOpportuniteId);

      if (fetchError) throw fetchError;
      if (!sourceLines || sourceLines.length === 0) {
        throw new Error("Aucune ligne à dupliquer");
      }

      // Prepare new lines (without id, with new opportunite_id)
      const newLines = sourceLines.map((line) => ({
        opportunite_id: targetOpportuniteId,
        service_id: line.service_id,
        description: line.description,
        quantite: line.quantite,
        prix_unitaire: line.prix_unitaire,
        remise_pourcent: line.remise_pourcent,
      }));

      // Insert new lines
      const { data: insertedLines, error: insertError } = await supabase
        .from("lignes_devis")
        .insert(newLines)
        .select();

      if (insertError) throw insertError;
      return insertedLines;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lignes-devis", variables.targetOpportuniteId],
      });
    },
  });
}
