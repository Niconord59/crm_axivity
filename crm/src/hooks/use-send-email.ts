"use client";

import { useMutation } from "@tanstack/react-query";

interface SendEmailParams {
  contactIds: string[];
  objet: string;
  contenu: string;
  attachment?: File;
}

interface SendEmailResult {
  success: boolean;
  sent: number;
  errors: string[];
}

export function useSendEmail() {
  return useMutation({
    mutationFn: async (params: SendEmailParams): Promise<SendEmailResult> => {
      const formData = new FormData();
      formData.append("contactIds", JSON.stringify(params.contactIds));
      formData.append("objet", params.objet);
      formData.append("contenu", params.contenu);

      if (params.attachment) {
        formData.append("attachment", params.attachment);
      }

      const response = await fetch("/api/emails/send", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'envoi des emails");
      }

      return response.json();
    },
  });
}
