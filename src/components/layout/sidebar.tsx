"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Target,
  Phone,
  CheckSquare,
  Users,
  FileText,
  UsersRound,
  BarChart3,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Prospection",
    href: "/prospection",
    icon: Phone,
  },
  {
    title: "Projets",
    href: "/projets",
    icon: FolderKanban,
  },
  {
    title: "Opportunités",
    href: "/opportunites",
    icon: Target,
  },
  {
    title: "Tâches",
    href: "/taches",
    icon: CheckSquare,
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    title: "Factures",
    href: "/factures",
    icon: FileText,
  },
];

const secondaryNavItems: NavItem[] = [
  {
    title: "Équipe",
    href: "/equipe",
    icon: UsersRound,
  },
  {
    title: "Rapports",
    href: "/rapports",
    icon: BarChart3,
  },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <item.icon className="h-4 w-4" />
      <span>{item.title}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo-axivity.png"
            alt="Axivity"
            width={160}
            height={48}
            className="h-10 w-auto"
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} onClick={onLinkClick} />
          ))}
        </nav>

        <Separator className="my-4" />

        <nav className="flex flex-col gap-1">
          {secondaryNavItems.map((item) => (
            <NavLink key={item.href} item={item} onClick={onLinkClick} />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          CRM Axivity v1.0
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r bg-card lg:block">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu de navigation</SheetTitle>
        </SheetHeader>
        <SidebarContent onLinkClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
