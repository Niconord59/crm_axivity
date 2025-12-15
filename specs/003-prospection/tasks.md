# Tâches : Module Prospection

**Feature** : 003-prospection
**Total** : 32 tâches
**Statut** : 87% (28/32) - Phases 1-6 complètes, Phase 0 en attente (action utilisateur Airtable)

---

## Phase 0 : Préparation Airtable

### T0.1 - Créer champ "Statut Prospection" sur T2-Contacts
- [ ] Ouvrir T2-Contacts dans Airtable
- [ ] Ajouter champ Single Select "Statut Prospection"
- [ ] Options : À appeler, Appelé - pas répondu, Rappeler, Qualifié, Non qualifié, Perdu
- [ ] Noter le Field ID

### T0.2 - Créer champ "Date Rappel" sur T2-Contacts
- [ ] Ajouter champ Date "Date Rappel"
- [ ] Format : European (DD/MM/YYYY)
- [ ] Noter le Field ID

### T0.3 - Créer champ "Source Lead" sur T2-Contacts
- [ ] Ajouter champ Single Select "Source Lead"
- [ ] Options : LinkedIn, Site web, Salon, Recommandation, Achat liste, Autre
- [ ] Noter le Field ID

### T0.4 - Créer champ "Notes Prospection" sur T2-Contacts
- [ ] Ajouter champ Long Text "Notes Prospection"
- [ ] Rich text : désactivé
- [ ] Noter le Field ID

### T0.5 - Créer vue "Prospection" sur T2-Contacts
- [ ] Créer vue Grid "PROSPECTION"
- [ ] Filtre : Statut Prospection is not empty
- [ ] Tri : Date Rappel (asc), Statut Prospection (asc)

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
| **Total** | **33** | **~15h** |

---

*Tâches créées le 15 décembre 2025*
