import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateFactureHTML } from "@/lib/templates/facture-template";
import { generatePDF } from "@/lib/pdf/browser-pool";
import { handleApiError, validateRequestBody } from "@/lib/api-error-handler";
import { generateFactureSchema } from "@/lib/schemas/api";
import { NotFoundError, ConflictError, DatabaseError } from "@/lib/errors";
import type { FactureData, FactureCompanyInfo, LigneDevis } from "@/types";

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

// Generate sequential invoice number using the database function
// SECURITY: Throws error on failure instead of fallback to prevent duplicates
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateInvoiceNumber(supabase: ReturnType<typeof createClient<any>>): Promise<string> {
  const { data, error } = await supabase.rpc("generer_numero_facture");

  if (error) {
    console.error("Error generating invoice number:", error);
    throw new DatabaseError("Impossible de générer le numéro de facture", {
      supabaseError: error.message,
    });
  }

  if (!data) {
    throw new DatabaseError("Numéro de facture non retourné par la base de données");
  }

  return data as string;
}

// Calculate due date (default 30 days)
function getDueDate(days: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export async function POST(request: NextRequest) {
  try {
    // Get Supabase client with service role (throws if not configured)
    const supabase = getSupabaseServiceClient();

    const { devisId } = await validateRequestBody(request, generateFactureSchema);

    // Fetch devis with related data
    const { data: devis, error: devisError } = await supabase
      .from("devis")
      .select(`
        id,
        numero_devis,
        opportunite_id,
        client_id,
        contact_id,
        total_ht,
        tva,
        total_ttc,
        taux_tva,
        conditions_paiement,
        facture_id,
        opportunites (
          id,
          nom,
          notes
        ),
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
      .eq("id", devisId)
      .single();

    if (devisError || !devis) {
      throw new NotFoundError("Devis non trouvé");
    }

    // Check if already converted
    if (devis.facture_id) {
      throw new ConflictError("Ce devis a déjà été converti en facture");
    }

    // Fetch company settings
    const { data: companySettings } = await supabase
      .from("parametres_entreprise")
      .select("*")
      .limit(1)
      .single();

    // Build company info for invoice
    const entreprise: FactureCompanyInfo | undefined = companySettings
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
          couleurPrincipale: companySettings.couleur_principale || "#16a34a",
          iban: companySettings.iban,
          bic: companySettings.bic,
        }
      : undefined;

    // Get payment terms with defaults
    const conditionsPaiement =
      devis.conditions_paiement ||
      companySettings?.conditions_paiement_defaut ||
      "Paiement à 30 jours fin de mois";

    // Fetch quote lines from the opportunity
    const { data: lignesData, error: lignesError } = await supabase
      .from("lignes_devis")
      .select(`
        *,
        catalogue_services (
          nom,
          categorie
        )
      `)
      .eq("opportunite_id", devis.opportunite_id)
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

    // Extract client and contact from joined data
    const clientData = devis.clients;
    const client = Array.isArray(clientData) ? clientData[0] : clientData;

    const contactData = devis.contacts;
    const contact = Array.isArray(contactData) ? contactData[0] : contactData;

    const opportuniteData = devis.opportunites;
    const opportunite = Array.isArray(opportuniteData) ? opportuniteData[0] : opportuniteData;

    // Generate sequential invoice number
    const numeroFacture = await generateInvoiceNumber(supabase);
    const dateEmission = new Date().toISOString().split("T")[0];
    const dateEcheance = getDueDate(30);

    // Build FactureData
    const factureData: FactureData = {
      numeroFacture,
      dateEmission,
      dateEcheance,
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
      objet: opportunite?.nom || "Prestation de services",
      devisReference: devis.numero_devis,
      lignes,
      totalHT: devis.total_ht || 0,
      tauxTva: devis.taux_tva || 20,
      tva: devis.tva || 0,
      totalTTC: devis.total_ttc || 0,
      conditionsPaiement,
    };

    // Generate HTML
    const html = generateFactureHTML(factureData);

    // Generate PDF using browser pool
    const buffer = await generatePDF(html);

    // Create facture record
    const pdfFilename = `${numeroFacture}.pdf`;

    const { data: factureRecord, error: factureError } = await supabase
      .from("factures")
      .insert({
        numero: numeroFacture,
        client_id: client?.id || null,
        projet_id: null, // No project yet
        contact_id: contact?.id || null,
        devis_id: devisId,
        statut: "Brouillon",
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        montant_ht: devis.total_ht,
        taux_tva: devis.taux_tva || 20,
        conditions_paiement: conditionsPaiement,
        objet: opportunite?.nom,
        pdf_filename: pdfFilename,
      })
      .select()
      .single();

    if (factureError) {
      throw new DatabaseError("Erreur lors de la création de la facture", { error: factureError.message });
    }

    // Upload PDF to storage
    if (factureRecord) {
      const filePath = `${factureRecord.id}/${pdfFilename}`;

      const { error: uploadError } = await supabase.storage
        .from("factures-pdf")
        .upload(filePath, buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (!uploadError) {
        // Get public URL and update facture
        const { data: urlData } = supabase.storage
          .from("factures-pdf")
          .getPublicUrl(filePath);

        await supabase
          .from("factures")
          .update({
            pdf_url: urlData.publicUrl,
            pdf_filename: filePath,
          })
          .eq("id", factureRecord.id);
      }

      // Update devis to link it to the facture
      await supabase
        .from("devis")
        .update({
          facture_id: factureRecord.id,
          date_conversion: new Date().toISOString(),
          statut: "accepte", // Mark devis as accepted when converted
        })
        .eq("id", devisId);
    }

    // Return PDF - cast to BodyInit for Response compatibility
    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFilename}"`,
        "X-Facture-Id": factureRecord?.id || "",
        "X-Facture-Numero": numeroFacture,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
