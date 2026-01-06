"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useProjetMembres, useSetProjetMembres } from "@/hooks/use-projet-membres";
import { useCreateNotification } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

interface AssignTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetId: string;
  projetNom: string;
}

interface Profile {
  id: string;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  role: string;
  avatar_url: string | null;
}

function getFullName(profile: Profile): string | null {
  return [profile.prenom, profile.nom].filter(Boolean).join(" ") || null;
}

function getInitials(nom?: string | null): string {
  if (!nom) return "?";
  const parts = nom.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return nom.substring(0, 2).toUpperCase();
}

function getAvatarColor(id: string): string {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-amber-500",
    "bg-rose-500",
  ];
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function AssignTeamModal({
  open,
  onOpenChange,
  projetId,
  projetNom,
}: AssignTeamModalProps) {
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialIds, setInitialIds] = useState<Set<string>>(new Set());

  // Fetch current project members
  const { data: currentMembres, isLoading: loadingMembres } = useProjetMembres(projetId);

  // Fetch all team profiles (excluding clients)
  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["profiles", "team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nom, prenom, email, role, avatar_url")
        .in("role", ["admin", "developpeur_nocode", "developpeur_automatisme", "commercial"])
        .order("nom", { ascending: true });

      if (error) throw error;
      return data as Profile[];
    },
    enabled: open,
  });

  const setMembres = useSetProjetMembres();
  const createNotification = useCreateNotification();

  // Initialize selected IDs when current members are loaded
  useEffect(() => {
    if (currentMembres) {
      const ids = new Set(currentMembres.map((m) => m.profileId));
      setSelectedIds(ids);
      setInitialIds(ids);
    }
  }, [currentMembres]);

  const toggleSelection = (profileId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!user?.id) return;

    const selectedArray = Array.from(selectedIds);

    // Find newly added members (for notifications)
    const newMembers = selectedArray.filter((id) => !initialIds.has(id));

    try {
      // Update project members
      await setMembres.mutateAsync({
        projetId,
        profileIds: selectedArray,
        assignedBy: user.id,
      });

      // Create notifications for newly assigned members
      for (const profileId of newMembers) {
        await createNotification.mutateAsync({
          userId: profileId,
          type: "project_assigned",
          title: "Nouveau projet assigné",
          message: `Vous avez été assigné au projet "${projetNom}"`,
          link: `/projets?id=${projetId}`,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning team members:", error);
    }
  };

  const isLoading = loadingMembres || loadingProfiles;
  const hasChanges = !areSetsEqual(selectedIds, initialIds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigner l'équipe
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les membres à assigner au projet &quot;{projetNom}&quot;
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-2">
              {profiles?.map((profile) => (
                <label
                  key={profile.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                    selectedIds.has(profile.id)
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted border border-transparent"
                  )}
                  onClick={() => toggleSelection(profile.id)}
                >
                  <Checkbox
                    checked={selectedIds.has(profile.id)}
                    onCheckedChange={() => toggleSelection(profile.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback
                      className={cn("text-white text-xs", getAvatarColor(profile.id))}
                    >
                      {getInitials(getFullName(profile))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {getFullName(profile) || profile.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile.email}
                    </p>
                  </div>
                  {selectedIds.has(profile.id) && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </label>
              ))}

              {profiles?.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Aucun membre disponible
                </p>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || setMembres.isPending}
          >
            {setMembres.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Enregistrer ({selectedIds.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function areSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

export default AssignTeamModal;
