"use client";

import Link from "next/link";
import { ArrowLeft, Users, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PageHeader,
  PageLoading,
  EmptyState,
  KPICard,
} from "@/components/shared";
import { AppBreadcrumb } from "@/components/layout";
import { useEquipe } from "@/hooks/use-equipe";

interface ChargeStatus {
  label: string;
  color: string;
  bgColor: string;
  minPercent: number;
  maxPercent: number;
}

const CHARGE_STATUSES: ChargeStatus[] = [
  {
    label: "Sous-utilisé",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    minPercent: 0,
    maxPercent: 40,
  },
  {
    label: "Disponible",
    color: "text-green-600",
    bgColor: "bg-green-100",
    minPercent: 40,
    maxPercent: 70,
  },
  {
    label: "Charge optimale",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    minPercent: 70,
    maxPercent: 90,
  },
  {
    label: "Surcharge",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    minPercent: 90,
    maxPercent: 100,
  },
  {
    label: "Critique",
    color: "text-red-600",
    bgColor: "bg-red-100",
    minPercent: 100,
    maxPercent: Infinity,
  },
];

function getChargeStatus(percent: number): ChargeStatus {
  return (
    CHARGE_STATUSES.find(
      (s) => percent >= s.minPercent && percent < s.maxPercent
    ) || CHARGE_STATUSES[4]
  );
}

export default function ChargeEquipePage() {
  const { data: equipe, isLoading } = useEquipe();

  if (isLoading) {
    return <PageLoading />;
  }

  // All team members (all team members)
  const membresActifs = equipe || [];

  // Calculate statistics
  const totalCapacite = membresActifs.reduce(
    (sum, m) => sum + (m.capaciteHebdo || 0),
    0
  );
  const totalHeures = membresActifs.reduce(
    (sum, m) => sum + (m.heuresSemaine || 0),
    0
  );
  const chargeGlobale = totalCapacite > 0 ? (totalHeures / totalCapacite) * 100 : 0;

  const membresSurcharges = membresActifs.filter((m) => {
    const percent = m.capaciteHebdo
      ? ((m.heuresSemaine || 0) / m.capaciteHebdo) * 100
      : 0;
    return percent >= 90;
  });

  const membresDisponibles = membresActifs.filter((m) => {
    const percent = m.capaciteHebdo
      ? ((m.heuresSemaine || 0) / m.capaciteHebdo) * 100
      : 0;
    return percent < 70;
  });

  // Sort by charge percentage (descending)
  const membresTries = [...membresActifs].sort((a, b) => {
    const percentA = a.capaciteHebdo
      ? ((a.heuresSemaine || 0) / a.capaciteHebdo) * 100
      : 0;
    const percentB = b.capaciteHebdo
      ? ((b.heuresSemaine || 0) / b.capaciteHebdo) * 100
      : 0;
    return percentB - percentA;
  });

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Équipe", href: "/equipe" },
          { label: "Charge de Travail" },
        ]}
      />

      <PageHeader
        title="Charge de Travail"
        description="Vue d'ensemble de la charge de travail de l'équipe"
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/equipe">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'équipe
          </Link>
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Charge Globale"
          value={`${Math.round(chargeGlobale)}%`}
          description={`${totalHeures}h / ${totalCapacite}h`}
          icon={Clock}
        />
        <KPICard
          title="Membres Actifs"
          value={membresActifs.length}
          description="Dans l'équipe"
          icon={Users}
        />
        <KPICard
          title="En Surcharge"
          value={membresSurcharges.length}
          description="Membres > 90%"
          icon={AlertTriangle}
          variant={membresSurcharges.length > 0 ? "destructive" : "default"}
        />
        <KPICard
          title="Disponibles"
          value={membresDisponibles.length}
          description="Membres < 70%"
          icon={CheckCircle}
        />
      </div>

      {/* Charge overview bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Répartition de la Charge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Progress value={chargeGlobale} className="flex-1 h-4" />
              <span className="text-sm font-medium w-16 text-right">
                {Math.round(chargeGlobale)}%
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {CHARGE_STATUSES.slice(0, 4).map((status) => (
                <div key={status.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${status.bgColor}`} />
                  <span className="text-muted-foreground">{status.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members charge list */}
      {membresActifs.length === 0 ? (
        <EmptyState
          title="Aucun membre actif"
          description="Aucun membre actif dans l'équipe."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détail par Membre</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {membresTries.map((membre) => {
                const chargePercent = membre.capaciteHebdo
                  ? ((membre.heuresSemaine || 0) / membre.capaciteHebdo) * 100
                  : 0;
                const status = getChargeStatus(chargePercent);
                const heuresDisponibles = Math.max(
                  0,
                  (membre.capaciteHebdo || 0) - (membre.heuresSemaine || 0)
                );

                return (
                  <div
                    key={membre.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {membre.nom
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{membre.nom}</p>
                        <Badge
                          variant="outline"
                          className={`${status.bgColor} ${status.color} border-0`}
                        >
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {membre.role || "Non défini"}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Assigné</p>
                        <p className="font-medium">
                          {membre.heuresSemaine || 0}h
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Capacité</p>
                        <p className="font-medium">
                          {membre.capaciteHebdo || 0}h
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Disponible</p>
                        <p
                          className={`font-medium ${
                            heuresDisponibles <= 0 ? "text-destructive" : ""
                          }`}
                        >
                          {heuresDisponibles}h
                        </p>
                      </div>
                    </div>

                    <div className="w-32">
                      <Progress
                        value={Math.min(chargePercent, 100)}
                        className={`h-2 ${
                          chargePercent >= 100
                            ? "[&>div]:bg-red-500"
                            : chargePercent >= 90
                            ? "[&>div]:bg-orange-500"
                            : chargePercent >= 70
                            ? "[&>div]:bg-emerald-500"
                            : ""
                        }`}
                      />
                      <p className="text-xs text-right mt-1 text-muted-foreground">
                        {Math.round(chargePercent)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {membresSurcharges.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertes de Surcharge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {membresSurcharges.map((membre) => {
                const chargePercent = membre.capaciteHebdo
                  ? ((membre.heuresSemaine || 0) / membre.capaciteHebdo) * 100
                  : 0;

                return (
                  <div
                    key={membre.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-destructive/10"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {membre.nom
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{membre.nom}</span>
                    </div>
                    <Badge variant="destructive">
                      {Math.round(chargePercent)}% de charge
                    </Badge>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Ces membres ont une charge de travail supérieure à 90% de leur
              capacité. Envisagez de réaffecter certaines tâches.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
