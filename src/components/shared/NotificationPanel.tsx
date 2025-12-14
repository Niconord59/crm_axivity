"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check, AlertTriangle, FileText, FolderKanban, Clock } from "lucide-react";
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
import { formatDate, isOverdue } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "task" | "invoice" | "project";
  title: string;
  description: string;
  href: string;
  isUrgent: boolean;
  date?: string;
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false);

  const { data: tachesEnRetard } = useTachesEnRetard();
  const { data: facturesImpayees } = useFacturesImpayees();
  const { data: projetsActifs } = useProjetsActifs();

  // Build notifications from real data
  const notifications: Notification[] = [];

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

  const notificationCount = notifications.length;
  const hasNotifications = notificationCount > 0;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "task":
        return <Clock className="h-4 w-4" />;
      case "invoice":
        return <FileText className="h-4 w-4" />;
      case "project":
        return <FolderKanban className="h-4 w-4" />;
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
                Aucune notification pour le moment
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex gap-3 p-4 hover:bg-muted/50 transition-colors",
                    notification.isUrgent && "bg-destructive/5"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      notification.isUrgent
                        ? "bg-destructive/10 text-destructive"
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
                        Échéance: {formatDate(notification.date)}
                      </p>
                    )}
                  </div>
                </Link>
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
