"use client";

import {
  Phone,
  PhoneCall,
  Mail,
  Building2,
  Calendar,
  MoreVertical,
  XCircle,
  Clock,
  Copy,
  ArrowRight,
  FileText,
  Video,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { toast } from "sonner";
import type { Prospect } from "@/hooks/use-prospects";
import { formatDate, cn } from "@/lib/utils";

interface LeadCardProps {
  prospect: Prospect;
  onCall: (prospect: Prospect) => void;
  onNotQualified: (prospect: Prospect) => void;
  onLost: (prospect: Prospect) => void;
}

// Configuration des couleurs par statut
function getStatusConfig(status: string | undefined) {
  switch (status) {
    case "À appeler":
      return {
        border: "border-l-blue-500",
        badge: "bg-blue-100 text-blue-800 border-blue-200",
        avatar: "bg-blue-100 text-blue-700",
      };
    case "Appelé - pas répondu":
      return {
        border: "border-l-slate-400",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        avatar: "bg-slate-100 text-slate-600",
      };
    case "Rappeler":
      return {
        border: "border-l-orange-500",
        badge: "bg-orange-100 text-orange-800 border-orange-200",
        avatar: "bg-orange-100 text-orange-700",
      };
    case "RDV planifié":
      return {
        border: "border-l-violet-500",
        badge: "bg-violet-100 text-violet-800 border-violet-200",
        avatar: "bg-violet-100 text-violet-700",
      };
    case "Qualifié":
      return {
        border: "border-l-emerald-500",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        avatar: "bg-emerald-100 text-emerald-700",
      };
    case "Non qualifié":
      return {
        border: "border-l-amber-500",
        badge: "bg-amber-100 text-amber-800 border-amber-200",
        avatar: "bg-amber-100 text-amber-700",
      };
    case "Perdu":
      return {
        border: "border-l-red-500",
        badge: "bg-red-100 text-red-800 border-red-200",
        avatar: "bg-red-100 text-red-700",
      };
    default:
      return {
        border: "border-l-gray-400",
        badge: "bg-gray-100 text-gray-700 border-gray-200",
        avatar: "bg-gray-100 text-gray-600",
      };
  }
}

// Couleur du badge source
function getSourceColor(source: string | undefined): string {
  switch (source) {
    case "LinkedIn":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Site web":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Salon":
      return "bg-green-50 text-green-700 border-green-200";
    case "Recommandation":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Achat liste":
      return "bg-gray-50 text-gray-700 border-gray-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

// Vérifier si la date est aujourd'hui
function isToday(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateString === today;
}

// Vérifier si la date est dans le passé
function isOverdue(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateString < today;
}

// Bouton d'action dynamique selon le statut
function getActionButton(status: string | undefined): {
  label: string;
  icon: LucideIcon;
  variant?: "default" | "outline" | "secondary";
} {
  switch (status) {
    case "À appeler":
      return { label: "Appeler", icon: Phone, variant: "default" };
    case "Appelé - pas répondu":
      return { label: "Rappeler", icon: PhoneCall, variant: "default" };
    case "Rappeler":
      return { label: "Rappeler", icon: PhoneCall, variant: "default" };
    case "RDV planifié":
      return { label: "Voir RDV", icon: Calendar, variant: "secondary" };
    case "Qualifié":
      return { label: "Convertir", icon: ArrowRight, variant: "default" };
    case "Non qualifié":
      return { label: "Voir fiche", icon: FileText, variant: "outline" };
    case "Perdu":
      return { label: "Voir fiche", icon: FileText, variant: "outline" };
    default:
      return { label: "Voir fiche", icon: FileText, variant: "default" };
  }
}

export function LeadCard({
  prospect,
  onCall,
  onNotQualified,
  onLost,
}: LeadCardProps) {
  const fullName = prospect.prenom
    ? `${prospect.prenom} ${prospect.nom}`
    : prospect.nom;

  const initials = prospect.prenom
    ? `${prospect.prenom[0]}${prospect.nom[0]}`
    : prospect.nom.slice(0, 2);

  const statusConfig = getStatusConfig(prospect.statutProspection);
  const actionButton = getActionButton(prospect.statutProspection);
  const ActionIcon = actionButton.icon;

  // Indicateur d'urgence (retard rappel ou RDV aujourd'hui)
  const isUrgent =
    isOverdue(prospect.dateRappel) ||
    (prospect.statutProspection === "RDV planifié" &&
      isToday(prospect.dateRdvPrevu));

  const handleCopyPhone = () => {
    if (prospect.telephone) {
      navigator.clipboard.writeText(prospect.telephone);
      toast.success("Numéro copié dans le presse-papier");
    }
  };

  const handleCopyEmail = () => {
    if (prospect.email) {
      navigator.clipboard.writeText(prospect.email);
      toast.success("Email copié dans le presse-papier");
    }
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 h-full flex flex-col",
        "hover:shadow-md hover:-translate-y-0.5",
        "border-l-4",
        statusConfig.border,
        isUrgent && "ring-2 ring-red-200 ring-offset-1"
      )}
    >
      <CardContent className="p-4 flex flex-col flex-1">
        {/* Header avec Avatar */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className={cn("h-10 w-10 shrink-0", statusConfig.avatar)}>
            <AvatarFallback
              className={cn("font-semibold text-sm", statusConfig.avatar)}
            >
              {initials.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm leading-tight truncate">
                  {fullName}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground truncate">
                    {prospect.clientNom || "Entreprise inconnue"}
                  </p>
                </div>
              </div>

              {/* Menu contextuel */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleCopyPhone}
                    disabled={!prospect.telephone}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copier le téléphone
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleCopyEmail}
                    disabled={!prospect.email}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Copier l&apos;email
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNotQualified(prospect)}>
                    <Clock className="h-4 w-4 mr-2" />
                    Non qualifié
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onLost(prospect)}
                    className="text-red-600"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Perdu
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badge statut */}
            <div className="mt-2">
              <Badge
                variant="outline"
                className={cn("text-[10px] font-medium px-2 py-0", statusConfig.badge)}
              >
                {prospect.statutProspection || "N/A"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Informations de contact */}
        <div className="space-y-1 mb-3">
          {prospect.telephone && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCopyPhone}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full group/btn"
                  >
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="font-medium">{prospect.telephone}</span>
                    <Copy className="h-3 w-3 opacity-0 group-hover/btn:opacity-50 transition-opacity ml-auto" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Cliquer pour copier</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {prospect.email && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full group/btn"
                  >
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{prospect.email}</span>
                    <Copy className="h-3 w-3 opacity-0 group-hover/btn:opacity-50 transition-opacity ml-auto shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Cliquer pour copier</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Tags - Source, Rappel, RDV */}
        {(prospect.sourceLead || prospect.dateRappel || prospect.dateRdvPrevu) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {prospect.sourceLead && (
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0", getSourceColor(prospect.sourceLead))}
              >
                {prospect.sourceLead}
              </Badge>
            )}
            {prospect.dateRappel && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  isOverdue(prospect.dateRappel)
                    ? "bg-red-50 text-red-700 border-red-300 animate-pulse"
                    : isToday(prospect.dateRappel)
                    ? "bg-orange-50 text-orange-700 border-orange-300"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                )}
              >
                <Calendar className="h-2.5 w-2.5 mr-1" />
                {isToday(prospect.dateRappel)
                  ? "Aujourd'hui"
                  : isOverdue(prospect.dateRappel)
                  ? "Retard"
                  : formatDate(prospect.dateRappel)}
              </Badge>
            )}
            {prospect.dateRdvPrevu && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  isToday(prospect.dateRdvPrevu)
                    ? "bg-violet-50 text-violet-700 border-violet-300"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                )}
              >
                {prospect.typeRdv === "Visio" ? (
                  <Video className="h-2.5 w-2.5 mr-1" />
                ) : (
                  <MapPin className="h-2.5 w-2.5 mr-1" />
                )}
                {isToday(prospect.dateRdvPrevu)
                  ? "Aujourd'hui"
                  : formatDate(prospect.dateRdvPrevu)}
              </Badge>
            )}
          </div>
        )}

        {/* Notes */}
        {prospect.notesProspection && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 italic">
            {prospect.notesProspection}
          </p>
        )}

        {/* Spacer pour pousser le bouton en bas */}
        <div className="flex-1" />

        {/* Bouton d'action principal - toujours en bas */}
        <Button
          variant={actionButton.variant}
          size="sm"
          className="w-full h-8 text-xs font-medium mt-auto"
          onClick={() => onCall(prospect)}
        >
          <ActionIcon className="h-3.5 w-3.5 mr-1.5" />
          {actionButton.label}
        </Button>
      </CardContent>
    </Card>
  );
}
