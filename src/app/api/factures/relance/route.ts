import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { differenceInDays } from "date-fns";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://n8n.axivity.cloud";

interface RelanceRequest {
  factureId: string;
}

function getRelanceLevel(dateEcheance: string): number {
  const joursRetard = differenceInDays(new Date(), new Date(dateEcheance));
  if (joursRetard <= 0) return 0;
  if (joursRetard <= 7) return 1;
  if (joursRetard <= 15) return 2;
  return 3;
}

export async function POST(request: NextRequest) {
  try {
    const body: RelanceRequest = await request.json();
    const { factureId } = body;

    if (!factureId) {
      return NextResponse.json(
        { error: "factureId is required" },
        { status: 400 }
      );
    }

    // 1. Récupérer la facture avec les relations
    const { data: facture, error: factureError } = await supabase
      .from("factures")
      .select(`
        id,
        numero,
        montant_ht,
        montant_ttc,
        date_emission,
        date_echeance,
        statut,
        projet_id,
        projets (
          id,
          nom,
          client_id,
          clients (
            id,
            nom
          )
        )
      `)
      .eq("id", factureId)
      .single();

    if (factureError || !facture) {
      console.error("Facture not found:", factureError);
      return NextResponse.json(
        { error: "Facture not found" },
        { status: 404 }
      );
    }

    // 2. Récupérer le contact principal du client
    const clientId = (facture.projets as any)?.client_id;
    let contactEmail = null;
    let contactNom = "Madame, Monsieur";

    if (clientId) {
      const { data: contact } = await supabase
        .from("contacts")
        .select("id, nom, prenom, email")
        .eq("client_id", clientId)
        .limit(1)
        .single();

      if (contact?.email) {
        contactEmail = contact.email;
        contactNom = contact.prenom
          ? `${contact.prenom} ${contact.nom}`
          : contact.nom;
      }
    }

    if (!contactEmail) {
      return NextResponse.json(
        { error: "Aucun email de contact trouvé pour cette facture" },
        { status: 400 }
      );
    }

    // 3. Calculer le niveau de relance
    const niveauRelance = getRelanceLevel(facture.date_echeance);
    if (niveauRelance === 0) {
      return NextResponse.json(
        { error: "Cette facture n'est pas en retard" },
        { status: 400 }
      );
    }

    const joursRetard = differenceInDays(
      new Date(),
      new Date(facture.date_echeance)
    );

    // 4. Appeler le webhook N8N
    const webhookPayload = {
      facture_id: facture.id,
      numero_facture: facture.numero || `FACT-${facture.id.slice(0, 8)}`,
      montant_ht: facture.montant_ht || 0,
      montant_ttc: facture.montant_ttc || 0,
      date_echeance: facture.date_echeance,
      jours_retard: joursRetard,
      niveau_relance: niveauRelance,
      client_nom: (facture.projets as any)?.clients?.nom || "Client",
      contact_nom: contactNom,
      contact_email: contactEmail,
    };

    console.log("Calling N8N webhook with payload:", webhookPayload);

    const n8nResponse = await fetch(
      `${N8N_WEBHOOK_URL}/webhook/relance-facture-manuelle`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      }
    );

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("N8N webhook error:", errorText);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de la relance", details: errorText },
        { status: 500 }
      );
    }

    const n8nResult = await n8nResponse.json();
    console.log("N8N webhook response:", n8nResult);

    // 5. Mettre à jour la facture dans Supabase (si les colonnes existent)
    try {
      const { error: updateError } = await supabase
        .from("factures")
        .update({
          niveau_relance: niveauRelance,
        })
        .eq("id", factureId);

      if (updateError) {
        console.error("Error updating facture:", updateError);
        // On ne fait pas échouer la requête car l'email a été envoyé
      }
    } catch (e) {
      console.error("Error updating facture (column may not exist):", e);
    }

    // 6. Créer une interaction dans le CRM
    const { error: interactionError } = await supabase
      .from("interactions")
      .insert({
        type: "Email",
        objet: `Relance N${niveauRelance} - Facture ${facture.numero || factureId}`,
        resume: `Email de relance niveau ${niveauRelance} envoyé pour la facture ${facture.numero || factureId} (${facture.montant_ttc}€ TTC, ${joursRetard} jours de retard)`,
        date: new Date().toISOString(),
        client_id: clientId,
      });

    if (interactionError) {
      console.error("Error creating interaction:", interactionError);
    }

    return NextResponse.json({
      success: true,
      message: `Relance N${niveauRelance} envoyée avec succès`,
      niveau_relance: niveauRelance,
      facture_id: factureId,
    });
  } catch (error) {
    console.error("Error in relance API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
