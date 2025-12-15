"use client";

import { useState, useEffect, useCallback } from "react";

const TOUR_STORAGE_KEY = "crm-axivity-tour-state";

export interface TourState {
  hasCompletedTour: boolean;
  hasSkippedTour: boolean;
  currentStep: number;
  lastSeenVersion: string;
}

const CURRENT_TOUR_VERSION = "1.0.0";

const defaultTourState: TourState = {
  hasCompletedTour: false,
  hasSkippedTour: false,
  currentStep: 0,
  lastSeenVersion: "",
};

function getTourState(): TourState {
  if (typeof window === "undefined") return defaultTourState;

  try {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as TourState;
    }
  } catch {
    // Ignore localStorage errors
  }
  return defaultTourState;
}

function saveTourState(state: TourState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage errors
  }
}

export function useOnboardingTour() {
  const [tourState, setTourState] = useState<TourState>(defaultTourState);
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const state = getTourState();
    setTourState(state);
    setIsInitialized(true);

    // Auto-open tour for first-time users
    const isNewUser = !state.hasCompletedTour && !state.hasSkippedTour;
    const hasNewVersion = state.lastSeenVersion !== CURRENT_TOUR_VERSION && state.hasCompletedTour;

    if (isNewUser || hasNewVersion) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      currentStep: 0,
    }));
    setIsOpen(true);
  }, []);

  const nextStep = useCallback((totalSteps: number) => {
    setTourState((prev) => {
      const newStep = prev.currentStep + 1;
      if (newStep >= totalSteps) {
        // Tour completed
        const newState = {
          ...prev,
          hasCompletedTour: true,
          currentStep: 0,
          lastSeenVersion: CURRENT_TOUR_VERSION,
        };
        saveTourState(newState);
        setIsOpen(false);
        return newState;
      }
      return { ...prev, currentStep: newStep };
    });
  }, []);

  const prevStep = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setTourState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const skipTour = useCallback(() => {
    const newState = {
      ...tourState,
      hasSkippedTour: true,
      currentStep: 0,
      lastSeenVersion: CURRENT_TOUR_VERSION,
    };
    saveTourState(newState);
    setTourState(newState);
    setIsOpen(false);
  }, [tourState]);

  const completeTour = useCallback(() => {
    const newState = {
      ...tourState,
      hasCompletedTour: true,
      currentStep: 0,
      lastSeenVersion: CURRENT_TOUR_VERSION,
    };
    saveTourState(newState);
    setTourState(newState);
    setIsOpen(false);
  }, [tourState]);

  const resetTour = useCallback(() => {
    const newState = defaultTourState;
    saveTourState(newState);
    setTourState(newState);
  }, []);

  return {
    // State
    isOpen,
    currentStep: tourState.currentStep,
    hasCompletedTour: tourState.hasCompletedTour,
    hasSkippedTour: tourState.hasSkippedTour,
    isInitialized,

    // Actions
    startTour,
    nextStep,
    prevStep,
    goToStep,
    skipTour,
    completeTour,
    resetTour,
    setIsOpen,
  };
}
