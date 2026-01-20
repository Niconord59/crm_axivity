"use client";

import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Hook spécialisé pour la page Prospection
 * S'abonne aux changements sur contacts et clients
 */
export function useProspectionRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Éviter les subscriptions en double
    if (channelRef.current) return;

    const channel = supabase.channel("prospection-realtime");
    channelRef.current = channel;

    // Écouter les changements sur contacts
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "contacts" },
      (payload) => {
        console.log("[Realtime] Contact change:", payload.eventType);
        // Invalider toutes les queries liées aux prospects
        queryClient.invalidateQueries({ queryKey: ["prospects"] });
      }
    );

    // Écouter les changements sur clients
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "clients" },
      (payload) => {
        console.log("[Realtime] Client change:", payload.eventType);
        // Invalider les queries clients et prospects (car prospects affichent le nom client)
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        queryClient.invalidateQueries({ queryKey: ["prospects"] });
      }
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[Realtime] Prospection channel connected");
      }
    });

    return () => {
      console.log("[Realtime] Prospection channel disconnected");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, queryClient]);
}

/**
 * Hook spécialisé pour le Pipeline Commercial (Opportunités)
 * S'abonne aux changements sur opportunites, clients, contacts
 */
export function usePipelineRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (channelRef.current) return;

    const channel = supabase.channel("pipeline-realtime");
    channelRef.current = channel;

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "opportunites" },
      (payload) => {
        console.log("[Realtime] Opportunité change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["opportunites"] });
      }
    );

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "clients" },
      (payload) => {
        console.log("[Realtime] Client change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        queryClient.invalidateQueries({ queryKey: ["opportunites"] });
      }
    );

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "contacts" },
      (payload) => {
        console.log("[Realtime] Contact change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        queryClient.invalidateQueries({ queryKey: ["opportunites"] });
      }
    );

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "interactions" },
      (payload) => {
        console.log("[Realtime] Interaction change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["interactions"] });
        queryClient.invalidateQueries({ queryKey: ["opportunites"] });
      }
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[Realtime] Pipeline channel connected");
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, queryClient]);
}

/**
 * Hook spécialisé pour la page Projets
 * S'abonne aux changements sur projets, taches
 */
export function useProjetsRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (channelRef.current) return;

    const channel = supabase.channel("projets-realtime");
    channelRef.current = channel;

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "projets" },
      (payload) => {
        console.log("[Realtime] Projet change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["projets"] });
      }
    );

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "taches" },
      (payload) => {
        console.log("[Realtime] Tâche change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["taches"] });
        queryClient.invalidateQueries({ queryKey: ["projets"] });
      }
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[Realtime] Projets channel connected");
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, queryClient]);
}

/**
 * Hook spécialisé pour les Factures et Devis
 */
export function useFacturesRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (channelRef.current) return;

    const channel = supabase.channel("factures-realtime");
    channelRef.current = channel;

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "factures" },
      (payload) => {
        console.log("[Realtime] Facture change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["factures"] });
      }
    );

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "devis" },
      (payload) => {
        console.log("[Realtime] Devis change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["devis"] });
      }
    );

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "lignes_devis" },
      (payload) => {
        console.log("[Realtime] Ligne devis change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["lignes-devis"] });
        queryClient.invalidateQueries({ queryKey: ["devis"] });
      }
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[Realtime] Factures channel connected");
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, queryClient]);
}

/**
 * Hook spécialisé pour le Dashboard
 * S'abonne à toutes les tables principales pour les KPIs
 */
export function useDashboardRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (channelRef.current) return;

    const channel = supabase.channel("dashboard-realtime");
    channelRef.current = channel;

    // Clients
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "clients" },
      (payload) => {
        console.log("[Realtime] Dashboard - clients change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["clients"] });
      }
    );

    // Opportunités
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "opportunites" },
      (payload) => {
        console.log("[Realtime] Dashboard - opportunites change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["opportunites"] });
      }
    );

    // Projets
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "projets" },
      (payload) => {
        console.log("[Realtime] Dashboard - projets change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["projets"] });
      }
    );

    // Tâches
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "taches" },
      (payload) => {
        console.log("[Realtime] Dashboard - taches change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["taches"] });
      }
    );

    // Factures
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "factures" },
      (payload) => {
        console.log("[Realtime] Dashboard - factures change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["factures"] });
      }
    );

    // Contacts
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "contacts" },
      (payload) => {
        console.log("[Realtime] Dashboard - contacts change:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        queryClient.invalidateQueries({ queryKey: ["prospects"] });
      }
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[Realtime] Dashboard channel connected");
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, queryClient]);
}
