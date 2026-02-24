# P0-04 : Fix RLS Infinite Recursion (42P17)

## Probleme

Apres l'application des politiques granulaires (migration 009), toutes les requetes PostgREST retournaient HTTP 500 avec l'erreur :

```
ERROR: 42P17: infinite recursion detected in policy for relation "taches"
```

### Cause racine

Les politiques granulaires utilisaient des fonctions helper :
- `public.is_admin()` -> appelle `public.get_user_role()` -> lit `profiles`
- `public.is_developer()` -> appelle `public.get_user_role()` -> lit `profiles`

Mais les politiques de la table `profiles` elle-meme appelaient ces memes fonctions :
```sql
-- profiles_select_admin : USING (public.is_admin())
-- profiles_select_developer : USING (public.is_developer() AND id = auth.uid())
```

Cela creait une boucle : `taches -> is_admin() -> profiles -> is_admin() -> profiles -> ...`

### Pourquoi SECURITY DEFINER ne resout pas le probleme

Meme si `is_admin()` est `SECURITY DEFINER` avec un owner superuser (qui bypass RLS a l'execution), le **planificateur PostgreSQL** detecte la recursion de maniere **statique** lors de la planification de la requete, avant l'execution. Il ne prend pas en compte le fait que SECURITY DEFINER contournerait RLS.

## Solution appliquee

Migration `016-fix-rls-recursion-rollback.sql` :

1. **Suppression** de toutes les politiques existantes sur le schema public
2. **Recreation** de politiques simples `USING(true)` pour tous les utilisateurs authentifies
3. **Aucun appel de fonction** dans les politiques -> pas de recursion possible

### Impact securite

- Les politiques reviennent a l'etat "tous les authentifies ont acces CRUD"
- Acceptable pour un CRM interne a 2 utilisateurs
- Le signup est desactive (`DISABLE_SIGNUP=true`), seul l'admin invite les utilisateurs
- RLS reste actif (les utilisateurs anonymes n'ont toujours aucun acces)

## Solution future pour politiques granulaires

Pour re-implementer des politiques granulaires sans recursion :

### Option 1 : JWT Claims (recommandee)
Stocker le role dans `app_metadata` du JWT au lieu de lire `profiles` :
```sql
-- Au lieu de lire profiles
CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role')::user_role;
$$ LANGUAGE sql STABLE;
```
Puis mettre a jour le role via l'API admin Supabase :
```bash
curl -X PUT 'https://supabase.axivity.cloud/auth/v1/admin/users/{uid}' \
  -H 'Authorization: Bearer SERVICE_ROLE_KEY' \
  -d '{"app_metadata": {"role": "admin"}}'
```

### Option 2 : Profiles SELECT ouvert
Garder `profiles` lisible par tous les authentifies :
```sql
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
```
Et utiliser les fonctions helper normalement pour les AUTRES tables. La chaine se termine car `profiles` ne rappelle plus `is_admin()`.

### Option 3 : Variables de session
Utiliser un hook `pg_net` ou un trigger `AFTER LOGIN` pour stocker le role dans `current_setting()` :
```sql
CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role AS $$
  SELECT current_setting('app.user_role', true)::user_role;
$$ LANGUAGE sql STABLE;
```

## Fichiers modifies

| Fichier | Changement |
|---------|-----------|
| `supabase/migrations/security/016-fix-rls-recursion-rollback.sql` | Rollback des politiques |
| `crm/next.config.mjs` | Ajout Google Fonts dans CSP (style-src, font-src) |
| `docs/prompt-security/P0-04-rls-recursion-fix.md` | Ce document |
