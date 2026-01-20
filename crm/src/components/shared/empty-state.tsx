"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon, FileQuestion, Plus } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
  };
  /** Contenu personnalisé (ex: formulaire) - alternative à action */
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {children ? (
        <div className="mt-4">{children}</div>
      ) : action ? (
        <Button className="mt-4" onClick={action.onClick}>
          <Plus className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
