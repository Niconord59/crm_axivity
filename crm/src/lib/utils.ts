import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency in EUR
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "N/A";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format percentage
export function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null) return "N/A";
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format date in French
export function formatDate(date: string | undefined | null): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

// Format relative date (e.g., "il y a 3 jours")
export function formatRelativeDate(date: string | undefined | null): string {
  if (!date) return "N/A";
  const now = new Date();
  const target = new Date(date);
  const diffDays = Math.floor(
    (now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} ans`;
}

// Check if a date is overdue
export function isOverdue(date: string | undefined | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

// Calculate days until or since a date
export function daysDiff(date: string | undefined | null): number {
  if (!date) return 0;
  const now = new Date();
  const target = new Date(date);
  return Math.floor(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}
