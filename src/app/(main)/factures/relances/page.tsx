"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PageHeader,
  StatusBadge,
  PageLoading,
  EmptyState,
  KPICard,
} from "@/components/shared";
import { AppBreadcrumb } from "@/components/layout";
import { useFactures, useMarquerFacturePayee } from "@/hooks/use-factures";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import { differenceInDays } from "date-fns";

interface RelanceLevel {
  niveau: number;
  label: string;
  description: string;
  color: string;
  icon: React.ElementType;
  joursRetard: string;
}

const RELANCE_LEVELS: RelanceLevel[] = [
  {
    niveau: 1,
    label: "N1 - Premier rappel",
    description: "J+1 à J+7 après échéance",
    color: "bg-yellow-500",
    icon: Clock,
    joursRetard: "1-7 jours",
  },
  {
    niveau: 2,
    label: "N2 - Deuxième rappel",
    description: "J+7 à J+15 après échéance",
    color: "bg-orange-500",
    icon: AlertCircle,
    joursRetard: "7-15 jours",
  },
  {
    niveau: 3,
    label: "N3 - Mise en demeure",
    description: "J+15 ou plus après échéance",
    color: "bg-red-500",
    icon: XCircle,
    joursRetard: "15+ jours",
  },
];

function getRelanceLevel(dateEcheance: string): number {
  const joursRetard = differenceInDays(new Date(), new Date(dateEcheance));
  if (joursRetard <= 0) return 0;
  if (joursRetard <= 7) return 1;
  if (joursRetard <= 15) return 2;
  return 3;
}

export default function RelancesPage() {
  const { data: factures, isLoading } = useFactures({ statut: "Envoyé" });
  const marquerPayee = useMarquerFacturePayee();

  if (isLoading) {
    return <PageLoading />;
  }

  // Filter only overdue invoices
  const facturesEnRetard =
    factures?.filter(
      (f) => f.dateEcheance && isOverdue(f.dateEcheance)
    ) || [];

  // Group by relance level
  const facturesParNiveau = {
    1: facturesEnRetard.filter(
      (f) => f.dateEcheance && getRelanceLevel(f.dateEcheance) === 1
    ),
    2: facturesEnRetard.filter(
      (f) => f.dateEcheance && getRelanceLevel(f.dateEcheance) === 2
    ),
    3: facturesEnRetard.filter(
      (f) => f.dateEcheance && getRelanceLevel(f.dateEcheance) === 3
    ),
  };

  // Calculate totals
  const totalEnRetard = facturesEnRetard.reduce(
    (sum, f) => sum + (f.montantTTC || 0),
    0
  );
  const totalN1 = facturesParNiveau[1].reduce(
    (sum, f) => sum + (f.montantTTC || 0),
    0
  );
  const totalN2 = facturesParNiveau[2].reduce(
    (sum, f) => sum + (f.montantTTC || 0),
    0
  );
  const totalN3 = facturesParNiveau[3].reduce(
    (sum, f) => sum + (f.montantTTC || 0),
    0
  );

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Factures", href: "/factures" },
          { label: "Relances" },
        ]}
      />

      <PageHeader
        title="Relances Factures"
        description="Suivez et gérez les factures en retard de paiement"
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/factures">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Toutes les factures
          </Link>
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total en Retard"
          value={formatCurrency(totalEnRetard)}
          description={`${facturesEnRetard.length} factures`}
          icon={AlertTriangle}
          variant="destructive"
        />
        <KPICard
          title="Niveau N1"
          value={formatCurrency(totalN1)}
          description={`${facturesParNiveau[1].length} factures (1-7j)`}
          icon={Clock}
        />
        <KPICard
          title="Niveau N2"
          value={formatCurrency(totalN2)}
          description={`${facturesParNiveau[2].length} factures (7-15j)`}
          icon={AlertCircle}
        />
        <KPICard
          title="Niveau N3"
          value={formatCurrency(totalN3)}
          description={`${facturesParNiveau[3].length} factures (15j+)`}
          icon={XCircle}
        />
      </div>

      {facturesEnRetard.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="Aucune facture en retard"
          description="Toutes vos factures sont payées ou dans les délais."
        />
      ) : (
        <div className="space-y-6">
          {RELANCE_LEVELS.map((level) => {
            const facturesNiveau = facturesParNiveau[level.niveau as 1 | 2 | 3];
            if (facturesNiveau.length === 0) return null;

            const Icon = level.icon;

            return (
              <Card key={level.niveau}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${level.color} bg-opacity-20`}
                      >
                        <Icon
                          className={`h-5 w-5 ${level.color.replace(
                            "bg-",
                            "text-"
                          )}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{level.label}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {level.description} - {facturesNiveau.length} facture
                          {facturesNiveau.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${level.color.replace("bg-", "border-")} ${level.color.replace("bg-", "text-")}`}
                    >
                      {formatCurrency(
                        facturesNiveau.reduce(
                          (sum, f) => sum + (f.montantTTC || 0),
                          0
                        )
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {facturesNiveau.map((facture) => {
                      const joursRetard = facture.dateEcheance
                        ? differenceInDays(
                            new Date(),
                            new Date(facture.dateEcheance)
                          )
                        : 0;

                      return (
                        <div
                          key={facture.id}
                          className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {facture.numero || "Sans numéro"}
                              </p>
                              <Badge variant="destructive" className="text-xs">
                                {joursRetard} jour{joursRetard > 1 ? "s" : ""} de
                                retard
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>
                                Émise:{" "}
                                {facture.dateEmission
                                  ? formatDate(facture.dateEmission)
                                  : "N/A"}
                              </span>
                              <span>
                                Échéance:{" "}
                                {facture.dateEcheance
                                  ? formatDate(facture.dateEcheance)
                                  : "N/A"}
                              </span>
                              {facture.niveauRelanceEnvoye !== undefined &&
                                facture.niveauRelanceEnvoye > 0 && (
                                  <span className="text-green-600">
                                    Relance N{facture.niveauRelanceEnvoye}{" "}
                                    envoyée
                                  </span>
                                )}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {formatCurrency(facture.montantTTC)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4 mr-1" />
                              Relancer
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => marquerPayee.mutate(facture.id)}
                              disabled={marquerPayee.isPending}
                            >
                              Payée
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Relance workflow info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Processus de Relance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">N1 - J+1</span>
                  <span className="text-sm font-medium">N2 - J+7</span>
                  <span className="text-sm font-medium">N3 - J+15</span>
                </div>
                <div className="relative">
                  <Progress value={100} className="h-2" />
                  <div className="absolute top-0 left-0 w-1/3 h-2 bg-yellow-500 rounded-l" />
                  <div className="absolute top-0 left-1/3 w-1/3 h-2 bg-orange-500" />
                  <div className="absolute top-0 left-2/3 w-1/3 h-2 bg-red-500 rounded-r" />
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Les relances automatiques sont envoyées via N8N à J+1, J+7 et J+15
              après la date d'échéance. Les factures ci-dessus nécessitent
              potentiellement une action manuelle.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
