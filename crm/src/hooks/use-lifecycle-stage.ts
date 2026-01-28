"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import type { LifecycleStage } from "@/types";
import { LIFECYCLE_STAGES, LIFECYCLE_STAGE_LABELS } from "@/types/constants";

// Order of lifecycle stages for downgrade protection
const LIFECYCLE_STAGE_ORDER: Record<LifecycleStage, number> = {
  Lead: 0,
  MQL: 1,
  SQL: 2,
  Opportunity: 3,
  Customer: 4,
  Evangelist: 5,
  Churned: 6, // Special case - can be reached from any stage
};

/**
 * Check if a lifecycle stage transition is a downgrade
 * (going backwards in the funnel)
 */
export function isLifecycleDowngrade(
  currentStage: LifecycleStage | undefined,
  newStage: LifecycleStage
): boolean {
  if (!currentStage) return false;

  // Churned is a special case - it's not a "downgrade" per se
  // it represents a lost customer/opportunity
  if (newStage === "Churned") return false;

  const currentOrder = LIFECYCLE_STAGE_ORDER[currentStage];
  const newOrder = LIFECYCLE_STAGE_ORDER[newStage];

  return newOrder < currentOrder;
}

/**
 * Get the next lifecycle stage in the funnel
 */
export function getNextLifecycleStage(
  currentStage: LifecycleStage | undefined
): LifecycleStage | null {
  if (!currentStage) return "Lead";

  const currentIndex = LIFECYCLE_STAGES.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex >= LIFECYCLE_STAGES.length - 2) {
    // Don't suggest Churned as "next" stage
    return null;
  }

  // Skip to next stage (but not Churned which is last)
  const nextStage = LIFECYCLE_STAGES[currentIndex + 1];
  return nextStage === "Churned" ? null : nextStage;
}

interface UpdateLifecycleStageParams {
  contactId: string;
  newStage: LifecycleStage;
  /**
   * If true, allows downgrade transitions (e.g., Customer -> SQL)
   * Default: false (will throw error on downgrade attempt)
   */
  forceDowngrade?: boolean;
  /**
   * Current stage for validation (optional)
   * If not provided, the hook will fetch the current stage
   */
  currentStage?: LifecycleStage;
  /**
   * If true, creates an automatic interaction for audit trail
   * Default: true
   */
  createInteraction?: boolean;
  /**
   * Client ID for the interaction (optional - will be fetched if not provided)
   */
  clientId?: string;
}

/**
 * Hook to update a contact's lifecycle stage
 *
 * Features:
 * - Validates stage transitions
 * - Optional downgrade protection
 * - Automatically updates lifecycle_stage_changed_at via DB trigger
 * - Creates automatic interaction for audit trail (optional)
 * - Invalidates relevant caches
 */
export function useUpdateLifecycleStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      newStage,
      forceDowngrade = false,
      currentStage,
      createInteraction = true,
      clientId,
    }: UpdateLifecycleStageParams) => {
      // If currentStage is provided and downgrade protection is enabled
      if (currentStage && !forceDowngrade) {
        if (isLifecycleDowngrade(currentStage, newStage)) {
          throw new Error(
            `Le passage de "${currentStage}" à "${newStage}" est un rétrogradage. ` +
              `Utilisez forceDowngrade: true pour confirmer ce changement.`
          );
        }
      }

      // Update the contact's lifecycle stage
      // Note: lifecycle_stage_changed_at is updated automatically via DB trigger
      const { data, error } = await supabase
        .from("contacts")
        .update({
          lifecycle_stage: newStage,
        })
        .eq("id", contactId)
        .select("id, lifecycle_stage, lifecycle_stage_changed_at, client_id")
        .single();

      if (error) throw error;

      // Create interaction for audit trail (non-blocking)
      if (createInteraction) {
        try {
          const resolvedClientId = clientId || (data.client_id as string | undefined);
          const previousLabel = currentStage
            ? LIFECYCLE_STAGE_LABELS[currentStage]
            : "Aucun";
          const newLabel = LIFECYCLE_STAGE_LABELS[newStage];

          await supabase.from("interactions").insert({
            objet: `Changement lifecycle stage`,
            type: "Note",
            date: new Date().toISOString().split("T")[0],
            resume: `Passage de "${previousLabel}" à "${newLabel}"`,
            contact_id: contactId,
            client_id: resolvedClientId || null,
          });
        } catch {
          // Non-blocking: interaction creation is for audit, don't fail the update
        }
      }

      return {
        id: data.id as string,
        lifecycleStage: data.lifecycle_stage as LifecycleStage,
        lifecycleStageChangedAt: data.lifecycle_stage_changed_at as string,
      };
    },
    onSuccess: async (_, variables) => {
      // Invalidate all prospect/contact related queries
      await queryClient.refetchQueries({ queryKey: queryKeys.prospects.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.prospects.detail(variables.contactId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.prospects.kpis() });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.contacts.detail(variables.contactId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.interactions.all });
    },
  });
}

/**
 * Hook to batch update lifecycle stages for multiple contacts
 * Useful for bulk operations (e.g., converting multiple leads to MQL)
 */
export function useBatchUpdateLifecycleStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactIds,
      newStage,
    }: {
      contactIds: string[];
      newStage: LifecycleStage;
    }) => {
      if (contactIds.length === 0) {
        return { updated: 0, contactIds: [] };
      }

      const { data, error } = await supabase
        .from("contacts")
        .update({
          lifecycle_stage: newStage,
        })
        .in("id", contactIds)
        .select("id");

      if (error) throw error;

      return {
        updated: data?.length || 0,
        contactIds: (data || []).map((d) => d.id as string),
      };
    },
    onSuccess: async () => {
      // Invalidate all prospect/contact related queries
      await queryClient.refetchQueries({ queryKey: queryKeys.prospects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.prospects.kpis() });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}
