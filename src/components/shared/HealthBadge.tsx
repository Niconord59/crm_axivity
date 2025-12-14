"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { differenceInDays, parseISO } from "date-fns";

export type HealthStatus = "good" | "warning" | "danger";

interface HealthBadgeProps {
  lastInteractionDate?: string | null;
  className?: string;
}

export function getHealthStatus(lastInteractionDate?: string | null): HealthStatus {
  if (!lastInteractionDate) return "danger";

  const daysSinceLastInteraction = differenceInDays(
    new Date(),
    parseISO(lastInteractionDate)
  );

  if (daysSinceLastInteraction <= 30) return "good";
  if (daysSinceLastInteraction <= 90) return "warning";
  return "danger";
}

export function getHealthLabel(status: HealthStatus): string {
  switch (status) {
    case "good":
      return "Relation active";
    case "warning":
      return "À surveiller";
    case "danger":
      return "À relancer";
  }
}

export function getHealthDescription(lastInteractionDate?: string | null): string {
  if (!lastInteractionDate) return "Aucune interaction enregistrée";

  const daysSinceLastInteraction = differenceInDays(
    new Date(),
    parseISO(lastInteractionDate)
  );

  if (daysSinceLastInteraction === 0) return "Interaction aujourd'hui";
  if (daysSinceLastInteraction === 1) return "Interaction hier";
  return `Dernière interaction il y a ${daysSinceLastInteraction} jours`;
}

export function HealthBadge({ lastInteractionDate, className }: HealthBadgeProps) {
  const status = getHealthStatus(lastInteractionDate);
  const label = getHealthLabel(status);
  const description = getHealthDescription(lastInteractionDate);

  const variantMap: Record<HealthStatus, "default" | "secondary" | "destructive"> = {
    good: "default",
    warning: "secondary",
    danger: "destructive",
  };

  const emojiMap: Record<HealthStatus, string> = {
    good: "🟢",
    warning: "🟡",
    danger: "🔴",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variantMap[status]} className={className}>
            {emojiMap[status]} {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
