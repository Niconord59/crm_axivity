"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Mail, Clock, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  PageLoading,
  EmptyState,
} from "@/components/shared";
import { useEquipe, useChargeEquipe } from "@/hooks/use-equipe";
import { useAuth } from "@/hooks/use-auth";
import { TEAM_ROLES, TEAM_ROLE_LABELS, type TeamRole } from "@/types";

export default function EquipePage() {
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { isAdmin } = useAuth();

  const { data: equipe, isLoading } = useEquipe();
  const { data: chargeEquipe } = useChargeEquipe();

  const filteredEquipe = equipe?.filter((membre) => {
    if (roleFilter !== "all" && membre.role !== roleFilter) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipe"
        description={isAdmin() ? "Gérez votre équipe et suivez leur charge de travail" : "La charge de travail de l'équipe"}
        action={isAdmin() ? {
          label: "Ajouter un Membre",
          icon: Plus,
          onClick: () => router.push("/admin/users"),
        } : undefined}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/equipe/charge">
              <BarChart3 className="h-4 w-4 mr-2" />
              Charge de travail
            </Link>
          </Button>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              {TEAM_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {TEAM_ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {!filteredEquipe || filteredEquipe.length === 0 ? (
        <EmptyState
          title="Aucun membre"
          description={isAdmin() ? "Ajoutez votre premier membre d'équipe." : "Aucun membre dans l'équipe pour le moment."}
          action={isAdmin() ? {
            label: "Ajouter un membre",
            onClick: () => router.push("/admin/users"),
          } : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEquipe.map((membre) => {
            const chargePercent = membre.capaciteHebdo
              ? Math.min(
                  ((membre.heuresSemaine || 0) / membre.capaciteHebdo) * 100,
                  100
                )
              : 0;

            return (
              <Card key={membre.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="text-lg">
                        {membre.nom
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{membre.nom}</h3>
                      </div>
                      {membre.role && (
                        <p className="text-sm text-muted-foreground">
                          {TEAM_ROLE_LABELS[membre.role as TeamRole] || membre.role}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {membre.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <a
                          href={`mailto:${membre.email}`}
                          className="hover:underline truncate"
                        >
                          {membre.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Charge de travail */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Charge hebdo
                        </span>
                      </div>
                      <span className="font-medium">
                        {membre.heuresSemaine || 0}h /{" "}
                        {membre.capaciteHebdo || 0}h
                      </span>
                    </div>
                    <Progress
                      value={chargePercent}
                      className={`h-2 ${
                        chargePercent > 80
                          ? "[&>div]:bg-destructive"
                          : chargePercent > 60
                          ? "[&>div]:bg-yellow-500"
                          : ""
                      }`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {chargePercent > 80
                        ? "Surcharge"
                        : chargePercent > 60
                        ? "Charge élevée"
                        : "Disponible"}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 text-sm">
                    <p className="text-muted-foreground">Tâches</p>
                    <p className="font-medium">
                      {membre.tachesAssignees?.length || 0}
                    </p>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
