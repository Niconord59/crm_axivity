import { Metadata } from "next";
import { PortailHeader } from "@/components/portail";

export const metadata: Metadata = {
  title: "Portail Client - CRM Axivity",
  description: "Accédez à vos projets et factures",
};

export default function PortailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Portail Header with Navigation */}
      <PortailHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Axivity - Tous droits réservés</p>
            <div className="flex items-center gap-4">
              <a href="mailto:contact@axivity.fr" className="hover:text-foreground">
                Contact
              </a>
              <a href="#" className="hover:text-foreground">
                Mentions légales
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
