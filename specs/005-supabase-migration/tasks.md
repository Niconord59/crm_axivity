# Tâches - Migration Supabase

## Phase 1 : Infrastructure ✅
- [x] Déployer Supabase via Coolify
- [x] Configurer les variables d'environnement
- [x] Vérifier l'accès à Supabase Studio
- [x] Configurer l'URL publique

## Phase 2 : Schéma & Auth ✅
- [x] Créer les extensions PostgreSQL
- [x] Créer les 21 tables
- [x] Configurer les ENUMs
- [x] Créer les triggers et fonctions
- [x] Configurer RLS (policies)

## Phase 3 : Migration données ✅
- [x] ~~Exporter les données Supabase~~ (N/A - base Supabase vide)
- [x] ~~Transformer les données~~ (N/A - base Supabase vide)
- [x] ~~Importer dans Supabase~~ (N/A - base Supabase vide)
- [x] Créer données de test (équipe)
- [x] Vérifier mapping CSV import → Supabase
- [x] Ajouter colonne linkedin manquante (migration 10)

## Phase 4 : Refactoring hooks ✅
- [x] Migrer `use-clients.ts`
- [x] Migrer `use-projets.ts`
- [x] Migrer `use-taches.ts`
- [x] Migrer `use-opportunites.ts`
- [x] Migrer `use-factures.ts`
- [x] Migrer `use-prospects.ts`
- [x] Migrer `use-equipe.ts`
- [x] Migrer `use-interactions.ts`
- [x] Migrer `use-convert-opportunity.ts`
- [x] Migrer `use-import-leads.ts`
- [x] Corriger les mappings de colonnes
- [x] Vérifier le build TypeScript

## Phase 5 : Auth UI ✅
- [x] Créer page `/login`
- [x] Créer page `/register`
- [x] Créer page `/forgot-password`
- [x] Créer page `/reset-password`
- [x] Créer composant `UserMenu` (Header dropdown)
- [x] Créer hook `use-auth.ts`
- [x] Créer proxy de protection des routes (Next.js 16 - remplace middleware)

## Phase 6 : Rôles UI ✅ (Complète)
- [x] Créer page `/admin/users`
- [x] Créer composant `InviteUserDialog` (intégré dans la page)
- [x] Implémenter changement de rôle (PATCH API)
- [x] Aligner les rôles code ↔ base de données (migration 11 + 11_v2)
- [x] Tester les permissions par rôle
- [x] Migration SQL exécutée avec succès

### Rôles utilisateur (alignés)
| Rôle | Permissions |
|------|-------------|
| `admin` | Accès total |
| `developpeur_nocode` | Lecture + modification tâches assignées (membre équipe) |
| `developpeur_automatisme` | Lecture + modification tâches assignées (membre équipe) |
| `commercial` | Gestion clients/contacts/opportunités propres, lecture projets/factures |
| `client` | Portail client (lecture seule) |

### Fichiers créés/modifiés
- `src/app/(main)/admin/users/page.tsx` - Page admin complète
- `src/app/api/admin/users/route.ts` - API GET/POST users
- `src/app/api/admin/users/[id]/route.ts` - API PATCH/DELETE user
- `supabase/migrations/11_update_user_roles.sql` - Migration enum + RLS

## Phase 7 : N8N Workflows ⏳
- [ ] Adapter workflow conversion opportunité
- [ ] Adapter workflow feedback post-projet
- [ ] Adapter workflow alertes tâches
- [ ] Adapter workflow relances factures

## Phase 5 détail (18 déc. 2025)

### Auth UI
- Route groups Next.js : `(auth)` pages standalone, `(main)` pages avec sidebar
- Pages : `/login`, `/register`, `/forgot-password`, `/reset-password`
- Proxy Next.js 16 : `src/proxy.ts` (remplace middleware.ts)
- Helper : `src/lib/supabase/proxy.ts`
- Header avec dropdown utilisateur et déconnexion
- SMTP Resend configuré (sandbox mode pour dev)

### Fichiers créés
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(auth)/layout.tsx`
- `src/proxy.ts`
- `src/lib/supabase/proxy.ts`
- `src/hooks/use-auth.ts`

---

## Corrections effectuées (18 déc. 2025)

### Mapping colonnes
- `nom_complet` → `nom` + `prenom` (contacts)
- `secteur_activite` → `secteur` (clients)
- `role` → `poste` (contacts)
- `notes` → `resume` (interactions)
- `participant_interne_id` → `user_id` (interactions)

### Colonnes ajoutées
- `contacts.date_rdv_prevu`
- `interactions.objet`
- `taches.date_terminee`

### Table ajoutée
- `equipe` (T10 - Membres de l'équipe)

### Fichiers modifiés
- `src/hooks/use-clients.ts`
- `src/hooks/use-prospects.ts`
- `src/hooks/use-interactions.ts`
- `src/hooks/use-import-leads.ts`
- `src/app/clients/[id]/page.tsx`
- `src/components/prospection/CallResultDialog.tsx`
- `src/components/prospection/ProspectForm.tsx`
