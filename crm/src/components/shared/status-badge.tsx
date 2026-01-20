"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ProjectStatus,
  OpportunityStatus,
  TaskStatus,
  InvoiceStatus,
  TaskPriority,
} from "@/types";

// Project Status
const projectStatusConfig: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  Cadrage: {
    label: "Cadrage",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  "En cours": {
    label: "En cours",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  "En pause": {
    label: "En pause",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
  Terminé: {
    label: "Terminé",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  Annulé: {
    label: "Annulé",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
};

// Opportunity Status
const opportunityStatusConfig: Record<
  OpportunityStatus,
  { label: string; className: string }
> = {
  Qualifié: {
    label: "Qualifié",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  Proposition: {
    label: "Proposition",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  },
  Négociation: {
    label: "Négociation",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  },
  Gagné: {
    label: "Gagné",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  Perdu: {
    label: "Perdu",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
};

// Task Status
const taskStatusConfig: Record<TaskStatus, { label: string; className: string }> = {
  "À faire": {
    label: "À faire",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  "En cours": {
    label: "En cours",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  "En revue": {
    label: "En revue",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  },
  Terminé: {
    label: "Terminé",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
};

// Invoice Status
const invoiceStatusConfig: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  Brouillon: {
    label: "Brouillon",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  Envoyé: {
    label: "Envoyé",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  Payé: {
    label: "Payé",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  Annulé: {
    label: "Annulé",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
  "En retard": {
    label: "En retard",
    className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  },
};

// Task Priority
const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  Basse: {
    label: "Basse",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  Moyenne: {
    label: "Moyenne",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  Haute: {
    label: "Haute",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  },
  Critique: {
    label: "Critique",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
};

interface StatusBadgeProps {
  status: string;
  type: "project" | "opportunity" | "task" | "invoice" | "priority";
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  let config: { label: string; className: string } | undefined;

  switch (type) {
    case "project":
      config = projectStatusConfig[status as ProjectStatus];
      break;
    case "opportunity":
      config = opportunityStatusConfig[status as OpportunityStatus];
      break;
    case "task":
      config = taskStatusConfig[status as TaskStatus];
      break;
    case "invoice":
      config = invoiceStatusConfig[status as InvoiceStatus];
      break;
    case "priority":
      config = priorityConfig[status as TaskPriority];
      break;
  }

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
