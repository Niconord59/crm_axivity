# Plan de Migration : Airtable → Supabase

**Date** : 17 décembre 2025
**Mise à jour** : 5 janvier 2026
**Projet** : CRM Axivity
**Objectifs** : Performance, Temps réel, Authentification, Rôles utilisateurs
**Statut** : ✅ MIGRATION COMPLÈTE (100%)

---

## État actuel de la migration

| Phase | Statut | Notes |
|-------|--------|-------|
| 1. Infrastructure | ✅ Complète | Supabase déployé via Coolify |
| 2. Schéma & Auth | ✅ Complète | 19 fichiers SQL de migration |
| 3. Migration données | ✅ Complète | Données test importées |
| 4. Refactoring hooks | ✅ Complète | 16 hooks migrés |
| 5. Auth UI | ✅ Complète | Pages login/register/forgot-password/reset-password |
| 6. Rôles UI | ✅ Complète | Invitation admin, création équipe automatique |
| 7. N8N workflows | ✅ Complète | 4 workflows adaptés |
| 8. Email Production | ✅ Complète | Resend + templates personnalisés |

### Hooks migrés (Phase 4)

| Hook | Statut | Notes |
|------|--------|-------|
| `use-clients.ts` | ✅ | Mapping `secteur` (pas `secteur_activite`) |
| `use-projets.ts` | ✅ | - |
| `use-taches.ts` | ✅ | - |
| `use-opportunites.ts` | ✅ | - |
| `use-factures.ts` | ✅ | - |
| `use-prospects.ts` | ✅ | Mapping `nom`/`prenom` (pas `nom_complet`) |
| `use-equipe.ts` | ✅ | Table `equipe` créée |
| `use-interactions.ts` | ✅ | Mapping `resume`/`user_id` |
| `use-convert-opportunity.ts` | ✅ | - |
| `use-import-leads.ts` | ✅ | Mapping colonnes corrigé |

---

## 1. Vue d'ensemble

### 1.1 Pourquoi migrer ?

| Critère | Airtable (actuel) | Supabase (cible) |
|---------|-------------------|------------------|
| Latence | 200-500ms | 10-50ms |
| Temps réel | ❌ Polling | ✅ WebSockets natifs |
| Auth utilisateurs | ❌ Non | ✅ Auth intégrée |
| Rôles/Permissions | ❌ Non | ✅ Row Level Security |
| Rate limit | 5 req/sec | Illimité (self-hosted) |
| Coût | ~20$/mois | 0$ (self-hosted) |
| Contrôle données | Cloud Airtable | 100% propriétaire |

### 1.2 Stack technique cible

```
┌─────────────────────────────────────────────────────────┐
│                    COOLIFY SERVER                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Next.js   │  │  Supabase   │  │    N8N          │  │
│  │   CRM App   │◄─┤  (Docker)   │◄─┤  Automations    │  │
│  │   :3000     │  │  :8000      │  │  :5678          │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│         │              │                    │           │
│         └──────────────┴────────────────────┘           │
│                    PostgreSQL :5432                      │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Système d'authentification et rôles

### 2.1 Rôles utilisateurs

| Rôle | Description | Accès |
|------|-------------|-------|
| `admin` | Administrateur | Tout accès, gestion utilisateurs |
| `manager` | Chef d'équipe | Lecture/écriture toutes données, pas de gestion users |
| `commercial` | Commercial | Ses opportunités, clients, prospection |
| `membre` | Membre équipe | Ses tâches, projets assignés |
| `client` | Client externe | Portail client uniquement (ses projets/factures) |

### 2.2 Matrice des permissions

| Table | admin | manager | commercial | membre | client |
|-------|-------|---------|------------|--------|--------|
| Clients | CRUD | CRUD | CRUD (own) | R | R (own) |
| Contacts | CRUD | CRUD | CRUD | R | - |
| Opportunités | CRUD | CRUD | CRUD (own) | R | - |
| Projets | CRUD | CRUD | R | R (assigned) | R (own) |
| Tâches | CRUD | CRUD | R | CRUD (own) | - |
| Factures | CRUD | CRUD | R | - | R (own) |
| Équipe | CRUD | R | R | R | - |
| Prospection | CRUD | CRUD | CRUD | - | - |

**Légende** : C=Create, R=Read, U=Update, D=Delete, own=ses données uniquement

### 2.3 Structure table utilisateurs

```sql
-- Table des profils utilisateurs (extension de auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'membre'
    CHECK (role IN ('admin', 'manager', 'commercial', 'membre', 'client')),
  equipe_id UUID REFERENCES equipe(id),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger pour créer le profil automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nom', 'Utilisateur'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 3. Schéma de base de données

### 3.1 Migration des 21 tables Airtable

#### Tables CRM Core

```sql
-- T1: Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type TEXT CHECK (type IN ('PME', 'ETI', 'Grand Compte', 'Startup', 'Association')),
  secteur TEXT,
  statut TEXT DEFAULT 'Prospect' CHECK (statut IN ('Prospect', 'Actif', 'Inactif', 'Churned')),
  site_web TEXT,
  siret TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  pays TEXT DEFAULT 'France',
  date_premier_contact DATE,
  derniere_interaction DATE,
  sante_client TEXT, -- Calculé via trigger
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- T2: Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT,
  telephone TEXT,
  poste TEXT,
  est_principal BOOLEAN DEFAULT false,
  -- Champs prospection
  statut_prospection TEXT CHECK (statut_prospection IN (
    'À appeler', 'Appelé - pas répondu', 'Rappeler',
    'RDV planifié', 'RDV effectué', 'Qualifié', 'Non qualifié', 'Perdu'
  )),
  date_rappel DATE,
  source_lead TEXT,
  notes_prospection TEXT,
  type_rdv TEXT CHECK (type_rdv IN ('Visio', 'Présentiel')),
  lien_visio TEXT,
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- T8: Interactions
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  type TEXT NOT NULL CHECK (type IN ('Email', 'Appel', 'Réunion', 'Note', 'Autre')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  resume TEXT,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tables Pipeline Commercial

```sql
-- T3: Opportunités
CREATE TABLE opportunites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  statut TEXT DEFAULT 'Qualifié' CHECK (statut IN (
    'Qualifié', 'Proposition', 'Négociation', 'Gagné', 'Perdu'
  )),
  valeur_estimee DECIMAL(12,2),
  probabilite INTEGER DEFAULT 50 CHECK (probabilite BETWEEN 0 AND 100),
  valeur_ponderee DECIMAL(12,2) GENERATED ALWAYS AS (valeur_estimee * probabilite / 100) STORED,
  date_cloture_prevue DATE,
  notes TEXT,
  projet_id UUID REFERENCES projets(id),
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- T14: Catalogue de Services
CREATE TABLE catalogue_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  prix_unitaire DECIMAL(10,2),
  unite TEXT DEFAULT 'forfait',
  categorie TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- T15: Lignes de Devis
CREATE TABLE lignes_devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunite_id UUID REFERENCES opportunites(id) ON DELETE CASCADE,
  service_id UUID REFERENCES catalogue_services(id),
  description TEXT,
  quantite DECIMAL(10,2) DEFAULT 1,
  prix_unitaire DECIMAL(10,2),
  remise_pourcent DECIMAL(5,2) DEFAULT 0,
  montant_ht DECIMAL(12,2) GENERATED ALWAYS AS (
    quantite * prix_unitaire * (1 - remise_pourcent / 100)
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tables Gestion de Projet

```sql
-- T4: Projets
CREATE TABLE projets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  brief TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  statut TEXT DEFAULT 'Cadrage' CHECK (statut IN (
    'Cadrage', 'En cours', 'En pause', 'Terminé', 'Annulé'
  )),
  date_debut DATE,
  date_fin_prevue DATE,
  date_fin_reelle DATE,
  budget_initial DECIMAL(12,2),
  heures_estimees DECIMAL(8,2),
  heures_passees DECIMAL(8,2) DEFAULT 0,
  chef_projet_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- T5: Tâches
CREATE TABLE taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
  statut TEXT DEFAULT 'À faire' CHECK (statut IN (
    'À faire', 'En cours', 'En revue', 'Terminé'
  )),
  priorite TEXT DEFAULT 'Moyenne' CHECK (priorite IN (
    'Basse', 'Moyenne', 'Haute', 'Critique'
  )),
  assignee_id UUID REFERENCES profiles(id),
  date_echeance DATE,
  heures_estimees DECIMAL(6,2),
  heures_passees DECIMAL(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- T6: Modèles de Tâches
CREATE TABLE modeles_taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  heures_estimees DECIMAL(6,2),
  categorie TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tables Finance

```sql
-- T7: Factures
CREATE TABLE factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  projet_id UUID REFERENCES projets(id),
  statut TEXT DEFAULT 'Brouillon' CHECK (statut IN (
    'Brouillon', 'Envoyé', 'Payé', 'Annulé'
  )),
  date_emission DATE,
  date_echeance DATE,
  montant_ht DECIMAL(12,2),
  taux_tva DECIMAL(5,2) DEFAULT 20,
  montant_ttc DECIMAL(12,2) GENERATED ALWAYS AS (
    montant_ht * (1 + taux_tva / 100)
  ) STORED,
  date_paiement DATE,
  niveau_relance INTEGER DEFAULT 0,
  date_derniere_relance DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tables Équipe & Temps

```sql
-- T10: Équipe (devient profiles, déjà défini)

-- T9: Journal de Temps
CREATE TABLE journal_temps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  tache_id UUID REFERENCES taches(id),
  projet_id UUID REFERENCES projets(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  heures DECIMAL(5,2) NOT NULL,
  description TEXT,
  facturable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- T20: Accomplissements
CREATE TABLE accomplissements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  categorie TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tables Stratégie & Feedback

```sql
-- T12: Objectifs (OKR)
CREATE TABLE objectifs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  periode TEXT, -- Q1 2025, etc.
  proprietaire_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- T13: Résultats Clés
CREATE TABLE resultats_cles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objectif_id UUID REFERENCES objectifs(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  valeur_cible DECIMAL(12,2),
  valeur_actuelle DECIMAL(12,2) DEFAULT 0,
  unite TEXT,
  progression INTEGER GENERATED ALWAYS AS (
    CASE WHEN valeur_cible > 0
      THEN LEAST(100, (valeur_actuelle / valeur_cible * 100)::INTEGER)
      ELSE 0
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- T11: Base de Connaissances
CREATE TABLE connaissances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  contenu TEXT,
  categorie TEXT,
  projet_id UUID REFERENCES projets(id),
  auteur_id UUID REFERENCES profiles(id),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- T16: Feedback Client
CREATE TABLE feedback_client (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id UUID REFERENCES projets(id),
  client_id UUID REFERENCES clients(id),
  note INTEGER CHECK (note BETWEEN 1 AND 5),
  commentaire TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- T17: Partenaires & Freelances
CREATE TABLE partenaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type TEXT CHECK (type IN ('Freelance', 'Agence', 'Partenaire')),
  specialite TEXT,
  email TEXT,
  telephone TEXT,
  tarif_journalier DECIMAL(10,2),
  note_interne INTEGER CHECK (note_interne BETWEEN 1 AND 5),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tables Système

```sql
-- T18: Changelog
CREATE TABLE changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  auteur_id UUID REFERENCES profiles(id),
  type TEXT CHECK (type IN ('Feature', 'Fix', 'Breaking', 'Improvement')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- T19: Scénarios Prévisionnels
CREATE TABLE scenarios_previsionnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  hypotheses JSONB,
  resultats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- T21: Demandes d'Évolution
CREATE TABLE demandes_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  priorite TEXT DEFAULT 'Moyenne',
  statut TEXT DEFAULT 'Proposé' CHECK (statut IN (
    'Proposé', 'Accepté', 'En cours', 'Terminé', 'Rejeté'
  )),
  demandeur_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Row Level Security (RLS)

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunites ENABLE ROW LEVEL SECURITY;
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
-- ... etc pour toutes les tables

-- Fonction helper pour récupérer le rôle
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Exemple de politique pour les clients
CREATE POLICY "Admins et managers voient tous les clients"
  ON clients FOR SELECT
  USING (auth.user_role() IN ('admin', 'manager'));

CREATE POLICY "Commerciaux voient leurs clients"
  ON clients FOR SELECT
  USING (
    auth.user_role() = 'commercial'
    AND owner_id = auth.uid()
  );

CREATE POLICY "Clients voient leur propre fiche"
  ON clients FOR SELECT
  USING (
    auth.user_role() = 'client'
    AND id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Politique CRUD pour admin
CREATE POLICY "Admin full access clients"
  ON clients FOR ALL
  USING (auth.user_role() = 'admin');
```

---

## 4. Plan de migration - Phases

### Phase 1 : Infrastructure (1 jour)

**Objectif** : Installer Supabase sur Coolify

#### Étapes :
1. [ ] Créer le projet Supabase sur Coolify (template Docker)
2. [ ] Configurer les variables d'environnement
3. [ ] Vérifier l'accès à Supabase Studio
4. [ ] Configurer les backups PostgreSQL automatiques

#### Commandes Coolify :
```yaml
# docker-compose.yml pour Supabase
services:
  supabase-db:
    image: supabase/postgres:15.1.0.117
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - supabase-db-data:/var/lib/postgresql/data

  supabase-studio:
    image: supabase/studio:latest
    ports:
      - "3001:3000"
    environment:
      SUPABASE_URL: http://supabase-kong:8000
      STUDIO_PG_META_URL: http://supabase-meta:8080
```

---

### Phase 2 : Schéma & Auth (1 jour)

**Objectif** : Créer le schéma et configurer l'authentification

#### Étapes :
1. [ ] Exécuter les scripts SQL de création des tables
2. [ ] Configurer les politiques RLS
3. [ ] Configurer l'auth (providers: Email, Google)
4. [ ] Créer le premier utilisateur admin
5. [ ] Tester les permissions

#### Configuration Auth :
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Types générés automatiquement
export type Database = {
  public: {
    Tables: {
      clients: { /* ... */ }
      contacts: { /* ... */ }
      // ...
    }
  }
}
```

---

### Phase 3 : Migration des données (0.5 jour)

**Objectif** : Transférer les données Airtable → Supabase

#### Script de migration :
```typescript
// scripts/migrate-airtable-to-supabase.ts
import Airtable from 'airtable'
import { supabase } from '../lib/supabase'

async function migrateClients() {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID!)

  const records = await base('T1-Clients').select().all()

  const clients = records.map(r => ({
    nom: r.get('Nom'),
    type: r.get('Type'),
    statut: r.get('Statut'),
    // ... mapping complet
  }))

  const { error } = await supabase.from('clients').insert(clients)
  if (error) console.error('Migration clients failed:', error)
  else console.log(`✓ ${clients.length} clients migrés`)
}

// Exécuter toutes les migrations dans l'ordre
async function main() {
  await migrateClients()
  await migrateContacts()
  await migrateOpportunites()
  // ... etc
}
```

---

### Phase 4 : Refactoring Frontend (2-3 jours)

**Objectif** : Adapter les hooks React pour Supabase

#### Avant (Airtable) :
```typescript
// hooks/use-clients.ts (AVANT)
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => airtable.getRecords('T1-Clients')
  })
}
```

#### Après (Supabase) :
```typescript
// hooks/use-clients.ts (APRÈS)
import { supabase } from '@/lib/supabase'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useClients() {
  const queryClient = useQueryClient()

  // Query standard
  const query = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, contacts(*), opportunites(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('clients-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => queryClient.invalidateQueries({ queryKey: ['clients'] })
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [queryClient])

  return query
}

// Hook pour créer un client
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (client: ClientInput) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })
}
```

#### Liste des hooks à adapter :
- [ ] `use-clients.ts`
- [ ] `use-contacts.ts`
- [ ] `use-opportunities.ts`
- [ ] `use-projects.ts`
- [ ] `use-tasks.ts`
- [ ] `use-invoices.ts`
- [ ] `use-team.ts`
- [ ] `use-prospects.ts`
- [ ] `use-interactions.ts`
- [ ] `use-google-calendar.ts` (garde tel quel)
- [ ] `use-gmail.ts` (garde tel quel)

---

### Phase 5 : Authentification UI (1 jour)

**Objectif** : Ajouter les pages login/register et protection des routes

#### Nouveaux composants :
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx  (vérifie auth)
│   │   ├── page.tsx (dashboard)
│   │   └── ... (toutes les pages existantes)
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── UserMenu.tsx
├── hooks/
│   ├── use-auth.ts
│   └── use-user.ts
└── lib/
    └── supabase.ts
```

#### Middleware de protection :
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Routes publiques
  const publicRoutes = ['/login', '/register', '/forgot-password']
  if (publicRoutes.includes(req.nextUrl.pathname)) {
    return res
  }

  // Redirection si non authentifié
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']
}
```

---

### Phase 6 : Gestion des rôles UI (0.5 jour)

**Objectif** : Interface d'administration des utilisateurs

#### Page Admin Users :
```typescript
// app/(protected)/admin/users/page.tsx
export default function AdminUsersPage() {
  const { data: users } = useUsers()
  const currentUser = useCurrentUser()

  if (currentUser?.role !== 'admin') {
    return <AccessDenied />
  }

  return (
    <div>
      <PageHeader title="Gestion des utilisateurs" />
      <UsersTable users={users} />
      <InviteUserDialog />
    </div>
  )
}
```

---

### Phase 7 : Workflows N8N (0.5 jour)

**Objectif** : Adapter les automations pour Supabase

#### Changements N8N :
- Remplacer les nodes Airtable par nodes Supabase/PostgreSQL
- Utiliser les webhooks Supabase pour les triggers

```json
// Exemple: Trigger sur nouvelle opportunité gagnée
{
  "nodes": [
    {
      "type": "n8n-nodes-base.supabaseTrigger",
      "parameters": {
        "table": "opportunites",
        "event": "UPDATE",
        "filter": "statut=eq.Gagné"
      }
    }
  ]
}
```

---

## 5. Variables d'environnement

```env
# .env.local (Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://supabase.ton-domaine.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth (conservé)
AUTH_GOOGLE_ID=xxxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxxxxxxxxxxxx
```

---

## 6. Planning estimé

| Phase | Durée | Dépendances |
|-------|-------|-------------|
| 1. Infrastructure | 1 jour | - |
| 2. Schéma & Auth | 1 jour | Phase 1 |
| 3. Migration données | 0.5 jour | Phase 2 |
| 4. Refactoring hooks | 2-3 jours | Phase 3 |
| 5. Auth UI | 1 jour | Phase 4 |
| 6. Rôles UI | 0.5 jour | Phase 5 |
| 7. N8N workflows | 0.5 jour | Phase 3 |

**Total estimé : 6-8 jours de développement**

---

## 7. Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Perte de données | Critique | Backup Airtable avant migration |
| Downtime | Moyen | Migration en soirée/weekend |
| Bugs post-migration | Moyen | Tests approfondis, rollback possible |
| Performance Supabase | Faible | Indexation optimisée |

---

## 8. Checklist finale

### Avant migration
- [ ] Backup complet Airtable (export CSV)
- [ ] Documentation des workflows N8N actuels
- [ ] Tests de l'environnement Supabase

### Après migration
- [ ] Vérifier intégrité des données
- [ ] Tester toutes les fonctionnalités
- [ ] Vérifier les permissions par rôle
- [ ] Tester le temps réel
- [ ] Mettre à jour la documentation

---

## 9. Prochaines étapes

1. **Validation** : Valider ce plan avec l'équipe
2. **Décision** : Choisir la date de début
3. **Préparation** : Installer Supabase sur Coolify
4. **Exécution** : Suivre les phases dans l'ordre

---

*Document généré le 17 décembre 2025*
