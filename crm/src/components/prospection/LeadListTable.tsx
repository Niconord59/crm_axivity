"use client";

import React from "react";
import {
  Phone,
  Mail,
  Calendar,
  Copy,
  Video,
  MapPin,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { Prospect } from "@/hooks/use-prospects";
import { formatDate, cn } from "@/lib/utils";
import { LifecycleStageBadge } from "@/components/shared/LifecycleStageBadge";

interface LeadListTableProps {
  prospects: Prospect[];
  onCall: (prospect: Prospect) => void;
}

function getStatusBadgeClass(status: string | undefined): string {
  switch (status) {
    case "À appeler":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Appelé - pas répondu":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Rappeler":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "RDV planifié":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "Qualifié":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Non qualifié":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Perdu":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getAvatarClass(status: string | undefined): string {
  switch (status) {
    case "À appeler":
      return "bg-blue-100 text-blue-700";
    case "Appelé - pas répondu":
      return "bg-slate-100 text-slate-600";
    case "Rappeler":
      return "bg-orange-100 text-orange-700";
    case "RDV planifié":
      return "bg-violet-100 text-violet-700";
    case "Qualifié":
      return "bg-emerald-100 text-emerald-700";
    case "Non qualifié":
      return "bg-amber-100 text-amber-700";
    case "Perdu":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getSourceBadgeClass(source: string | undefined): string {
  switch (source) {
    case "LinkedIn":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Site web":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Salon":
      return "bg-green-50 text-green-700 border-green-200";
    case "Recommandation":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function isToday(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateString === today;
}

function isOverdue(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateString < today;
}

export const LeadListTable = React.memo(function LeadListTable({
  prospects,
  onCall,
}: LeadListTableProps) {
  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[220px]">Nom</TableHead>
            <TableHead className="hidden sm:table-cell">Entreprise</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="hidden md:table-cell">Stage</TableHead>
            <TableHead className="hidden lg:table-cell">Source</TableHead>
            <TableHead className="hidden md:table-cell">Téléphone</TableHead>
            <TableHead className="hidden lg:table-cell">Email</TableHead>
            <TableHead className="hidden sm:table-cell">Rappel / RDV</TableHead>
            <TableHead className="w-[80px] text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prospects.map((prospect) => {
            const fullName = prospect.prenom
              ? `${prospect.prenom} ${prospect.nom}`
              : prospect.nom;
            const initials = prospect.prenom
              ? `${prospect.prenom[0]}${prospect.nom[0]}`
              : prospect.nom.slice(0, 2);
            const isUrgent =
              isOverdue(prospect.dateRappel) ||
              (prospect.statutProspection === "RDV planifié" &&
                isToday(prospect.dateRdvPrevu));

            return (
              <TableRow
                key={prospect.id}
                className={cn(
                  "cursor-pointer",
                  isUrgent && "bg-red-50/50"
                )}
                onClick={() => onCall(prospect)}
              >
                {/* Nom + Avatar */}
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      className={cn(
                        "h-8 w-8 shrink-0",
                        getAvatarClass(prospect.statutProspection)
                      )}
                    >
                      <AvatarFallback
                        className={cn(
                          "text-xs font-semibold",
                          getAvatarClass(prospect.statutProspection)
                        )}
                      >
                        {initials.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm truncate max-w-[160px]">
                      {fullName}
                    </span>
                  </div>
                </TableCell>

                {/* Entreprise */}
                <TableCell className="hidden sm:table-cell">
                  <span className="text-sm text-muted-foreground truncate max-w-[140px] block">
                    {prospect.clientNom || "—"}
                  </span>
                </TableCell>

                {/* Statut */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-medium px-2 py-0 whitespace-nowrap",
                      getStatusBadgeClass(prospect.statutProspection)
                    )}
                  >
                    {prospect.statutProspection || "N/A"}
                  </Badge>
                </TableCell>

                {/* Lifecycle Stage */}
                <TableCell className="hidden md:table-cell">
                  {prospect.lifecycleStage ? (
                    <LifecycleStageBadge
                      stage={prospect.lifecycleStage}
                      size="sm"
                      showLabel={true}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Source */}
                <TableCell className="hidden lg:table-cell">
                  {prospect.sourceLead ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        getSourceBadgeClass(prospect.sourceLead)
                      )}
                    >
                      {prospect.sourceLead}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Téléphone */}
                <TableCell className="hidden md:table-cell">
                  {prospect.telephone ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) =>
                              handleCopy(e, prospect.telephone!, "Téléphone")
                            }
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group/phone"
                          >
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{prospect.telephone}</span>
                            <Copy className="h-3 w-3 opacity-0 group-hover/phone:opacity-50 transition-opacity" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Cliquer pour copier</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Email */}
                <TableCell className="hidden lg:table-cell">
                  {prospect.email ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) =>
                              handleCopy(e, prospect.email!, "Email")
                            }
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group/email max-w-[180px]"
                          >
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{prospect.email}</span>
                            <Copy className="h-3 w-3 opacity-0 group-hover/email:opacity-50 transition-opacity shrink-0" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Cliquer pour copier</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Rappel / RDV */}
                <TableCell className="hidden sm:table-cell">
                  <div className="flex flex-wrap gap-1">
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
                    {!prospect.dateRappel && !prospect.dateRdvPrevu && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>

                {/* Action */}
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCall(prospect);
                    }}
                  >
                    Voir
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

LeadListTable.displayName = "LeadListTable";
