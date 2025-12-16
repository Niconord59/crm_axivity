"use client";

import {
  Phone,
  PhoneCall,
  Mail,
  Building2,
  Calendar,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  ArrowRight,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatDate } from "@/lib/utils";

interface LeadCardProps {
  prospect: Prospect;
  onCall: (prospect: Prospect) => void;
  onQualify: (prospect: Prospect) => void;
  onNotQualified: (prospect: Prospect) => void;
  onLost: (prospect: Prospect) => void;
}

// Get status badge color
function getStatusColor(status: string | undefined): string {
  switch (status) {
    case "À appeler":
      return "bg-blue-100 text-blue-800";
    case "Appelé - pas répondu":
      return "bg-gray-100 text-gray-800";
    case "Rappeler":
      return "bg-orange-100 text-orange-800";
    case "Qualifié":
      return "bg-green-100 text-green-800";
    case "Non qualifié":
      return "bg-yellow-100 text-yellow-800";
    case "Perdu":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Get source badge color
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

// Check if date is today
function isToday(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateString === today;
}

// Check if date is in the past
function isOverdue(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateString < today;
}

// Get dynamic action button based on prospect status
function getActionButton(status: string | undefined): { label: string; icon: LucideIcon; variant?: "default" | "outline" | "secondary" } {
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
  onQualify,
  onNotQualified,
  onLost,
}: LeadCardProps) {
  const fullName = prospect.prenom
    ? `${prospect.prenom} ${prospect.nom}`
    : prospect.nom;

  const actionButton = getActionButton(prospect.statutProspection);
  const ActionIcon = actionButton.icon;

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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header - Company + Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold truncate">
                {prospect.clientNom || "Entreprise inconnue"}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{fullName}</p>
          </div>
          <div className="flex items-center gap-1">
            <Badge className={getStatusColor(prospect.statutProspection)}>
              {prospect.statutProspection || "N/A"}
            </Badge>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1.5 mb-3">
          {prospect.email && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                  >
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{prospect.email}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cliquer pour copier</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {prospect.telephone && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCopyPhone}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                  >
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{prospect.telephone}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cliquer pour copier</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Tags - Source + Rappel */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {prospect.sourceLead && (
            <Badge variant="outline" className={getSourceColor(prospect.sourceLead)}>
              {prospect.sourceLead}
            </Badge>
          )}
          {prospect.dateRappel && (
            <Badge
              variant="outline"
              className={
                isOverdue(prospect.dateRappel)
                  ? "bg-red-50 text-red-700 border-red-200"
                  : isToday(prospect.dateRappel)
                  ? "bg-orange-50 text-orange-700 border-orange-200"
                  : "bg-gray-50 text-gray-700 border-gray-200"
              }
            >
              <Calendar className="h-3 w-3 mr-1" />
              {isToday(prospect.dateRappel)
                ? "Aujourd'hui"
                : isOverdue(prospect.dateRappel)
                ? `Retard (${formatDate(prospect.dateRappel)})`
                : formatDate(prospect.dateRappel)}
            </Badge>
          )}
        </div>

        {/* Notes */}
        {prospect.notesProspection && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {prospect.notesProspection}
          </p>
        )}

        {/* Actions - Desktop */}
        <div className="hidden sm:flex items-center gap-2 pt-2 border-t">
          <Button
            variant={actionButton.variant}
            size="sm"
            className="flex-1"
            onClick={() => onCall(prospect)}
          >
            <ActionIcon className="h-3.5 w-3.5 mr-1" />
            {actionButton.label}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onQualify(prospect)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyPhone}>
                <Copy className="h-4 w-4 mr-2" />
                Copier le téléphone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyEmail}>
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

        {/* Actions - Mobile */}
        <div className="sm:hidden pt-2 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                Actions
                <MoreVertical className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onCall(prospect)}>
                <ActionIcon className="h-4 w-4 mr-2" />
                {actionButton.label}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQualify(prospect)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Qualifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyPhone}>
                <Copy className="h-4 w-4 mr-2" />
                Copier téléphone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Copier email
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
      </CardContent>
    </Card>
  );
}
