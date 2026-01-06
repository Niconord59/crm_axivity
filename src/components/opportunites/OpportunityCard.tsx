"use client";

import React from "react";
import {
  Building2,
  Calendar,
  TrendingUp,
  Target,
  MoreVertical,
  CheckCircle,
  XCircle,
  ArrowRight,
  Clock,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Opportunite, OpportunityStatus } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface OpportunityCardProps {
  opportunity: Opportunite;
  onStatusChange?: (id: string, status: OpportunityStatus) => void;
  onOpenQuote?: (id: string) => void;
  onOpenMiniSheet?: (id: string) => void;
  isDragging?: boolean;
}

// Configuration des couleurs par statut
function getStatusConfig(status: OpportunityStatus | undefined) {
  switch (status) {
    case "Qualifié":
      return {
        border: "border-l-blue-500",
        badge: "bg-blue-100 text-blue-800 border-blue-200",
        progress: "bg-blue-500",
      };
    case "Proposition":
      return {
        border: "border-l-violet-500",
        badge: "bg-violet-100 text-violet-800 border-violet-200",
        progress: "bg-violet-500",
      };
    case "Négociation":
      return {
        border: "border-l-orange-500",
        badge: "bg-orange-100 text-orange-800 border-orange-200",
        progress: "bg-orange-500",
      };
    case "Gagné":
      return {
        border: "border-l-emerald-500",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        progress: "bg-emerald-500",
      };
    case "Perdu":
      return {
        border: "border-l-red-500",
        badge: "bg-red-100 text-red-800 border-red-200",
        progress: "bg-red-500",
      };
    default:
      return {
        border: "border-l-gray-400",
        badge: "bg-gray-100 text-gray-700 border-gray-200",
        progress: "bg-gray-500",
      };
  }
}

// Vérifier si la date de clôture est proche (< 7 jours)
function isClosingSoon(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const closeDate = new Date(dateString);
  const today = new Date();
  const diffDays = Math.ceil((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

// Vérifier si la date de clôture est dépassée
function isOverdue(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateString < today;
}

export const OpportunityCard = React.memo(function OpportunityCard({
  opportunity,
  onStatusChange,
  onOpenQuote,
  onOpenMiniSheet,
  isDragging = false,
}: OpportunityCardProps) {
  const statusConfig = getStatusConfig(opportunity.statut);
  const probabilityPercent = opportunity.probabilite
    ? Math.round(opportunity.probabilite)
    : 0;

  const isUrgent = isOverdue(opportunity.dateClotureEstimee);
  const closingSoon = isClosingSoon(opportunity.dateClotureEstimee);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200",
        "hover:shadow-md",
        "border-l-4",
        statusConfig.border,
        isDragging && "shadow-xl rotate-2 scale-105",
        isUrgent && "ring-2 ring-red-200 ring-offset-1",
        onOpenMiniSheet && "cursor-pointer"
      )}
      onClick={() => onOpenMiniSheet?.(opportunity.id)}
    >
      <CardContent className="p-3">
        {/* Header avec nom et menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">
            {opportunity.nom}
          </h4>

          {onStatusChange && opportunity.statut !== "Qualifié" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                <div className="px-2 py-1.5 mb-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Clôturer cette opportunité
                  </p>
                </div>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(opportunity.id, "Gagné");
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer mb-1.5 focus:bg-emerald-100 focus:text-emerald-700"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-200">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Marquer Gagné</p>
                    <p className="text-xs text-emerald-600">Affaire conclue avec succès</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(opportunity.id, "Perdu");
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer focus:bg-red-100 focus:text-red-700"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-200">
                    <XCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Marquer Perdu</p>
                    <p className="text-xs text-red-600">Opportunité non aboutie</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Valeur et probabilité */}
        <TooltipProvider delayDuration={300}>
          <div className="space-y-2">
            {/* Valeur estimée */}
            <div className="flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                    Valeur
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <p>Montant estimé du contrat si l'affaire est gagnée</p>
                </TooltipContent>
              </Tooltip>
              <span className="font-bold text-sm">
                {formatCurrency(opportunity.valeurEstimee || 0)}
              </span>
            </div>

            {/* Probabilité avec barre de progression */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                      Probabilité
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[220px]">
                    <p>Estimation des chances de remporter cette affaire (0-100%)</p>
                  </TooltipContent>
                </Tooltip>
                <span className="text-xs font-medium">{probabilityPercent}%</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative cursor-help">
                    <Progress
                      value={probabilityPercent}
                      className="h-1.5"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Valeur pondérée : {formatCurrency(opportunity.valeurPonderee || 0)}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Date de clôture */}
            {opportunity.dateClotureEstimee && (
              <div className="flex items-center justify-between pt-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-help border-b border-dotted border-muted-foreground/50">
                      <Calendar className="h-3 w-3" />
                      Clôture
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[200px]">
                    <p>Date prévue de signature ou décision du client</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 cursor-help",
                        isOverdue(opportunity.dateClotureEstimee)
                          ? "bg-red-50 text-red-700 border-red-300"
                          : closingSoon
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      )}
                    >
                      {isOverdue(opportunity.dateClotureEstimee) && (
                        <Clock className="h-2.5 w-2.5 mr-1" />
                      )}
                      {formatDate(opportunity.dateClotureEstimee)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isOverdue(opportunity.dateClotureEstimee) ? (
                      <p className="text-red-600">⚠️ Date dépassée - relancer le client</p>
                    ) : closingSoon ? (
                      <p className="text-amber-600">⏰ Échéance proche (&lt; 7 jours)</p>
                    ) : (
                      <p>Échéance dans plus de 7 jours</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Valeur pondérée en bas */}
          <div className="mt-3 pt-2 border-t border-dashed">
            <div className="flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide cursor-help border-b border-dotted border-muted-foreground/50">
                    Pondérée
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[220px]">
                  <p>Valeur × Probabilité = prévision réaliste de revenus</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-sm font-bold text-primary">
                {formatCurrency(opportunity.valeurPonderee || 0)}
              </span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
});

OpportunityCard.displayName = "OpportunityCard";
