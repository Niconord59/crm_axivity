"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  StatusBadge,
  PageLoading,
  EmptyState,
  KPICard,
  ExportButton,
} from "@/components/shared";
import { factureExportColumns } from "@/lib/export";
import { FactureForm } from "@/components/forms";
import { useFactures, useMarquerFacturePayee } from "@/hooks/use-factures";
import { useFacturesRealtime } from "@/hooks/use-realtime";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import { INVOICE_STATUSES, FACTURE_TYPE_LABELS, FACTURE_TYPE_COLORS, type InvoiceStatus } from "@/types";

export default function FacturesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: factures, isLoading } = useFactures(
    statusFilter !== "all" ? { statut: statusFilter as InvoiceStatus } : undefined
  );
  const marquerPayee = useMarquerFacturePayee();

  // S'abonner aux changements Realtime pour rafraîchir automatiquement
  useFacturesRealtime();

  if (isLoading) {
    return <PageLoading />;
  }

  // Calculate KPIs
  const facturesEnvoyees = factures?.filter((f) => f.statut === "Envoyé") || [];
  const facturesPayees = factures?.filter((f) => f.statut === "Payé") || [];
  const facturesEnRetard = facturesEnvoyees.filter(
    (f) => f.dateEcheance && isOverdue(f.dateEcheance)
  );

  const totalEnAttente = facturesEnvoyees.reduce(
    (sum, f) => sum + (f.montantTTC || 0),
    0
  );
  const totalEnRetard = facturesEnRetard.reduce(
    (sum, f) => sum + (f.montantTTC || 0),
    0
  );
  const totalPaye = facturesPayees.reduce(
    (sum, f) => sum + (f.montantTTC || 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Factures"
        description="Gérez vos factures et suivez les paiements"
      >
        <div className="flex items-center gap-2">
          <ExportButton
            data={factures || []}
            columns={factureExportColumns}
            filename="factures"
            sheetName="Factures"
          />
          <FactureForm />
          {facturesEnRetard.length > 0 && (
            <Button variant="destructive" size="sm" asChild>
              <Link href="/factures/relances">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Relances ({facturesEnRetard.length})
              </Link>
            </Button>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {INVOICE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="En Attente"
          value={formatCurrency(totalEnAttente)}
          description={`${facturesEnvoyees.length} factures`}
          icon={Clock}
        />
        <KPICard
          title="En Retard"
          value={formatCurrency(totalEnRetard)}
          description={`${facturesEnRetard.length} factures`}
          icon={AlertTriangle}
        />
        <KPICard
          title="Payées (ce mois)"
          value={formatCurrency(totalPaye)}
          description={`${facturesPayees.length} factures`}
          icon={CheckCircle}
        />
        <KPICard
          title="Total Factures"
          value={factures?.length || 0}
          icon={FileText}
        />
      </div>

      {/* Factures List */}
      {!factures || factures.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune facture"
          description="Créez votre première facture pour commencer."
        >
          <FactureForm />
        </EmptyState>
      ) : (
        <Card>
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
                        {facture.typeFacture && facture.typeFacture !== "unique" && (
                          <Badge
                            variant="outline"
                            className={`text-xs text-white ${FACTURE_TYPE_COLORS[facture.typeFacture]}`}
                          >
                            {FACTURE_TYPE_LABELS[facture.typeFacture]}
                          </Badge>
                        )}
                        {facture.niveauRelance && facture.niveauRelance > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Relance N{facture.niveauRelance}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge
                          status={facture.statut || "Brouillon"}
                          type="invoice"
                        />
                        <span className="text-xs text-muted-foreground">
                          Émise le{" "}
                          {facture.dateEmission
                            ? formatDate(facture.dateEmission)
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:block text-right">
                      <p
                        className={`font-medium ${
                          enRetard ? "text-destructive" : ""
                        }`}
                      >
                        Échéance:{" "}
                        {facture.dateEcheance
                          ? formatDate(facture.dateEcheance)
                          : "N/A"}
                      </p>
                      {facture.datePaiement && (
                        <p className="text-xs text-muted-foreground">
                          Payée le {formatDate(facture.datePaiement)}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatCurrency(facture.montantTTC)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        HT: {formatCurrency(facture.montantHT)}
                      </p>
                    </div>

                    {facture.statut === "Envoyé" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => marquerPayee.mutate(facture.id)}
                        disabled={marquerPayee.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Payée
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
