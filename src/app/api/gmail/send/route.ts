import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}

// Encode email to base64url format for Gmail API
function encodeEmail(to: string, subject: string, body: string, from: string): string {
  const emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(body).toString("base64"),
  ];

  const email = emailLines.join("\r\n");

  // Convert to base64url (replace + with -, / with _, remove =)
  return Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Non authentifié. Veuillez vous connecter avec Google." },
        { status: 401 }
      );
    }

    const body: SendEmailRequest = await request.json();
    const { to, subject, body: emailBody } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: "Destinataire, sujet et contenu requis" },
        { status: 400 }
      );
    }

    // Get user's email for the "From" field
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      return NextResponse.json(
        { error: "Impossible de récupérer les informations utilisateur" },
        { status: 500 }
      );
    }

    const userInfo = await userInfoResponse.json();
    const fromEmail = userInfo.email;

    // Encode the email
    const encodedEmail = encodeEmail(to, subject, emailBody, fromEmail);

    // Send via Gmail API
    const gmailResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: encodedEmail,
        }),
      }
    );

    if (!gmailResponse.ok) {
      const errorData = await gmailResponse.json();
      console.error("Gmail API error:", errorData);

      // Check for specific errors
      if (gmailResponse.status === 403) {
        return NextResponse.json(
          { error: "Permission Gmail non accordée. Veuillez vous reconnecter." },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    const result = await gmailResponse.json();

    return NextResponse.json({
      success: true,
      messageId: result.id,
      threadId: result.threadId,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'envoi" },
      { status: 500 }
    );
  }
}
