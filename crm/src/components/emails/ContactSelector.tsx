"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Search, Users, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface ContactForEmail {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  clientId: string | null;
  clientNom: string | null;
}

interface ContactSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ContactSelector({
  selectedIds,
  onSelectionChange,
}: ContactSelectorProps) {
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");

  // Fetch all contacts with email
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts-for-email"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, nom, prenom, email, client_id, clients(nom)")
        .not("email", "is", null)
        .neq("email", "")
        .order("nom", { ascending: true });

      if (error) throw error;

      return (data || []).map((c) => ({
        id: c.id,
        nom: c.nom,
        prenom: c.prenom,
        email: c.email,
        clientId: c.client_id,
        clientNom: (c.clients as { nom?: string } | null)?.nom || null,
      })) as ContactForEmail[];
    },
  });

  // Extract unique clients for filter
  const clients = useMemo(() => {
    if (!contacts) return [];
    const clientMap = new Map<string, string>();
    contacts.forEach((c) => {
      if (c.clientId && c.clientNom) {
        clientMap.set(c.clientId, c.clientNom);
      }
    });
    return Array.from(clientMap.entries())
      .map(([id, nom]) => ({ id, nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [contacts]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter((c) => {
      const matchesSearch =
        !search ||
        `${c.prenom || ""} ${c.nom} ${c.email || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesClient =
        clientFilter === "all" || c.clientId === clientFilter;
      return matchesSearch && matchesClient;
    });
  }, [contacts, search, clientFilter]);

  const selectedContacts = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter((c) => selectedIds.includes(c.id));
  }, [contacts, selectedIds]);

  const toggleContact = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    const filteredIds = filteredContacts.map((c) => c.id);
    const newSelection = new Set([...selectedIds, ...filteredIds]);
    onSelectionChange(Array.from(newSelection));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Destinataires ({selectedIds.length} sélectionné
          {selectedIds.length > 1 ? "s" : ""})
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={selectAll}
            disabled={filteredContacts.length === 0}
          >
            Tout sélectionner
          </Button>
          {selectedIds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
            >
              Tout désélectionner
            </Button>
          )}
        </div>
      </div>

      {/* Selected contacts badges */}
      {selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedContacts.map((c) => (
            <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
              {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
              <button
                type="button"
                onClick={() => toggleContact(c.id)}
                className="ml-1 rounded-full hover:bg-muted p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search and filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contact list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {search || clientFilter !== "all"
              ? "Aucun contact trouvé avec ces filtres"
              : "Aucun contact avec email disponible"}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[250px] border rounded-md">
          <div className="p-2 space-y-0.5">
            {filteredContacts.map((contact) => {
              const isSelected = selectedIds.includes(contact.id);
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => toggleContact(contact.id)}
                  className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  <Checkbox checked={isSelected} tabIndex={-1} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {contact.prenom
                        ? `${contact.prenom} ${contact.nom}`
                        : contact.nom}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.email}
                      {contact.clientNom && ` - ${contact.clientNom}`}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
