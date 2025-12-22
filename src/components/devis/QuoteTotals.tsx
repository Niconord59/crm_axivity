"use client";

import { cn } from "@/lib/utils";

interface QuoteTotalsProps {
  totalHT: number;
  tva: number;
  totalTTC: number;
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function QuoteTotals({
  totalHT,
  tva,
  totalTTC,
  className,
}: QuoteTotalsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Sous-total HT</span>
        <span className="font-medium">{formatCurrency(totalHT)}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">TVA (20%)</span>
        <span className="font-medium">{formatCurrency(tva)}</span>
      </div>
      <div className="h-px bg-border my-2" />
      <div className="flex justify-between items-center">
        <span className="font-semibold">Total TTC</span>
        <span className="text-lg font-bold text-primary">
          {formatCurrency(totalTTC)}
        </span>
      </div>
    </div>
  );
}
