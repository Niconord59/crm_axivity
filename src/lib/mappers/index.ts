// CRM Axivity - Mappers Barrel Export
// Centralized exports for all entity mappers

// Base utilities
export {
  parseString,
  parseOptionalString,
  parseNumber,
  parseOptionalNumber,
  parseBoolean,
  parseDate,
  parseLinkedIds,
  parseLinkedId,
  parseEnum,
  type SupabaseRecord,
} from "./base.mapper";

// Entity mappers
export {
  mapToClient,
  mapClientToInsert,
  mapClientToUpdate,
} from "./client.mapper";

export {
  mapToOpportunite,
  mapOpportuniteToInsert,
  mapOpportuniteToUpdate,
} from "./opportunite.mapper";

export {
  mapToProjet,
  mapProjetToInsert,
  mapProjetToUpdate,
  type ProjetWithOwner,
} from "./projet.mapper";

export {
  mapToTache,
  mapTacheToInsert,
  mapTacheToUpdate,
} from "./tache.mapper";

export {
  mapToFacture,
  mapFactureToInsert,
  mapFactureToUpdate,
} from "./facture.mapper";
