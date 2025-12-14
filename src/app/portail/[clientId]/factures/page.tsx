"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Download, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, PageLoading, EmptyState, KPICard } from "@/components/shared";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useClient } from "@/hooks/use-clients";
import { useFactures } from "@/hooks/use-factures";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";

export default function PortailFacturesPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const { data: client, isLoading: loadingClient } = useClient(clientId);
  const { data: factures, isLoading: loadingFactures } = useFactures({
    clientId,
  });

  const isLoading = loadingClient || loadingFactures;

  if (isLoading) {
    return <PageLoading />;
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-lg font-semibold">Accès non autorisé</h2>
        <p className="text-muted-foreground mt-1">
          Ce portail client n'est pas disponible.
        </p>
      </div>
    );
  }

  // Calculate totals
  const facturesEnAttente = factures?.filter((f) => f.statut === "Envoyé") || [];
  const facturesPayees = factures?.filter((f) => f.statut === "Payé") || [];

  const totalEnAttente = facturesEnAttente.reduce(
    (sum, f) => sum + (f.montantTTC || 0),
    0
  );
  const totalPaye = facturesPayees.reduce(
    (sum, f) => sum + (f.montantTTC || 0),
    0
  );

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/portail/${clientId}`}>Accueil</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Factures</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vos Factures</h1>
          <p className="text-muted-foreground">
            Consultez et téléchargez vos factures
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="En attente de paiement"
          value={formatCurrency(totalEnAttente)}
          description={`${facturesEnAttente.length} facture${facturesEnAttente.length > 1 ? "s" : ""}`}
          icon={Clock}
        />
        <KPICard
          title="Factures payées"
          value={formatCurrency(totalPaye)}
          description={`${facturesPayees.length} facture${facturesPayees.length > 1 ? "s" : ""}`}
          icon={CheckCircle}
        />
        <KPICard
          title="Total factures"
          value={factures?.length || 0}
          description="Toutes périodes confondues"
          icon={FileText}
        />
      </div>

      {!factures || factures.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune facture"
          description="Vous n'avez pas encore de factures."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historique des factures</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {factures.map((facture) => {
                const enRetard =
                  facture.statut === "Envoyé" &&
                  facture.dateEcheance &&
                  isOverdue(facture.dateEcheance);

                return (
                  <div
                    key={facture.id}
                    className={`flex items-center gap-4 p-4 ${
                      enRetard ? "bg-destructive/5" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {facture.numero || "Sans numéro"}
                        </p>
                        {enRetard && (
                          <Badge variant="destructive" className="text-xs">
                            En retard
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                        <StatusBadge
                          status={facture.statut || "Brouillon"}
                          type="invoice"
                        />
                        <span>
                          Émise le{" "}
                          {facture.dateEmission
                            ? formatDate(facture.dateEmission)
                            : "N/A"}
                        </span>
                        {facture.dateEcheance && (
                          <span className={enRetard ? "text-destructive font-medium" : ""}>
                            Échéance: {formatDate(facture.dateEcheance)}
                          </span>
                        )}
                        {facture.datePaiement && (
                          <span className="text-green-600">
                            Payée le {formatDate(facture.datePaiement)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatCurrency(facture.montantTTC)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        HT: {formatCurrency(facture.montantHT)}
                      </p>
                    </div>

                    <Button variant="outline" size="sm" className="hidden sm:flex">
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment info */}
      {totalEnAttente > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg">Informations de paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pour régler vos factures, vous pouvez effectuer un virement bancaire
              aux coordonnées suivantes :
            </p>
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">IBAN :</span>{" "}
                <span className="font-mono">FR76 XXXX XXXX XXXX XXXX XXXX XXX</span>
              </p>
              <p>
                <span className="text-muted-foreground">BIC :</span>{" "}
                <span className="font-mono">XXXXXXXX</span>
              </p>
              <p>
                <span className="text-muted-foreground">Titulaire :</span> Axivity
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Merci d'indiquer le numéro de facture en référence de votre virement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
