"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { tourSteps, getTourProgress } from "@/lib/tour-steps";
import { cn } from "@/lib/utils";

interface OnboardingTourProps {
  isOpen: boolean;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onGoToStep: (step: number) => void;
  onSkip: () => void;
  onComplete: () => void;
  onClose: () => void;
}

export function OnboardingTour({
  isOpen,
  currentStep,
  onNext,
  onPrev,
  onGoToStep,
  onSkip,
  onComplete,
  onClose,
}: OnboardingTourProps) {
  const router = useRouter();
  const pathname = usePathname();
  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;
  const progress = getTourProgress(currentStep);

  // Navigate to step route if specified
  useEffect(() => {
    if (isOpen && step?.route && pathname !== step.route) {
      router.push(step.route);
    }
  }, [isOpen, step?.route, pathname, router]);

  // Highlight sidebar nav item
  useEffect(() => {
    if (!isOpen || !step?.spotlightNav) return;

    // Find and highlight the nav item
    const navLinks = document.querySelectorAll("aside nav a, [data-sheet-content] nav a");
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href === step.spotlightNav) {
        link.classList.add("tour-spotlight");
      } else {
        link.classList.remove("tour-spotlight");
      }
    });

    return () => {
      navLinks.forEach((link) => {
        link.classList.remove("tour-spotlight");
      });
    };
  }, [isOpen, step?.spotlightNav, currentStep]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
        case "Enter":
        case " ": // Space bar
          e.preventDefault();
          if (isLastStep) {
            onComplete();
          } else {
            onNext();
          }
          break;
        case "ArrowLeft":
          if (!isFirstStep) {
            onPrev();
          }
          break;
      }
    },
    [isOpen, isFirstStep, isLastStep, onNext, onPrev, onComplete, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !step) return null;

  const Icon = step.icon;
  const isCenterPosition = step.position === "center" || !step.target;

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Tour card */}
      <div
        className={cn(
          "fixed z-[101] w-full max-w-md px-4 animate-in fade-in slide-in-from-bottom-4 duration-300",
          isCenterPosition
            ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            : "bottom-8 left-1/2 -translate-x-1/2 lg:bottom-auto lg:left-auto lg:right-8 lg:top-24 lg:translate-x-0"
        )}
      >
        <Card className="shadow-2xl border-2">
          <CardHeader className="pb-3">
            {/* Progress bar */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Étape {currentStep + 1} / {tourSteps.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fermer</span>
              </Button>
            </div>

            <Progress value={progress} className="h-1.5" />

            {/* Step header */}
            <div className="flex items-start gap-3 mt-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg leading-tight">
                  {step.title}
                </h3>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </CardContent>

          <CardFooter className="flex items-center justify-between gap-2 pt-2 border-t">
            {/* Left actions */}
            <div>
              {!isLastStep && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-muted-foreground"
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Passer
                </Button>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button variant="outline" size="sm" onClick={onPrev}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
              )}

              {isLastStep ? (
                <Button size="sm" onClick={onComplete}>
                  Commencer
                </Button>
              ) : (
                <Button size="sm" onClick={onNext}>
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Step dots navigation */}
        <div className="flex justify-center gap-1.5 mt-4">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-2 rounded-full transition-all duration-200",
                index === currentStep
                  ? "w-6 bg-primary"
                  : index < currentStep
                  ? "w-2 bg-primary/50"
                  : "w-2 bg-muted-foreground/30"
              )}
              onClick={() => {
                if (index !== currentStep) {
                  onGoToStep(index);
                }
              }}
              aria-label={`Aller à l'étape ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
