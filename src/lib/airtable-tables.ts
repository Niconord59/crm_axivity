// Airtable Table IDs for CRM Axivity
// Base ID: appEf6JtWFdfLwsU6

export const AIRTABLE_TABLES = {
  // CRM Core
  CLIENTS: "Clients",
  CONTACTS: "Contacts",
  INTERACTIONS: "Interactions",

  // Sales Pipeline
  OPPORTUNITES: "Opportunités",
  CATALOGUE_SERVICES: "Catalogue de Services",
  LIGNES_DEVIS: "Lignes de Devis",

  // Project Management
  PROJETS: "Projets",
  TACHES: "Tâches",
  MODELES_TACHES: "Modèles de Tâches",

  // Finance
  FACTURES: "Factures",

  // Time & Resources
  JOURNAL_TEMPS: "Journal de Temps",
  EQUIPE: "Équipe",

  // Knowledge & Strategy
  CONNAISSANCES: "Connaissances",
  OBJECTIFS: "Objectifs",
  RESULTATS_CLES: "Résultats Clés",

  // Ecosystem
  FEEDBACK_CLIENT: "Feedback Client",
  PARTENAIRES: "Partenaires & Freelances",

  // System
  CHANGELOG: "Changelog du Cockpit",
  SCENARIOS: "Scénarios Prévisionnels",
  ACCOMPLISSEMENTS: "Accomplissements",
  DEMANDES_EVOLUTION: "Demandes d'Évolution",
} as const;

export type AirtableTable = (typeof AIRTABLE_TABLES)[keyof typeof AIRTABLE_TABLES];

// Table IDs (more stable than names)
export const AIRTABLE_TABLE_IDS = {
  CLIENTS: "tbljVwWGbg2Yq9toR",
  CONTACTS: "tblNHBh9qBi6OeFca",
  OPPORTUNITES: "tbl8QiX8vGLQfRu0G",
  PROJETS: "tblwNbd9Lk8SxixAI",
  TACHES: "tbl6x2Ju4HJyh8SW2",
  MODELES_TACHES: "tblhOmJ1223G97l3k",
  FACTURES: "tbl0d2o8Df9Sj827M",
  INTERACTIONS: "tblUoIhmQVr3ie5BQ",
  JOURNAL_TEMPS: "tblPFfQLwtEbp8PoG",
  EQUIPE: "tblozWfDZEFW3Nkwv",
  CONNAISSANCES: "tblizxKK7FJsHuWnU",
  OBJECTIFS: "tblFhPGAqSaXSJZ0e",
  RESULTATS_CLES: "tbllcCCF5blNA8FQ6",
  CATALOGUE_SERVICES: "tbl7GlDVGVyuKM1Sx",
  LIGNES_DEVIS: "tblDKpxirY53hAO8k",
  FEEDBACK_CLIENT: "tbl9I3B5xqIy5Gcrt",
  PARTENAIRES: "tblJfPLFKJyCg23Az",
  CHANGELOG: "tblx1zcTUoahNDAgn",
  SCENARIOS: "tblU8SpVot0pxbosk",
  ACCOMPLISSEMENTS: "tblBEg5xbIEwib9Eo",
  DEMANDES_EVOLUTION: "tblaHSPKYf4r3RbNF",
} as const;
