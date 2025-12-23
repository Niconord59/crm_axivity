"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { getNafLabel } from "@/lib/naf-codes";

// API Response types from recherche-entreprises.api.gouv.fr
interface SiegeEntreprise {
  siret: string;
  adresse: string;
  code_postal: string;
  libelle_commune: string;
  // Activity info can also be at siege level
  activite_principale?: string;
  libelle_activite_principale?: string;
}

interface EntrepriseResult {
  siren: string;
  nom_complet: string;
  nom_raison_sociale: string;
  sigle?: string;
  siege: SiegeEntreprise;
  nature_juridique?: string;
  libelle_nature_juridique?: string;
  activite_principale?: string;
  libelle_activite_principale?: string;
  nombre_etablissements: number;
  nombre_etablissements_ouverts: number;
  tranche_effectif_salarie?: string;
  annee_tranche_effectif_salarie?: string;
}

interface SearchResponse {
  results: EntrepriseResult[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Simplified company info for our forms
export interface CompanyInfo {
  nom: string;
  siret: string;
  siren: string;
  adresse: string;
  codePostal: string;
  ville: string;
  activite?: string;
  natureJuridique?: string;
  effectif?: string;
  // Fields that can be enriched via Google Places
  telephone?: string;
  siteWeb?: string;
}

/**
 * Hook to search French companies using the government API
 * https://recherche-entreprises.api.gouv.fr
 */
export function useCompanySearch(searchQuery: string, options?: { enabled?: boolean }) {
  // Debounce the search query to avoid too many API calls
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  return useQuery({
    queryKey: ["company-search", debouncedQuery],
    queryFn: async (): Promise<CompanyInfo[]> => {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        return [];
      }

      const url = new URL("https://recherche-entreprises.api.gouv.fr/search");
      url.searchParams.set("q", debouncedQuery);
      url.searchParams.set("per_page", "10");
      url.searchParams.set("page", "1");
      // Only search active companies
      url.searchParams.set("etat_administratif", "A");

      const response = await fetch(url.toString(), {
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      return data.results.map((entreprise) => {
        // Get activity label: try labels first, then convert code to label via NAF table
        const activiteLabel = entreprise.libelle_activite_principale
          || entreprise.siege.libelle_activite_principale
          || getNafLabel(entreprise.activite_principale)
          || getNafLabel(entreprise.siege.activite_principale);

        return {
          nom: entreprise.nom_complet || entreprise.nom_raison_sociale,
          siret: entreprise.siege.siret,
          siren: entreprise.siren,
          adresse: entreprise.siege.adresse || "",
          codePostal: entreprise.siege.code_postal || "",
          ville: entreprise.siege.libelle_commune || "",
          activite: activiteLabel,
          natureJuridique: entreprise.libelle_nature_juridique,
          effectif: entreprise.tranche_effectif_salarie,
        };
      });
    },
    enabled: (options?.enabled ?? true) && debouncedQuery.length >= 3,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to manage company search state with selection
 */
export function useCompanySearchState() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data: companies = [], isLoading, isFetching } = useCompanySearch(searchValue, {
    enabled: isSearching && !selectedCompany,
  });

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    setIsSearching(true);
    // Clear selection when user types a new search
    if (selectedCompany && value !== selectedCompany.nom) {
      setSelectedCompany(null);
    }
  }, [selectedCompany]);

  const handleSelect = useCallback((company: CompanyInfo) => {
    setSelectedCompany(company);
    setSearchValue(company.nom);
    setIsSearching(false);
  }, []);

  const handleClear = useCallback(() => {
    setSearchValue("");
    setSelectedCompany(null);
    setIsSearching(false);
  }, []);

  return {
    searchValue,
    companies,
    selectedCompany,
    isLoading: isLoading || isFetching,
    handleSearch,
    handleSelect,
    handleClear,
    setSearchValue,
  };
}
