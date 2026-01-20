"use client";

import { useState } from "react";
import { StickyNote, Loader2, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ManualNoteFormProps {
  onSubmit: (note: string) => Promise<void>;
  isDisabled?: boolean;
  disabledMessage?: string;
}

export function ManualNoteForm({
  onSubmit,
  isDisabled = false,
  disabledMessage
}: ManualNoteFormProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!note.trim() || isDisabled) return;

    setIsSubmitting(true);
    try {
      await onSubmit(note.trim());
      setNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
          <StickyNote className="h-4 w-4 text-amber-600" />
        </div>
        <Label className="font-medium text-amber-900">Ajouter une note</Label>
      </div>
      <div className="flex gap-2">
        <Textarea
          placeholder="Écrire une note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[60px] resize-y bg-white"
          rows={2}
        />
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !note.trim() || isDisabled}
          size="icon"
          className="h-[60px] w-12 shrink-0 bg-amber-600 hover:bg-amber-700"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      {isDisabled && disabledMessage && (
        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {disabledMessage}
        </p>
      )}
    </div>
  );
}
