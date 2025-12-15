"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileSidebar } from "./Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SearchCommand, NotificationPanel } from "@/components/shared";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Rechercher...</span>
            <span className="sm:hidden">Rechercher</span>
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationPanel />

          {/* User avatar */}
          <Avatar className="h-8 w-8">
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Search Command Dialog */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
