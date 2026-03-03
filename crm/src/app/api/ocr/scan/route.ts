import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error-handler";
import { ValidationError, ExternalServiceError } from "@/lib/errors";

// Mistral OCR structured response
interface BusinessCardData {
  lastName?: string;
  firstName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  companyPhone?: string;
  website?: string;
  linkedin?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
}

// JSON schema for Mistral structured output
const BUSINESS_CARD_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "business_card",
    strict: true,
    schema: {
      type: "object",
      properties: {
        lastName: { type: "string", description: "Nom de famille" },
        firstName: { type: "string", description: "Prénom" },
        email: { type: "string", description: "Adresse email" },
        phone: { type: "string", description: "Téléphone personnel ou mobile" },
        jobTitle: { type: "string", description: "Poste / titre du job" },
        company: { type: "string", description: "Nom de l'entreprise" },
        companyPhone: {
          type: "string",
          description: "Téléphone de l'entreprise (ligne fixe)",
        },
        website: { type: "string", description: "Site web" },
        linkedin: { type: "string", description: "URL LinkedIn" },
        address: { type: "string", description: "Adresse postale" },
        postalCode: { type: "string", description: "Code postal" },
        city: { type: "string", description: "Ville" },
        country: { type: "string", description: "Pays" },
      },
      required: [
        "lastName",
        "firstName",
        "email",
        "phone",
        "jobTitle",
        "company",
        "companyPhone",
        "website",
        "linkedin",
        "address",
        "postalCode",
        "city",
        "country",
      ],
      additionalProperties: false,
    },
  },
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/ocr/scan
 * Extract business card data from an image using Mistral vision model
 */
export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image || typeof image !== "string") {
      throw new ValidationError("L'image est requise (format base64 data URI)");
    }

    // Validate data URI format
    if (!image.startsWith("data:image/")) {
      throw new ValidationError(
        "Format d'image invalide. Attendu: data:image/..."
      );
    }

    // Check size (base64 is ~4/3 of original, but we check the full string)
    const sizeInBytes = Math.ceil((image.length * 3) / 4);
    if (sizeInBytes > MAX_IMAGE_SIZE) {
      throw new ValidationError(
        `L'image est trop volumineuse (${Math.round(sizeInBytes / 1024 / 1024)}MB). Maximum: 10MB`
      );
    }

    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      throw new ExternalServiceError("Mistral OCR", {
        reason: "MISTRAL_API_KEY non configurée",
      });
    }

    // Call Mistral chat completions with vision capability
    const response = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extrais les informations de contact de cette carte de visite. Retourne un JSON avec les champs trouvés. Si un champ n'est pas visible, retourne une chaîne vide.",
                },
                {
                  type: "image_url",
                  image_url: image,
                },
              ],
            },
          ],
          response_format: BUSINESS_CARD_SCHEMA,
          max_tokens: 1000,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new ExternalServiceError("Mistral OCR", {
        status: response.status,
        body: errorText,
      });
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new ExternalServiceError("Mistral OCR", {
        reason: "Réponse vide du modèle",
      });
    }

    // Parse the structured JSON response
    let cardData: BusinessCardData;
    try {
      cardData = JSON.parse(content);
    } catch {
      throw new ExternalServiceError("Mistral OCR", {
        reason: "Réponse JSON invalide",
        content,
      });
    }

    return NextResponse.json({ result: cardData });
  } catch (error) {
    return handleApiError(error);
  }
}
