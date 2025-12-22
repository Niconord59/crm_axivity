"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TourTriggerProps {
  onClick: () => void;
  hasSeenTour: boolean;
}

export function TourTrigger({ onClick, hasSeenTour }: TourTriggerProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className="relative"
            data-tour="help-button"
          >
            <HelpCircle className="h-5 w-5" />
            {!hasSeenTour && (
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
            )}
            <span className="sr-only">Aide et visite guidée</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Visite guidée</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
