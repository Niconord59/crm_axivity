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

## Phase 3 : Migration données ⏳
- [ ] Exporter les données Airtable
- [ ] Transformer les données (mapping colonnes)
- [ ] Importer dans Supabase
- [x] Créer données de test (équipe)

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

## Phase 5 : Auth UI ⏳
- [ ] Créer page `/login`
- [ ] Créer page `/register`
- [ ] Créer page `/forgot-password`
- [ ] Créer composant `UserMenu`
- [ ] Créer hook `use-auth.ts`
- [ ] Créer middleware de protection des routes

## Phase 6 : Rôles UI ⏳
- [ ] Créer page `/admin/users`
- [ ] Créer composant `InviteUserDialog`
- [ ] Implémenter changement de rôle
- [ ] Tester les permissions par rôle

## Phase 7 : N8N Workflows ⏳
- [ ] Adapter workflow conversion opportunité
- [ ] Adapter workflow feedback post-projet
- [ ] Adapter workflow alertes tâches
- [ ] Adapter workflow relances factures

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
