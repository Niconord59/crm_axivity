# Tâches : Module Devis

**Feature** : 006-devis
**Total** : 45 tâches
**Statut** : 100% (45/45) - Toutes les phases complètes

---

## Phase 0 : Préparation Base de Données [COMPLETE]

### T0.1 - Créer type ENUM statut_devis
- [x] Créer migration `18_devis_table.sql`
- [x] Définir ENUM : brouillon, envoye, accepte, refuse, expire
- [x] Exécuter sur Supabase

### T0.2 - Créer table devis
- [x] Définir schéma complet (voir spec.md)
- [x] Ajouter contraintes UNIQUE sur numero_devis
- [x] Ajouter clés étrangères vers opportunites, clients, contacts
- [x] Ajouter colonnes montants (total_ht, tva, total_ttc)

### T0.3 - Créer table devis_compteur
- [x] Table simple : annee (PK), dernier_numero
- [x] Utilisée pour la numérotation séquentielle

### T0.4 - Créer fonction generer_numero_devis()
- [x] Fonction PL/pgSQL
- [x] Upsert dans devis_compteur
- [x] Retourne DEV-YYYY-NNN

### T0.5 - Créer trigger updated_at
- [x] Fonction update_updated_at_column()
- [x] Trigger BEFORE UPDATE sur table devis

### T0.6 - Créer index de recherche
- [x] Index sur opportunite_id
- [x] Index sur client_id
- [x] Index sur statut
- [x] Index sur date_devis (DESC)
- [x] Index sur numero_devis

### T0.7 - Configurer RLS policies
- [x] SELECT : tous les utilisateurs authentifiés
- [x] INSERT : tous les utilisateurs authentifiés
- [x] UPDATE : tous les utilisateurs authentifiés
- [x] DELETE : admins uniquement
- [x] Policies pour devis_compteur

### T0.8 - Créer bucket Storage
- [x] Créer bucket `devis-pdf`
- [x] Configurer accès public en lecture
- [x] Configurer upload pour utilisateurs authentifiés

---

## Phase 1 : Infrastructure TypeScript [COMPLETE]

### T1.1 - Créer types TypeScript
- [x] Ajouter interface `Devis` dans `src/types/index.ts`
- [x] Ajouter interface `DevisData` pour génération PDF
- [x] Ajouter interface `DevisCompanyInfo`
- [x] Étendre interface `LigneDevis` avec serviceNom, serviceCategorie

### T1.2 - Créer hook use-services.ts
- [x] Créer `src/hooks/use-services.ts`
- [x] Implémenter `useServices()` : fetch catalogue_services
- [x] Grouper par catégorie pour le sélecteur

### T1.3 - Créer hook use-lignes-devis.ts
- [x] Créer `src/hooks/use-lignes-devis.ts`
- [x] Implémenter `useLignesDevis(opportuniteId)`
- [x] Implémenter `useCreateLigneDevis()`
- [x] Implémenter `useUpdateLigneDevis()`
- [x] Implémenter `useDeleteLigneDevis()`
- [x] Joindre catalogue_services pour récupérer nom/catégorie

### T1.4 - Créer hook use-devis.ts
- [x] Créer `src/hooks/use-devis.ts`
- [x] Implémenter `useDevisByOpportunite(opportuniteId)`
- [x] Implémenter `useSendDevisEmail()`
- [x] Tri par date décroissante

---

## Phase 2 : Template PDF [COMPLETE]

### T2.1 - Créer template HTML
- [x] Créer `src/lib/templates/devis-template.ts`
- [x] Fonction `generateDevisHTML(data: DevisData): string`
- [x] Structure : header, infos entreprise, infos client, lignes, totaux
- [x] Styles CSS inline pour compatibilité PDF

### T2.2 - En-tête entreprise
- [x] Afficher logo/header si `headerDevisUrl` défini
- [x] Sinon afficher nom entreprise en texte
- [x] Informations légales : SIRET, RCS, TVA intra

### T2.3 - Section client
- [x] Nom entreprise client
- [x] SIRET (si disponible)
- [x] Adresse complète
- [x] Contact (nom, email, téléphone, poste)

### T2.4 - Tableau des lignes
- [x] Colonnes : Description, Qté, Prix unitaire, Remise, Montant HT
- [x] Afficher catégorie service si disponible
- [x] Alignement des nombres à droite
- [x] Format monétaire français

### T2.5 - Section totaux
- [x] Total HT
- [x] TVA (taux % + montant)
- [x] Total TTC (en gras)

### T2.6 - Pied de page
- [x] Conditions de paiement
- [x] Date de validité
- [x] Mentions légales entreprise

---

## Phase 3 : API Routes [COMPLETE]

### T3.1 - Créer route /api/devis/generate
- [x] Créer `src/app/api/devis/generate/route.ts`
- [x] Recevoir opportuniteId en body
- [x] Fetch opportunité avec client et contact
- [x] Fetch lignes de devis
- [x] Fetch paramètres entreprise
- [x] Générer numéro séquentiel via `generer_numero_devis()`
- [x] Générer HTML et PDF avec Puppeteer
- [x] Upload PDF dans Supabase Storage
- [x] Créer enregistrement dans table devis
- [x] Retourner PDF en response avec headers X-Devis-Id, X-Devis-Numero

### T3.2 - Créer route /api/devis/preview
- [x] Créer `src/app/api/devis/preview/route.ts`
- [x] Similaire à /generate mais sans sauvegarde
- [x] Numéro temporaire : DEV-YYYY-XXX
- [x] Content-Disposition: inline (affichage navigateur)

### T3.3 - Créer route /api/devis/send
- [x] Créer `src/app/api/devis/send/route.ts`
- [x] Recevoir devisId et optionnel recipientEmail
- [x] Fetch devis avec relations
- [x] Récupérer email du contact si non fourni
- [x] Générer HTML email professionnel
- [x] Fetch PDF depuis Storage
- [x] Envoyer via Resend API
- [x] Mettre à jour statut devis → "envoye"
- [x] Mettre à jour date_envoi

---

## Phase 4 : Composants UI [COMPLETE]

### T4.1 - Créer ServiceSelector
- [x] Créer `src/components/devis/ServiceSelector.tsx`
- [x] Dialog avec liste des services groupés par catégorie
- [x] Afficher nom, description, prix par défaut
- [x] Callback `onSelect(service)` au clic

### T4.2 - Créer QuoteLinesTable
- [x] Créer `src/components/devis/QuoteLinesTable.tsx`
- [x] Table avec colonnes : Description, Qté, Prix, Remise, Total, Actions
- [x] Inputs inline pour édition quantité et prix
- [x] Boutons actions : Dupliquer, Supprimer
- [x] Calcul automatique du montant HT
- [x] Affichage des totaux en bas

### T4.3 - Créer QuoteEditorSheet
- [x] Créer `src/components/devis/QuoteEditorSheet.tsx`
- [x] Sheet avec 2 onglets : Éditeur, Historique
- [x] **Onglet Éditeur** :
  - [x] Bouton "Ajouter un service" → ouvre ServiceSelector
  - [x] QuoteLinesTable pour afficher/éditer les lignes
  - [x] Affichage totaux (HT, TVA, TTC)
  - [x] Boutons footer : Prévisualiser, Générer PDF
- [x] **Onglet Historique** :
  - [x] Liste des devis générés (useDevisByOpportunite)
  - [x] Badges statut colorés
  - [x] Boutons : Voir PDF, Envoyer par email

### T4.4 - Intégrer dans OpportunityCard
- [x] Ajouter bouton "Devis" dans OpportunityCard
- [x] Ouvrir QuoteEditorSheet au clic
- [x] Passer opportuniteId en prop

---

## Phase 5 : Fonctionnalités avancées [COMPLETE]

### T5.1 - Implémenter prévisualisation
- [x] Bouton "Prévisualiser" dans QuoteEditorSheet
- [x] Appel API /api/devis/preview
- [x] Ouvrir PDF dans nouvel onglet
- [x] État loading pendant génération

### T5.2 - Implémenter génération PDF
- [x] Bouton "Générer PDF" dans QuoteEditorSheet
- [x] Appel API /api/devis/generate
- [x] Téléchargement automatique du PDF
- [x] Rafraîchissement de l'historique
- [x] Toast de succès avec numéro de devis

### T5.3 - Implémenter duplication de ligne
- [x] Bouton "Dupliquer" dans QuoteLinesTable
- [x] Créer nouvelle ligne avec mêmes valeurs
- [x] Description préfixée "(Copie)"

### T5.4 - Implémenter envoi email
- [x] Bouton "Envoyer" dans l'historique
- [x] Appel API /api/devis/send
- [x] Toast de succès/erreur
- [x] Rafraîchissement du statut dans la liste

### T5.5 - Gérer états vides
- [x] Message si aucune ligne de devis
- [x] Message si aucun devis dans l'historique
- [x] Désactiver boutons Prévisualiser/Générer si 0 lignes

---

## Phase 6 : Polish et UX [COMPLETE]

### T6.1 - Loading states
- [x] Skeleton loading pour la table des lignes
- [x] Spinner sur boutons pendant les actions
- [x] Disabled states appropriés

### T6.2 - Validation et erreurs
- [x] Validation quantité > 0
- [x] Validation prix >= 0
- [x] Messages d'erreur toast explicites
- [x] Gestion erreur API gracieuse

### T6.3 - Responsive design
- [x] Table scrollable horizontalement sur mobile
- [x] Sheet pleine largeur sur mobile
- [x] Boutons empilés sur petits écrans

### T6.4 - Documentation
- [x] Mettre à jour CLAUDE.md
- [x] Mettre à jour passation_projet_agence_ia.md
- [x] Créer specs/006-devis/spec.md
- [x] Créer specs/006-devis/tasks.md

---

## Résumé par phase

| Phase | Tâches | Effort |
|-------|--------|--------|
| Phase 0 : Base de données | 8 | 2h |
| Phase 1 : Infrastructure TypeScript | 4 | 2h |
| Phase 2 : Template PDF | 6 | 3h |
| Phase 3 : API Routes | 3 | 4h |
| Phase 4 : Composants UI | 4 | 6h |
| Phase 5 : Fonctionnalités avancées | 5 | 3h |
| Phase 6 : Polish et UX | 4 | 2h |
| **Total** | **45** | **~22h** |

---

## Fichiers créés/modifiés

### Nouveaux fichiers

| Fichier | Description |
|---------|-------------|
| `supabase/migrations/18_devis_table.sql` | Migration SQL complète |
| `src/hooks/use-services.ts` | Hook catalogue services |
| `src/hooks/use-lignes-devis.ts` | Hook CRUD lignes |
| `src/hooks/use-devis.ts` | Hook historique + envoi |
| `src/lib/templates/devis-template.ts` | Template HTML pour PDF |
| `src/app/api/devis/generate/route.ts` | API génération PDF |
| `src/app/api/devis/preview/route.ts` | API prévisualisation |
| `src/app/api/devis/send/route.ts` | API envoi email |
| `src/components/devis/ServiceSelector.tsx` | Sélecteur de service |
| `src/components/devis/QuoteLinesTable.tsx` | Table des lignes |
| `src/components/devis/QuoteEditorSheet.tsx` | Sheet éditeur principal |
| `src/components/devis/index.ts` | Barrel export |

### Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/types/index.ts` | Ajout types Devis, DevisData, LigneDevis |
| `src/components/opportunites/OpportunityCard.tsx` | Bouton "Devis" |
| `CLAUDE.md` | Documentation module devis |
| `Documentation/passation_projet_agence_ia.md` | Phase 8 module devis |

---

*Tâches créées le 23 décembre 2025*
*Statut final : 100% - Implémentation complète*
