"use client";

import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Search,
  Loader2,
  MapPin,
  Check,
  ChevronsUpDown,
  PlusCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useCompanySearch, type CompanyInfo } from "@/hooks/use-company-search";

interface Client {
  id: string;
  nom: string;
  secteurActivite?: string;
  siteWeb?: string;
  telephone?: string;
  siret?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
}

interface CompanySearchProps {
  value: string;
  selectedClientId?: string;
  clients?: Client[];
  isLoadingClients?: boolean;
  onSelectExisting: (client: Client) => void;
  onSelectNew: (company: CompanyInfo) => void;
  onCreateManual: (name: string) => void;
  error?: string;
}

export function CompanySearch({
  value,
  selectedClientId,
  clients = [],
  isLoadingClients = false,
  onSelectExisting,
  onSelectNew,
  onCreateManual,
  error,
}: CompanySearchProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search government API for companies
  const { data: apiCompanies = [], isLoading: isSearching } = useCompanySearch(
    searchValue,
    { enabled: open && searchValue.length >= 3 }
  );

  // Update searchValue when value prop changes
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  // Filter existing clients based on search
  const filteredClients = clients.filter((client) =>
    client.nom.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Check if search matches an existing client exactly
  const exactClientMatch = clients.find(
    (client) => client.nom.toLowerCase() === searchValue.toLowerCase()
  );

  // Check if search matches an API company exactly
  const exactApiMatch = apiCompanies.find(
    (company) => company.nom.toLowerCase() === searchValue.toLowerCase()
  );

  const handleSelectClient = (client: Client) => {
    setSearchValue(client.nom);
    onSelectExisting(client);
    setOpen(false);
  };

  const handleSelectApiCompany = (company: CompanyInfo) => {
    setSearchValue(company.nom);
    onSelectNew(company);
    setOpen(false);
  };

  const handleCreateManual = () => {
    onCreateManual(searchValue);
    setOpen(false);
  };

  // Show API results only if not matching an existing client
  const showApiResults =
    searchValue.length >= 3 &&
    !exactClientMatch &&
    (isSearching || apiCompanies.length > 0);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 shrink-0 opacity-50" />
              {value || "Rechercher une entreprise..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="relative">
              <CommandInput
                ref={inputRef}
                placeholder="Tapez le nom de l'entreprise..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <CommandList>
              {/* Loading state */}
              {isLoadingClients && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mx-auto mb-2 animate-spin" />
                  Chargement...
                </div>
              )}

              {/* No results */}
              {!isLoadingClients &&
                !isSearching &&
                filteredClients.length === 0 &&
                apiCompanies.length === 0 &&
                searchValue.length >= 3 && (
                  <CommandEmpty>
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Search className="h-8 w-8 text-muted-foreground/50" />
                      <p>Aucune entreprise trouvée</p>
                      <p className="text-xs text-muted-foreground">
                        Vous pouvez créer une nouvelle entrée
                      </p>
                    </div>
                  </CommandEmpty>
                )}

              {/* Existing clients */}
              {filteredClients.length > 0 && (
                <CommandGroup heading="Clients existants">
                  {filteredClients.slice(0, 5).map((client) => (
                    <CommandItem
                      key={client.id}
                      value={client.nom}
                      onSelect={() => handleSelectClient(client)}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selectedClientId === client.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{client.nom}</div>
                        {client.ville && (
                          <div className="text-xs text-muted-foreground truncate">
                            {client.ville}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        CRM
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* API results */}
              {showApiResults && (
                <>
                  {filteredClients.length > 0 && <CommandSeparator />}
                  <CommandGroup heading="Annuaire entreprises (API Gouvernement)">
                    {isSearching ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 mx-auto mb-2 animate-spin" />
                        Recherche en cours...
                      </div>
                    ) : (
                      apiCompanies.slice(0, 5).map((company) => (
                        <CommandItem
                          key={company.siret}
                          value={company.nom}
                          onSelect={() => handleSelectApiCompany(company)}
                          className="flex items-start gap-2 py-2"
                        >
                          <div className="pt-0.5">
                            <Building2 className="h-4 w-4 shrink-0 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="truncate font-medium">
                              {company.nom}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {company.codePostal} {company.ville}
                              </span>
                            </div>
                            {company.activite && (
                              <div className="text-xs text-muted-foreground truncate">
                                {company.activite}
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <Badge variant="outline" className="text-xs">
                              SIRET
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {company.siret}
                            </span>
                          </div>
                        </CommandItem>
                      ))
                    )}
                    {!isSearching && apiCompanies.length > 0 && (
                      <div className="px-2 py-2 text-xs text-muted-foreground flex items-center gap-1 border-t">
                        <ExternalLink className="h-3 w-3" />
                        Données de recherche-entreprises.api.gouv.fr
                      </div>
                    )}
                  </CommandGroup>
                </>
              )}

              {/* Create new option */}
              {searchValue && !exactClientMatch && !exactApiMatch && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleCreateManual}
                      className="text-primary"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Créer &quot;{searchValue}&quot; manuellement
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Hint text */}
      {!value && (
        <p className="text-xs text-muted-foreground">
          Tapez au moins 3 caractères pour rechercher dans l&apos;annuaire officiel
        </p>
      )}
    </div>
  );
}
