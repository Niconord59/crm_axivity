"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

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

function getLocalTourState(): TourState {
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

function saveLocalTourState(state: TourState): void {
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
  const [userId, setUserId] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());

  // Sync tour state to Supabase
  const syncToSupabase = useCallback(async (state: TourState) => {
    if (!userId) return;

    try {
      await supabaseRef.current
        .from("profiles")
        .update({
          tour_completed: state.hasCompletedTour,
          tour_skipped: state.hasSkippedTour,
          tour_version: state.lastSeenVersion,
        })
        .eq("id", userId);
    } catch (error) {
      console.error("Error syncing tour state to Supabase:", error);
    }
  }, [userId]);

  // Save state to both localStorage and Supabase
  const saveTourState = useCallback((state: TourState) => {
    saveLocalTourState(state);
    syncToSupabase(state);
  }, [syncToSupabase]);

  // Initialize from Supabase (if authenticated) or localStorage
  useEffect(() => {
    const initTourState = async () => {
      // First, load from localStorage for fast initial render
      const localState = getLocalTourState();
      setTourState(localState);

      // Then try to get authenticated user and sync from Supabase
      try {
        const { data: { session } } = await supabaseRef.current.auth.getSession();

        if (session?.user) {
          setUserId(session.user.id);

          // Fetch tour state from Supabase
          const { data: profile } = await supabaseRef.current
            .from("profiles")
            .select("tour_completed, tour_skipped, tour_version")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            const supabaseState: TourState = {
              hasCompletedTour: profile.tour_completed ?? false,
              hasSkippedTour: profile.tour_skipped ?? false,
              currentStep: 0,
              lastSeenVersion: profile.tour_version ?? "",
            };

            // Merge states: Supabase takes priority for persistence flags
            const mergedState: TourState = {
              hasCompletedTour: supabaseState.hasCompletedTour || localState.hasCompletedTour,
              hasSkippedTour: supabaseState.hasSkippedTour || localState.hasSkippedTour,
              currentStep: localState.currentStep, // Keep local step for session continuity
              lastSeenVersion: supabaseState.lastSeenVersion || localState.lastSeenVersion,
            };

            setTourState(mergedState);
            saveLocalTourState(mergedState);

            // Use merged state for auto-open decision
            const isNewUser = !mergedState.hasCompletedTour && !mergedState.hasSkippedTour;
            const hasNewVersion = mergedState.lastSeenVersion !== CURRENT_TOUR_VERSION && mergedState.hasCompletedTour;

            if (isNewUser || hasNewVersion) {
              setTimeout(() => setIsOpen(true), 1000);
            }

            setIsInitialized(true);
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching tour state from Supabase:", error);
      }

      // Fallback to localStorage only
      setIsInitialized(true);

      const isNewUser = !localState.hasCompletedTour && !localState.hasSkippedTour;
      const hasNewVersion = localState.lastSeenVersion !== CURRENT_TOUR_VERSION && localState.hasCompletedTour;

      if (isNewUser || hasNewVersion) {
        setTimeout(() => setIsOpen(true), 1000);
      }
    };

    initTourState();
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
  }, [saveTourState]);

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
  }, [tourState, saveTourState]);

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
  }, [tourState, saveTourState]);

  const resetTour = useCallback(() => {
    const newState = defaultTourState;
    saveTourState(newState);
    setTourState(newState);
  }, [saveTourState]);

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
