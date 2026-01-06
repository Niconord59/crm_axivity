"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ProjetMembre } from "@/types";

interface TeamAvatarStackProps {
  membres: ProjetMembre[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

const overlapClasses = {
  sm: "-ml-2",
  md: "-ml-3",
  lg: "-ml-4",
};

function getInitials(nom?: string): string {
  if (!nom) return "?";
  const parts = nom.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return nom.substring(0, 2).toUpperCase();
}

function getAvatarColor(profileId: string): string {
  // Generate consistent color based on profile ID
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-amber-500",
    "bg-rose-500",
  ];
  const hash = profileId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function TeamAvatarStack({
  membres,
  maxVisible = 3,
  size = "md",
  className,
}: TeamAvatarStackProps) {
  if (!membres || membres.length === 0) {
    return null;
  }

  const visibleMembres = membres.slice(0, maxVisible);
  const remainingCount = membres.length - maxVisible;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex items-center", className)}>
        {visibleMembres.map((membre, index) => (
          <Tooltip key={membre.id}>
            <TooltipTrigger asChild>
              <Avatar
                className={cn(
                  sizeClasses[size],
                  index > 0 && overlapClasses[size],
                  "ring-2 ring-background cursor-pointer"
                )}
              >
                <AvatarImage
                  src={undefined}
                  alt={membre.profileNom || "Membre"}
                />
                <AvatarFallback
                  className={cn(
                    "text-white font-medium",
                    getAvatarColor(membre.profileId)
                  )}
                >
                  {getInitials(membre.profileNom)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="font-medium">{membre.profileNom || "Membre"}</p>
              {membre.profileEmail && (
                <p className="text-xs text-muted-foreground">{membre.profileEmail}</p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}

        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar
                className={cn(
                  sizeClasses[size],
                  overlapClasses[size],
                  "ring-2 ring-background cursor-pointer bg-muted"
                )}
              >
                <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                  +{remainingCount}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="space-y-1">
                {membres.slice(maxVisible).map((membre) => (
                  <p key={membre.id} className="text-sm">
                    {membre.profileNom || membre.profileEmail || "Membre"}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

export default TeamAvatarStack;
