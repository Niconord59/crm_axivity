"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "./use-auth";
import type { Notification, NotificationType } from "@/types";

// =============================================================================
// MAPPER: DB → TypeScript
// =============================================================================

interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function mapToNotification(record: DbNotification): Notification {
  return {
    id: record.id,
    userId: record.user_id,
    type: record.type as NotificationType,
    title: record.title,
    message: record.message ?? undefined,
    link: record.link ?? undefined,
    isRead: record.is_read,
    createdAt: record.created_at,
  };
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Get all notifications for the current user
 */
export function useNotifications(options?: { unreadOnly?: boolean }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.notifications.list(options),
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (options?.unreadOnly) {
        query = query.eq("is_read", false);
      }

      const { data, error } = await query;

      // Gracefully handle missing table (migration not run yet)
      if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
        console.warn("Table notifications does not exist. Run migration 20_projet_membres_notifications.sql");
        return [];
      }
      if (error) throw error;
      return (data || []).map(mapToNotification);
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Get count of unread notifications
 */
export function useUnreadNotificationsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      // Gracefully handle missing table (migration not run yet)
      if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
        return 0;
      }
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Mark a notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

/**
 * Create a notification (used internally by API routes)
 * This is typically called from the API route, not directly from components
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      type,
      title,
      message,
      link,
    }: {
      userId: string;
      type: NotificationType;
      title: string;
      message?: string;
      link?: string;
    }) => {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          type,
          title,
          message,
          link,
        })
        .select()
        .single();

      // Gracefully handle missing table (migration not run yet)
      if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
        console.warn("Table notifications does not exist. Run migration 20_projet_membres_notifications.sql");
        return null;
      }
      if (error) throw error;
      return mapToNotification(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

/**
 * Delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}
