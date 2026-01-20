"use client";

import { useMutation } from "@tanstack/react-query";

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  address?: string;
  telephone?: string;
  telephoneInternational?: string;
  siteWeb?: string;
  googleMapsUrl?: string;
}

interface SearchPlacesParams {
  query: string;
  city?: string;
}

interface SearchPlacesResponse {
  result: PlaceSearchResult | null;
  message?: string;
  error?: string;
}

/**
 * Hook to search for business details on Google Places
 * Returns telephone and website for a company
 */
export function useSearchGooglePlaces() {
  return useMutation({
    mutationFn: async ({ query, city }: SearchPlacesParams): Promise<PlaceSearchResult | null> => {
      const response = await fetch("/api/places/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, city }),
      });

      if (!response.ok) {
        throw new Error("Failed to search Google Places");
      }

      const data: SearchPlacesResponse = await response.json();

      if (data.error) {
        console.warn("Google Places search error:", data.error);
        return null;
      }

      return data.result;
    },
  });
}

/**
 * Helper function to enrich company data with Google Places info
 */
export async function enrichCompanyWithPlaces(
  companyName: string,
  city?: string
): Promise<PlaceSearchResult | null> {
  try {
    const response = await fetch("/api/places/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: companyName, city }),
    });

    if (!response.ok) {
      return null;
    }

    const data: SearchPlacesResponse = await response.json();
    return data.result;
  } catch (error) {
    console.error("Error enriching company data:", error);
    return null;
  }
}
