"use client";

import { useMutation } from "@tanstack/react-query";
import type { ProspectFormData } from "@/lib/schemas/prospect";

interface BusinessCardData {
  lastName?: string;
  firstName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  companyPhone?: string;
  website?: string;
  linkedin?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
}

interface ScanResponse {
  result: BusinessCardData;
  error?: string;
  code?: string;
}

/**
 * Convert a File to a base64 data URI
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });
}

/**
 * Map OCR result to ProspectFormData fields
 */
function mapToProspectData(
  card: BusinessCardData
): Partial<ProspectFormData> {
  const data: Partial<ProspectFormData> = {
    sourceLead: "Salon",
  };

  if (card.lastName) data.nom = card.lastName;
  if (card.firstName) data.prenom = card.firstName;
  if (card.email) data.email = card.email;
  if (card.phone) data.telephone = card.phone;
  if (card.jobTitle) data.role = card.jobTitle;
  if (card.company) data.entreprise = card.company;
  if (card.companyPhone) data.telephoneEntreprise = card.companyPhone;
  if (card.website) data.siteWeb = card.website;
  if (card.linkedin) data.linkedinPage = card.linkedin;
  if (card.address) data.adresse = card.address;
  if (card.postalCode) data.codePostal = card.postalCode;
  if (card.city) data.ville = card.city;
  if (card.country) data.pays = card.country;

  return data;
}

/**
 * Hook to scan a business card image and extract contact data
 * Returns a mutation that takes a File and returns Partial<ProspectFormData>
 */
export function useScanBusinessCard() {
  return useMutation({
    mutationFn: async (file: File): Promise<Partial<ProspectFormData>> => {
      const base64 = await fileToBase64(file);

      const response = await fetch("/api/ocr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Erreur lors de l'analyse de la carte"
        );
      }

      const data: ScanResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return mapToProspectData(data.result);
    },
  });
}
