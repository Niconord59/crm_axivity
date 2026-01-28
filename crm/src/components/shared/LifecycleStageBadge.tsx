"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { LifecycleStage } from "@/types";
import {
  LIFECYCLE_STAGE_LABELS,
  LIFECYCLE_STAGE_COLORS,
} from "@/types/constants";
import { LIFECYCLE_STAGE_ICONS } from "./lifecycle-stage-icons";

// Tooltip descriptions for each stage (French)
const LIFECYCLE_STAGE_DESCRIPTIONS: Record<LifecycleStage, string> = {
  Lead: "Nouveau contact identifié, pas encore qualifié",
  MQL: "Marketing Qualified Lead - A montré de l'intérêt",
  SQL: "Sales Qualified Lead - Prêt pour un contact commercial",
  Opportunity: "Opportunité commerciale active en cours",
  Customer: "Client avec au moins un projet/achat",
  Evangelist: "Client ambassadeur qui recommande nos services",
  Churned: "Contact perdu ou inactif",
};

interface LifecycleStageBadgeProps {
  stage: LifecycleStage;
  size?: "sm" | "md";
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function LifecycleStageBadge({
  stage,
  size = "md",
  showLabel = true,
  showTooltip = true,
  className,
}: LifecycleStageBadgeProps) {
  const Icon = LIFECYCLE_STAGE_ICONS[stage];
  const label = LIFECYCLE_STAGE_LABELS[stage];
  const bgColor = LIFECYCLE_STAGE_COLORS[stage];
  const description = LIFECYCLE_STAGE_DESCRIPTIONS[stage];

  // Size variants
  const sizeClasses = {
    sm: {
      badge: "text-[10px] px-1.5 py-0 h-5",
      icon: "h-3 w-3",
      gap: "gap-1",
    },
    md: {
      badge: "text-xs px-2 py-0.5 h-6",
      icon: "h-3.5 w-3.5",
      gap: "gap-1.5",
    },
  };

  const sizes = sizeClasses[size];

  const badgeContent = (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium border-0 text-white",
        bgColor,
        sizes.badge,
        sizes.gap,
        "inline-flex items-center",
        className
      )}
    >
      <Icon className={sizes.icon} />
      {showLabel && <span>{label}</span>}
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent className="max-w-[220px]">
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
