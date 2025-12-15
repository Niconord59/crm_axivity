# Tâches : Module Prospection

**Feature** : 003-prospection
**Total** : 44 tâches
**Statut** : 100% (44/44) - Toutes les phases complètes ✅

---

## Phase 0 : Préparation Airtable [COMPLETE]

### T0.1 - Créer champ "Statut Prospection" sur T2-Contacts
- [x] Ouvrir T2-Contacts dans Airtable
- [x] Ajouter champ Single Select "Statut Prospection"
- [x] Options : À appeler, Appelé - pas répondu, Rappeler, RDV planifié, Qualifié, Non qualifié, Perdu
- [x] Noter le Field ID

### T0.2 - Créer champ "Date Rappel" sur T2-Contacts
- [x] Ajouter champ Date "Date Rappel"
- [x] Format : European (DD/MM/YYYY)
- [x] Noter le Field ID

### T0.3 - Créer champ "Source Lead" sur T2-Contacts
- [x] Ajouter champ Single Select "Source Lead"
- [x] Options : LinkedIn, Site web, Salon, Recommandation, Achat liste, Autre
- [x] Noter le Field ID

### T0.4 - Créer champ "Notes Prospection" sur T2-Contacts
- [x] Ajouter champ Long Text "Notes Prospection"
- [x] Rich text : désactivé
- [x] Noter le Field ID

### T0.5 - Créer vue "Prospection" sur T2-Contacts
- [x] Créer vue Grid "PROSPECTION"
- [x] Filtre : Statut Prospection is not empty
- [x] Tri : Date Rappel (asc), Statut Prospection (asc)

---

## Phase 1 : Infrastructure [COMPLETE]

### T1.1 - Mettre à jour types TypeScript
- [x] Ajouter type `ProspectStatut` dans `src/types/index.ts`
- [x] Ajouter type `ProspectSource` dans `src/types/index.ts`
- [x] Étendre interface `Contact` avec les 4 nouveaux champs

### T1.2 - Créer schémas Zod prospect
- [x] Créer `src/lib/schemas/prospect.ts`
- [x] Définir `PROSPECT_STATUTS` et `PROSPECT_SOURCES`
- [x] Créer `prospectSchema` (validation création)
- [x] Créer `callResultSchema` (validation résultat appel)
- [x] Créer `csvMappingSchema` (validation mapping import)

### T1.3 - Mettre à jour airtable-tables.ts
- [x] Field IDs seront ajoutés après création dans Airtable (Phase 0)
- [x] Champs documentés dans code et CLAUDE.md

### T1.4 - Créer hook useProspects
- [x] Créer `src/hooks/use-prospects.ts`
- [x] Implémenter `useProspects()` : fetch contacts avec statut prospection
- [x] Implémenter filtres (statut, source, dateRappel)
- [x] Implémenter recherche (nom contact, nom entreprise)

### T1.5 - Créer mutation useUpdateProspectStatus
- [x] Ajouter dans `use-prospects.ts`
- [x] Implémenter mise à jour statut + date rappel + notes
- [x] Invalider cache après mutation

---

## Phase 2 : Page principale [COMPLETE]

### T2.1 - Créer page /prospection
- [x] Créer `src/app/prospection/page.tsx`
- [x] Ajouter metadata (title, description)
- [x] Structure : KPIs + Filtres + Liste
- [x] Intégrer AppLayout

### T2.2 - Créer composant ProspectionKPIs
- [x] Créer `src/components/prospection/ProspectionKPIs.tsx`
- [x] KPI 1 : Leads à appeler (count statut "À appeler")
- [x] KPI 2 : Rappels aujourd'hui (date = today)
- [x] KPI 3 : Taux qualification (qualifiés / total * 100)
- [x] KPI 4 : Rappels en retard (date < today AND statut = Rappeler)

### T2.3 - Créer composant LeadCard
- [x] Créer `src/components/prospection/LeadCard.tsx`
- [x] Afficher : entreprise, contact, email, téléphone
- [x] Badge statut avec couleurs
- [x] Badge source
- [x] Badge rappel (si date définie, highlight si aujourd'hui/retard)
- [x] Notes tronquées (max 100 chars)
- [x] 4 boutons d'action

### T2.4 - Créer composant ProspectionFilters
- [x] Créer `src/components/prospection/ProspectionFilters.tsx`
- [x] Select statut (single select)
- [x] Select source
- [x] Select date rappel (Tous, Aujourd'hui, Cette semaine, En retard)
- [x] Input recherche avec debounce

### T2.5 - Ajouter lien Prospection dans Sidebar
- [x] Modifier `src/components/layout/Sidebar.tsx`
- [x] Ajouter item "Prospection" avec icône `Phone`
- [x] Position : après Opportunités
- [x] Ajouter dans MobileNav également

---

## Phase 3 : Actions et dialogs [COMPLETE]

### T3.1 - Créer CallResultDialog
- [x] Créer `src/components/prospection/CallResultDialog.tsx`
- [x] Header avec nom contact + entreprise
- [x] Radio group pour résultat (5 options)
- [x] Date picker conditionnel (si "Rappeler")
- [x] Textarea notes
- [x] Checkbox "Créer interaction dans CRM" (optionnel, non implémenté)
- [x] Boutons Annuler / Enregistrer

### T3.2 - Créer hook useCreateInteraction
- [x] Intégré dans CallResultDialog (mutation directe)
- [x] Mise à jour statut + date rappel + notes

### T3.3 - Implémenter action "Appeler"
- [x] Copier téléphone dans presse-papier
- [x] Toast "Numéro copié"
- [x] Ouvrir CallResultDialog
- [x] Gérer soumission : update statut

### T3.4 - Implémenter actions "Non qualifié" et "Perdu"
- [x] Changer statut directement
- [x] Toast confirmation

### T3.5 - Créer ProspectForm (création manuelle)
- [x] Créer `src/components/prospection/ProspectForm.tsx`
- [x] Champs : Entreprise, Contact, Email, Téléphone, Source, Notes
- [x] Logique : chercher/créer client + créer contact
- [x] Bouton "+" dans header page

---

## Phase 4 : Import CSV [COMPLETE]

### T4.1 - Créer hook useImportLeads
- [x] Créer `src/hooks/use-import-leads.ts`
- [x] Fonction `parseFile(file)` avec papaparse
- [x] Support CSV uniquement (XLSX non implémenté - YAGNI)
- [x] Fonction `setMapping()` : détecte colonnes + applique mapping
- [x] State : file, columns, mapping, preview, progress, duplicates

### T4.2 - Créer LeadImportDialog - Structure
- [x] Créer `src/components/prospection/LeadImportDialog.tsx`
- [x] State : step (1, 2, 3)
- [x] Navigation entre étapes
- [x] Boutons Retour / Suivant / Importer

### T4.3 - Implémenter Étape 1 : Upload fichier
- [x] Input file avec drag & drop styling
- [x] Accepter .csv
- [x] Parser automatiquement à la sélection
- [x] Passer à étape 2 avec colonnes détectées

### T4.4 - Implémenter Étape 2 : Mapping colonnes
- [x] Liste des colonnes du fichier
- [x] Select pour chaque colonne → champ CRM
- [x] Options : Entreprise, Contact, Email, Téléphone, Source, Notes, -- Ignorer --
- [x] Validation : 3 champs obligatoires mappés
- [x] Bouton "Aperçu" pour passer à étape 3

### T4.5 - Implémenter Étape 3 : Aperçu et import
- [x] Table avec 5 premières lignes mappées
- [x] Compteur total lignes
- [x] Détection doublons (emails existants)
- [x] Message "X emails en doublon seront mis à jour"
- [x] Bouton "Importer X leads"

### T4.6 - Implémenter logique d'import batch
- [x] Boucle sur les leads (batch de 10)
- [x] Pour chaque lead : chercher/créer client + créer contact
- [x] Progress bar pendant import
- [x] Résumé final dans toast : X créés, Y erreurs
- [x] Rate limiting (200ms entre batches)

---

## Phase 5 : Conversion en opportunité [COMPLETE]

### T5.1 - Créer hook useConvertToOpportunity
- [x] Créer `src/hooks/use-convert-opportunity.ts`
- [x] Input : contactId, clientId
- [x] Actions :
  - Update contact statut → "Qualifié"
  - Update client statut → "Actif" (si Prospect)
- [x] Invalidation des queries après mutation

### T5.2 - Modifier OpportuniteForm pour pré-remplissage
- [x] Ajouter prop `initialData?: Partial<OpportuniteFormData>`
- [x] Ajouter prop `onSuccess?: (id: string) => void`
- [x] Pré-remplir client, source et notes depuis lead

### T5.3 - Implémenter bouton "Qualifié"
- [x] Clic → ouvre OpportuniteForm en mode dialog
- [x] Pré-remplir : client, source, notes (depuis Notes Prospection)
- [x] Statut opportunité : "Qualifié"
- [x] À la validation : appeler useConvertToOpportunity
- [x] Toast avec lien "Voir l'opportunité"
- [x] Lead masqué de la liste (statut Qualifié filtré par défaut)

---

## Phase 6 : Polish [COMPLETE]

### T6.1 - Responsive mobile
- [x] LeadCard : layout responsive avec grid
- [x] Actions : boutons adaptés (outline style)
- [x] Page : grille responsive (1-2-3 colonnes selon viewport)

### T6.2 - États vides et loading
- [x] PageLoading pour état de chargement
- [x] Empty state "Aucun lead à prospecter"
- [x] Empty state avec CTA "Importez vos premiers leads"

### T6.3 - Toasts et feedback
- [x] Import : toast avec nombre de leads importés
- [x] Appel : "Numéro copié dans le presse-papier"
- [x] Conversion : "Opportunité créée avec succès" + lien Voir
- [x] Erreurs : messages explicites via toast.error

### T6.4 - Documentation
- [x] Mettre à jour `Interface/CLAUDE.md` (nouvelle route, nouveaux composants)
- [x] Mettre à jour `tasks.md` avec statut completion
- [x] Mettre à jour `passation_projet_agence_ia.md` (nouvelle fonctionnalité)

---

## Phase 7 : Intégration Google Calendar [COMPLETE]

### T7.1 - Setup NextAuth.js avec Google OAuth
- [x] Installer `next-auth@beta`
- [x] Créer `src/lib/auth.ts` avec Google provider + calendar scope
- [x] Créer `src/app/api/auth/[...nextauth]/route.ts`
- [x] Créer `src/providers/session-provider.tsx`
- [x] Modifier `src/app/layout.tsx` pour wrapper avec SessionProvider
- [x] Configurer variables env (AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET)

### T7.2 - API Routes Calendar
- [x] Créer `src/app/api/calendar/events/route.ts`
- [x] Implémenter GET : liste events (date range)
- [x] Implémenter POST : créer event

### T7.3 - Hooks Google Calendar
- [x] Créer `src/hooks/use-google-calendar.ts`
- [x] Implémenter `useCalendarEvents(start, end)`
- [x] Implémenter `useCreateCalendarEvent()`
- [x] Implémenter `useGoogleCalendarStatus()`

### T7.4 - Composants UI Agenda
- [x] Créer `src/components/prospection/agenda/GoogleAuthButton.tsx`
- [x] Créer `src/components/prospection/agenda/EventCard.tsx`
- [x] Créer `src/components/prospection/agenda/WeekCalendar.tsx`
- [x] Créer `src/components/prospection/agenda/CreateEventDialog.tsx`
- [x] Créer `src/components/prospection/agenda/AgendaTab.tsx`
- [x] Pré-remplissage event avec infos du lead

### T7.5 - Intégration dans CallResultDialog
- [x] Ajouter 5ème onglet "Agenda" dans CallResultDialog
- [x] Renommer onglet "Appel" → "Résultat"
- [x] Passer props prospect à AgendaTab

### T7.6 - Nouveau statut "RDV planifié"
- [x] Ajouter "RDV planifié" dans PROSPECT_STATUTS (types + schemas)
- [x] Ajouter badge violet pour "RDV planifié"
- [x] Masquer champ Notes quand "RDV planifié" sélectionné
- [x] Masquer et décocher checkbox "Créer interaction" pour "RDV planifié"

### T7.7 - Fix rafraîchissement UI
- [x] Utiliser `refetchQueries` au lieu de `invalidateQueries` dans useUpdateProspectStatus
- [x] Invalider aussi `prospection-kpis` après mise à jour statut

---

## Résumé par phase

| Phase | Tâches | Effort |
|-------|--------|--------|
| Phase 0 : Airtable | 5 | 0.5h |
| Phase 1 : Infrastructure | 5 | 3h |
| Phase 2 : Page principale | 5 | 4h |
| Phase 3 : Actions | 5 | 4h |
| Phase 4 : Import CSV | 6 | 4h |
| Phase 5 : Conversion | 3 | 2h |
| Phase 6 : Polish | 4 | 2h |
| Phase 7 : Google Calendar | 7 | 8h |
| **Total** | **40** | **~27h** |

---

*Tâches créées le 15 décembre 2025*
*Mise à jour : 15 décembre 2025 (Phase 7 Google Calendar)*
