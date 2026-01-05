"use client";

import { Plus, Minus, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

// Quick amount presets
const AMOUNT_PRESETS = [5000, 10000, 25000, 50000, 100000, 200000];

// Quick increment amounts
const INCREMENT_AMOUNTS = [1000, 5000];

interface AmountSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export function AmountSelector({ value, onChange }: AmountSelectorProps) {
  const handleAmountChange = (inputValue: string) => {
    const num = parseInt(inputValue.replace(/[^0-9]/g, ""), 10);
    onChange(isNaN(num) ? 0 : num);
  };

  const handlePresetClick = (amount: number) => {
    onChange(amount);
  };

  const handleIncrement = (amount: number) => {
    onChange(value + amount);
  };

  const handleDecrement = (amount: number) => {
    onChange(Math.max(0, value - amount));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Euro className="h-5 w-5 text-emerald-600" />
        <Label className="text-base font-semibold">Montant estimé</Label>
      </div>

      {/* Main Amount Input */}
      <div className="relative">
        <Input
          type="text"
          value={value.toLocaleString("fr-FR")}
          onChange={(e) => handleAmountChange(e.target.value)}
          className="text-2xl font-bold h-14 pr-10 text-right"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
          €
        </span>
      </div>

      {/* Quick Preset Buttons */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Montants rapides</p>
        <div className="flex flex-wrap gap-2">
          {AMOUNT_PRESETS.map((amount) => (
            <Button
              key={amount}
              type="button"
              variant={value === amount ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetClick(amount)}
              className="text-xs"
            >
              {formatCurrency(amount)}
            </Button>
          ))}
        </div>
      </div>

      {/* Increment/Decrement Buttons */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {INCREMENT_AMOUNTS.map((amount) => (
            <Button
              key={`add-${amount}`}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleIncrement(amount)}
              className="flex-1 text-xs text-emerald-600"
            >
              <Plus className="h-3 w-3 mr-1" />
              {amount >= 1000 ? `${amount / 1000}k` : amount}
            </Button>
          ))}
        </div>
        <div className="flex-1 flex gap-1">
          {INCREMENT_AMOUNTS.map((amount) => (
            <Button
              key={`sub-${amount}`}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDecrement(amount)}
              className="flex-1 text-xs text-red-600"
              disabled={value < amount}
            >
              <Minus className="h-3 w-3 mr-1" />
              {amount >= 1000 ? `${amount / 1000}k` : amount}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
