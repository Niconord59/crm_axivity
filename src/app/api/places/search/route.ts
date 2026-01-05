import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error-handler";
import { ValidationError, ExternalServiceError } from "@/lib/errors";

// Google Places API response types
interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url?: string;
  types?: string[];
  business_status?: string;
}

interface TextSearchResponse {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address?: string;
    types?: string[];
    business_status?: string;
  }>;
  status: string;
  error_message?: string;
}

interface PlaceDetailsResponse {
  result: PlaceResult;
  status: string;
  error_message?: string;
}

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  address?: string;
  telephone?: string;
  telephoneInternational?: string;
  siteWeb?: string;
  googleMapsUrl?: string;
}

/**
 * POST /api/places/search
 * Search for a business on Google Places and return contact info
 */
export async function POST(request: NextRequest) {
  try {
    const { query, city } = await request.json();

    if (!query) {
      throw new ValidationError("La requête de recherche est requise");
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      // Return empty result if no API key configured (graceful degradation)
      return NextResponse.json({ result: null, message: "Google Places API not configured" });
    }

    // Build search query: company name + city for better accuracy
    const searchQuery = city ? `${query} ${city} France` : `${query} France`;

    // Step 1: Text Search to find the place
    const textSearchUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    textSearchUrl.searchParams.set("query", searchQuery);
    textSearchUrl.searchParams.set("key", apiKey);
    textSearchUrl.searchParams.set("language", "fr");
    textSearchUrl.searchParams.set("type", "establishment");

    const textSearchResponse = await fetch(textSearchUrl.toString());
    const textSearchData: TextSearchResponse = await textSearchResponse.json();

    if (textSearchData.status !== "OK" || !textSearchData.results?.length) {
      return NextResponse.json({
        result: null,
        message: textSearchData.error_message || "No results found",
      });
    }

    // Get the first (most relevant) result
    const place = textSearchData.results[0];

    // Step 2: Get Place Details for phone and website
    const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    detailsUrl.searchParams.set("place_id", place.place_id);
    detailsUrl.searchParams.set("key", apiKey);
    detailsUrl.searchParams.set("language", "fr");
    detailsUrl.searchParams.set("fields", "name,formatted_address,formatted_phone_number,international_phone_number,website,url");

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData: PlaceDetailsResponse = await detailsResponse.json();

    if (detailsData.status !== "OK") {
      // Return basic info from text search if details fail
      return NextResponse.json({
        result: {
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
        } as PlaceSearchResult,
      });
    }

    const details = detailsData.result;

    const result: PlaceSearchResult = {
      placeId: place.place_id,
      name: details.name || place.name,
      address: details.formatted_address || place.formatted_address,
      telephone: details.formatted_phone_number,
      telephoneInternational: details.international_phone_number,
      siteWeb: details.website,
      googleMapsUrl: details.url,
    };

    return NextResponse.json({ result });
  } catch (error) {
    return handleApiError(error);
  }
}
