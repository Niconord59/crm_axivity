import { z } from "zod";
import { CONTACT_ROLES } from "@/types/constants";

// Export enum array for form Select components
export { CONTACT_ROLES };

// Schema for creating/editing an opportunite_contact (pivot table)
export const opportuniteContactSchema = z.object({
  // Opportunite ID (required)
  opportuniteId: z
    .string()
    .uuid("ID opportunité invalide"),

  // Contact ID (required)
  contactId: z
    .string()
    .uuid("ID contact invalide"),

  // Role in the opportunity
  role: z.enum(CONTACT_ROLES, {
    errorMap: () => ({ message: "Veuillez sélectionner un rôle valide" }),
  }),

  // Primary contact flag
  isPrimary: z.boolean().default(false),
});

export type OpportuniteContactFormData = z.infer<typeof opportuniteContactSchema>;

// Default values for a new form
export const opportuniteContactDefaultValues: Partial<OpportuniteContactFormData> = {
  opportuniteId: undefined,
  contactId: undefined,
  role: "Participant",
  isPrimary: false,
};

// Schema for adding a contact to an opportunity (simplified - opportuniteId implicit)
// Derived from opportuniteContactSchema to avoid duplication
export const addContactToOpportuniteSchema = opportuniteContactSchema.omit({
  opportuniteId: true,
});

export type AddContactToOpportuniteFormData = z.infer<typeof addContactToOpportuniteSchema>;

// Default values for adding a contact
export const addContactToOpportuniteDefaultValues: Partial<AddContactToOpportuniteFormData> = {
  contactId: undefined,
  role: "Participant",
  isPrimary: false,
};
