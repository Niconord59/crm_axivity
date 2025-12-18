"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Building2, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  PageLoading,
  EmptyState,
  ExportButton,
} from "@/components/shared";
import { clientExportColumns } from "@/lib/export";
import { ClientForm } from "@/components/forms";
import { useClients } from "@/hooks/use-clients";
import { formatCurrency } from "@/lib/utils";
import { CLIENT_STATUSES } from "@/types";

const SECTEURS = [
  "Tech/IT",
  "E-commerce",
  "Finance",
  "Santé",
  "Education",
  "Services",
  "Industrie",
  "Autre",
] as const;

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [secteurFilter, setSecteurFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");

  const { data: clients, isLoading } = useClients();

  const filteredClients = clients?.filter((client) => {
    // Search filter
    if (
      search &&
      !client.nom.toLowerCase().includes(search.toLowerCase()) &&
      !client.secteurActivite?.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    // Secteur filter
    if (secteurFilter !== "all" && client.secteurActivite !== secteurFilter) {
      return false;
    }
    // Status filter
    if (statutFilter !== "all" && client.statut !== statutFilter) {
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
        title="Clients"
        description="Gérez vos clients et leurs informations"
      >
        <div className="flex items-center gap-2">
          <ExportButton
            data={filteredClients || []}
            columns={clientExportColumns}
            filename="clients"
            sheetName="Clients"
          />
          <ClientForm />
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={secteurFilter} onValueChange={setSecteurFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Secteur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les secteurs</SelectItem>
            {SECTEURS.map((secteur) => (
              <SelectItem key={secteur} value={secteur}>
                {secteur}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {CLIENT_STATUSES.map((statut) => (
              <SelectItem key={statut} value={statut}>
                {statut}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clients List */}
      {!filteredClients || filteredClients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucun client"
          description="Ajoutez votre premier client pour commencer."
        >
          <ClientForm />
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {client.nom
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{client.nom}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {client.secteurActivite && (
                          <Badge variant="outline" className="text-xs">
                            {client.secteurActivite}
                          </Badge>
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
                            className="text-xs"
                          >
                            {client.statut}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {client.siteWeb && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <span className="truncate">{client.siteWeb}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground">CA Total</p>
                      <p className="font-medium">
                        {formatCurrency(client.caTotal)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Projets</p>
                      <p className="font-medium">{client.projets?.length || 0}</p>
                    </div>
                  </div>

                  {client.santeClient && (
                    <div className="mt-2">
                      <span className="text-xs">{client.santeClient}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
