import {
  LayoutDashboard,
  Phone,
  FolderKanban,
  Target,
  CheckSquare,
  Users,
  FileText,
  Search,
  Bell,
  type LucideIcon,
} from "lucide-react";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  // Target element selector (optional - for highlighting)
  target?: string;
  // Position of the tooltip relative to target
  position?: "top" | "bottom" | "left" | "right" | "center";
  // Route to navigate to (optional)
  route?: string;
  // Spotlight the sidebar nav item
  spotlightNav?: string;
}

export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Bienvenue sur CRM Axivity !",
    description:
      "Découvrez votre cockpit opérationnel pour gérer l'ensemble de votre agence IA. Ce tour rapide vous présente les fonctionnalités principales.",
    icon: LayoutDashboard,
    position: "center",
  },
  {
    id: "dashboard",
    title: "Tableau de bord",
    description:
      "Votre vue d'ensemble avec les KPIs clés : chiffre d'affaires, projets en cours, opportunités et tâches urgentes. Tout ce dont vous avez besoin en un coup d'œil.",
    icon: LayoutDashboard,
    route: "/",
    spotlightNav: "/",
  },
  {
    id: "prospection",
    title: "Prospection",
    description:
      "Gérez vos leads et votre activité commerciale. Importez des contacts depuis un CSV, suivez vos appels, et convertissez vos prospects en opportunités.",
    icon: Phone,
    route: "/prospection",
    spotlightNav: "/prospection",
  },
  {
    id: "projets",
    title: "Gestion de Projets",
    description:
      "Suivez tous vos projets clients avec une vue Kanban. Visualisez l'avancement, les budgets et les deadlines de chaque projet.",
    icon: FolderKanban,
    route: "/projets",
    spotlightNav: "/projets",
  },
  {
    id: "opportunites",
    title: "Pipeline Commercial",
    description:
      "Votre pipeline de ventes en mode Kanban. Faites glisser les opportunités entre les étapes : Qualification, Proposition, Négociation, jusqu'à Gagné !",
    icon: Target,
    route: "/opportunites",
    spotlightNav: "/opportunites",
  },
  {
    id: "taches",
    title: "Gestion des Tâches",
    description:
      "Organisez le travail de votre équipe. Assignez des tâches, suivez les deadlines et gardez un œil sur les retards.",
    icon: CheckSquare,
    route: "/taches",
    spotlightNav: "/taches",
  },
  {
    id: "clients",
    title: "Base Clients",
    description:
      "Votre CRM centralisé avec une fiche 360° pour chaque client : projets, factures, contacts et historique des interactions.",
    icon: Users,
    route: "/clients",
    spotlightNav: "/clients",
  },
  {
    id: "factures",
    title: "Facturation",
    description:
      "Gérez vos factures et suivez les paiements. Visualisez les montants dus, en retard, et le chiffre d'affaires encaissé.",
    icon: FileText,
    route: "/factures",
    spotlightNav: "/factures",
  },
  {
    id: "search",
    title: "Recherche Rapide",
    description:
      "Utilisez Cmd+K (ou Ctrl+K) pour rechercher instantanément des projets, clients, tâches ou opportunités. Gagnez du temps !",
    icon: Search,
    target: "[data-tour='search-button']",
    position: "bottom",
  },
  {
    id: "notifications",
    title: "Notifications",
    description:
      "Restez informé des événements importants : nouvelles tâches, rappels, factures en retard, et plus encore.",
    icon: Bell,
    target: "[data-tour='notifications']",
    position: "bottom",
  },
  {
    id: "complete",
    title: "C'est parti !",
    description:
      "Vous êtes prêt à utiliser CRM Axivity. Vous pouvez relancer ce tour à tout moment depuis le bouton d'aide dans la barre de navigation.",
    icon: LayoutDashboard,
    position: "center",
  },
];

export function getTourProgress(currentStep: number): number {
  return Math.round((currentStep / (tourSteps.length - 1)) * 100);
}
