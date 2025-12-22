import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/services/email-service";

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Non authentifié. Veuillez vous connecter." },
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

    const provider = session.provider || "google";
    const result = await sendEmail(provider, session.accessToken, {
      to,
      subject,
      body: emailBody,
    });

    if (!result.success) {
      console.error(`${provider} email send error:`, result.error);

      // Check for permission errors
      if (result.error?.includes("Permission")) {
        return NextResponse.json(
          { error: result.error },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: result.error || "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
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
