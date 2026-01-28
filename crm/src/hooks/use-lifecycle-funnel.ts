"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import type { LifecycleStage } from "@/types";
import { LIFECYCLE_STAGES } from "@/types/constants";
import { differenceInDays, parseISO } from "date-fns";

// Stages in funnel order (excluding Churned for conversion calculation)
const FUNNEL_STAGES: LifecycleStage[] = [
  "Lead",
  "MQL",
  "SQL",
  "Opportunity",
  "Customer",
  "Evangelist",
];

export interface LifecycleFunnelStats {
  stage: LifecycleStage;
  count: number;
  percentage: number; // % of total contacts
}

export interface LifecycleConversionRate {
  fromStage: LifecycleStage;
  toStage: LifecycleStage;
  rate: number; // Percentage 0-100
}

export interface LifecycleFunnelData {
  /** Stats per lifecycle stage */
  stages: LifecycleFunnelStats[];
  /** Conversion rates between adjacent stages */
  conversionRates: LifecycleConversionRate[];
  /** Total number of contacts */
  totalContacts: number;
  /** Churned contacts (separate from funnel) */
  churnedCount: number;
  /** Average days from Lead creation to Customer (only for Customers) */
  avgLeadToCustomerDays: number | null;
}

/**
 * Hook to fetch lifecycle funnel statistics
 *
 * Returns:
 * - Count of contacts per lifecycle stage
 * - Conversion rates between adjacent stages
 * - Average Lead → Customer cycle time
 */
export function useLifecycleFunnel() {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, "lifecycle-funnel"] as const,
    queryFn: async (): Promise<LifecycleFunnelData> => {
      // Fetch all contacts with lifecycle stage info
      const { data: contacts, error } = await supabase
        .from("contacts")
        .select("id, lifecycle_stage, created_at, lifecycle_stage_changed_at")
        .not("lifecycle_stage", "is", null);

      if (error) throw error;

      // Count contacts per stage
      const stageCounts: Record<LifecycleStage, number> = {
        Lead: 0,
        MQL: 0,
        SQL: 0,
        Opportunity: 0,
        Customer: 0,
        Evangelist: 0,
        Churned: 0,
      };

      // Collect Customer creation dates for cycle time calculation
      const customerCycleDays: number[] = [];

      (contacts || []).forEach((contact) => {
        const stage = contact.lifecycle_stage as LifecycleStage;
        if (stage && stageCounts[stage] !== undefined) {
          stageCounts[stage]++;
        }

        // Calculate Lead → Customer cycle for customers
        if (
          stage === "Customer" &&
          contact.created_at &&
          contact.lifecycle_stage_changed_at
        ) {
          const createdDate = parseISO(contact.created_at as string);
          const customerDate = parseISO(contact.lifecycle_stage_changed_at as string);
          const days = differenceInDays(customerDate, createdDate);
          if (days >= 0) {
            customerCycleDays.push(days);
          }
        }
      });

      const totalContacts = contacts?.length || 0;
      const churnedCount = stageCounts.Churned;

      // Calculate stage stats (excluding Churned from main funnel view)
      const stages: LifecycleFunnelStats[] = LIFECYCLE_STAGES.map((stage) => ({
        stage,
        count: stageCounts[stage],
        percentage: totalContacts > 0 ? (stageCounts[stage] / totalContacts) * 100 : 0,
      }));

      // Calculate conversion rates between adjacent funnel stages
      // Note: This is a simplified calculation based on current distribution
      // A true conversion rate would require historical tracking of stage transitions
      const conversionRates: LifecycleConversionRate[] = [];

      for (let i = 0; i < FUNNEL_STAGES.length - 1; i++) {
        const fromStage = FUNNEL_STAGES[i];
        const toStage = FUNNEL_STAGES[i + 1];
        const fromCount = stageCounts[fromStage];
        const toCount = stageCounts[toStage];

        // Count all contacts that reached toStage or beyond
        // (i.e., they must have passed through fromStage)
        const reachedToStageOrBeyond = FUNNEL_STAGES.slice(i + 1).reduce(
          (sum, s) => sum + stageCounts[s],
          0
        );

        // Total who were at fromStage or progressed beyond
        const passedThroughFromStage = fromCount + reachedToStageOrBeyond;

        const rate =
          passedThroughFromStage > 0
            ? (reachedToStageOrBeyond / passedThroughFromStage) * 100
            : 0;

        conversionRates.push({
          fromStage,
          toStage,
          rate: Math.round(rate * 10) / 10, // Round to 1 decimal
        });
      }

      // Calculate average Lead → Customer cycle time
      const avgLeadToCustomerDays =
        customerCycleDays.length > 0
          ? Math.round(
              customerCycleDays.reduce((sum, d) => sum + d, 0) /
                customerCycleDays.length
            )
          : null;

      return {
        stages,
        conversionRates,
        totalContacts,
        churnedCount,
        avgLeadToCustomerDays,
      };
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Calculate the "health" of the funnel based on conversion rates
 * Returns a simple score from 0-100
 */
export function calculateFunnelHealth(
  conversionRates: LifecycleConversionRate[]
): number {
  if (conversionRates.length === 0) return 0;

  // Average of all conversion rates
  const avgRate =
    conversionRates.reduce((sum, cr) => sum + cr.rate, 0) /
    conversionRates.length;

  // Score scales from 0-100 where 50% avg conversion rate = 100 health
  // Most B2B funnels have much lower rates, so we scale accordingly
  const health = Math.min(100, avgRate * 2);

  return Math.round(health);
}
