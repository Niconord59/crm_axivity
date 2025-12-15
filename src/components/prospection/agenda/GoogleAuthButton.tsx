"use client";

import { Button } from "@/components/ui/button";
import { useGoogleCalendarAuth } from "@/hooks/use-google-calendar";
import { Calendar, LogOut, Loader2 } from "lucide-react";

interface GoogleAuthButtonProps {
  className?: string;
}

export function GoogleAuthButton({ className }: GoogleAuthButtonProps) {
  const { isConnected, isLoading, hasError, connect, disconnect, userEmail } =
    useGoogleCalendarAuth();

  if (isLoading) {
    return (
      <Button disabled className={className} variant="outline">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Chargement...
      </Button>
    );
  }

  if (hasError) {
    return (
      <Button onClick={connect} variant="destructive" className={className}>
        <Calendar className="mr-2 h-4 w-4" />
        Reconnecter Google Calendar
      </Button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{userEmail}</span>
        <Button onClick={disconnect} variant="ghost" size="sm">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connect} className={className}>
      <Calendar className="mr-2 h-4 w-4" />
      Connecter Google Calendar
    </Button>
  );
}
