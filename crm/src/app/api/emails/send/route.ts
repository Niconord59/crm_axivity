import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleApiError } from "@/lib/api-error-handler";
import { ValidationError, ExternalServiceError } from "@/lib/errors";

function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Configuration Supabase manquante: SUPABASE_SERVICE_ROLE_KEY est requis"
    );
  }

  return createClient(url, serviceKey);
}

/**
 * Replace template variables with actual contact data
 * Supports: {{prenom}}, {{nom}}, {{email}}, {{telephone}}, {{poste}}, {{entreprise}}
 */
function replaceVariables(
  text: string,
  contact: Record<string, string | null | undefined>,
  clientNom?: string
): string {
  return text
    .replace(/\{\{prenom\}\}/g, contact.prenom || "")
    .replace(/\{\{nom\}\}/g, contact.nom || "")
    .replace(/\{\{email\}\}/g, contact.email || "")
    .replace(/\{\{telephone\}\}/g, contact.telephone || "")
    .replace(/\{\{poste\}\}/g, contact.poste || "")
    .replace(/\{\{entreprise\}\}/g, clientNom || "");
}

/**
 * Convert plain text to basic HTML (preserves newlines)
 */
function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\n/g, "<br>");
}

export async function POST(request: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new ExternalServiceError("Resend", {
        error: "RESEND_API_KEY non configurée",
      });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const contactIdsRaw = formData.get("contactIds") as string;
    const objet = formData.get("objet") as string;
    const contenu = formData.get("contenu") as string;
    const attachment = formData.get("attachment") as File | null;

    // Validate required fields
    if (!contactIdsRaw || !objet || !contenu) {
      throw new ValidationError("contactIds, objet et contenu sont requis");
    }

    let contactIds: string[];
    try {
      contactIds = JSON.parse(contactIdsRaw);
    } catch {
      throw new ValidationError("contactIds doit être un tableau JSON valide");
    }

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      throw new ValidationError("Au moins un contact est requis");
    }

    // Validate attachment size (max 25MB)
    if (attachment && attachment.size > 25 * 1024 * 1024) {
      throw new ValidationError("La pièce jointe ne doit pas dépasser 25 Mo");
    }

    // Prepare attachment if present
    let attachments: Array<{
      filename: string;
      content: string;
    }> = [];

    if (attachment && attachment.size > 0) {
      const buffer = await attachment.arrayBuffer();
      attachments = [
        {
          filename: attachment.name,
          content: Buffer.from(buffer).toString("base64"),
        },
      ];
    }

    // Fetch contacts with their client info
    const supabase = getSupabaseServiceClient();
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select(
        "id, nom, prenom, email, telephone, poste, client_id, clients(nom)"
      )
      .in("id", contactIds);

    if (contactsError) throw contactsError;

    if (!contacts || contacts.length === 0) {
      throw new ValidationError("Aucun contact trouvé");
    }

    // Fetch company settings for sender info
    const { data: companySettings } = await supabase
      .from("parametres_entreprise")
      .select("email, nom")
      .limit(1)
      .single();

    const fromEmail = companySettings?.email || "noreply@axivity.cloud";
    const fromName = companySettings?.nom || "CRM Axivity";

    // Send personalized email to each contact
    const results: { sent: number; errors: string[] } = {
      sent: 0,
      errors: [],
    };

    for (const contact of contacts) {
      if (!contact.email) {
        results.errors.push(
          `${contact.prenom || ""} ${contact.nom}: pas d'email`
        );
        continue;
      }

      const clientData = contact.clients as { nom?: string } | null;
      const clientNom = clientData?.nom;

      // Replace variables in subject and body
      const personalizedSubject = replaceVariables(objet, contact, clientNom);
      const personalizedBody = replaceVariables(contenu, contact, clientNom);

      // Build HTML email
      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <tr><td style="padding:40px;">
          <div style="color:#1a1a1a;font-size:15px;line-height:1.7;">
            ${textToHtml(personalizedBody)}
          </div>
        </td></tr>
        <tr><td style="padding:20px 40px;background-color:#f8fafc;border-radius:0 0 8px 8px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">
            Envoyé depuis le CRM ${fromName}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [contact.email],
            subject: personalizedSubject,
            html: htmlContent,
            attachments,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          results.errors.push(
            `${contact.email}: ${error.message || "Erreur d'envoi"}`
          );
        } else {
          results.sent++;
        }
      } catch (error) {
        results.errors.push(
          `${contact.email}: ${error instanceof Error ? error.message : "Erreur inconnue"}`
        );
      }
    }

    return NextResponse.json({
      success: results.sent > 0,
      sent: results.sent,
      errors: results.errors,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
