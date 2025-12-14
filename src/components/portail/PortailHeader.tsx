"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { FolderKanban, FileText, Home, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useClient } from "@/hooks/use-clients";

const NAV_ITEMS = [
  { href: "", label: "Accueil", icon: Home },
  { href: "/projets", label: "Projets", icon: FolderKanban },
  { href: "/factures", label: "Factures", icon: FileText },
];

export function PortailHeader() {
  const params = useParams();
  const pathname = usePathname();
  const clientId = params.clientId as string | undefined;

  const { data: client, isLoading } = useClient(clientId);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Branding */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">
                A
              </span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-sm">Axivity</h1>
              <p className="text-xs text-muted-foreground">Portail Client</p>
            </div>
          </div>

          {/* Navigation - Only show if clientId is available */}
          {clientId && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const href = `/portail/${clientId}${item.href}`;
                const isActive = pathname === href;
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "gap-2",
                        isActive && "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Client Info */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24 hidden sm:block" />
              </div>
            ) : client ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(client.nom)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:block max-w-[150px] truncate">
                  {client.nom}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Navigation */}
        {clientId && (
          <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const href = `/portail/${clientId}${item.href}`;
              const isActive = pathname === href;
              const Icon = item.icon;

              return (
                <Link key={item.href} href={href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2 whitespace-nowrap",
                      isActive && "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
