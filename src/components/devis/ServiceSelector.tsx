"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useServices } from "@/hooks/use-services";
import type { CatalogueService } from "@/types";

interface ServiceSelectorProps {
  value?: string;
  onSelect: (service: CatalogueService | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ServiceSelector({
  value,
  onSelect,
  placeholder = "Sélectionner un service...",
  disabled = false,
}: ServiceSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const { data: services = [], isLoading } = useServices({ actifOnly: true });

  // Group services by category
  const groupedServices = React.useMemo(() => {
    const groups: Record<string, CatalogueService[]> = {};

    services.forEach((service) => {
      const category = service.categorie || "Autres";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(service);
    });

    return groups;
  }, [services]);

  const selectedService = services.find((s) => s.id === value);

  const formatPrice = (price: number, unite: string) => {
    return `${price.toLocaleString("fr-FR")} € / ${unite}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {selectedService ? (
            <span className="truncate">{selectedService.nom}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un service..." />
          <CommandList>
            <CommandEmpty>Aucun service trouvé.</CommandEmpty>

            {/* Option to clear selection */}
            {value && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onSelect(null);
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Ligne libre (sans service)
                </CommandItem>
              </CommandGroup>
            )}

            {Object.entries(groupedServices).map(([category, categoryServices]) => (
              <CommandGroup key={category} heading={category}>
                {categoryServices.map((service) => (
                  <CommandItem
                    key={service.id}
                    value={`${service.nom} ${service.description || ""}`}
                    onSelect={() => {
                      onSelect(service);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === service.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{service.nom}</span>
                      {service.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {service.description}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatPrice(service.prixUnitaire, service.unite)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
