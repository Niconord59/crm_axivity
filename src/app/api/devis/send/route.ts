import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Send email using Resend
async function sendEmailWithResend(
  to: string,
  subject: string,
  htmlContent: string,
  attachmentUrl?: string,
  attachmentFilename?: string
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  // Fetch PDF attachment if provided
  let attachments: Array<{ filename: string; content: string }> = [];

  if (attachmentUrl && attachmentFilename) {
    try {
      const response = await fetch(attachmentUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64Content = Buffer.from(buffer).toString("base64");
        attachments = [
          {
            filename: attachmentFilename,
            content: base64Content,
          },
        ];
      }
    } catch (error) {
      console.error("Error fetching PDF attachment:", error);
    }
  }

  // Fetch company settings for sender info
  const { data: companySettings } = await supabase
    .from("parametres_entreprise")
    .select("email, nom")
    .limit(1)
    .single();

  const fromEmail = companySettings?.email || "noreply@axivity.cloud";
  const fromName = companySettings?.nom || "CRM Axivity";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html: htmlContent,
        attachments,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to send email" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Generate email HTML for quote
function generateQuoteEmailHTML(data: {
  numeroDevis: string;
  clientNom: string;
  contactNom?: string;
  contactPrenom?: string;
  opportuniteNom: string;
  totalTTC: number;
  dateValidite: string;
  entrepriseNom: string;
}): string {
  const contactName = data.contactPrenom
    ? `${data.contactPrenom} ${data.contactNom}`
    : data.contactNom || "Madame, Monsieur";

  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(data.totalTTC);

  const formattedDate = new Date(data.dateValidite).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis ${data.numeroDevis}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 3px solid #2563eb;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px;">Devis ${data.numeroDevis}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bonjour ${contactName},
              </p>

              <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Veuillez trouver ci-joint notre devis concernant <strong>${data.opportuniteNom}</strong>.
              </p>

              <!-- Quote Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; margin: 30px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 14px; padding-bottom: 10px;">Numéro de devis</td>
                        <td align="right" style="color: #1a1a1a; font-weight: 600; font-size: 14px; padding-bottom: 10px;">${data.numeroDevis}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px; padding-bottom: 10px;">Montant TTC</td>
                        <td align="right" style="color: #2563eb; font-weight: 700; font-size: 18px; padding-bottom: 10px;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;">Valide jusqu'au</td>
                        <td align="right" style="color: #1a1a1a; font-size: 14px;">${formattedDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                N'hésitez pas à nous contacter si vous avez des questions ou souhaitez discuter de ce devis.
              </p>

              <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 10px;">
                Cordialement,
              </p>

              <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0;">
                L'équipe ${data.entrepriseNom}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8fafc; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Ce message a été envoyé automatiquement depuis le CRM ${data.entrepriseNom}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { devisId, recipientEmail, customMessage } = await request.json();

    if (!devisId) {
      return NextResponse.json(
        { error: "devisId is required" },
        { status: 400 }
      );
    }

    // Fetch devis with related data
    const { data: devis, error: devisError } = await supabase
      .from("devis")
      .select(`
        *,
        clients (nom),
        contacts (nom, prenom, email),
        opportunites (nom)
      `)
      .eq("id", devisId)
      .single();

    if (devisError || !devis) {
      return NextResponse.json(
        { error: "Devis not found" },
        { status: 404 }
      );
    }

    // Get recipient email
    const contact = devis.contacts as { nom?: string; prenom?: string; email?: string } | null;
    const client = devis.clients as { nom?: string } | null;
    const opportunite = devis.opportunites as { nom?: string } | null;

    const toEmail = recipientEmail || contact?.email;

    if (!toEmail) {
      return NextResponse.json(
        { error: "No recipient email provided and contact has no email" },
        { status: 400 }
      );
    }

    // Get company settings
    const { data: companySettings } = await supabase
      .from("parametres_entreprise")
      .select("nom")
      .limit(1)
      .single();

    // Generate email HTML
    const emailHTML = generateQuoteEmailHTML({
      numeroDevis: devis.numero_devis,
      clientNom: client?.nom || "Client",
      contactNom: contact?.nom,
      contactPrenom: contact?.prenom,
      opportuniteNom: opportunite?.nom || "Projet",
      totalTTC: devis.total_ttc,
      dateValidite: devis.date_validite,
      entrepriseNom: companySettings?.nom || "Notre entreprise",
    });

    // Send email
    const result = await sendEmailWithResend(
      toEmail,
      `Devis ${devis.numero_devis} - ${opportunite?.nom || "Proposition commerciale"}`,
      customMessage ? `<p>${customMessage}</p>${emailHTML}` : emailHTML,
      devis.pdf_url,
      `${devis.numero_devis}.pdf`
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    // Update devis status to "envoye" and set date_envoi
    await supabase
      .from("devis")
      .update({
        statut: "envoye",
        date_envoi: new Date().toISOString(),
      })
      .eq("id", devisId);

    return NextResponse.json({
      success: true,
      message: `Email sent to ${toEmail}`,
    });
  } catch (error) {
    console.error("Error sending devis email:", error);
    return NextResponse.json(
      { error: "Error sending email", details: String(error) },
      { status: 500 }
    );
  }
}
