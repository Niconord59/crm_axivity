# Feature Specification: Améliorations CRM Axivity - Phase 2

**Feature Branch**: `002-crm-ameliorations`
**Created**: 2025-12-14
**Updated**: 2025-12-14
**Status**: En cours (53% - Phases 1-3 terminées)
**Input**: Audit de l'implémentation Phase 1 et analyse des fonctionnalités manquantes

## Contexte

Suite à l'implémentation de la Phase 1 (105 tâches complétées), un audit a révélé que l'application est fonctionnelle en lecture mais manque de fonctionnalités CRUD complètes et de visualisations. Cette Phase 2 vise à combler ces lacunes.

### État Actuel (Post-Phase 3 - Graphiques)

| Catégorie | Implémenté | Manquant |
|-----------|------------|----------|
| **CRUD** | ✅ Création/Édition (5 entités) | - |
| **Visualisation** | ✅ 3 graphiques Recharts | - |
| **Export** | Librairies installées | Non utilisées |
| **Recherche** | Composant UI | Non connecté |
| **Pages** | 9 complètes + formulaires + charts | 7 placeholder |

### Fichiers créés (Phase 2)

| Fichier | Description |
|---------|-------------|
| `src/components/shared/FormDialog.tsx` | Composant Dialog générique réutilisable |
| `src/components/ui/form.tsx` | Composants Form react-hook-form |
| `src/components/ui/label.tsx` | Composant Label Radix |
| `src/components/ui/textarea.tsx` | Composant Textarea |
| `src/lib/schemas/*.ts` | 5 schémas Zod (client, opportunite, projet, tache, facture) |
| `src/components/forms/*.tsx` | 5 formulaires CRUD |

### Fichiers créés (Phase 3)

| Fichier | Description |
|---------|-------------|
| `src/components/shared/ChartContainer.tsx` | Wrapper responsive pour graphiques |
| `src/components/charts/CAMensuelChart.tsx` | BarChart CA mensuel (6 derniers mois) |
| `src/components/charts/PipelineChart.tsx` | PieChart pipeline par statut |
| `src/components/charts/ProgressionChart.tsx` | AreaChart progression projets |
| `src/components/charts/index.ts` | Barrel export des composants charts |

---

## User Scenarios & Testing *(mandatory)*

### User Story 10 - Formulaires CRUD Opportunités (Priority: P1-CRITIQUE)

En tant que commercial, je veux créer et modifier des opportunités directement depuis l'interface web afin de ne plus avoir à basculer vers Supabase pour la saisie de données.

**Why this priority**: Sans formulaires, l'application est en lecture seule et ne peut pas être utilisée comme outil de travail principal.

**Independent Test**: Créer une nouvelle opportunité via le formulaire et vérifier qu'elle apparaît dans le pipeline Kanban et dans Supabase.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est sur la page Opportunités, **When** il clique sur "Nouvelle opportunité", **Then** un dialog s'ouvre avec un formulaire contenant : Nom, Client (select), Valeur estimée, Probabilité, Date clôture prévue, Statut
2. **Given** l'utilisateur remplit le formulaire, **When** il clique sur "Créer", **Then** l'opportunité est créée dans Supabase et apparaît dans la colonne correspondante du Kanban
3. **Given** l'utilisateur clique sur une opportunité, **When** il sélectionne "Modifier", **Then** le formulaire pré-rempli s'ouvre et les modifications sont sauvegardées dans Supabase

---

### User Story 11 - Formulaires CRUD Projets (Priority: P1-CRITIQUE)

En tant que chef de projet, je veux créer et modifier des projets directement depuis l'interface afin de gérer le cycle de vie complet des missions.

**Why this priority**: Les projets sont au coeur de l'activité, leur création manuelle dans Supabase ralentit les opérations.

**Independent Test**: Créer un projet, lui ajouter des tâches, et vérifier que le pourcentage de complétion se calcule correctement.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est sur la page Projets, **When** il clique sur "Nouveau projet", **Then** un dialog s'ouvre avec : Brief, Client, Budget, Dates début/fin, Statut
2. **Given** un projet existe, **When** l'utilisateur l'édite et change le statut, **Then** le projet se déplace dans la colonne Kanban correspondante
3. **Given** l'utilisateur crée un projet, **When** il sélectionne un client, **Then** le lien bidirectionnel est automatiquement créé dans Supabase

---

### User Story 12 - Formulaires CRUD Tâches (Priority: P1-CRITIQUE)

En tant que membre de l'équipe, je veux créer et modifier des tâches assignées à un projet afin de planifier le travail quotidien.

**Why this priority**: La gestion des tâches est essentielle pour l'exécution des projets.

**Independent Test**: Créer une tâche avec échéance, la marquer comme terminée, vérifier que le % du projet parent se met à jour.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est sur la page Tâches ou le détail d'un projet, **When** il clique sur "Nouvelle tâche", **Then** un formulaire s'ouvre avec : Nom, Projet (select), Responsable (select), Échéance, Priorité, Description
2. **Given** une tâche est créée avec échéance passée, **When** l'utilisateur consulte la liste, **Then** un badge rouge "En retard" s'affiche
3. **Given** l'utilisateur modifie le responsable d'une tâche, **When** il sauvegarde, **Then** le membre d'équipe reçoit la tâche dans "Mes tâches"

---

### User Story 13 - Formulaires CRUD Factures (Priority: P1)

En tant que responsable administratif, je veux créer des factures liées aux projets afin de suivre la facturation depuis l'interface.

**Why this priority**: La facturation est critique pour la trésorerie.

**Independent Test**: Créer une facture, marquer comme payée, vérifier que le CA encaissé du client se met à jour.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est sur la page Factures, **When** il clique sur "Nouvelle facture", **Then** un formulaire s'ouvre avec : Référence, Projet (select), Montant HT, Date émission, Date échéance
2. **Given** une facture est créée, **When** le montant HT est saisi, **Then** le montant TTC (x1.2) est calculé et affiché automatiquement
3. **Given** l'utilisateur marque une facture comme payée, **When** il sauvegarde, **Then** le statut change et la date de paiement est enregistrée

---

### User Story 14 - Formulaires CRUD Clients (Priority: P1)

En tant que commercial, je veux ajouter de nouveaux clients directement depuis l'interface afin d'enrichir la base CRM.

**Why this priority**: L'ajout de clients est le point d'entrée du cycle de vie.

**Independent Test**: Créer un client, lui créer une opportunité, vérifier le lien dans la fiche 360°.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est sur la page Clients, **When** il clique sur "Nouveau client", **Then** un formulaire s'ouvre avec : Nom, Email, Téléphone, Secteur, Statut (Prospect/Actif/Ancien)
2. **Given** un client est créé comme "Prospect", **When** une opportunité est gagnée, **Then** le statut peut être changé en "Actif"
3. **Given** l'utilisateur édite un client, **When** il modifie l'email, **Then** la modification est reflétée dans la fiche 360°

---

### User Story 15 - Fiche Client 360° Complète (Priority: P1)

En tant que commercial ou chef de projet, je veux consulter une fiche client avec tous ses onglets fonctionnels afin d'avoir une vision complète de la relation.

**Why this priority**: La page existe mais les onglets sont en placeholder.

**Independent Test**: Accéder à une fiche client et vérifier que tous les onglets affichent les données correctes.

**Acceptance Scenarios**:

1. **Given** l'utilisateur accède à la fiche d'un client, **When** il clique sur l'onglet "Projets", **Then** il voit tous les projets liés avec leur statut et budget
2. **Given** l'utilisateur est sur l'onglet "Factures", **When** il consulte la liste, **Then** il voit toutes les factures du client avec leur statut de paiement
3. **Given** l'utilisateur est sur l'onglet "Interactions", **When** il consulte l'historique, **Then** il voit le journal des contacts (appels, emails, réunions)
4. **Given** un client n'a pas eu d'interaction depuis 90+ jours, **When** l'utilisateur consulte la fiche, **Then** un badge "À relancer" rouge s'affiche

---

### User Story 16 - Graphiques Dashboard (Priority: P1)

En tant que dirigeant, je veux voir des graphiques visuels du CA et du pipeline afin de comprendre les tendances en un coup d'oeil.

**Why this priority**: Les données existent mais ne sont pas visualisées.

**Independent Test**: Vérifier que le graphique CA affiche les 6 derniers mois de factures payées.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est sur le dashboard, **When** il consulte le graphique CA, **Then** il voit un BarChart avec le CA mensuel sur 6 mois
2. **Given** l'utilisateur est sur la page Opportunités, **When** il consulte le header, **Then** il voit un PieChart de répartition par statut
3. **Given** l'utilisateur est sur la page Rapports, **When** il consulte les graphiques, **Then** il voit un AreaChart de progression des projets

---

### User Story 17 - Export CSV/Excel (Priority: P2)

En tant qu'utilisateur, je veux exporter les données en CSV ou Excel afin de créer des rapports personnalisés ou les partager.

**Why this priority**: Les librairies sont installées mais non utilisées.

**Independent Test**: Exporter la liste des projets en Excel et vérifier que le fichier s'ouvre correctement.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est sur une page liste (Projets, Clients, Factures), **When** il clique sur "Exporter", **Then** un menu propose CSV ou Excel
2. **Given** l'utilisateur exporte en CSV, **When** le fichier est téléchargé, **Then** il contient toutes les colonnes visibles avec encodage UTF-8
3. **Given** l'utilisateur exporte en Excel, **When** le fichier est téléchargé, **Then** il contient une feuille formatée avec en-têtes en gras

---

### User Story 18 - Calendrier des Tâches (Priority: P2)

En tant que membre de l'équipe, je veux voir mes tâches sur un calendrier mensuel afin de planifier ma semaine visuellement.

**Why this priority**: La page calendrier existe mais est vide.

**Independent Test**: Créer une tâche avec échéance et vérifier qu'elle apparaît sur le calendrier.

**Acceptance Scenarios**:

1. **Given** l'utilisateur accède à `/taches/calendrier`, **When** la page s'affiche, **Then** il voit un calendrier mensuel avec les tâches positionnées par date d'échéance
2. **Given** une tâche est priorité P1, **When** elle s'affiche sur le calendrier, **Then** elle a un badge rouge
3. **Given** l'utilisateur clique sur une tâche dans le calendrier, **When** le détail s'ouvre, **Then** il peut la marquer comme terminée

---

### User Story 19 - Portail Client Externe (Priority: P2)

En tant que client de l'agence, je veux accéder à un portail dédié pour suivre mes projets et factures sans contacter l'équipe.

**Why this priority**: Les 3 pages existent en placeholder.

**Independent Test**: Accéder au portail d'un client et vérifier l'isolation des données.

**Acceptance Scenarios**:

1. **Given** un client accède à `/portail/[clientId]`, **When** la page s'affiche, **Then** il voit uniquement ses projets avec leur % d'avancement
2. **Given** le client clique sur "Factures", **When** la page s'affiche, **Then** il voit ses factures avec statut et montant
3. **Given** le client consulte un projet, **When** il regarde la progression, **Then** il voit le % de tâches terminées sans voir le détail des tâches

---

### User Story 20 - Recherche Globale Connectée (Priority: P3)

En tant qu'utilisateur, je veux rechercher rapidement n'importe quelle entité via Cmd+K afin de naviguer efficacement.

**Why this priority**: Le composant existe mais n'est pas connecté aux données.

**Independent Test**: Taper "Acme" et vérifier que les résultats affichent le client, ses projets et opportunités.

**Acceptance Scenarios**:

1. **Given** l'utilisateur appuie sur Cmd+K, **When** le dialog s'ouvre, **Then** il peut taper un terme de recherche
2. **Given** l'utilisateur tape "Acme", **When** les résultats s'affichent, **Then** ils sont groupés par type (Clients, Projets, Opportunités, Tâches)
3. **Given** l'utilisateur clique sur un résultat, **When** la navigation s'effectue, **Then** il arrive sur la page de l'entité sélectionnée

---

### User Story 21 - Gestion Équipe et Charge (Priority: P3)

En tant que manager, je veux visualiser la charge de travail de chaque membre afin d'équilibrer les assignations.

**Why this priority**: Les pages équipe sont en placeholder.

**Independent Test**: Consulter la charge et vérifier que les barres de progression reflètent les heures assignées.

**Acceptance Scenarios**:

1. **Given** l'utilisateur accède à `/equipe`, **When** la page s'affiche, **Then** il voit la liste des membres avec rôle et nombre de tâches en cours
2. **Given** l'utilisateur accède à `/equipe/charge`, **When** la page s'affiche, **Then** il voit une barre de progression par membre (heures assignées / capacité semaine)
3. **Given** un membre dépasse 100% de capacité, **When** la barre s'affiche, **Then** elle est rouge avec un avertissement

---

## Edge Cases

- **Formulaires** : Validation Zod côté client, messages d'erreur en français, gestion des conflits de modification concurrente
- **Graphiques** : Affichage "Aucune donnée" si période vide, tooltips avec valeurs exactes
- **Export** : Limite de 1000 enregistrements par export, message si limite atteinte
- **Calendrier** : Gestion des tâches sans échéance (non affichées), scroll horizontal si nombreuses tâches le même jour
- **Portail** : Accès refusé si clientId invalide, affichage convivial si aucun projet
- **Recherche** : Debounce 300ms, maximum 10 résultats par type, gestion accent-insensitive

---

## Requirements *(mandatory)*

### Functional Requirements

**Formulaires CRUD**
- **FR-041**: Le système DOIT permettre la création d'opportunités via un formulaire Dialog
- **FR-042**: Le système DOIT permettre l'édition d'opportunités avec pré-remplissage des champs
- **FR-043**: Le système DOIT permettre la création/édition de projets avec liaison client
- **FR-044**: Le système DOIT permettre la création/édition de tâches avec liaison projet et responsable
- **FR-045**: Le système DOIT permettre la création/édition de factures avec calcul TTC automatique
- **FR-046**: Le système DOIT permettre la création/édition de clients
- **FR-047**: Tous les formulaires DOIVENT valider les données avec Zod avant soumission
- **FR-048**: Tous les formulaires DOIVENT afficher les erreurs de validation en français

**Fiche Client 360°**
- **FR-049**: L'onglet Projets DOIT afficher tous les projets liés au client
- **FR-050**: L'onglet Factures DOIT afficher toutes les factures liées au client
- **FR-051**: L'onglet Interactions DOIT afficher l'historique des contacts
- **FR-052**: L'indicateur Santé Client DOIT être calculé sur la dernière interaction (> 90j = rouge)

**Graphiques**
- **FR-053**: Le dashboard DOIT afficher un graphique CA mensuel (6 derniers mois) avec Recharts
- **FR-054**: La page Opportunités DOIT afficher un PieChart de répartition par statut
- **FR-055**: La page Rapports DOIT afficher un AreaChart de progression des projets

**Export**
- **FR-056**: Les pages listes DOIVENT proposer un bouton "Exporter" avec options CSV et Excel
- **FR-057**: L'export CSV DOIT être encodé en UTF-8 avec séparateur point-virgule
- **FR-058**: L'export Excel DOIT générer un fichier .xlsx avec en-têtes formatés

**Calendrier**
- **FR-059**: La page calendrier DOIT afficher les tâches positionnées par date d'échéance
- **FR-060**: Les tâches DOIVENT être colorées selon leur priorité (P1=rouge, P2=orange, P3=bleu)
- **FR-061**: Un clic sur une tâche DOIT ouvrir son détail

**Portail Client**
- **FR-062**: Le portail DOIT afficher uniquement les données du client identifié
- **FR-063**: Le portail DOIT avoir un layout distinct (sans sidebar interne)
- **FR-064**: Le portail DOIT afficher les projets avec leur % de complétion

**Recherche Globale**
- **FR-065**: La recherche DOIT être déclenchée par Cmd+K (Mac) ou Ctrl+K (Windows)
- **FR-066**: Les résultats DOIVENT être groupés par type d'entité
- **FR-067**: La recherche DOIT être accent-insensitive et case-insensitive

**Équipe**
- **FR-068**: La page équipe DOIT lister les membres avec leur rôle et tâches en cours
- **FR-069**: La page charge DOIT afficher une barre de progression par membre

### Key Entities (Nouvelles)

- **FormDialog**: Composant réutilisable pour les formulaires CRUD
- **ExportButton**: Composant d'export CSV/Excel réutilisable
- **ChartContainer**: Wrapper responsive pour les graphiques Recharts

---

## Assumptions

- Les hooks mutations (`useCreateProjet`, etc.) existent déjà dans les fichiers hooks
- Les types TypeScript sont complets et incluent tous les champs éditables
- L'API Supabase supporte le batch create (jusqu'à 10 records)
- Le rate limiting Supabase (5 req/sec) est géré par le client existant

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-011**: Les utilisateurs peuvent créer une opportunité en moins de 30 secondes via le formulaire
- **SC-012**: Les utilisateurs peuvent modifier n'importe quelle entité sans quitter l'interface
- **SC-013**: Les graphiques s'affichent en moins de 2 secondes après chargement des données
- **SC-014**: L'export Excel génère un fichier valide pour des listes jusqu'à 1000 enregistrements
- **SC-015**: La recherche globale retourne des résultats en moins de 500ms
- **SC-016**: Le calendrier affiche correctement les tâches sur un mois complet
- **SC-017**: Le portail client affiche uniquement les données du client (isolation vérifiée)
- **SC-018**: La charge de travail calcule correctement le % de capacité atteinte
