"use client";

import { cn } from "@/lib/utils";
import { Check, Phone, PhoneOff, Calendar, CalendarCheck, UserCheck, Target } from "lucide-react";

// Définition des étapes du parcours prospect
const PROSPECT_STEPS = [
  {
    id: "contact",
    label: "1er contact",
    icon: Phone,
    description: "Premier appel passé",
  },
  {
    id: "etabli",
    label: "Contact établi",
    icon: PhoneOff,
    description: "Conversation avec le prospect",
  },
  {
    id: "rdv_planifie",
    label: "RDV planifié",
    icon: Calendar,
    description: "Rendez-vous programmé",
  },
  {
    id: "rdv_effectue",
    label: "RDV effectué",
    icon: CalendarCheck,
    description: "Rendez-vous réalisé",
  },
  {
    id: "qualifie",
    label: "Qualifié",
    icon: UserCheck,
    description: "Lead qualifié",
  },
  {
    id: "opportunite",
    label: "Opportunité",
    icon: Target,
    description: "Opportunité créée",
  },
] as const;

// Mapper les statuts de prospect vers l'étape correspondante
function getStepIndexFromStatus(status?: string): number {
  if (!status) return -1;

  switch (status) {
    case "À appeler":
      return -1; // Pas encore commencé
    case "Appelé - pas répondu":
      return 0; // 1er contact (tenté)
    case "Rappeler":
      return 1; // Contact établi (conversation)
    case "RDV planifié":
      return 2; // RDV planifié
    case "RDV effectué":
      return 3; // RDV effectué
    case "Qualifié":
      return 4; // Qualifié
    case "Non qualifié":
    case "Perdu":
      return -2; // Parcours terminé (échec)
    default:
      return -1;
  }
}

// Obtenir le message d'aide selon le statut
function getHelperMessage(status?: string): { text: string; type: "info" | "success" | "warning" } | null {
  if (!status) return null;

  switch (status) {
    case "À appeler":
      return { text: "Passez votre premier appel pour démarrer le parcours", type: "info" };
    case "Appelé - pas répondu":
      return { text: "Le prospect n'a pas répondu, réessayez plus tard", type: "warning" };
    case "Rappeler":
      return { text: "Rappelez à la date prévue pour maintenir le contact", type: "info" };
    case "RDV planifié":
      return { text: "Après le RDV, mettez à jour le statut", type: "info" };
    case "RDV effectué":
      return { text: "Qualifiez le lead ou marquez-le comme non qualifié", type: "info" };
    case "Qualifié":
      return { text: "Créez une opportunité pour suivre ce prospect", type: "success" };
    case "Non qualifié":
      return { text: "Ce prospect ne correspond pas à votre cible", type: "warning" };
    case "Perdu":
      return { text: "Ce prospect n'est plus intéressé", type: "warning" };
    default:
      return null;
  }
}

interface ProspectProgressStepperProps {
  currentStatus?: string;
  className?: string;
}

export function ProspectProgressStepper({ currentStatus, className }: ProspectProgressStepperProps) {
  const currentStepIndex = getStepIndexFromStatus(currentStatus);
  const helperMessage = getHelperMessage(currentStatus);
  const isLost = currentStatus === "Non qualifié" || currentStatus === "Perdu";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Stepper horizontal */}
      <div className="flex items-center justify-between">
        {PROSPECT_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStepIndex >= index;
          const isCurrent = currentStepIndex === index;
          const isDisabled = isLost || currentStepIndex < index;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted && !isCurrent && "bg-green-500 border-green-500 text-white",
                    isCurrent && "bg-primary border-primary text-primary-foreground animate-pulse",
                    isDisabled && !isCompleted && "bg-muted border-muted-foreground/30 text-muted-foreground/50",
                    isLost && "bg-red-100 border-red-300 text-red-500"
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1 text-center leading-tight max-w-[60px]",
                    isCurrent && "font-semibold text-primary",
                    isCompleted && !isCurrent && "text-green-600",
                    isDisabled && !isCompleted && "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < PROSPECT_STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-1",
                    currentStepIndex > index ? "bg-green-500" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Helper message */}
      {helperMessage && (
        <div
          className={cn(
            "text-xs px-3 py-2 rounded-md text-center",
            helperMessage.type === "info" && "bg-blue-50 text-blue-700 border border-blue-200",
            helperMessage.type === "success" && "bg-green-50 text-green-700 border border-green-200",
            helperMessage.type === "warning" && "bg-amber-50 text-amber-700 border border-amber-200"
          )}
        >
          {helperMessage.text}
        </div>
      )}
    </div>
  );
}
