"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROSPECT_STATUSES, PROSPECT_SOURCES, LIFECYCLE_STAGES, LIFECYCLE_STAGE_LABELS } from "@/types";
import type { ProspectFilters } from "@/hooks/use-prospects";
import type { LifecycleStage } from "@/types";

interface ProspectionFiltersProps {
  filters: ProspectFilters;
  onFiltersChange: (filters: ProspectFilters) => void;
}

export function ProspectionFilters({
  filters,
  onFiltersChange,
}: ProspectionFiltersProps) {
  // Le filtre date de rappel n'est pertinent que pour le statut "Rappeler"
  const showDateRappelFilter = filters.statut === "Rappeler";

  const handleStatusChange = (value: string) => {
    const newStatut = value === "all" ? undefined : value as ProspectFilters["statut"];

    // Réinitialiser le filtre dateRappel si on change de statut
    onFiltersChange({
      ...filters,
      statut: newStatut,
      dateRappel: newStatut === "Rappeler" ? filters.dateRappel : undefined,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un lead..."
          value={filters.search || ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value || undefined })
          }
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <Select
        value={typeof filters.statut === "string" ? filters.statut : "all"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          {PROSPECT_STATUSES.map((statut) => (
            <SelectItem key={statut} value={statut}>
              {statut}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Source filter */}
      <Select
        value={filters.source || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            source: value === "all" ? undefined : value as ProspectFilters["source"],
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes sources</SelectItem>
          {PROSPECT_SOURCES.map((source) => (
            <SelectItem key={source} value={source}>
              {source}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Lifecycle Stage filter */}
      <Select
        value={filters.lifecycleStage || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            lifecycleStage: value === "all" ? undefined : value as LifecycleStage,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les stages</SelectItem>
          {LIFECYCLE_STAGES.map((stage) => (
            <SelectItem key={stage} value={stage}>
              {LIFECYCLE_STAGE_LABELS[stage]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date rappel filter - seulement visible pour le statut "Rappeler" */}
      {showDateRappelFilter && (
        <Select
          value={filters.dateRappel || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              dateRappel: value === "all" ? undefined : value as ProspectFilters["dateRappel"],
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Quand ?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="today">Aujourd&apos;hui</SelectItem>
            <SelectItem value="this_week">Cette semaine</SelectItem>
            <SelectItem value="overdue">En retard</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
