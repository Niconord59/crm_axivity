"use client";

import { useState, useEffect } from "react";
import { Search, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileSidebar } from "./Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchCommand, NotificationPanel } from "@/components/shared";
import { TourTrigger } from "@/components/onboarding";
import { useOnboarding } from "@/providers/onboarding-provider";
import { useAuthContext } from "@/providers/auth-provider";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { startTour, hasCompletedTour, isInitialized } = useOnboarding();
  const { user, signOut, isLoading } = useAuthContext();

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for search
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
      // "?" for tour (only when not typing in an input)
      if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        startTour();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [startTour]);

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return "U";
    const first = user.prenom?.[0] || user.nom?.[0] || "";
    const last = user.prenom ? user.nom?.[0] : "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
        <MobileSidebar />

        {/* Search button (all screens) */}
        <div className="flex-1">
          <Button
            variant="outline"
            className="relative w-full max-w-md justify-start text-sm text-muted-foreground"
            onClick={() => setSearchOpen(true)}
            data-tour="search-button"
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Rechercher...</span>
            <span className="sm:hidden">Rechercher</span>
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              Ctrl+K
            </kbd>
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Tour trigger */}
          {isInitialized && (
            <TourTrigger
              onClick={startTour}
              hasCompletedTour={hasCompletedTour}
            />
          )}

          {/* Notifications */}
          <div data-tour="notifications">
            <NotificationPanel />
          </div>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  {user?.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.nom} />
                  )}
                  <AvatarFallback>{isLoading ? "..." : getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user ? `${user.prenom || ""} ${user.nom}`.trim() : "Utilisateur"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                <span>Mon profil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search Command Dialog */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
