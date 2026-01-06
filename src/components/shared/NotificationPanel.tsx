"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, Check, AlertTriangle, FileText, FolderKanban, Clock, X, Phone, Video, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTachesEnRetard } from "@/hooks/use-taches";
import { useFacturesImpayees } from "@/hooks/use-factures";
import { useProjetsActifs } from "@/hooks/use-projets";
import { useRappelsAujourdhui, useRdvAujourdhui } from "@/hooks/use-prospects";
import { useNotifications, useMarkNotificationAsRead } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, isOverdue } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: "task" | "invoice" | "project" | "callback" | "rdv" | "project_assigned";
  title: string;
  description: string;
  href: string;
  isUrgent: boolean;
  date?: string;
  /** True if this is a database notification that needs to be marked as read */
  isDbNotification?: boolean;
}

const DISMISSED_KEY = "crm-notifications-dismissed";

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const { user, isAdmin } = useAuth();

  // Admin sees all notifications, others see only their own
  const userId = isAdmin() ? undefined : user?.id;

  const { data: tachesEnRetard } = useTachesEnRetard(userId);
  const { data: facturesImpayees } = useFacturesImpayees(); // Factures are global
  const { data: projetsActifs } = useProjetsActifs(userId);
  const { data: rappelsAujourdhui } = useRappelsAujourdhui(userId);
  const { data: rdvAujourdhui } = useRdvAujourdhui(userId);

  // Database notifications (e.g., project assignments)
  const { data: dbNotifications } = useNotifications({ unreadOnly: true });
  const markAsRead = useMarkNotificationAsRead();

  // Load dismissed notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedIds(new Set(parsed));
      } catch {
        // Invalid data, reset
        localStorage.removeItem(DISMISSED_KEY);
      }
    }
  }, []);

  // Dismiss a notification
  const dismissNotification = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Clear all dismissed (reset)
  const clearDismissed = useCallback(() => {
    setDismissedIds(new Set());
    localStorage.removeItem(DISMISSED_KEY);
  }, []);

  // Build notifications from real data
  const notifications: NotificationItem[] = [];

  // Add database notifications first (project assignments, etc.)
  dbNotifications?.slice(0, 5).forEach((notif) => {
    notifications.push({
      id: `db-${notif.id}`,
      type: notif.type === "project_assigned" ? "project_assigned" : "project",
      title: notif.title,
      description: notif.message || "",
      href: notif.link || "/projets",
      isUrgent: false,
      date: notif.createdAt,
      isDbNotification: true,
    });
  });

  // Add overdue tasks
  tachesEnRetard?.slice(0, 3).forEach((tache) => {
    notifications.push({
      id: `task-${tache.id}`,
      type: "task",
      title: "Tâche en retard",
      description: tache.nom,
      href: "/taches",
      isUrgent: true,
      date: tache.dateEcheance,
    });
  });

  // Add unpaid invoices
  facturesImpayees?.slice(0, 3).forEach((facture) => {
    notifications.push({
      id: `invoice-${facture.id}`,
      type: "invoice",
      title: "Facture impayée",
      description: facture.numero || "Sans numéro",
      href: "/factures/relances",
      isUrgent: facture.niveauRelance ? facture.niveauRelance >= 2 : false,
      date: facture.dateEcheance,
    });
  });

  // Add projects nearing deadline
  projetsActifs
    ?.filter((p) => p.dateFinPrevue && isOverdue(p.dateFinPrevue))
    .slice(0, 2)
    .forEach((projet) => {
      notifications.push({
        id: `project-${projet.id}`,
        type: "project",
        title: "Projet en retard",
        description: projet.nomProjet || projet.briefProjet || "Sans nom",
        href: `/projets/${projet.id}`,
        isUrgent: true,
        date: projet.dateFinPrevue,
      });
    });

  // Add callbacks scheduled for today
  rappelsAujourdhui?.slice(0, 3).forEach((prospect) => {
    const contactName = prospect.prenom
      ? `${prospect.prenom} ${prospect.nom}`
      : prospect.nom;
    notifications.push({
      id: `callback-${prospect.id}`,
      type: "callback",
      title: "Rappel à faire",
      description: `${contactName}${prospect.clientNom ? ` - ${prospect.clientNom}` : ""}`,
      href: `/prospection?leadId=${prospect.id}`,
      isUrgent: false,
      date: prospect.dateRappel,
    });
  });

  // Add RDV scheduled for today
  rdvAujourdhui?.slice(0, 3).forEach((prospect) => {
    const contactName = prospect.prenom
      ? `${prospect.prenom} ${prospect.nom}`
      : prospect.nom;
    const isVisio = prospect.typeRdv === "Visio";
    notifications.push({
      id: `rdv-${prospect.id}`,
      type: "rdv",
      title: isVisio ? "Visio aujourd'hui" : "RDV aujourd'hui",
      description: `${contactName}${prospect.clientNom ? ` - ${prospect.clientNom}` : ""}`,
      href: `/prospection?leadId=${prospect.id}`,
      isUrgent: true,
      date: prospect.dateRdvPrevu,
    });
  });

  // Filter out dismissed notifications
  const visibleNotifications = notifications.filter(
    (n) => !dismissedIds.has(n.id)
  );
  const notificationCount = visibleNotifications.length;
  const hasNotifications = notificationCount > 0;
  const hasDismissed = dismissedIds.size > 0;

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "task":
        return <Clock className="h-4 w-4" />;
      case "invoice":
        return <FileText className="h-4 w-4" />;
      case "project":
        return <FolderKanban className="h-4 w-4" />;
      case "project_assigned":
        return <Users className="h-4 w-4" />;
      case "callback":
        return <Phone className="h-4 w-4" />;
      case "rdv":
        return <Video className="h-4 w-4" />;
    }
  };

  // Handle notification click - mark DB notifications as read
  const handleNotificationClick = (notification: NotificationItem) => {
    if (notification.isDbNotification) {
      // Extract the actual ID from "db-xxx"
      const dbId = notification.id.replace("db-", "");
      markAsRead.mutate(dbId);
    } else {
      dismissNotification(notification.id);
    }
    setOpen(false);
  };

  // Handle dismiss button click
  const handleDismiss = (notification: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.isDbNotification) {
      const dbId = notification.id.replace("db-", "");
      markAsRead.mutate(dbId);
    } else {
      dismissNotification(notification.id);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          {hasNotifications && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="font-semibold">Notifications</h4>
          {hasNotifications && (
            <span className="text-xs text-muted-foreground">
              {notificationCount} notification{notificationCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {!hasNotifications ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Check className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Tout est à jour</p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasDismissed
                  ? "Toutes les notifications ont été lues"
                  : "Aucune notification pour le moment"}
              </p>
              {hasDismissed && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={clearDismissed}
                >
                  Restaurer les notifications
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-3 p-4 hover:bg-muted/50 transition-colors relative group",
                    notification.isUrgent && "bg-destructive/5",
                    notification.type === "project_assigned" && "bg-blue-50"
                  )}
                >
                  <Link
                    href={notification.href}
                    onClick={() => handleNotificationClick(notification)}
                    className="flex gap-3 flex-1 min-w-0"
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        notification.isUrgent
                          ? "bg-destructive/10 text-destructive"
                          : notification.type === "project_assigned"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {notification.isUrgent ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        getIcon(notification.type)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.description}
                      </p>
                      {notification.date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.isDbNotification ? "" : "Échéance: "}
                          {formatDate(notification.date)}
                        </p>
                      )}
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                    onClick={(e) => handleDismiss(notification, e)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Masquer</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {hasNotifications && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm"
                onClick={() => setOpen(false)}
                asChild
              >
                <Link href="/taches">Voir toutes les alertes</Link>
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
