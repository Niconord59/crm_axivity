"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";
import { OnboardingTour } from "@/components/onboarding";
import { tourSteps } from "@/lib/tour-steps";

interface OnboardingContextValue {
  startTour: () => void;
  hasCompletedTour: boolean;
  hasSeenTour: boolean;
  isInitialized: boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const {
    isOpen,
    currentStep,
    hasCompletedTour,
    hasSkippedTour,
    isInitialized,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    setIsOpen,
  } = useOnboardingTour();

  const hasSeenTour = hasCompletedTour || hasSkippedTour;

  const handleNext = () => nextStep(tourSteps.length);
  const handleClose = () => setIsOpen(false);

  return (
    <OnboardingContext.Provider
      value={{
        startTour,
        hasCompletedTour,
        hasSeenTour,
        isInitialized,
      }}
    >
      {children}
      <OnboardingTour
        isOpen={isOpen}
        currentStep={currentStep}
        onNext={handleNext}
        onPrev={prevStep}
        onSkip={skipTour}
        onComplete={completeTour}
        onClose={handleClose}
      />
    </OnboardingContext.Provider>
  );
}
