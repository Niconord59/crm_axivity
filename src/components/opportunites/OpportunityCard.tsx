"use client";

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

export function OpportunityCard({
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

          {onStatusChange && (
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
              <DropdownMenuContent align="end" className="w-48">
                {onOpenQuote && (
                  <>
                    <DropdownMenuItem onClick={() => onOpenQuote(opportunity.id)}>
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      Éditer le devis
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => onStatusChange(opportunity.id, "Qualifié")}>
                  <Target className="h-4 w-4 mr-2 text-blue-500" />
                  Qualifié
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(opportunity.id, "Proposition")}>
                  <ArrowRight className="h-4 w-4 mr-2 text-violet-500" />
                  Proposition
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(opportunity.id, "Négociation")}>
                  <TrendingUp className="h-4 w-4 mr-2 text-orange-500" />
                  Négociation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onStatusChange(opportunity.id, "Gagné")}
                  className="text-emerald-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer Gagné
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onStatusChange(opportunity.id, "Perdu")}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Marquer Perdu
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Valeur et probabilité */}
        <div className="space-y-2">
          {/* Valeur estimée */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Valeur</span>
            <span className="font-bold text-sm">
              {formatCurrency(opportunity.valeurEstimee || 0)}
            </span>
          </div>

          {/* Probabilité avec barre de progression */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Probabilité</span>
              <span className="text-xs font-medium">{probabilityPercent}%</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Progress
                      value={probabilityPercent}
                      className="h-1.5"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Valeur pondérée: {formatCurrency(opportunity.valeurPonderee || 0)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Date de clôture */}
          {opportunity.dateClotureEstimee && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Clôture
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0",
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
            </div>
          )}
        </div>

        {/* Valeur pondérée en bas */}
        <div className="mt-3 pt-2 border-t border-dashed">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Pondérée
            </span>
            <span className="text-sm font-bold text-primary">
              {formatCurrency(opportunity.valeurPonderee || 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
