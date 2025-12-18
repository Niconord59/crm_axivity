"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Globe,
  Building2,
  FolderKanban,
  FileText,
  MessageSquare,
  Info,
  Phone,
  Mail,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, PageLoading, HealthBadge } from "@/components/shared";
import { AppBreadcrumb } from "@/components/layout";
import { useClient } from "@/hooks/use-clients";
import { useProjets } from "@/hooks/use-projets";
import { useFactures } from "@/hooks/use-factures";
import { useInteractions, useLastInteractionDate } from "@/hooks/use-interactions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type Tab = "infos" | "projets" | "factures" | "interactions";

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("infos");

  const { data: client, isLoading: loadingClient } = useClient(id);
  const { data: projets, isLoading: loadingProjets } = useProjets({
    clientId: id,
  });
  const { data: factures, isLoading: loadingFactures } = useFactures({
    clientId: id,
  });
  const { data: interactions, isLoading: loadingInteractions } = useInteractions({
    clientId: id,
  });
  const { data: lastInteractionDate } = useLastInteractionDate({
    clientId: id,
  });

  const isLoading = loadingClient || loadingProjets || loadingFactures || loadingInteractions;

  if (isLoading) {
    return <PageLoading />;
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-lg font-semibold">Client non trouvé</h2>
        <p className="text-muted-foreground mt-1">
          Ce client n'existe pas ou a été supprimé.
        </p>
        <Button asChild className="mt-4">
          <Link href="/clients">Retour aux clients</Link>
        </Button>
      </div>
    );
  }

  // Calculate stats
  const projetsActifs = projets?.filter((p) => p.statut === "En cours") || [];
  const projetsTermines = projets?.filter((p) => p.statut === "Terminé") || [];
  const facturesPayees = factures?.filter((f) => f.statut === "Payé") || [];
  const facturesEnAttente = factures?.filter((f) => f.statut === "Envoyé") || [];
  const montantEnAttente = facturesEnAttente.reduce((sum, f) => sum + (f.montantTTC || 0), 0);

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "infos", label: "Informations", icon: Info },
    { key: "projets", label: "Projets", icon: FolderKanban, count: projets?.length },
    { key: "factures", label: "Factures", icon: FileText, count: factures?.length },
    { key: "interactions", label: "Interactions", icon: MessageSquare, count: interactions?.length },
  ];

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Clients", href: "/clients" },
          { label: client.nom },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {client.nom
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{client.nom}</h1>
              {client.secteurActivite && (
                <Badge variant="outline">{client.secteurActivite}</Badge>
              )}
              {client.statut && (
                <Badge
                  variant={
                    client.statut === "Actif"
                      ? "default"
                      : client.statut === "Prospect"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {client.statut}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <HealthBadge lastInteractionDate={lastInteractionDate} />
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Chiffre d'Affaires</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(client.caTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Projets</p>
            <p className="text-2xl font-bold mt-1">{projets?.length || 0}</p>
            <p className="text-xs text-muted-foreground">
              {projetsActifs.length} en cours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Factures</p>
            <p className="text-2xl font-bold mt-1">{factures?.length || 0}</p>
            <p className="text-xs text-muted-foreground">
              {facturesPayees.length} payées
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(montantEnAttente)}
            </p>
            <p className="text-xs text-muted-foreground">
              {facturesEnAttente.length} factures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content - Informations */}
      {activeTab === "infos" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.siteWeb && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={client.siteWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline text-primary"
                  >
                    {client.siteWeb}
                  </a>
                </div>
              )}
              {client.secteurActivite && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.secteurActivite}</span>
                </div>
              )}
              {client.dateCreation && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Client depuis le {formatDate(client.dateCreation)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Projets terminés</p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={projets?.length ? (projetsTermines.length / projets.length) * 100 : 0}
                      className="h-2"
                    />
                    <span className="text-sm font-medium">
                      {projetsTermines.length}/{projets?.length || 0}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Taux de facturation</p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={factures?.length ? (facturesPayees.length / factures.length) * 100 : 0}
                      className="h-2"
                    />
                    <span className="text-sm font-medium">
                      {facturesPayees.length}/{factures?.length || 0}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Interactions</p>
                  <p className="text-lg font-semibold">{interactions?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Content - Projets */}
      {activeTab === "projets" && (
        <div className="space-y-4">
          {projets && projets.length > 0 ? (
            projets.map((projet) => (
              <Link key={projet.id} href={`/projets/${projet.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {projet.nomProjet || projet.briefProjet || "Sans nom"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <StatusBadge
                            status={projet.statut || "En cours"}
                            type="project"
                          />
                          {projet.priorite && (
                            <StatusBadge status={projet.priorite} type="priority" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {projet.dateFinPrevue
                              ? `Fin prévue: ${formatDate(projet.dateFinPrevue)}`
                              : "Date non définie"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium">{formatCurrency(projet.budget)}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progression</span>
                        <span>{Math.round((projet.pourcentageTachesTerminees || 0) * 100)}%</span>
                      </div>
                      <Progress
                        value={(projet.pourcentageTachesTerminees || 0) * 100}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground mt-2">
                  Aucun projet pour ce client
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab Content - Factures */}
      {activeTab === "factures" && (
        <div className="space-y-4">
          {factures && factures.length > 0 ? (
            factures.map((facture) => (
              <Card key={facture.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">
                        {facture.numero || "Sans numéro"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                    <div className="text-right shrink-0">
                      <p className="font-medium text-lg">
                        {formatCurrency(facture.montantTTC)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Échéance:{" "}
                        {facture.dateEcheance
                          ? formatDate(facture.dateEcheance)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  {facture.niveauRelance && facture.niveauRelance > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <Badge variant="destructive" className="text-xs">
                        Relance niveau {facture.niveauRelance}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground mt-2">
                  Aucune facture pour ce client
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab Content - Interactions (Timeline) */}
      {activeTab === "interactions" && (
        <div className="space-y-4">
          {interactions && interactions.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-6">
                {interactions.map((interaction, index) => (
                  <div key={interaction.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className={`absolute left-2 w-5 h-5 rounded-full border-2 bg-background ${
                      index === 0 ? "border-primary" : "border-muted-foreground/30"
                    }`}>
                      <div className={`absolute inset-1 rounded-full ${
                        index === 0 ? "bg-primary" : "bg-muted-foreground/30"
                      }`} />
                    </div>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">{interaction.objet}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {interaction.type && (
                                <Badge variant="outline" className="text-xs">
                                  {interaction.type}
                                </Badge>
                              )}
                              {interaction.date && (
                                <span className="text-xs text-muted-foreground">
                                  {format(parseISO(interaction.date), "d MMMM yyyy", { locale: fr })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {interaction.resume && (
                          <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">
                            {interaction.resume}
                          </p>
                        )}
                        {interaction.prochaineTache && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">Prochaine action:</p>
                            <p className="text-sm font-medium">{interaction.prochaineTache}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground mt-2">
                  Aucune interaction enregistrée
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les interactions sont créées via Airtable ou les workflows N8N
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
