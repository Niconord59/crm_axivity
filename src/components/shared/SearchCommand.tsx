"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderKanban,
  Building2,
  FileText,
  Users,
  Target,
  CheckSquare,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useProjets } from "@/hooks/use-projets";
import { useClients } from "@/hooks/use-clients";
import { useOpportunites } from "@/hooks/use-opportunites";
import { useTaches } from "@/hooks/use-taches";
import { useFactures } from "@/hooks/use-factures";
import { useEquipe } from "@/hooks/use-equipe";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: projets } = useProjets();
  const { data: clients } = useClients();
  const { data: opportunites } = useOpportunites();
  const { data: taches } = useTaches();
  const { data: factures } = useFactures();
  const { data: equipe } = useEquipe();

  // Filter results based on search
  const filteredProjets = projets?.filter((p) =>
    (p.nomProjet || p.briefProjet || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  ).slice(0, 5);

  const filteredClients = clients?.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const filteredOpportunites = opportunites?.filter((o) =>
    o.nom.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const filteredTaches = taches?.filter((t) =>
    t.nom.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const filteredFactures = factures?.filter((f) =>
    (f.numero || "").toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const filteredEquipe = equipe?.filter((m) =>
    m.nom.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const handleSelect = useCallback(
    (path: string) => {
      onOpenChange(false);
      setSearch("");
      router.push(path);
    },
    [onOpenChange, router]
  );

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const hasResults =
    (filteredProjets?.length ?? 0) > 0 ||
    (filteredClients?.length ?? 0) > 0 ||
    (filteredOpportunites?.length ?? 0) > 0 ||
    (filteredTaches?.length ?? 0) > 0 ||
    (filteredFactures?.length ?? 0) > 0 ||
    (filteredEquipe?.length ?? 0) > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Rechercher projets, clients, tâches..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {search && !hasResults && (
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        )}

        {/* Quick Navigation */}
        {!search && (
          <CommandGroup heading="Navigation rapide">
            <CommandItem onSelect={() => handleSelect("/")}>
              <FolderKanban className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/projets")}>
              <FolderKanban className="mr-2 h-4 w-4" />
              Projets
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/opportunites")}>
              <Target className="mr-2 h-4 w-4" />
              Opportunités
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/taches")}>
              <CheckSquare className="mr-2 h-4 w-4" />
              Tâches
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/clients")}>
              <Building2 className="mr-2 h-4 w-4" />
              Clients
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/factures")}>
              <FileText className="mr-2 h-4 w-4" />
              Factures
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/equipe")}>
              <Users className="mr-2 h-4 w-4" />
              Équipe
            </CommandItem>
          </CommandGroup>
        )}

        {/* Search Results */}
        {search && (
          <>
            {filteredProjets && filteredProjets.length > 0 && (
              <CommandGroup heading="Projets">
                {filteredProjets.map((projet) => (
                  <CommandItem
                    key={projet.id}
                    onSelect={() => handleSelect(`/projets/${projet.id}`)}
                  >
                    <FolderKanban className="mr-2 h-4 w-4" />
                    <span>{projet.nomProjet || projet.briefProjet || "Sans nom"}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filteredClients && filteredClients.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Clients">
                  {filteredClients.map((client) => (
                    <CommandItem
                      key={client.id}
                      onSelect={() => handleSelect(`/clients/${client.id}`)}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>{client.nom}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {filteredOpportunites && filteredOpportunites.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Opportunités">
                  {filteredOpportunites.map((opp) => (
                    <CommandItem
                      key={opp.id}
                      onSelect={() => handleSelect("/opportunites")}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      <span>{opp.nom}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {filteredTaches && filteredTaches.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Tâches">
                  {filteredTaches.map((tache) => (
                    <CommandItem
                      key={tache.id}
                      onSelect={() => handleSelect("/taches")}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      <span>{tache.nom}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {filteredFactures && filteredFactures.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Factures">
                  {filteredFactures.map((facture) => (
                    <CommandItem
                      key={facture.id}
                      onSelect={() => handleSelect("/factures")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span>{facture.numero || "Sans numéro"}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {filteredEquipe && filteredEquipe.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Équipe">
                  {filteredEquipe.map((membre) => (
                    <CommandItem
                      key={membre.id}
                      onSelect={() => handleSelect("/equipe")}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <span>{membre.nom}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
