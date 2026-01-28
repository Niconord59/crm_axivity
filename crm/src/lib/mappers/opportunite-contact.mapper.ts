// CRM Axivity - OpportuniteContact Mapper
// Maps between Supabase opportunite_contacts records and TypeScript OpportuniteContact

import type { OpportuniteContact, ContactRole } from "@/types";
import { CONTACT_ROLES } from "@/types/constants";
import {
  parseString,
  parseBoolean,
  parseDate,
  parseEnum,
  type SupabaseRecord,
} from "./base.mapper";

/**
 * Map a Supabase opportunite_contacts record to OpportuniteContact type
 */
export function mapToOpportuniteContact(
  record: SupabaseRecord
): OpportuniteContact {
  return {
    id: parseString(record.id),
    opportuniteId: parseString(record.opportunite_id),
    contactId: parseString(record.contact_id),
    role: parseEnum(record.role, CONTACT_ROLES, "Participant") as ContactRole,
    isPrimary: parseBoolean(record.is_primary, false),
    createdTime: parseDate(record.created_at),
    updatedAt: parseDate(record.updated_at),
    // Relations are loaded separately if needed
    contact: undefined,
    opportunite: undefined,
  };
}

/**
 * Map OpportuniteContact to Supabase insert format
 */
export function mapOpportuniteContactToInsert(data: {
  opportuniteId: string;
  contactId: string;
  role: ContactRole;
  isPrimary?: boolean;
}): Record<string, unknown> {
  return {
    opportunite_id: data.opportuniteId,
    contact_id: data.contactId,
    role: data.role,
    is_primary: data.isPrimary ?? false,
  };
}

/**
 * Map OpportuniteContact to Supabase update format
 */
export function mapOpportuniteContactToUpdate(data: {
  role?: ContactRole;
  isPrimary?: boolean;
}): Record<string, unknown> {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.role !== undefined) {
    update.role = data.role;
  }

  if (data.isPrimary !== undefined) {
    update.is_primary = data.isPrimary;
  }

  return update;
}
