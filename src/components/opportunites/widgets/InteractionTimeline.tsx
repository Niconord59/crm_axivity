"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Loader2,
  History,
  Phone,
  Mail,
  Video,
  MessageSquare,
  Clock,
  ArrowRight,
  StickyNote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Interaction } from "@/types";

interface InteractionTimelineProps {
  interactions: Interaction[] | undefined;
  isLoading: boolean;
}

export function InteractionTimeline({ interactions, isLoading }: InteractionTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!interactions || interactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
        <p className="font-medium">Aucune interaction</p>
        <p className="text-xs mt-1">Les appels et emails seront enregistrés ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">
          {interactions.length} interaction{interactions.length > 1 ? "s" : ""}
        </p>
        <Badge variant="secondary" className="text-xs">
          <History className="h-3 w-3 mr-1" />
          Historique
        </Badge>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        {interactions.map((interaction) => {
          const isEmail = interaction.type === "Email";
          const isCall = interaction.type === "Appel";
          const isMeeting = interaction.type === "Réunion";
          const isNote = interaction.type === "Note";

          const iconBg = isEmail
            ? "bg-blue-100 text-blue-600"
            : isCall
            ? "bg-orange-100 text-orange-600"
            : isMeeting
            ? "bg-violet-100 text-violet-600"
            : isNote
            ? "bg-amber-100 text-amber-600"
            : "bg-gray-100 text-gray-600";

          return (
            <div key={interaction.id} className="relative pl-10 pb-6 last:pb-0">
              {/* Timeline dot */}
              <div
                className={cn(
                  "absolute left-0 top-0 h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-background",
                  iconBg
                )}
              >
                {isEmail ? (
                  <Mail className="h-4 w-4" />
                ) : isCall ? (
                  <Phone className="h-4 w-4" />
                ) : isMeeting ? (
                  <Video className="h-4 w-4" />
                ) : isNote ? (
                  <StickyNote className="h-4 w-4" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
              </div>

              <div
                className={cn(
                  "p-4 rounded-xl border transition-colors",
                  isEmail
                    ? "bg-blue-50/50 border-blue-200"
                    : isNote
                    ? "bg-amber-50/50 border-amber-200"
                    : "bg-muted/30"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium text-sm">{interaction.objet}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {interaction.type}
                  </Badge>
                </div>

                {interaction.date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <Clock className="h-3 w-3" />
                    {format(parseISO(interaction.date), "PPP 'à' HH:mm", { locale: fr })}
                  </p>
                )}

                {interaction.resume && (
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-background/50 rounded-lg p-3 border">
                    {interaction.resume}
                  </div>
                )}

                {interaction.prochaineTache && (
                  <p className="text-sm text-primary mt-2 flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    {interaction.prochaineTache}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
