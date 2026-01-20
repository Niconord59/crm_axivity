"use client";

import { ManualNoteForm, InteractionTimeline } from "../widgets";
import type { Interaction } from "@/types";

interface OpportunityHistoryTabProps {
  interactions: Interaction[] | undefined;
  isLoading: boolean;
  contactId: string | undefined;
  onAddNote: (note: string) => Promise<void>;
}

export function OpportunityHistoryTab({
  interactions,
  isLoading,
  contactId,
  onAddNote,
}: OpportunityHistoryTabProps) {
  return (
    <div>
      {/* Manual Note Form */}
      <div className="mb-6">
        <ManualNoteForm
          onSubmit={onAddNote}
          isDisabled={!contactId}
          disabledMessage="Cette opportunité doit être liée à un contact pour ajouter des notes"
        />
      </div>

      {/* Interactions Timeline */}
      <InteractionTimeline interactions={interactions} isLoading={isLoading} />
    </div>
  );
}
