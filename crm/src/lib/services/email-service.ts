// Email Service - Abstraction for Gmail and Microsoft Graph APIs

import type { OAuthProvider } from "@/lib/auth";

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

export interface GetUserEmailResult {
  email?: string;
  error?: string;
}

// ============================================
// GOOGLE (GMAIL) IMPLEMENTATION
// ============================================

// Encode email to base64url format for Gmail API
function encodeGmailEmail(to: string, subject: string, body: string, from: string): string {
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

async function getGoogleUserEmail(accessToken: string): Promise<GetUserEmailResult> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return { error: "Impossible de récupérer l'email utilisateur Google" };
  }

  const userInfo = await response.json();
  return { email: userInfo.email };
}

async function sendGmailEmail(
  accessToken: string,
  params: SendEmailParams,
  fromEmail: string
): Promise<SendEmailResult> {
  const encodedEmail = encodeGmailEmail(params.to, params.subject, params.body, fromEmail);

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedEmail }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Gmail API error:", errorData);

    if (response.status === 403) {
      return { success: false, error: "Permission Gmail non accordée. Veuillez vous reconnecter." };
    }

    return { success: false, error: "Erreur lors de l'envoi de l'email via Gmail" };
  }

  const result = await response.json();
  return {
    success: true,
    messageId: result.id,
    threadId: result.threadId,
  };
}

// ============================================
// MICROSOFT GRAPH IMPLEMENTATION
// ============================================

async function getMicrosoftUserEmail(accessToken: string): Promise<GetUserEmailResult> {
  const response = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return { error: "Impossible de récupérer l'email utilisateur Microsoft" };
  }

  const userInfo = await response.json();
  return { email: userInfo.mail || userInfo.userPrincipalName };
}

async function sendMicrosoftEmail(
  accessToken: string,
  params: SendEmailParams
): Promise<SendEmailResult> {
  // Microsoft Graph API uses a different format - no base64 encoding needed
  const mailPayload = {
    message: {
      subject: params.subject,
      body: {
        contentType: "text",
        content: params.body,
      },
      toRecipients: [
        {
          emailAddress: {
            address: params.to,
          },
        },
      ],
    },
    saveToSentItems: true,
  };

  const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(mailPayload),
  });

  // Microsoft sendMail returns 202 Accepted with no body on success
  if (response.status === 202 || response.ok) {
    return {
      success: true,
      messageId: `ms-${Date.now()}`, // Microsoft doesn't return messageId for sendMail
    };
  }

  const errorData = await response.json().catch(() => ({}));
  console.error("Microsoft Graph API error:", errorData);

  if (response.status === 403) {
    return { success: false, error: "Permission Mail.Send non accordée. Veuillez vous reconnecter." };
  }

  return { success: false, error: errorData.error?.message || "Erreur lors de l'envoi de l'email via Microsoft" };
}

// ============================================
// UNIFIED SERVICE FUNCTIONS
// ============================================

export async function getUserEmail(
  provider: OAuthProvider,
  accessToken: string
): Promise<GetUserEmailResult> {
  if (provider === "google") {
    return getGoogleUserEmail(accessToken);
  } else {
    return getMicrosoftUserEmail(accessToken);
  }
}

export async function sendEmail(
  provider: OAuthProvider,
  accessToken: string,
  params: SendEmailParams
): Promise<SendEmailResult> {
  // First, get the user's email for the From field (only needed for Google)
  if (provider === "google") {
    const userEmailResult = await getGoogleUserEmail(accessToken);
    if (userEmailResult.error || !userEmailResult.email) {
      return { success: false, error: userEmailResult.error || "Email utilisateur non trouvé" };
    }
    return sendGmailEmail(accessToken, params, userEmailResult.email);
  } else {
    return sendMicrosoftEmail(accessToken, params);
  }
}
