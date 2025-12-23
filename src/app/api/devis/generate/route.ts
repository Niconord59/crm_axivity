import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";
import { generateDevisHTML } from "@/lib/templates/devis-template";
import type { DevisData, DevisCompanyInfo, LigneDevis } from "@/types";

// Create a Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Generate quote number
function generateQuoteNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DEV-${year}${month}-${random}`;
}

// Calculate validity date
function getValidityDate(days: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export async function POST(request: NextRequest) {
  try {
    const { opportuniteId } = await request.json();

    if (!opportuniteId) {
      return NextResponse.json(
        { error: "opportuniteId is required" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: "Error fetching quote lines" },
        { status: 500 }
      );
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

    // Extract client and contact from joined data (may be array or object depending on relation)
    const clientData = opportunite.clients;
    const client = Array.isArray(clientData) ? clientData[0] : clientData;

    const contactData = opportunite.contacts;
    const contact = Array.isArray(contactData) ? contactData[0] : contactData;

    // Build DevisData
    const devisData: DevisData = {
      numeroDevis: generateQuoteNumber(),
      dateDevis: new Date().toISOString().split("T")[0],
      dateValidite: getValidityDate(validiteJours),
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

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    await browser.close();

    // Convert Uint8Array to Buffer for NextResponse
    const buffer = Buffer.from(pdfBuffer);

    // Return PDF
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${devisData.numeroDevis}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Error generating PDF", details: String(error) },
      { status: 500 }
    );
  }
}
