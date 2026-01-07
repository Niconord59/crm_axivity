import { createClient } from '@supabase/supabase-js'

// Storage key for auth session - MUST match @/lib/supabase/client.ts
export const AUTH_STORAGE_KEY = 'crm-axivity-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persiste la session dans localStorage
    persistSession: true,
    // Détecte les tokens dans l'URL (callbacks OAuth)
    detectSessionInUrl: true,
    // Utilise PKCE pour une meilleure sécurité
    flowType: 'pkce',
    // Clé de stockage unifiée avec @/lib/supabase/client.ts
    storageKey: AUTH_STORAGE_KEY,
    // Rafraîchit automatiquement le token avant expiration
    autoRefreshToken: true,
  },
})

// Types pour les tables Supabase
export type UserRole = 'admin' | 'developpeur_nocode' | 'developpeur_automatisme' | 'commercial' | 'client'

export type Profile = {
  id: string
  email: string
  nom: string
  prenom: string | null
  role: UserRole
  avatar_url: string | null
  telephone: string | null
  created_at: string
  updated_at: string
}

export type Client = {
  id: string
  nom: string
  siret: string | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  pays: string | null
  email: string | null
  telephone: string | null
  site_web: string | null
  statut: 'Prospect' | 'Actif' | 'Inactif' | 'Perdu'
  sante_client: string | null
  derniere_interaction: string | null
  notes: string | null
  owner_id: string | null
  created_at: string
  updated_at: string
}

export type Contact = {
  id: string
  nom: string
  prenom: string | null
  email: string | null
  telephone: string | null
  poste: string | null
  client_id: string | null
  est_principal: boolean
  statut_prospection: 'À appeler' | 'Appelé - pas répondu' | 'Rappeler' | 'RDV planifié' | 'Qualifié' | 'Non qualifié' | 'Perdu' | null
  date_rappel: string | null
  source_lead: string | null
  notes_prospection: string | null
  type_rdv: 'Visio' | 'Présentiel' | null
  lien_visio: string | null
  owner_id: string | null
  created_at: string
  updated_at: string
}

export type Opportunite = {
  id: string
  nom: string
  client_id: string | null
  contact_id: string | null
  statut: 'Nouveau' | 'Qualifié' | 'Proposition' | 'Négociation' | 'Gagné' | 'Perdu'
  valeur_estimee: number | null
  probabilite: number | null
  valeur_ponderee: number | null
  date_cloture_prevue: string | null
  notes: string | null
  projet_id: string | null
  owner_id: string | null
  created_at: string
  updated_at: string
}

export type Projet = {
  id: string
  nom: string
  brief: string | null
  client_id: string | null
  statut: 'Cadrage' | 'En cours' | 'En pause' | 'Terminé' | 'Annulé'
  date_debut: string | null
  date_fin_prevue: string | null
  date_fin_reelle: string | null
  budget_initial: number | null
  heures_estimees: number | null
  heures_passees: number | null
  notes: string | null
  owner_id: string | null
  created_at: string
  updated_at: string
}

export type Tache = {
  id: string
  titre: string
  description: string | null
  projet_id: string | null
  assignee_id: string | null
  statut: 'À faire' | 'En cours' | 'En review' | 'Terminé'
  priorite: 'Basse' | 'Moyenne' | 'Haute' | 'Urgente'
  date_echeance: string | null
  heures_estimees: number | null
  heures_passees: number | null
  created_at: string
  updated_at: string
}

export type Facture = {
  id: string
  numero: string | null
  client_id: string | null
  projet_id: string | null
  statut: 'Brouillon' | 'Envoyé' | 'Payé' | 'En retard' | 'Annulé'
  montant_ht: number | null
  taux_tva: number | null
  montant_ttc: number | null
  date_emission: string | null
  date_echeance: string | null
  date_paiement: string | null
  niveau_relance: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Interaction = {
  id: string
  client_id: string | null
  contact_id: string | null
  type: 'Appel' | 'Email' | 'Réunion' | 'Note' | 'Autre'
  date: string
  resume: string | null
  auteur_id: string | null
  created_at: string
}
