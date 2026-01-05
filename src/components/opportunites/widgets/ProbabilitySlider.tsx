"use client";

import { Target, TrendingUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/utils";

interface ProbabilitySliderProps {
  value: number;
  onChange: (value: number) => void;
  montant: number;
}

export function ProbabilitySlider({ value, onChange, montant }: ProbabilitySliderProps) {
  const valeurPonderee = montant * (value / 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          <Label className="text-base font-semibold">Probabilité</Label>
        </div>
        <span className="text-xl font-bold">{value}%</span>
      </div>

      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        max={100}
        step={5}
        className="py-2"
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Faible</span>
        <span>Moyen</span>
        <span>Fort</span>
      </div>

      {/* Weighted Value */}
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Valeur pondérée</span>
          </div>
          <span className="text-lg font-bold text-primary">
            {formatCurrency(valeurPonderee)}
          </span>
        </div>
      </div>
    </div>
  );
}
