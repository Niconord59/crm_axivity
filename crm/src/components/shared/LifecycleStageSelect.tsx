"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { LifecycleStage } from "@/types";
import {
  LIFECYCLE_STAGES,
  LIFECYCLE_STAGE_LABELS,
  LIFECYCLE_STAGE_COLORS,
} from "@/types/constants";
import { isLifecycleDowngrade } from "@/hooks/use-lifecycle-stage";
import { LIFECYCLE_STAGE_ICONS } from "./lifecycle-stage-icons";

interface LifecycleStageSelectProps {
  value: LifecycleStage | undefined;
  onChange: (value: LifecycleStage) => void;
  disabled?: boolean;
  currentStage?: LifecycleStage;
  className?: string;
  placeholder?: string;
}

export function LifecycleStageSelect({
  value,
  onChange,
  disabled = false,
  currentStage,
  className,
  placeholder = "Sélectionner un stage",
}: LifecycleStageSelectProps) {
  const [pendingStage, setPendingStage] = useState<LifecycleStage | null>(null);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);

  const handleValueChange = (newValue: string) => {
    const newStage = newValue as LifecycleStage;
    const stageToCheck = currentStage || value;

    // Check if this is a downgrade
    if (stageToCheck && isLifecycleDowngrade(stageToCheck, newStage)) {
      setPendingStage(newStage);
      setShowDowngradeDialog(true);
    } else {
      onChange(newStage);
    }
  };

  const handleConfirmDowngrade = () => {
    if (pendingStage) {
      onChange(pendingStage);
    }
    setShowDowngradeDialog(false);
    setPendingStage(null);
  };

  const handleCancelDowngrade = () => {
    setShowDowngradeDialog(false);
    setPendingStage(null);
  };

  const selectedLabel = value ? LIFECYCLE_STAGE_LABELS[value] : undefined;
  const SelectedIcon = value ? LIFECYCLE_STAGE_ICONS[value] : undefined;
  const selectedColor = value ? LIFECYCLE_STAGE_COLORS[value] : undefined;

  return (
    <>
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={cn("w-full", className)}>
          <SelectValue placeholder={placeholder}>
            {value && SelectedIcon && (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center justify-center h-5 w-5 rounded",
                    selectedColor
                  )}
                >
                  <SelectedIcon className="h-3 w-3 text-white" />
                </span>
                <span>{selectedLabel}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LIFECYCLE_STAGES.map((stage) => {
            const Icon = LIFECYCLE_STAGE_ICONS[stage];
            const label = LIFECYCLE_STAGE_LABELS[stage];
            const bgColor = LIFECYCLE_STAGE_COLORS[stage];

            return (
              <SelectItem key={stage} value={stage}>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center h-5 w-5 rounded",
                      bgColor
                    )}
                  >
                    <Icon className="h-3 w-3 text-white" />
                  </span>
                  <span>{label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Downgrade Confirmation Dialog */}
      <AlertDialog
        open={showDowngradeDialog}
        onOpenChange={setShowDowngradeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmer le rétrogradage
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de rétrograder ce contact de{" "}
              <strong>
                {currentStage
                  ? LIFECYCLE_STAGE_LABELS[currentStage]
                  : value
                  ? LIFECYCLE_STAGE_LABELS[value]
                  : ""}
              </strong>{" "}
              vers{" "}
              <strong>
                {pendingStage ? LIFECYCLE_STAGE_LABELS[pendingStage] : ""}
              </strong>
              .
              <br />
              <br />
              Cette action est inhabituelle dans un processus commercial normal.
              Êtes-vous sûr de vouloir continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDowngrade}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDowngrade}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Confirmer le rétrogradage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
