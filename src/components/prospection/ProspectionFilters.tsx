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
import { PROSPECT_STATUSES, PROSPECT_SOURCES } from "@/types";
import type { ProspectFilters } from "@/hooks/use-prospects";

interface ProspectionFiltersProps {
  filters: ProspectFilters;
  onFiltersChange: (filters: ProspectFilters) => void;
}

export function ProspectionFilters({
  filters,
  onFiltersChange,
}: ProspectionFiltersProps) {
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
        value={filters.statut as string || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            statut: value === "all" ? undefined : value as ProspectFilters["statut"],
          })
        }
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

      {/* Date rappel filter */}
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
          <SelectValue placeholder="Rappel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les rappels</SelectItem>
          <SelectItem value="today">Aujourd&apos;hui</SelectItem>
          <SelectItem value="this_week">Cette semaine</SelectItem>
          <SelectItem value="overdue">En retard</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
