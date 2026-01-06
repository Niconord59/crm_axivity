import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateDevisHTML } from "@/lib/templates/devis-template";
import { generatePDF } from "@/lib/pdf/browser-pool";
import { handleApiError, validateRequestBody } from "@/lib/api-error-handler";
import { previewDevisSchema } from "@/lib/schemas/api";
import { NotFoundError, DatabaseError } from "@/lib/errors";
import type { DevisData, DevisCompanyInfo, LigneDevis } from "@/types";

// Create a Supabase client with service role for server-side operations
// SECURITY: Service role key is required - never fall back to anon key
function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Configuration Supabase manquante: SUPABASE_SERVICE_ROLE_KEY est requis pour les opérations serveur"
    );
  }

  return createClient(url, serviceKey);
}

// Generate preview quote number
function generatePreviewQuoteNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  return `DEV-${year}-XXX`;
}

// Calculate validity date
function getValidityDate(days: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export async function POST(request: NextRequest) {
  try {
    // Get Supabase client with service role (throws if not configured)
    const supabase = getSupabaseServiceClient();

    const { opportuniteId } = await validateRequestBody(request, previewDevisSchema);

    // Fetch opportunity with client and contact
    const { data: opportunite, error: oppError } = await supabase
      .from("opportunites")
      .select(`
        id,
        nom,
        notes,
        client_id,
        contact_id,
        clients (
          id,
          nom,
          siret,
          adresse,
          code_postal,
          ville,
          pays
        ),
        contacts (
          id,
          nom,
          prenom,
          email,
          telephone,
          poste
        )
      `)
      .eq("id", opportuniteId)
      .single();

    if (oppError || !opportunite) {
      throw new NotFoundError("Opportunité non trouvée");
    }

    // Fetch company settings
    const { data: companySettings } = await supabase
      .from("parametres_entreprise")
      .select("*")
      .limit(1)
      .single();

    // Build company info for quote
    const entreprise: DevisCompanyInfo | undefined = companySettings
      ? {
          nom: companySettings.nom,
          formeJuridique: companySettings.forme_juridique,
          capital: companySettings.capital,
          siret: companySettings.siret,
          rcs: companySettings.rcs,
          tvaIntracommunautaire: companySettings.tva_intracommunautaire,
          adresse: companySettings.adresse,
          codePostal: companySettings.code_postal,
          ville: companySettings.ville,
          pays: companySettings.pays,
          telephone: companySettings.telephone,
          email: companySettings.email,
          siteWeb: companySettings.site_web,
          logoUrl: companySettings.logo_url,
          headerDevisUrl: companySettings.header_devis_url,
          couleurPrincipale: companySettings.couleur_principale,
        }
      : undefined;

    // Get quote settings with defaults
    const validiteJours = companySettings?.validite_devis_jours || 30;
    const tauxTva = (companySettings?.taux_tva_defaut || 20) / 100;
    const conditionsPaiement =
      companySettings?.conditions_paiement_defaut ||
      "Paiement à 30 jours fin de mois";

    // Fetch quote lines
    const { data: lignesData, error: lignesError } = await supabase
      .from("lignes_devis")
      .select(`
        *,
        catalogue_services (
          nom,
          categorie
        )
      `)
      .eq("opportunite_id", opportuniteId)
      .order("created_at", { ascending: true });

    if (lignesError) {
      throw new DatabaseError("Erreur lors de la récupération des lignes du devis", { error: lignesError.message });
    }

    // Map lines to LigneDevis type
    const lignes: LigneDevis[] = (lignesData || []).map((record) => {
      const service = record.catalogue_services as { nom?: string; categorie?: string } | null;
      return {
        id: record.id,
        opportuniteId: record.opportunite_id,
        serviceId: record.service_id,
        description: record.description,
        quantite: record.quantite || 1,
        prixUnitaire: record.prix_unitaire || 0,
        remisePourcent: record.remise_pourcent || 0,
        montantHT: record.montant_ht || 0,
        serviceNom: service?.nom,
        serviceCategorie: service?.categorie,
      };
    });

    // Calculate totals
    const totalHT = lignes.reduce((sum, l) => sum + (l.montantHT || 0), 0);
    const tva = totalHT * tauxTva;
    const totalTTC = totalHT + tva;

    // Extract client and contact from joined data
    const clientData = opportunite.clients;
    const client = Array.isArray(clientData) ? clientData[0] : clientData;

    const contactData = opportunite.contacts;
    const contact = Array.isArray(contactData) ? contactData[0] : contactData;

    // Generate preview quote number (not saved)
    const numeroDevis = generatePreviewQuoteNumber();
    const dateDevis = new Date().toISOString().split("T")[0];
    const dateValidite = getValidityDate(validiteJours);

    // Build DevisData
    const devisData: DevisData = {
      numeroDevis,
      dateDevis,
      dateValidite,
      entreprise,
      client: {
        nom: client?.nom || "Client inconnu",
        siret: client?.siret,
        adresse: client?.adresse,
        codePostal: client?.code_postal,
        ville: client?.ville,
        pays: client?.pays || "France",
      },
      contact: contact
        ? {
            nom: contact.nom,
            prenom: contact.prenom,
            email: contact.email,
            telephone: contact.telephone,
            poste: contact.poste,
          }
        : undefined,
      opportunite: {
        nom: opportunite.nom,
        notes: opportunite.notes,
      },
      lignes,
      totalHT,
      tva,
      totalTTC,
      conditionsPaiement,
    };

    // Generate HTML
    const html = generateDevisHTML(devisData);

    // Generate PDF using browser pool
    const buffer = await generatePDF(html);

    // Return PDF - cast to BodyInit for Response compatibility
    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="apercu-devis.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
