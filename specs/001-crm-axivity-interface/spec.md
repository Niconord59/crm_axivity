# Feature Specification: Interface Web CRM Axivity

**Feature Branch**: `001-crm-axivity-interface`
**Created**: 2025-12-14
**Status**: ✅ Complete (100% - All 105 tasks completed)
**Input**: Créer l'interface complète décrite dans les fichiers de documentation (Guide de Construction et passation_projet_agence_ia.md)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tableau de Bord Principal (Priority: P1)

En tant que membre de l'équipe de l'agence IA, je veux accéder à un tableau de bord centralisé affichant les KPIs clés de l'activité (projets actifs, CA pipeline, CA du trimestre, tâches en retard) et les projets récents afin d'avoir une vue d'ensemble instantanée de la santé de l'agence.

**Why this priority**: Le dashboard est le point d'entrée principal de l'application. Sans lui, les utilisateurs ne peuvent pas naviguer efficacement ni avoir une vision globale de l'activité.

**Independent Test**: Peut être testé en vérifiant que les 4 KPIs s'affichent correctement avec des données provenant d'Airtable, et que la navigation vers les autres sections est fonctionnelle.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est connecté, **When** il accède au dashboard, **Then** il voit 4 cartes KPI affichant : Projets actifs, CA Pipeline, CA Trimestre, Tâches en retard
2. **Given** l'utilisateur est sur le dashboard, **When** il consulte la section graphique, **Then** il voit un graphique de CA mensuel sur les 6 derniers mois
3. **Given** l'utilisateur est sur mobile, **When** il accède au dashboard, **Then** les KPIs s'affichent en grille 2x2 et une barre de navigation fixe apparaît en bas

---

### User Story 2 - Gestion des Projets (Priority: P1)

En tant que chef de projet, je veux visualiser et gérer tous les projets de l'agence dans différentes vues (liste, kanban par statut) afin de suivre l'avancement des missions et identifier rapidement les projets en difficulté.

**Why this priority**: La gestion des projets est au coeur de l'activité de l'agence. Les projets génèrent le CA et nécessitent un suivi quotidien.

**Independent Test**: Peut être testé en créant/modifiant un projet et en vérifiant que les changements sont reflétés dans Airtable et dans les différentes vues.

**Acceptance Scenarios**:

1. **Given** l'utilisateur accède à la page Projets, **When** il consulte la liste, **Then** il voit tous les projets avec leur statut, client, progression et dates
2. **Given** l'utilisateur est sur la page Projets, **When** il bascule en vue Kanban, **Then** les projets sont regroupés par colonnes de statut (Planification, En cours, En revue, Terminé, Facturé)
3. **Given** l'utilisateur clique sur un projet, **When** le panneau détail s'ouvre, **Then** il voit les informations complètes du projet incluant les tâches associées et leur progression

---

### User Story 3 - Pipeline Commercial (Opportunités) (Priority: P1)

En tant que commercial, je veux gérer le pipeline de ventes sous forme de Kanban drag-and-drop afin de suivre les opportunités à travers les étapes du cycle de vente et connaître la valeur pondérée du pipeline.

**Why this priority**: Le pipeline commercial est essentiel pour la croissance de l'agence. La visualisation Kanban permet une gestion intuitive des opportunités.

**Independent Test**: Peut être testé en déplaçant une opportunité d'une colonne à une autre et en vérifiant que la valeur pondérée se recalcule et que Airtable est mis à jour.

**Acceptance Scenarios**:

1. **Given** l'utilisateur accède à la page Opportunités, **When** la page s'affiche, **Then** il voit un Kanban avec colonnes : Lead, Qualifié, Proposition envoyée, Négociation, Gagnée, Perdue
2. **Given** une opportunité est dans la colonne "Proposition envoyée", **When** l'utilisateur la drag vers "Négociation", **Then** le statut est mis à jour dans Airtable et la valeur pondérée de la colonne est recalculée
3. **Given** l'utilisateur consulte une colonne, **When** il regarde le total, **Then** il voit la somme des valeurs pondérées (Valeur Estimée x Probabilité) de toutes les opportunités de cette colonne

---

### User Story 4 - Gestion des Tâches (Priority: P2)

En tant que membre de l'équipe, je veux consulter mes tâches assignées sous forme de liste filtrable et de calendrier afin de planifier ma semaine et ne jamais manquer une échéance.

**Why this priority**: La gestion des tâches est essentielle pour l'exécution des projets, mais dépend de l'existence préalable des projets dans le système.

**Independent Test**: Peut être testé en marquant une tâche comme terminée et en vérifiant que le pourcentage de progression du projet parent se met à jour.

**Acceptance Scenarios**:

1. **Given** l'utilisateur accède à la page Tâches, **When** il applique le filtre "Mes tâches", **Then** seules les tâches qui lui sont assignées s'affichent
2. **Given** l'utilisateur est sur la page Tâches, **When** il bascule en vue Calendrier, **Then** les tâches sont affichées sur un calendrier mensuel avec leur date d'échéance
3. **Given** une tâche est en retard (échéance passée), **When** l'utilisateur consulte la liste, **Then** la tâche est mise en évidence visuellement (badge rouge)
4. **Given** l'utilisateur coche une tâche comme terminée, **When** le statut est sauvegardé, **Then** le pourcentage de complétion du projet associé est automatiquement recalculé

---

### User Story 5 - Fiche Client 360° (Priority: P2)

En tant que commercial ou chef de projet, je veux accéder à une fiche client complète avec onglets (Informations, Projets, Factures, Interactions) afin d'avoir une vision à 360° de la relation avec chaque client.

**Why this priority**: La vision client unifiée améliore la qualité du service et facilite la prise de décision commerciale.

**Independent Test**: Peut être testé en naviguant vers une fiche client et en vérifiant que tous les onglets affichent les données correctes liées à ce client.

**Acceptance Scenarios**:

1. **Given** l'utilisateur accède à la liste des clients, **When** il clique sur un client, **Then** la fiche 360° s'ouvre avec l'onglet Informations actif
2. **Given** l'utilisateur est sur une fiche client, **When** il clique sur l'onglet Projets, **Then** il voit tous les projets liés à ce client avec leur statut et budget
3. **Given** l'utilisateur est sur une fiche client, **When** il consulte l'indicateur "Santé du Client", **Then** il voit un badge rouge si aucune interaction depuis plus de 90 jours

---

### User Story 6 - Gestion des Factures et Relances (Priority: P2)

En tant que responsable administratif, je veux suivre les factures avec leur statut de paiement et voir clairement lesquelles nécessitent une relance afin d'optimiser la trésorerie de l'agence.

**Why this priority**: La facturation est critique pour la santé financière, mais intervient après l'exécution des projets.

**Independent Test**: Peut être testé en filtrant les factures en retard et en vérifiant que le niveau de relance (N1, N2, N3) s'affiche correctement.

**Acceptance Scenarios**:

1. **Given** l'utilisateur accède à la page Factures, **When** il applique le filtre "En retard", **Then** seules les factures avec échéance dépassée et statut "Envoyée" s'affichent
2. **Given** une facture a dépassé son échéance de 1 jour, **When** l'utilisateur la consulte, **Then** le badge indique "Relance N1"
3. **Given** une facture a dépassé son échéance de 15+ jours, **When** l'utilisateur la consulte, **Then** le badge indique "Relance N3" en rouge

---

### User Story 7 - Dashboard Stratégique CEO (Priority: P3)

En tant que dirigeant de l'agence, je veux accéder à un dashboard stratégique avec des graphiques de CA, taux de conversion, marges et top projets rentables afin de piloter l'entreprise avec des données fiables.

**Why this priority**: Le dashboard CEO est important mais moins urgent que les fonctionnalités opérationnelles quotidiennes.

**Independent Test**: Peut être testé en vérifiant que les métriques agrégées (CA total, taux conversion, marge moyenne) sont calculées correctement à partir des données Airtable.

**Acceptance Scenarios**:

1. **Given** l'utilisateur accède à la page Rapports, **When** la page s'affiche, **Then** il voit les KPIs stratégiques : CA total, Taux de conversion pipeline, Marge moyenne
2. **Given** l'utilisateur consulte le graphique CA, **When** il sélectionne une période (trimestre/année), **Then** le graphique se met à jour avec les données de la période
3. **Given** l'utilisateur consulte le tableau Top Projets, **When** il le consulte, **Then** il voit les 10 projets les plus rentables classés par marge

---

### User Story 8 - Gestion de l'Équipe et Charge de Travail (Priority: P3)

En tant que manager, je veux visualiser la charge de travail de chaque membre de l'équipe afin d'équilibrer les assignations et éviter la surcharge.

**Why this priority**: L'optimisation des ressources est importante pour l'efficacité mais moins critique que les fonctionnalités de gestion de projet de base.

**Independent Test**: Peut être testé en consultant la page équipe et en vérifiant que le pourcentage de capacité atteinte est calculé correctement pour chaque membre.

**Acceptance Scenarios**:

1. **Given** l'utilisateur accède à la page Équipe, **When** la page s'affiche, **Then** il voit la liste des membres avec leur rôle et nombre de tâches en cours
2. **Given** l'utilisateur consulte la vue Charge de travail, **When** la page s'affiche, **Then** il voit un indicateur visuel (barre de progression) du % de capacité atteinte par membre

---

### User Story 9 - Portail Client Externe (Priority: P3)

En tant que client de l'agence, je veux accéder à un portail dédié pour suivre l'avancement de mes projets et consulter mes factures afin d'avoir de la visibilité sans déranger l'équipe.

**Why this priority**: Le portail client améliore l'expérience client mais n'est pas nécessaire pour les opérations internes de base.

**Independent Test**: Peut être testé en se connectant en tant que client et en vérifiant que seuls ses projets et factures sont visibles.

**Acceptance Scenarios**:

1. **Given** un client accède à son portail, **When** la page s'affiche, **Then** il voit uniquement ses projets avec leur pourcentage d'avancement
2. **Given** un client est sur son portail, **When** il consulte l'onglet Factures, **Then** il voit uniquement ses factures avec leur statut de paiement

---

### User Story 10 - Notifications en Temps Réel (Priority: P1 - Enhancement)

En tant que membre de l'équipe, je veux voir les alertes importantes (tâches en retard, factures impayées, projets en difficulté) dans un panneau de notifications accessible depuis le header afin de réagir rapidement aux situations critiques.

**Why this priority**: Les notifications permettent une gestion proactive et évitent les oublis critiques.

**Independent Test**: Peut être testé en créant une tâche en retard et en vérifiant qu'elle apparaît dans le panneau de notifications.

**Acceptance Scenarios**:

1. **Given** l'utilisateur clique sur l'icône cloche, **When** le panneau s'ouvre, **Then** il voit la liste des alertes groupées par type (tâches, factures, projets)
2. **Given** il y a des alertes urgentes, **When** l'utilisateur consulte le header, **Then** un badge avec le nombre d'alertes s'affiche sur l'icône cloche
3. **Given** l'utilisateur clique sur une notification, **When** le lien est suivi, **Then** il est redirigé vers la page correspondante

---

### User Story 11 - Import de Leads (Priority: P1 - Enhancement)

En tant que commercial, je veux importer des leads depuis un fichier CSV ou Excel avec mapping de colonnes afin de charger rapidement une base de prospects sans saisie manuelle.

**Why this priority**: L'import en masse de leads accélère considérablement le travail de prospection.

**Independent Test**: Peut être testé en important un fichier CSV de test et en vérifiant que les leads apparaissent dans le pipeline commercial.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est sur la page Opportunités, **When** il clique sur "Importer", **Then** une boîte de dialogue d'import s'ouvre
2. **Given** l'utilisateur dépose un fichier CSV/XLSX, **When** le fichier est parsé, **Then** il voit les colonnes détectées avec mapping automatique
3. **Given** l'utilisateur a configuré le mapping, **When** il clique sur "Importer", **Then** les leads sont créés dans Airtable avec une barre de progression
4. **Given** l'import est terminé, **When** l'utilisateur ferme la boîte de dialogue, **Then** le pipeline commercial est rafraîchi avec les nouveaux leads

---

### Edge Cases

- Que se passe-t-il quand Airtable renvoie une erreur réseau ? L'interface affiche un message d'erreur convivial avec option de réessayer.
- Que se passe-t-il quand un projet n'a aucune tâche ? Le pourcentage de complétion affiche 0% avec un message explicatif.
- Que se passe-t-il quand un utilisateur accède à une fiche client sans aucun projet/facture ? Les onglets concernés affichent "Aucune donnée" avec option de créer.
- Que se passe-t-il sur mobile quand le Kanban a beaucoup de colonnes ? Les colonnes sont scrollables horizontalement avec indicateurs visuels.
- Que se passe-t-il si un champ rollup/formula Airtable renvoie une erreur ? L'interface affiche "N/A" au lieu de planter.

## Requirements *(mandatory)*

### Functional Requirements

**Layout & Navigation**
- **FR-001**: Le système DOIT afficher une sidebar de navigation sur desktop (240px) avec les liens vers toutes les sections principales
- **FR-002**: Le système DOIT afficher une barre de navigation fixe en bas sur mobile avec 5 icônes principales
- **FR-003**: Le système DOIT adapter automatiquement l'affichage selon 3 breakpoints : Mobile (<768px), Tablette (768-1024px), Desktop (>1024px)
- **FR-004**: Le système DOIT afficher un header avec recherche globale, notifications et profil utilisateur

**Dashboard**
- **FR-005**: Le dashboard DOIT afficher 4 cartes KPI : Projets actifs, CA Pipeline, CA Trimestre, Tâches en retard
- **FR-006**: Le dashboard DOIT afficher un graphique de CA mensuel (6 derniers mois)
- **FR-007**: Le dashboard DOIT afficher la liste des projets récents avec leur progression

**Projets**
- **FR-008**: La page Projets DOIT offrir une vue Liste triable par colonne (nom, client, statut, date)
- **FR-009**: La page Projets DOIT offrir une vue Kanban groupée par statut
- **FR-010**: Les projets DOIVENT afficher leur pourcentage de tâches terminées (calculé automatiquement)
- **FR-011**: Le détail d'un projet DOIT s'ouvrir dans un panneau latéral (Sheet) avec toutes les informations

**Opportunités**
- **FR-012**: La page Opportunités DOIT afficher un Kanban avec colonnes : Lead, Qualifié, Proposition envoyée, Négociation, Gagnée, Perdue
- **FR-013**: Chaque colonne DOIT afficher la somme des valeurs pondérées de ses opportunités
- **FR-014**: Les opportunités DOIVENT être déplaçables par drag-and-drop entre colonnes
- **FR-015**: Un déplacement de colonne DOIT mettre à jour le statut dans Airtable

**Tâches**
- **FR-016**: La page Tâches DOIT offrir une vue Liste filtrable par responsable et projet
- **FR-017**: La page Tâches DOIT offrir une vue Calendrier mensuel
- **FR-018**: Les tâches en retard DOIVENT être visuellement identifiables (badge rouge)
- **FR-019**: Le checkbox de complétion DOIT mettre à jour le statut dans Airtable

**Clients**
- **FR-020**: La page Clients DOIT afficher une liste searchable de tous les clients
- **FR-021**: La fiche client DOIT avoir 4 onglets : Informations, Projets, Factures, Interactions
- **FR-022**: La fiche client DOIT afficher un indicateur "Santé du Client" basé sur la dernière interaction

**Factures**
- **FR-023**: La page Factures DOIT permettre de filtrer par statut (Brouillon, Envoyée, Payée, Annulée)
- **FR-024**: Les factures en retard DOIVENT afficher leur niveau de relance (N1, N2, N3)
- **FR-025**: La page Factures DOIT avoir une vue dédiée "À relancer" regroupant toutes les factures en retard

**Équipe**
- **FR-026**: La page Équipe DOIT lister tous les membres avec leur rôle et email
- **FR-027**: La vue Charge de travail DOIT afficher le % de capacité atteinte par membre

**Rapports CEO**
- **FR-028**: Le dashboard CEO DOIT afficher des KPIs stratégiques : CA total, Taux conversion, Marge moyenne
- **FR-029**: Le dashboard CEO DOIT permettre de filtrer par période (mois, trimestre, année)
- **FR-030**: Le dashboard CEO DOIT afficher un classement des projets les plus rentables

**Portail Client**
- **FR-031**: Le portail client DOIT être isolé des autres sections (accès restreint aux données du client)
- **FR-032**: Le portail client DOIT afficher les projets du client avec leur progression
- **FR-033**: Le portail client DOIT afficher les factures du client avec leur statut

**Données & API**
- **FR-034**: Toutes les données DOIVENT être lues depuis l'API Airtable en temps réel
- **FR-035**: Toutes les modifications DOIVENT être écrites vers l'API Airtable
- **FR-036**: Les erreurs API DOIVENT être gérées avec des messages utilisateur conviviaux
- **FR-037**: L'interface DOIT afficher un état de chargement (skeleton) pendant les requêtes API

**Responsive & Mobile**
- **FR-038**: Toutes les pages DOIVENT être utilisables sur smartphone (écran 375px minimum)
- **FR-039**: Les tableaux DOIVENT être scrollables horizontalement sur mobile
- **FR-040**: Les Kanban DOIVENT permettre le scroll horizontal entre colonnes sur mobile

### Key Entities

- **Client**: Entreprise cliente avec son statut (Prospect, Actif, Ancien), ses contacts associés, projets, opportunités, et CA total encaissé
- **Contact**: Personne physique chez un client avec nom, email, téléphone, et rôle
- **Opportunité**: Affaire potentielle avec valeur estimée, probabilité, statut pipeline, et date de clôture prévue
- **Projet**: Mission signée avec budget, dates, statut d'avancement, liste de tâches, et pourcentage de complétion
- **Tâche**: Action à réaliser avec responsable, projet parent, date d'échéance, statut, et priorité
- **Facture**: Document de facturation avec montant HT/TTC, statut de paiement, date d'échéance, et niveau de relance
- **Membre Équipe**: Collaborateur interne avec rôle, email, et capacité de travail
- **Interaction**: Journal des contacts avec les clients (appels, emails, réunions)

## Assumptions

- Les utilisateurs sont déjà authentifiés via un système d'authentification existant (non inclus dans ce scope)
- La base Airtable avec les 21 tables est déjà configurée et opérationnelle (Base ID: appEf6JtWFdfLwsU6)
- Les workflows N8N sont gérés séparément et ne font pas partie de cette interface
- L'interface est destinée à des utilisateurs francophones (textes en français)
- Les utilisateurs ont accès à une connexion internet stable pour les appels API Airtable
- Le taux de TVA par défaut est de 20% pour le calcul du montant TTC

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Les utilisateurs peuvent visualiser le dashboard complet en moins de 3 secondes après connexion
- **SC-002**: Les utilisateurs peuvent trouver et ouvrir n'importe quel projet en moins de 5 clics depuis le dashboard
- **SC-003**: Les utilisateurs peuvent mettre à jour le statut d'une opportunité (drag-and-drop) en moins de 2 secondes
- **SC-004**: Les utilisateurs peuvent marquer une tâche comme terminée en 1 clic
- **SC-005**: L'interface est utilisable sur smartphone sans zoom ni scroll horizontal involontaire sur les pages principales
- **SC-006**: 100% des données affichées correspondent aux données Airtable (pas de cache obsolète visible)
- **SC-007**: Les erreurs API affichent un message compréhensible dans 100% des cas (pas d'écran blanc ou de message technique)
- **SC-008**: Les membres de l'équipe peuvent gérer leurs tâches quotidiennes entièrement depuis mobile
- **SC-009**: Le CEO peut consulter les métriques stratégiques sans assistance technique
- **SC-010**: Les clients peuvent suivre leurs projets de manière autonome via le portail
