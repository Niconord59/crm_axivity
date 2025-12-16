"use client";

import { useMutation } from "@tanstack/react-query";

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
}

interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

/**
 * Hook to send emails via Gmail API
 */
export function useSendEmail() {
  return useMutation({
    mutationFn: async (params: SendEmailParams): Promise<SendEmailResponse> => {
      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de l'email");
      }

      return data;
    },
  });
}

/**
 * Generate follow-up email template for missed call
 */
export function generateFollowUpEmail(params: {
  prospectPrenom?: string;
  prospectNom: string;
  entreprise?: string;
  userNom?: string;
  userTelephone?: string;
  leftVoicemail?: boolean;
}): { subject: string; body: string } {
  const { prospectPrenom, prospectNom, entreprise, userNom, userTelephone, leftVoicemail } = params;

  const greeting = prospectPrenom ? `Bonjour ${prospectPrenom}` : "Bonjour";
  const voicemailMention = leftVoicemail
    ? "Je vous ai également laissé un message vocal.\n\n"
    : "";

  const subject = `Suite à mon appel${entreprise ? ` - ${entreprise}` : ""}`;

  const body = `${greeting},

Je viens d'essayer de vous joindre par téléphone sans succès.
${voicemailMention}
Je souhaitais échanger avec vous au sujet de nos solutions d'intelligence artificielle qui pourraient vous aider à optimiser vos processus.

N'hésitez pas à me recontacter${userTelephone ? ` au ${userTelephone}` : ""} ou à me proposer un créneau qui vous conviendrait pour un bref échange.

Cordialement,
${userNom || "L'équipe Axivity"}

--
Axivity - Solutions IA pour entreprises`;

  return { subject, body };
}
