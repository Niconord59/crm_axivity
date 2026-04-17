import { NextRequest, NextResponse } from "next/server";
import { getServerAccessToken } from "@/lib/auth";
import { sendEmail } from "@/lib/services/email-service";
import { handleApiError, validateRequestBody } from "@/lib/api-error-handler";
import { sendEmailSchema } from "@/lib/schemas/api";
import { UnauthorizedError, ForbiddenError, ExternalServiceError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const credentials = await getServerAccessToken(request);

    if (!credentials) {
      throw new UnauthorizedError("Veuillez vous connecter pour envoyer des emails");
    }

    const { to, subject, body: emailBody } = await validateRequestBody(
      request,
      sendEmailSchema
    );

    const { accessToken, provider } = credentials;
    const result = await sendEmail(provider, accessToken, {
      to,
      subject,
      body: emailBody,
    });

    if (!result.success) {
      // Check for permission errors
      if (result.error?.includes("Permission")) {
        throw new ForbiddenError(result.error);
      }

      throw new ExternalServiceError("Email", { error: result.error });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      threadId: result.threadId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
