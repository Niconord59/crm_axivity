# Guide de Construction : Base Airtable pour Agence IA

## 1\. Schéma de la Base de Données (Structure des Tables)

Voici la structure fondamentale pour un cockpit opérationnel robuste. Les champs marqués d'une étoile `*` sont des champs clés pour les liaisons et les calculs.

---

### **`[T1] Clients`**

Cette table est le répertoire de toutes les entreprises avec lesquelles vous travaillez ou avez travaillé.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Nom du Client** | `Texte ligne simple` | Le nom légal de l'entreprise cliente. |
| **Statut** | `Statut` | Ex: Prospect, Actif, Ancien, En pause. |
| **Contacts** `*` | `Lien vers [T2] Contacts` | Lie tous les contacts associés à ce client. |
| **Projets** `*` | `Lien vers [T4] Projets` | Lie tous les projets réalisés pour ce client. |
| **Opportunités** `*` | `Lien vers [T3] Opportunités` | Lie toutes les opportunités commerciales avec ce client. |
| **CA Total Encaissé** | `Rollup` | Fait la somme des budgets de tous les `Projets` liés ayant le statut "Terminé". |
| **Date de Création** | `Date de création` | Date à laquelle le client a été ajouté à la base. |

---

### **`[T2] Contacts`**

Cette table contient les informations sur les personnes physiques chez vos clients.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Nom Complet** | `Texte ligne simple` | Prénom et Nom du contact. |
| **Client** `*` | `Lien vers [T1] Clients` | L'entreprise pour laquelle cette personne travaille. |
| **Email** | `Email` | Adresse email professionnelle. |
| **Téléphone** | `Numéro de téléphone` | Ligne directe. |
| **Rôle** | `Texte ligne simple` | Ex: CEO, Chef de projet, Responsable Marketing. |

---

### **`[T3] Opportunités`**

Votre pipeline de vente. Chaque enregistrement est une affaire potentielle.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Nom de l'Opportunité** | `Texte ligne simple` | Ex: "Automatisation du support client pour \[Client\]". |
| **Client** `*` | `Lien vers [T1] Clients` | Le client potentiel pour cette affaire. |
| **Statut** | `Statut` | Pipeline : Lead, Qualifié, Proposition envoyée, Négociation, Gagnée, Perdue. |
| **Valeur Estimée** | `Devise` | Le montant potentiel du contrat. |
| **Probabilité** | `Pourcentage` | La probabilité de signer l'affaire (ajustée manuellement). |
| **Valeur Pondérée** | `Formule` | Formule : `{Valeur Estimée} * {Probabilité}`. |
| **Date de Clôture Estimée** | `Date` | La date à laquelle vous pensez signer l'affaire. |
| **Projet Créé** `*` | `Lien vers [T4] Projets` | Une fois l'opportunité "Gagnée", elle sera liée au projet créé. |
| **Notes** | `Texte long` | Notes et contexte de l'opportunité. *Transféré vers le projet lors de la conversion.* |

---

### **`[T4] Projets`**

Le centre de suivi pour les missions signées.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Nom du Projet** | `Texte ligne simple` | Nom clair et unique de la mission. |
| **Client** `*` | `Lien vers [T1] Clients` | Le client pour qui le projet est réalisé. |
| **Statut** | `Statut` | Ex: En attente, Planification, En cours, En revue, Terminé, Facturé. |
| **Budget Final** | `Devise` | Le montant signé sur le devis. |
| **Date de Début** | `Date` | Date de lancement du projet. |
| **Date de Fin Prévue** | `Date` | Date de livraison cible. |
| **Tâches** `*` | `Lien vers [T5] Tâches` | Lie toutes les tâches nécessaires à la réalisation du projet. |
| **% Tâches Terminées** | `Rollup` | Calcule le pourcentage de tâches liées qui ont le statut "Terminée". |
| **Opportunités** `*` | `Lien vers [T3] Opportunités` | Lien bidirectionnel vers l'opportunité d'origine (créé automatiquement lors de la conversion). |
| **Date Fin Réelle** | `Date` | Date réelle de fin du projet. *Utilisé par le workflow de feedback post-projet.* |
| **Notes** | `Texte long` | Notes et contexte du projet. *Copié depuis l'opportunité lors de la conversion.* |

---

### **`[T5] Tâches`**

Les actions concrètes à réaliser pour chaque projet.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Nom de la Tâche** | `Texte ligne simple` | Description claire de l'action (verbe d'action). Ex: "Configurer le webhook de l'API". |
| **Projet** `*` | `Lien vers [T4] Projets` | Le projet auquel cette tâche appartient. |
| **Responsable** | `Collaborateur` | La personne de votre équipe en charge de la tâche. |
| **Membre Équipe** `*` | `Lien vers [T10] Équipe` | Lien vers la table Équipe. *Utilisé par les workflows N8N pour récupérer l'email du responsable (le champ Collaborateur ne permet pas d'accéder à l'email via API).* |
| **Date d'Échéance** | `Date` | La date limite pour terminer la tâche. |
| **Statut** | `Statut` | Ex: À faire, En cours, En attente de validation, Terminée. |
| **Priorité** | `Statut` | Ex: Haute, Moyenne, Basse. |

## 2\. Application Web SAAS - React + Shadcn/UI

> **⚠️ CHANGEMENT D'APPROCHE** : L'interface utilisateur est développée comme une application web SAAS complète en **React 18.3.1** avec **Shadcn/UI**, au lieu des Interfaces Airtable natives. Cette approche offre une expérience utilisateur supérieure et un design 100% responsive pour smartphone.

### Stack Technique

| Technologie | Version | Rôle |
|-------------|---------|------|
| **React** | 18.3.1 | Framework frontend |
| **Shadcn/UI** | Latest | Bibliothèque de composants UI |
| **Tailwind CSS** | 3.x | Styling utilitaire |
| **Airtable API** | REST | Backend / Base de données |
| **Recharts** | Latest | Graphiques et visualisations |

**Documentation** :
- React : https://fr.react.dev/
- Shadcn/UI : https://ui.shadcn.com

### Principes de Conception

1. **100% Responsive** : Interface optimisée desktop, tablette et smartphone
2. **Mobile-First** : Conception prioritaire pour l'usage mobile
3. **Composants Shadcn** : Toute la partie graphique utilise exclusivement Shadcn/UI
4. **API Airtable** : Lecture/écriture des données via l'API REST

### Architecture de l'Application

```
crm-axivity-app/
├── src/
│   ├── app/                          # Routes (Next.js App Router)
│   │   ├── (auth)/                   # Authentification
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/              # Layout principal
│   │   │   ├── layout.tsx            # Sidebar + Header
│   │   │   ├── page.tsx              # Dashboard Principal
│   │   │   ├── projets/
│   │   │   │   ├── page.tsx          # Liste projets
│   │   │   │   └── [id]/page.tsx     # Détail projet
│   │   │   ├── opportunites/
│   │   │   │   ├── page.tsx          # Pipeline Kanban
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── taches/
│   │   │   │   ├── page.tsx          # Mes tâches
│   │   │   │   └── calendrier/page.tsx
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx          # Liste clients
│   │   │   │   └── [id]/page.tsx     # Fiche 360°
│   │   │   ├── factures/
│   │   │   │   ├── page.tsx
│   │   │   │   └── relances/page.tsx
│   │   │   ├── equipe/
│   │   │   │   ├── page.tsx
│   │   │   │   └── charge/page.tsx   # Charge de travail
│   │   │   └── rapports/
│   │   │       └── page.tsx          # Dashboard CEO
│   │   └── portail/                  # Portail client externe
│   │       └── [clientId]/
│   ├── components/
│   │   ├── ui/                       # Composants Shadcn (auto-générés)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MobileNav.tsx         # Bottom navigation mobile
│   │   │   └── Breadcrumb.tsx
│   │   ├── dashboard/
│   │   │   ├── KpiCard.tsx
│   │   │   ├── ChartCA.tsx
│   │   │   └── RecentProjects.tsx
│   │   ├── projets/
│   │   ├── taches/
│   │   ├── clients/
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── StatusBadge.tsx
│   │       └── SearchCommand.tsx
│   ├── lib/
│   │   ├── airtable.ts               # Client API Airtable
│   │   ├── utils.ts
│   │   └── hooks/
│   │       ├── useProjects.ts
│   │       ├── useTasks.ts
│   │       └── useClients.ts
│   └── types/
│       └── index.ts                  # Types TypeScript
├── tailwind.config.js
├── components.json                   # Config Shadcn
└── package.json
```

### Connexion Airtable API

```typescript
// lib/airtable.ts
const AIRTABLE_BASE_ID = 'appEf6JtWFdfLwsU6';

export const TABLES = {
  CLIENTS: 'tbljVwWGbg2Yq9toR',
  CONTACTS: 'tblNHBh9qBi6OeFca',
  OPPORTUNITES: 'tbl8QiX8vGLQfRu0G',
  PROJETS: 'tblwNbd9Lk8SxixAI',
  TACHES: 'tbl6x2Ju4HJyh8SW2',
  MODELES_TACHES: 'tblhOmJ1223G97l3k',
  FACTURES: 'tbl0d2o8Df9Sj827M',
  INTERACTIONS: 'tblUoIhmQVr3ie5BQ',
  JOURNAL_TEMPS: 'tblPFfQLwtEbp8PoG',
  EQUIPE: 'tblozWfDZEFW3Nkwv',
  CONNAISSANCES: 'tblizxKK7FJsHuWnU',
  OBJECTIFS: 'tblFhPGAqSaXSJZ0e',
  RESULTATS_CLES: 'tbllcCCF5blNA8FQ6',
  CATALOGUE_SERVICES: 'tbl7GlDVGVyuKM1Sx',
  LIGNES_DEVIS: 'tblDKpxirY53hAO8k',
  FEEDBACK_CLIENT: 'tbl9I3B5xqIy5Gcrt',
  PARTENAIRES: 'tblJfPLFKJyCg23Az',
  CHANGELOG: 'tblx1zcTUoahNDAgn',
  SCENARIOS: 'tblU8SpVot0pxbosk',
  ACCOMPLISSEMENTS: 'tblBEg5xbIEwib9Eo',
  DEMANDES_EVOLUTION: 'tblaHSPKYf4r3RbNF',
};
```

### Design Responsive

```
┌────────────────────────────────────────────────────────────────┐
│                      DESKTOP (≥1024px)                          │
├───────────┬────────────────────────────────────────────────────┤
│           │  Header: Recherche globale, Notifications, Profil   │
│  Sidebar  ├────────────────────────────────────────────────────┤
│   240px   │                                                     │
│           │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  🏠 Home  │  │ Projets  │ │ CA Mois  │ │ Pipeline │ │ Retard │ │
│  📊 Proj  │  │   12     │ │  45K€    │ │  120K€   │ │   3    │ │
│  💼 Opp   │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ✅ Tâch  │                                                     │
│  👥 Cli   │  ┌────────────────────────┐ ┌────────────────────┐ │
│  📄 Fact  │  │   📊 Graphique CA      │ │  📋 Projets actifs │ │
│  👤 Équi  │  │                        │ │                    │ │
│  📈 Rapp  │  └────────────────────────┘ └────────────────────┘ │
└───────────┴────────────────────────────────────────────────────┘

┌──────────────────────────┐
│    MOBILE (<768px)       │
├──────────────────────────┤
│ ☰  CRM Axivity     🔔 👤 │  ← Header compact + hamburger
├──────────────────────────┤
│  ┌──────────┐┌──────────┐│
│  │ Projets  ││ CA Mois  ││  ← Grid 2 colonnes
│  │   12     ││  45K€    ││
│  └──────────┘└──────────┘│
│  ┌──────────┐┌──────────┐│
│  │ Pipeline ││ Retard   ││
│  │  120K€   ││   3      ││
│  └──────────┘└──────────┘│
│  ┌──────────────────────┐│
│  │   📊 Graphique CA    ││  ← Full width, scroll
│  └──────────────────────┘│
│  ┌──────────────────────┐│
│  │  📋 Projets actifs   ││  ← Cards swipable
│  └──────────────────────┘│
├──────────────────────────┤
│  🏠   📊   ✅   👥   ⚙️  │  ← Bottom navigation fixe
└──────────────────────────┘
```

### Composants Shadcn Utilisés

| Catégorie | Composants Shadcn |
|-----------|-------------------|
| **Layout** | `Card`, `Separator`, `Sheet`, `Tabs`, `ScrollArea`, `Resizable` |
| **Navigation** | `NavigationMenu`, `Breadcrumb`, `DropdownMenu`, `Command`, `Menubar` |
| **Formulaires** | `Input`, `Select`, `Checkbox`, `Calendar`, `DatePicker`, `Form`, `Textarea` |
| **Data Display** | `Table`, `Badge`, `Avatar`, `Progress`, `Skeleton`, `HoverCard` |
| **Feedback** | `Alert`, `AlertDialog`, `Toast`, `Sonner`, `Dialog`, `Tooltip` |
| **Actions** | `Button`, `Toggle`, `ToggleGroup`, `Switch` |

---

## 2.1\. Pages de l'Application (Ancien Guide Airtable - Gardé pour référence)

> **Note** : Les sections suivantes décrivent la logique métier et les widgets prévus. Ils sont maintenant implémentés en React/Shadcn au lieu d'Airtable Interfaces.

Les Interfaces Airtable permettent de visualiser vos données de manière interactive et ciblée, sans exposer la complexité de la base de données.

### **Étape 1 : Création de l'Interface.**

1. Dans votre base Airtable, cliquez sur l'icône **"Interfaces"** en haut à gauche.  
2. Cliquez sur **"Start building"**.  
3. Donnez un nom à votre interface, par exemple **"Dashboard Principal"**. Choisissez une icône et une couleur.  
4. Choisissez une disposition de départ (le "Blank canvas" est parfait pour commencer) et cliquez sur **"Next"**.

### **Étape 2 : Ajout du Widget "KPIs Clés".**

Ce widget affiche les chiffres les plus importants en un coup d'œil.

1. Sur votre canevas d'interface, cliquez sur **"+ Add element"** en bas à gauche.  
2. Sélectionnez l'élément **"Number"**.  
3. **Configurez le premier KPI : "Nombre de Projets Actifs"**  
   * **Source :** Sélectionnez la table `[T4] Projets`.  
   * **Calculation :** Choisissez **"Count"**.  
   * **Filtering :** Cliquez sur **"+ Add condition"** et configurez le filtre : `Where "Statut" is "En cours"`.  
   * Renommez l'élément en "Projets Actifs".  
4. **Configurez le deuxième KPI : "CA Potentiel en Pipeline"**  
   * Ajoutez un nouvel élément **"Number"**.  
   * **Source :** Sélectionnez la table `[T3] Opportunités`.  
   * **Calculation :** Choisissez **"Sum"** et sélectionnez le champ `Valeur Estimée`.  
   * **Filtering :** Ajoutez une condition : `Where "Statut" is not "Gagnée" AND "Statut" is not "Perdue"`.  
   * Renommez l'élément en "CA Potentiel".  
5. **Configurez le troisième KPI : "CA Signé ce Trimestre"**  
   * Ajoutez un nouvel élément **"Number"**.  
   * **Source :** Sélectionnez la table `[T4] Projets`.  
   * **Calculation :** Choisissez **"Sum"** et sélectionnez le champ `Budget Final`.  
   * **Filtering :** Ajoutez une condition : `Where "Date de Début" is within "this quarter"`.  
   * Renommez l'élément en "CA Signé (Trimestre)".

### **Étape 3 : Ajout de la Vue "Projets en Cours".**

Cette section liste les projets qui demandent une attention immédiate.

1. Cliquez sur **"+ Add element"** et choisissez l'élément **"Grid"**.  
2. **Source :** Sélectionnez la table `[T4] Projets`.  
3. **Filtering :** Configurez le filtre : `Where "Statut" is "En cours"`.  
4. **Fields :** Choisissez les champs à afficher dans la grille, par exemple : `Nom du Projet`, `Client`, `Date de Fin Prévue`, et `% Tâches Terminées`.  
5. Donnez un titre à l'élément, comme "Suivi des Projets Actifs".

### **Étape 4 : Ajout de la Vue "Tâches à Venir".**

Une vue chronologique pour anticiper la charge de travail.

1. Cliquez sur **"+ Add element"** et choisissez l'élément **"Timeline"**.  
2. **Source :** Sélectionnez la table `[T5] Tâches`.  
3. **Date Fields :**  
   * **Start date field :** Si vous avez une date de début de tâche, utilisez-la. Sinon, utilisez la `Date d'Échéance`.  
   * **End date field :** Utilisez la `Date d'Échéance`.  
4. **Filtering :** Ajoutez un filtre pour ne pas afficher les tâches déjà terminées : `Where "Statut" is not "Terminée"`.  
5. **Grouping (Optionnel) :** Groupez les tâches par `Projet` ou par `Responsable` pour une meilleure lisibilité.  
6. Donnez un titre à l'élément, comme "Planning des Tâches".

## 3\. Exemples d'Automatisations Essentielles

Automatisez les processus répétitifs pour gagner en efficacité et réduire les erreurs.

> **✅ IMPLÉMENTÉ** : Ces automatisations ont été créées sous forme de workflows N8N. Voir le dossier `Workflows_n8n/` pour les fichiers JSON et leur documentation.

### **Automatisation 1 : Conversion d'une Opportunité en Projet.**

Cette automatisation crée automatiquement un projet lorsqu'une affaire est gagnée.

* **Déclencheur (Trigger) :**  
    
  * Type : `When a record matches conditions`.  
  * Table : `[T3] Opportunités`.  
  * Condition : `Where "Statut" is "Gagnée"`.


* **Actions :**  
    
  1. **Action 1 : Créer un Projet**  
     * Type : `Create record`.  
     * Table : `[T4] Projets`.  
     * **Fields à mapper :**  
       * `Nom du Projet` : Insérez la valeur du champ `Nom de l'Opportunité` du déclencheur.  
       * `Client` : Insérez la valeur du champ `Client` du déclencheur.  
       * `Budget Final` : Insérez la valeur du champ `Valeur Estimée` du déclencheur.  
       * `Statut` : Choisissez la valeur statique "Planification".  
  2. **Action 2 (Optionnelle) : Mettre à jour l'Opportunité**  
     * Type : `Update record`.  
     * Table : `[T3] Opportunités`.  
     * **Record ID :** Utilisez l'Airtable Record ID du déclencheur.  
     * **Fields à mettre à jour :**  
       * `Projet Créé` : Insérez l'Airtable Record ID de l'enregistrement créé à l'étape 1\.  
  3. **Action 3 : Notifier l'équipe**  
     * Type : `Send a Slack message` ou `Send an email`.  
     * Message : "🎉 Nouvelle affaire signée \! Le projet '\[Nom du Projet\]' a été créé pour le client '\[Nom du Client\]'. Montant : \[Budget Final\] €."

### **Automatisation 2 : Notification de Tâche en Retard.**

Cette automatisation envoie un rappel quotidien pour les tâches dont l'échéance est dépassée.

* **Déclencheur (Trigger) :**  
    
  * Type : `At a scheduled time`.  
  * Configuration : Tous les jours (`Every day`), en semaine (`weekdays only`), à 9h00.


* **Actions :**  
    
  1. **Action 1 : Trouver les tâches en retard**  
     * Type : `Find records`.  
     * Table : `[T5] Tâches`.  
     * **Conditions :**  
       * Condition 1 : `Where "Date d'Échéance" is before "today"`.  
       * Condition 2 : `AND "Statut" is not "Terminée"`.  
  2. **Action 2 : Envoyer un résumé**  
     * Type : `Send an email` (ou un message Slack).  
     * **Destinataire :** L'email du chef de projet.  
     * **Sujet :** "Rappel : Tâches en retard aujourd'hui".  
     * **Message :**  
       * Insérez une condition : `If "Number of records" from Action 1 is greater than 0`.  
       * Dans le corps du message, insérez une grille ou une liste des enregistrements trouvés à l'étape 1, en affichant le `Nom de la Tâche`, le `Projet` associé, et le `Responsable`.  
       * Si aucune tâche n'est trouvée, l'email ne sera pas envoyé.

## 4\. Vues Stratégiques par Table

Les "Vues" sont des filtres et des affichages sauvegardés de vos données. Elles sont essentielles pour organiser votre travail sans être submergé par l'information. Voici des vues critiques à créer pour chaque table.

### **Dans la table `[T3] Opportunités`**

* **Vue 1 : Pipeline Commercial (Kanban)**  
    
  * **Type :** `Kanban`.  
  * **Champ de regroupement :** `Statut`.  
  * **Objectif :** Visualiser l'ensemble du pipeline de vente en un coup d'œil. Vous pouvez glisser-déposer les opportunités d'une colonne à l'autre (ex: de "Proposition envoyée" à "Négociation").  
  * **Configuration :** Dans la barre de personnalisation, activez la somme (`Sum`) sur le champ `Valeur Pondérée` pour chaque colonne afin de voir la valeur de votre pipeline à chaque étape.


* **Vue 2 : Opportunités à Relancer (Grid)**  
    
  * **Type :** `Grid`.  
  * **Filtres :**  
    * `"Statut" is not "Gagnée"`  
    * `AND "Statut" is not "Perdue"`  
    * `AND "Date de dernière modification" is before "a week ago"`  
  * **Objectif :** Isoler les affaires qui n'ont pas eu d'activité récente pour ne jamais laisser un lead se refroidir.

### **Dans la table `[T4] Projets`**

* **Vue 1 : Projets par Statut (Kanban)**  
    
  * **Type :** `Kanban`.  
  * **Champ de regroupement :** `Statut`.  
  * **Objectif :** Avoir une vue d'ensemble sur l'avancement de tous les projets, de la planification à la facturation.


* **Vue 2 : Santé des Projets (Grid)**  
    
  * **Type :** `Grid`.  
  * **Champs visibles :** `Nom du Projet`, `Client`, `Date de Fin Prévue`, `% Tâches Terminées`.  
  * **Filtre :** `"Statut" is "En cours"`.  
  * **Mise en forme conditionnelle (Coloration) :**  
    * Si `"Date de Fin Prévue"` est passée ET `"% Tâches Terminées"` est inférieur à 100%, colorer la ligne en rouge.  
    * Si `"% Tâches Terminées"` est supérieur à 80%, colorer le champ en vert.  
  * **Objectif :** Identifier immédiatement les projets qui prennent du retard.

### **Dans la table `[T5] Tâches`**

* **Vue 1 : Mes Tâches de la Semaine (Grid)**  
    
  * **Type :** `Grid`.  
  * **Filtres :**  
    * `"Responsable" is "current user"` (chaque membre de l'équipe ne verra que ses propres tâches).  
    * `AND "Date d'Échéance" is on or after "today"`.  
    * `AND "Date d'Échéance" is on or before "a week from now"`.  
    * `AND "Statut" is not "Terminée"`.  
  * **Objectif :** Fournir à chaque collaborateur une to-do list claire et actionnable pour la semaine, sans distraction.


* **Vue 2 : Calendrier de l'Équipe (Calendar)**  
    
  * **Type :** `Calendar`.  
  * **Champ de date :** `Date d'Échéance`.  
  * **Objectif :** Visualiser la charge de travail de l'équipe sur un calendrier pour mieux planifier les sprints et anticiper les goulots d'étranglement.

## 5\. Formules et Champs Avancés Utiles

Relions nos tables de manière plus intelligente pour faire remonter l'information automatiquement.

* **Champ 1 : Afficher le chef de projet sur une Tâche**  
    
  * **Table :** `[T4] Projets`  
  * **Nouveau champ :** `Chef de Projet` de type `Collaborateur`.  
  * **Table :** `[T5] Tâches`  
  * **Nouveau champ :** `Chef du Projet (Lookup)`  
  * **Type :** `Lookup`  
  * **Configuration :**  
    1. Ce champ "regarde" à travers le lien `Projet`.  
    2. Il récupère la valeur du champ `Chef de Projet` de la table `[T4] Projets`.  
  * **Bénéfice :** Vous pouvez voir directement qui est le responsable final d'un projet depuis la liste des tâches, ce qui simplifie les notifications et les filtres.


* **Champ 2 : Calculer le Retard d'un Projet**  
    
  * **Table :** `[T4] Projets`  
  * **Nouveau champ :** `Jours de Retard`  
  * **Type :** `Formule`  
  * **Formule :**  
      
    IF(  
      
      AND(  
      
        {Date de Fin Prévue},  
      
        {Statut} \!= "Terminé",  
      
        IS\_AFTER({Date de Fin Prévue}, TODAY()) \= FALSE()  
      
      ),  
      
      DATETIME\_DIFF(TODAY(), {Date de Fin Prévue}, 'days'),  
      
      0  
      
    )  
      
  * **Explication :** SI la date de fin est passée ET que le projet n'est pas terminé, ALORS calcule la différence en jours entre aujourd'hui et la date de fin prévue. SINON, affiche 0\.  
  * **Bénéfice :** Un indicateur numérique clair pour trier et prioriser les projets qui dérapent le plus.


* **Champ 3 : Préfixer les Noms de Projets**  
    
  * **Table :** `[T4] Projets`  
  * **Nouveau champ :** `ID Projet` de type `Autonumber`.  
  * **Modifier le champ principal :** `Nom du Projet` en type `Formule`.  
  * **Nouveau champ :** `Brief Projet` de type `Texte ligne simple`. C'est ici que vous écrirez le nom du projet désormais.  
  * **Formule pour `Nom du Projet` :**  
      
    'P' & {ID Projet} & ' \- ' & {Brief Projet}  
      
  * **Bénéfice :** Chaque projet a un identifiant unique et standardisé (ex: "P101 \- Refonte site Client X"), ce qui évite les confusions et facilite les recherches.

## 6\. Automatisation Supplémentaire : Création de Tâches Standard

Pour garantir la qualité et ne rien oublier, automatisez la création d'une liste de tâches standard pour chaque nouveau projet.

* **Contexte :** Imaginons que chaque projet d'automatisation IA ait 3 phases clés : "Kick-off & Cadrage", "Développement", "Déploiement & Formation".  
    
* **Pré-requis :** Créez une table **`[T6] Modèles de Tâches`**.  
    
  * Champ 1 : `Nom de la Tâche` (Texte). Ex: "Organiser la réunion de lancement".  
  * Champ 2 : `Phase` (Statut). Ex: "Kick-off & Cadrage".  
  * Champ 3 : `Délai (jours après début)` (Nombre). Ex: `2` (signifie que la tâche doit être faite 2 jours après le début du projet).


* **Automatisation : Déployer le plan de projet**  
    
  * **Déclencheur (Trigger) :**  
      
    * Type : `When a record is created`.  
    * Table : `[T4] Projets`.

    

  * **Actions :**  
      
    1. **Action 1 : Trouver les tâches de la phase 1**  
       * Type : `Find records`.  
       * Table : `[T6] Modèles de Tâches`.  
       * Condition : `Where "Phase" is "Kick-off & Cadrage"`.  
    2. **Action 2 : Créer les tâches correspondantes en boucle**  
       * Type : `Repeating action` \-\> `For each record` from Action 1\.  
       * **Dans la boucle :** `Create record`.  
       * Table : `[T5] Tâches`.  
       * **Fields à mapper :**  
         * `Nom de la Tâche` : Insérer la valeur du champ `Nom de la Tâche` de la boucle.  
         * `Projet` : Insérer l'Airtable Record ID du projet qui a déclenché l'automatisation.  
         * `Date d'Échéance` : Utilisez une formule dynamique. Insérez la `Date de Début` du projet déclencheur, puis ajoutez une étape `Dateadd` en utilisant la valeur du champ `Délai (jours après début)` de la boucle.

    

  * **Bénéfice :** En une seconde, chaque nouveau projet est peuplé avec un plan d'action standardisé, assurant qu'aucune étape critique n'est manquée. Vous pouvez répéter les actions pour les autres phases.

## 7\. Gestion Financière et Facturation

Pour une vision claire de votre trésorerie et de la rentabilité, il est crucial de suivre les factures de près. Nous allons ajouter une table dédiée à cela.

### **Nouvelle Table : `[T7] Factures`**

Cette table suivra chaque facture émise, de sa création à son paiement.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Numéro de Facture** | `Texte ligne simple` | Numéro unique de la facture (ex: FACT-2024-001). |
| **Projet** `*` | `Lien vers [T4] Projets` | Le projet concerné par cette facture. |
| **Client** `*` | `Lookup` | Affiche automatiquement le client lié au projet sélectionné. |
| **Montant HT** | `Devise` | Le montant facturé avant taxes. |
| **Montant TTC** | `Formule` | Formule simple : `{Montant HT} * 1.2` (si TVA à 20%). |
| **Date d'Émission** | `Date` | La date à laquelle la facture a été envoyée. |
| **Date d'Échéance** | `Date` | La date limite de paiement. |
| **Statut** | `Statut` | Ex: Brouillon, Envoyée, Payée, En retard. |
| **Date de Paiement** | `Date` | La date à laquelle le paiement a été reçu. |
| **Niveau Relance Envoyé** | `Nombre` | Niveau de relance déjà envoyé (0, 1, 2 ou 3). *Mis à jour par le workflow N8N.* |
| **Date Dernière Relance** | `Date` | Date du dernier email de relance envoyé. *Mis à jour par le workflow N8N.* |
| **Niveau de Relance** | `Formule` | Calcule le niveau de relance à envoyer selon le retard (N1: J+1, N2: J+7, N3: J+15). *Lecture seule.* |

### **Mise à jour de la table `[T4] Projets`**

Connectons les finances aux projets pour calculer la rentabilité.

| Nom du Champ (à ajouter/modifier) | Type de Champ | Description |
| :---- | :---- | :---- |
| **Factures** `*` | `Lien vers [T7] Factures` | Lie toutes les factures associées à ce projet. |
| **Montant Total Facturé** | `Rollup` | Fait la somme (`sum`) du champ `Montant HT` de toutes les factures liées. |
| **Statut de Facturation** | `Rollup` | Affiche le `Statut` de la facture liée. Si plusieurs factures, configurez pour afficher un résumé. |
| **Coût Interne Estimé** | `Devise` | Coût de la main-d'œuvre, logiciels, etc. (saisi manuellement pour l'instant). |
| **Marge Brute** | `Formule` | Formule : `{Montant Total Facturé} - {Coût Interne Estimé}`. |
| **Taux de Marge** | `Formule` | Formule : `IF({Montant Total Facturé} > 0, {Marge Brute} / {Montant Total Facturé}, 0)` et formatez en `Pourcentage`. |

**Bénéfice :** Vous transformez votre Airtable d'un simple outil de suivi en un véritable système de gestion financière. Vous pouvez créer une vue "Factures en retard" et automatiser les relances.

## 8\. Suivi de la Relation Client (CRM Avancé)

Un projet terminé n'est pas la fin de la relation. Suivez chaque interaction pour fidéliser vos clients et générer de nouvelles opportunités.

### **Nouvelle Table : `[T8] Interactions`**

C'est le journal de bord de toutes vos communications avec les clients et prospects.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Objet de l'Interaction** | `Texte ligne simple` | Ex: "Appel de suivi Q4", "Réunion de cadrage", "Email de support". |
| **Type** | `Statut` | Ex: Email, Appel, Réunion, Support, Autre. |
| **Date** | `Date` | Date et heure de l'interaction. |
| **Contact** `*` | `Lien vers [T2] Contacts` | La personne avec qui vous avez interagi. |
| **Client** `*` | `Lookup` | Affiche automatiquement le client lié au contact. |
| **Notes** | `Texte long` | Compte-rendu de l'interaction, points clés, prochaines étapes. |
| **Participant Interne** | `Collaborateur` | Le membre de votre équipe qui a mené l'interaction. |

### **Mise à jour de la table `[T1] Clients`**

| Nom du Champ (à ajouter) | Type de Champ | Description |
| :---- | :---- | :---- |
| **Dernière Interaction** | `Rollup` | "Regarde" à travers le lien `Contacts` \-\> `Interactions` et récupère la date maximale (`max`) du champ `Date`. |
| **Santé du Client** | `Formule` | Formule pour un indicateur simple : `IF(DATETIME_DIFF(TODAY(), {Dernière Interaction}, 'days') > 90, "🔴 À relancer", "✅ Actif")`. |

**Bénéfice :** Vous disposez d'un historique complet pour chaque client. N'importe qui dans l'équipe peut reprendre une conversation en ayant tout le contexte, et vous pouvez créer des vues pour vous assurer qu'aucun client n'est laissé de côté trop longtemps.

## 9\. Simplification de la Saisie de Données avec les Formulaires

Réduisez les erreurs de saisie et gagnez du temps en utilisant les formulaires Airtable pour capturer l'information à la source.

* **Exemple 1 : Formulaire de Nouveau Lead**  
    
  * Allez dans la table `[T3] Opportunités`.  
  * Créez une nouvelle vue de type `Form`.  
  * Nommez-la "Nouveau Lead".  
  * Glissez-déposez les champs dont vous avez besoin : `Nom de l'Opportunité`, `Client` (ou des champs pour créer un nouveau client), `Valeur Estimée`, et des champs de notes.  
  * **Action :** Intégrez ce formulaire sur votre site web ou partagez le lien directement. Chaque soumission créera une nouvelle opportunité dans votre pipeline, prête à être qualifiée.


* **Exemple 2 : Formulaire de Demande de Support**  
    
  1. Allez dans la table `[T8] Interactions`.  
  2. Créez une vue `Form`.  
  3. Nommez-la "Demande de Support Client".  
  4. Champs à inclure : `Contact` (pré-remplissable si vous envoyez le lien au bon client), `Objet de l'Interaction`, `Notes` (où le client décrit son problème). Mettez une valeur par défaut "Support" pour le champ `Type`.  
  5. **Action :** Créez une automatisation qui notifie le `Chef de Projet` associé au client lorsqu'un formulaire de ce type est soumis.

**Bénéfice :** Vous standardisez la collecte d'informations et réduisez la charge administrative, tout en intégrant votre cockpit Airtable à vos processus externes.

## 10\. Vision Stratégique \- Le Dashboard du CEO

> **📱 Implémentation React** : Cette page correspond à `/rapports` dans l'application React. Utilise les composants Shadcn `Card`, `Chart` (Recharts), `Table`, `Select` pour les filtres.

Le premier dashboard était opérationnel. Celui-ci est destiné au pilotage stratégique de l'agence.

* **Étape 1 : Créez une nouvelle Interface** nommée "Pilotage Stratégique".  
    
* **Étape 2 : Ajoutez des KPIs de haut niveau.**  
    
  * **Marge Brute Moyenne :** Un élément `Number` sur la table `[T4] Projets`, calculant la moyenne (`average`) du champ `Taux de Marge`.  
  * **Durée Moyenne du Cycle de Vente :** Un élément `Number` sur la table `[T3] Opportunités` (filtrée sur "Gagnée"), calculant la durée moyenne entre la date de création et la date de clôture.  
  * **Taux de Conversion :** Un élément `Formula` qui divise le nombre d'opportunités "Gagnées" par le nombre total d'opportunités (hors leads ouverts).


* **Étape 3 : Ajoutez un graphique de performance.**  
    
  * Ajoutez un élément `Chart` (graphique à barres).  
  * **Source :** `[T7] Factures`.  
  * **X-axis :** Le champ `Date d'Émission`, regroupé par mois (`by month`).  
  * **Y-axis :** La somme (`sum`) du champ `Montant HT`.  
  * **Titre :** "Chiffre d'Affaires Facturé par Mois".


* **Étape 4 : Ajoutez une vue sur la rentabilité.**  
    
  * Ajoutez un élément `List` ou `Grid`.  
  * **Source :** `[T4] Projets`, filtré sur "Terminé".  
  * **Champs visibles :** `Nom du Projet`, `Montant Total Facturé`, `Coût Interne Estimé`, `Marge Brute`.  
  * **Trier** la liste par `Marge Brute` décroissante.  
  * **Titre :** "Projets les plus rentables".

**Bénéfice :** Ce dashboard vous donne les indicateurs nécessaires pour prendre des décisions stratégiques : sur quel type de projet vous concentrer, comment optimiser votre cycle de vente, et comment piloter la croissance de l'agence sur la base de données réelles.

## 11\. Gestion des Ressources et Suivi du Temps

Comprendre où passe le temps de votre équipe est la clé de la rentabilité et de la planification. Cette section introduit le suivi du temps pour mesurer l'effort réel par rapport aux estimations.

### **Nouvelle Table : `[T9] Journal de Temps`**

Chaque entrée est un bloc de temps consacré à une tâche spécifique.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Description** | `Texte ligne simple` | Ce qui a été fait (ex: "Développement du module d'import"). |
| **Collaborateur** | `Collaborateur` | Qui a effectué le travail. |
| **Tâche** `*` | `Lien vers [T5] Tâches` | La tâche spécifique sur laquelle le temps a été passé. |
| **Projet** `*` | `Lookup` | Affiche automatiquement le projet lié à la tâche. |
| **Date** | `Date` | Le jour où le travail a été effectué. |
| **Durée (heures)** | `Durée` | Le temps passé, formaté en heures/minutes (ex: 2:30). |

### **Mises à jour des tables `[T5] Tâches` et `[T4] Projets`**

* **Dans la table `[T5] Tâches` :**  
    
  * **Nouveau champ `Temps Estimé (h)` :** `Durée`. Saisissez ici votre estimation initiale pour la tâche.  
  * **Nouveau champ `Temps Passé (h)` :** `Rollup`.  
    * "Regarde" le champ `Journal de Temps`.  
    * Récupère le champ `Durée (heures)`.  
    * Calcule la somme (`sum`).  
  * **Nouveau champ `Écart Temps` :** `Formule`.  
    * Formule : `IF({Temps Estimé (h)}, {Temps Estimé (h)} - {Temps Passé (h)}, "")`. Cela vous montrera le temps restant (ou le dépassement).


* **Dans la table `[T4] Projets` :**  
    
  * **Nouveau champ `Total Heures Estimées` :** `Rollup`. Fait la somme du `Temps Estimé (h)` de toutes les `Tâches` liées.  
  * **Nouveau champ `Total Heures Passées` :** `Rollup`. Fait la somme du `Temps Passé (h)` de toutes les `Tâches` liées.  
  * **Nouveau champ `Budget Temps Consommé` :** `Formule`.  
    * Formule : `IF({Total Heures Estimées} > 0, {Total Heures Passées} / {Total Heures Estimées}, 0)`. Formatez en `Pourcentage`.

**Bénéfice :** Vous pouvez désormais comparer les estimations à la réalité, identifier les types de projets qui sont les plus chronophages, et ajuster vos devis futurs avec des données précises. Un dashboard de "Suivi de Rentabilité" peut maintenant afficher les projets par `Taux de Marge` et par `Budget Temps Consommé`.

## 12\. Création d'un Portail Client Sécurisé

> **📱 Implémentation React** : Cette page correspond à `/portail/[clientId]` dans l'application React. Interface simplifiée avec composants Shadcn `Card`, `Progress`, `Table`, `Badge`. Authentification par lien unique ou token JWT.

Offrez de la transparence à vos clients et réduisez les emails de suivi en leur donnant un accès direct (et contrôlé) à l'avancement de leur projet.

1. **Pré-requis : Ajouter un collaborateur client.**  
     
   * Dans la table `[T1] Clients`, ajoutez un champ **`Contact Principal (Portail)`** de type `Collaborateur`. Invitez l'email de votre client principal à la base (avec des permissions de "Read-only" ou "Commenter" pour commencer).

   

2. **Créer une nouvelle Interface** nommée "Portail Client".  
     
3. **Configurer le filtrage dynamique.**  
     
   * En haut de l'interface, cliquez sur `Allow data to be filtered by the logged-in user`.  
   * Choisissez la table `[T1] Clients` et le champ `Contact Principal (Portail)`. Airtable saura désormais qui est connecté.

   

4. **Ajouter des éléments filtrés pour le client.**  
     
   * **Widget "Statut du Projet" :** Ajoutez un élément `List` basé sur la table `[T4] Projets`.  
     * **Filtre :** `Where "Client" (via le lien) -> "Contact Principal (Portail)" is the current user`.  
     * **Champs visibles :** `Nom du Projet`, `Statut`, `% Tâches Terminées`.  
   * **Widget "Prochaines Échéances" :** Ajoutez un élément `Timeline` ou `List` basé sur la table `[T5] Tâches`.  
     * **Filtre 1 :** `Where "Projet" (via le lien) -> "Client" -> "Contact Principal (Portail)" is the current user`.  
     * **Filtre 2 :** `AND "Statut" is not "Terminée"`.  
     * **Champs visibles :** `Nom de la Tâche`, `Date d'Échéance`. Ne montrez pas le `Responsable` interne si vous ne le souhaitez pas.  
   * **Widget "Vos Factures" :** Ajoutez un élément `Grid` basé sur la table `[T7] Factures`.  
     * **Filtre :** `Where "Client" (via le lien) -> "Contact Principal (Portail)" is the current user`.  
     * **Champs visibles :** `Numéro de Facture`, `Montant TTC`, `Date d'Émission`, `Statut`.

   

5. **Partager l'Interface.**  
     
   * Cliquez sur le bouton "Share" en haut à droite de l'interface et partagez-la spécifiquement avec votre client (son email de collaborateur).

**Bénéfice :** Vous offrez une expérience premium et professionnelle. Le client se sent impliqué, a une visibilité claire sur l'avancement et peut consulter ses factures à tout moment, ce qui renforce la confiance et l'efficacité.

## 13\. Intégrations Clés avec des Outils Externes

Votre cockpit doit être le centre de contrôle, pas une île isolée. Connectez-le à vos autres outils pour un flux de travail sans friction.

* **Intégration 1 : Synchronisation du Calendrier**  
    
  * **Objectif :** Afficher les échéances des tâches Airtable dans votre Google Calendar ou Outlook.  
  * **Comment :** Créez une vue `Calendar` dans la table `[T5] Tâches` (par ex. "Calendrier des Échéances"). Cliquez sur "Share view" et générez une URL de souscription au calendrier ("iCal subscription link"). Ajoutez cette URL à votre application de calendrier.  
  * **Bénéfice :** Les deadlines sont visibles là où vous gérez votre journée, réduisant le risque d'oubli.


* **Intégration 2 : Comptabilité via Make/Zapier**  
    
  * **Objectif :** Créer automatiquement une facture dans votre logiciel de comptabilité (ex: QuickBooks, Pennylane) quand une facture est marquée comme "Envoyée" dans Airtable.  
  * **Comment (avec Make.com) :**  
    1. **Déclencheur :** "Watch Records" dans Airtable `[T7] Factures` (avec une formule `LAST_MODIFIED_TIME` pour le déclenchement).  
    2. **Filtre :** Continuer seulement si `Statut` est "Envoyée".  
    3. **Action :** "Create an Invoice" dans QuickBooks, en mappant les champs `Client`, `Montant HT`, `Date d'Émission`, etc.  
  * **Bénéfice :** Élimine la double saisie, réduit les erreurs et assure que votre comptabilité est toujours synchronisée avec vos opérations.


* **Intégration 3 : Génération de Documents avec DocsAutomator/DocuMint**  
    
  * **Objectif :** Générer un Devis ou un Contrat PDF en un clic depuis une `Opportunité`.  
  * **Comment :**  
    1. Créez un modèle de document dans Google Docs avec des variables (ex: `{{nom_client}}`, `{{montant_devis}}`).  
    2. Dans la table `[T3] Opportunités`, ajoutez un champ `Générer Devis` de type `Bouton`.  
    3. Configurez le bouton pour déclencher un webhook fourni par l'outil (DocsAutomator, etc.).  
    4. L'outil récupère les données de l'enregistrement Airtable, les insère dans le modèle, génère le PDF et peut le rattacher à l'enregistrement Airtable.  
  * **Bénéfice :** Professionnalisme et gain de temps spectaculaire sur les tâches administratives commerciales.

Ce cockpit est désormais un système nerveux central pour votre agence, de la prospection à la facturation, en passant par la gestion des ressources et la relation client. Il est prêt à évoluer avec votre croissance.

## 14\. Gestion de la Capacité et Planification des Ressources

À mesure que l'agence grandit, la question n'est plus "que faire ?" mais "qui peut le faire et quand ?". Cette section vous permet de visualiser la charge de travail de votre équipe pour une allocation intelligente des projets.

### **Nouvelle Table : `[T10] Équipe`**

Cette table remplace l'utilisation simple du champ `Collaborateur` et devient la source de vérité pour votre équipe.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Nom du Membre** | `Texte ligne simple` | Le nom complet de la personne. |
| **Rôle** | `Statut` | Ex: Développeur IA, Chef de Projet, Consultant. |
| **Email** | `Email` | Email de la personne. |
| **Collaborateur Airtable** | `Collaborateur` | Le compte Airtable associé à cette personne. |
| **Capacité Hebdo (h)** | `Nombre` | Le nombre d'heures de travail productif disponibles par semaine (ex: 35). |
| **Tâches Assignées** `*` | `Lien vers [T5] Tâches` | Lie toutes les tâches assignées à ce membre. |
| **Charge Prévue (Semaine)** | `Rollup` | **Configuration :** 1\. "Regarde" le champ \`Tâches Assignées\`. 2\. Récupère le champ \`Temps Estimé (h)\`. 3\. \*\*Condition :\*\* \`Where "Date d'Échéance" is "this week" AND "Statut" is not "Terminée"\`. 4\. Calcule la somme (\`sum\`). |
| **% Capacité Atteinte** | `Formule` | Formule : `IF({Capacité Hebdo (h)} > 0, {Charge Prévue (Semaine)} / {Capacité Hebdo (h)}, 0)`. Formatez en `Pourcentage` et ajoutez une coloration conditionnelle (vert \-\> orange \-\> rouge). |

### **Mise à jour de la table `[T5] Tâches`**

Remplacez le champ `Responsable` par un lien vers la nouvelle table.

| Nom du Champ (à modifier) | Type de Champ | Description |
| :---- | :---- | :---- |
| **Responsable** | `Lien vers [T10] Équipe` | Lie la tâche à un membre de l'équipe. |

**Bénéfice :** Vous obtenez une vue claire, en temps réel, de la charge de travail de chacun pour la semaine à venir. Avant d'assigner un nouveau projet, vous pouvez instantanément voir qui a de la bande passante, évitant ainsi le surmenage et les retards. Un dashboard "Planification des Ressources" peut afficher chaque membre de l'équipe avec sa jauge de `% Capacité Atteinte`.

## 15\. Base de Connaissances et Capitalisation (Wiki Interne)

Chaque projet est une source d'apprentissage. Ne laissez pas ce savoir s'évaporer. Capitalisez dessus pour accélérer les futurs projets.

### **Nouvelle Table : `[T11] Connaissances`**

Votre wiki interne pour les processus, les solutions techniques et les meilleures pratiques.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Titre de l'Article** | `Texte ligne simple` | Ex: "Procédure de déploiement sur AWS Lambda", "Script de nettoyage de données pour les CRM". |
| **Contenu** | `Texte long` | Activez le "rich text formatting" pour inclure des titres, listes, et blocs de code. |
| **Catégorie** | `Statut` | Ex: Technique, Processus, Commercial, Juridique. |
| **Mots-clés** | `Options multiples` | Ex: API, Python, Webhook, GPT-4, Devis, Contrat. |
| **Projets Associés** `*` | `Lien vers [T4] Projets` | Lie cet article aux projets où cette connaissance a été appliquée ou développée. |
| **Auteur** | `Lien vers [T10] Équipe` | Qui a rédigé ou est l'expert sur ce sujet. |
| **Date de Création** | `Date de création` |  |

**Bénéfice :** Fini de réinventer la roue. Quand un nouveau projet démarre, vous pouvez consulter les articles de connaissances liés à des projets similaires pour un démarrage rapide. Un nouveau membre de l'équipe peut se former en consultant cette base. C'est un actif stratégique qui grandit avec votre agence.

## 16\. Suivi des Objectifs Stratégiques (OKRs)

Connectez le travail quotidien à la vision globale de l'entreprise. Assurez-vous que chaque projet sert un objectif plus grand.

### **Nouvelles Tables : `[T12] Objectifs` et `[T13] Résultats Clés`**

* **Table `[T12] Objectifs` :**  
    
  * `Objectif` (Texte) : Ex: "Devenir la référence sur les automatisations pour cabinets d'avocats".  
  * `Période` (Statut) : Ex: "Q1 2026".  
  * `Résultats Clés` (`Lien vers [T13] Résultats Clés`).


* **Table `[T13] Résultats Clés` :**  
    
  * `Résultat Clé` (Texte) : Ex: "Signer 5 nouveaux clients dans le secteur juridique".  
  * `Objectif` (`Lien vers [T12] Objectifs`).  
  * `Projets Contributifs` (`Lien vers [T4] Projets`).  
  * `Type de Mesure` (Statut) : Ex: Pourcentage, Valeur Numérique.  
  * `Cible` (Nombre) : Ex: `5`.  
  * `Actuel` (Rollup) : Fait le décompte (`count`) des `Projets Contributifs` liés.  
  * `Progression` (Formule) : `{Actuel} / {Cible}`. Formatez en `Pourcentage`.

### **Mise à jour de la table `[T4] Projets`**

Ajoutez un champ **`Contribue au Résultat Clé`** de type `Lien vers [T13] Résultats Clés`.

**Bénéfice :** Vous passez d'une gestion purement opérationnelle à un pilotage par la performance. Vous pouvez justifier chaque projet par sa contribution à la stratégie de l'entreprise. Le dashboard du CEO peut désormais inclure un suivi de la progression des OKRs, directement alimenté par l'avancement des projets sur le terrain.

## 17\. Amélioration Continue et Maintenance de la Base

Un cockpit performant est un cockpit bien entretenu. Voici les bonnes pratiques pour garantir la longévité et la fiabilité de votre système.

* **1\. Mettre en Place une Routine d'Archivage :**  
    
  * Dans les tables `Projets`, `Tâches`, `Opportunités`, ajoutez un champ `Archivé` de type `Checkbox`.  
  * Créez une automatisation qui, chaque semaine, trouve les enregistrements "Terminés" ou "Perdus" depuis plus de 90 jours et coche automatiquement la case `Archivé`.  
  * Modifiez TOUTES vos vues de travail (`Kanban`, `Grid`, etc.) pour y ajouter un filtre permanent : `Where "Archivé" is not checked`.  
  * **Bénéfice :** Votre base reste rapide et pertinente. Les données ne sont pas supprimées, juste masquées, ce qui garantit des performances optimales au quotidien.


* **2\. Documenter Directement dans Airtable :**  
    
  * Utilisez la fonction "Edit field description" pour chaque champ afin d'expliquer son utilité et son fonctionnement.  
  * Utilisez la "Table description" pour expliquer le rôle de chaque table dans l'écosystème.  
  * **Bénéfice :** La base devient auto-documentée. Toute nouvelle personne rejoignant l'équipe peut comprendre la structure sans aide extérieure.


* **3\. Créer une Vue "Contrôle Qualité des Données" :**  
    
  * Dans chaque table clé, créez une vue de maintenance (ex: "🛠️ DQ Check").  
  * Utilisez des filtres pour trouver les anomalies :  
    * Dans `[T5] Tâches` : `Where "Date d'Échéance" is empty OR "Responsable" is empty`.  
    * Dans `[T4] Projets` : `Where "Client" is empty`.  
    * Dans `[T3] Opportunités` : `Where "Valeur Estimée" is empty`.  
  * **Bénéfice :** Vous pouvez corriger proactivement les erreurs de saisie avant qu'elles ne faussent vos dashboards et vos rapports.

Votre cockpit Airtable est désormais un système mature, capable non seulement de gérer les opérations quotidiennes, mais aussi de soutenir la croissance, de capitaliser sur le savoir et de piloter la stratégie de votre agence. Il est prêt à évoluer avec vos ambitions.

## 18\. Intégration de l'IA dans les Opérations (Le Cockpit Intelligent)

En tant qu'agence IA, votre outil interne doit refléter votre expertise. Utilisez la fonctionnalité "Airtable AI" pour automatiser les tâches cognitives et non plus seulement les tâches répétitives.

* **Action 1 : Qualification Automatique des Leads**  
    
  * **Contexte :** Un formulaire de contact sur votre site web alimente la table `[T3] Opportunités` avec des messages de prospects.  
  * **Mise en place :**  
    1. Ajoutez un champ `Score de Priorité IA` (Statut) et `Résumé IA` (Texte long) dans la table `[T3] Opportunités`.  
    2. Créez une automatisation qui se déclenche à la création d'une nouvelle opportunité.  
    3. **Action :** `Use AI to fill a field`.  
    4. **Prompt :** "Analyse le message du prospect suivant : `{Message du Prospect}`. Évalue son adéquation avec nos services (automatisation IA pour entreprises). Si le besoin est clair, le budget semble élevé et l'urgence est présente, qualifie-le de 'Haute'. S'il est vague ou semble peu qualifié, qualifie-le de 'Basse'. Sinon, qualifie-le de 'Moyenne'." Faites passer le résultat dans le champ `Score de Priorité IA`.  
    5. Ajoutez une seconde action AI : "Génère un résumé en 3 points du besoin client exprimé dans `{Message du Prospect}`." Faites passer le résultat dans le champ `Résumé IA`.  
  * **Bénéfice :** Votre équipe commerciale reçoit des leads déjà triés et résumés, leur permettant de se concentrer immédiatement sur les opportunités les plus prometteuses.


* **Action 2 : Génération de Plans d'Action par l'IA**  
    
  * **Contexte :** Lorsqu'un projet est créé, il faut esquisser les premières grandes tâches.  
  * **Mise en place :**  
    1. Dans la table `[T4] Projets`, ajoutez un champ `Brief Projet Détaillé` (Texte long) et un champ `Générer Plan d'Action` (Bouton).  
    2. Configurez le bouton pour lancer une automatisation.  
    3. **Action :** `Use AI to create records`.  
    4. **Table de destination :** `[T5] Tâches`.  
    5. **Prompt :** "En te basant sur le brief de projet suivant : `{Brief Projet Détaillé}`, génère une liste de 5 à 7 tâches principales pour le mener à bien. Formate ta réponse comme une liste, où chaque item est le nom d'une tâche."  
    6. L'automatisation créera automatiquement les tâches suggérées, liées au bon projet.  
  * **Bénéfice :** Accélère radicalement la phase de planification de projet. Le chef de projet n'a plus qu'à affiner, assigner et dater les tâches générées par l'IA.

## 19\. Productisation des Offres et Devis Rapide

Standardisez vos services pour créer des devis complexes en quelques clics, garantissant cohérence et rapidité.

### **Nouvelles Tables : `[T14] Catalogue de Services` & `[T15] Lignes de Devis`**

* **Table `[T14] Catalogue de Services` :**  
    
  * `Nom du Service` (Texte) : Ex: "Audit d'Automatisation", "Développement de Chatbot Personnalisé \- Tier 1".  
  * `Description` (Texte long).  
  * `Prix Unitaire HT` (Devise).  
  * `Unité` (Statut) : Ex: Forfait, Heure, Jour.


* **Table `[T15] Lignes de Devis` (Table de jonction) :**  
    
  * `Service` (`Lien vers [T14] Catalogue de Services`).  
  * `Opportunité` (`Lien vers [T3] Opportunités`).  
  * `Quantité` (Nombre), avec une valeur par défaut de `1`.  
  * `Prix Unitaire` (`Lookup` qui récupère le prix du service lié).  
  * `Total Ligne HT` (`Formule`) : `{Quantité} * {Prix Unitaire}`.

### **Mise à jour de la table `[T3] Opportunités`**

* Remplacez le champ `Valeur Estimée` (Devise) par un `Rollup`.  
  * "Regarde" le champ `Lignes de Devis`.  
  * Récupère le champ `Total Ligne HT`.  
  * Calcule la somme (`sum`).

**Bénéfice :** Pour créer un devis, vous n'avez plus à taper un montant. Vous allez dans l'enregistrement de l'opportunité, et dans le champ `Lignes de Devis`, vous cliquez sur "+" pour ajouter les services de votre catalogue. Le montant total se calcule automatiquement, sans erreur. C'est un changement radical pour l'efficacité commerciale.

## 20\. Gouvernance et Sécurité des Données à l'Échelle

À mesure que l'équipe s'agrandit, il devient vital de contrôler qui peut voir et modifier quoi.

* **1\. Définir des Rôles et des Permissions :**  
    
  * (Nécessite un plan Airtable payant) Utilisez la fonctionnalité "User groups" pour créer des groupes comme "Ventes", "Production", "Finance".  
  * Dans les paramètres de chaque table, au lieu de donner des permissions à des individus, donnez-les à des groupes.  
  * **Exemple de configuration :**  
    * Le groupe "Ventes" peut créer/modifier des `Opportunités` mais ne peut que lire les `Tâches`.  
    * Le groupe "Production" peut créer/modifier `Projets` et `Tâches` mais ne peut pas voir les champs financiers comme `Marge Brute`.  
    * Le groupe "Finance" a un accès complet aux `Factures` et aux champs de rentabilité, mais ne peut que lire les `Tâches`.  
  * **Bénéfice :** Réduit le risque d'erreurs, protège les informations sensibles et simplifie l'interface pour chaque utilisateur qui ne voit que ce qui est pertinent pour son rôle.


* **2\. Utiliser des Vues Personnelles Verrouillées :**  
    
  * Encouragez chaque membre de l'équipe à créer ses propres vues personnelles ("Personal views") pour organiser son travail.  
  * En tant qu'administrateur, créez des vues de référence (ex: "Tous les Projets Actifs") et "verrouillez-les" ("Lock view"). Cela empêche les modifications accidentelles des filtres et des champs qui pourraient impacter les autres utilisateurs ou les dashboards.  
  * **Bénéfice :** Maintient l'ordre et la cohérence de la base tout en offrant de la flexibilité à chaque utilisateur.

## 21\. Le Cycle de Vie Complet : Du Marketing au Succès Client

Intégrons les dernières étapes pour une vision à 360 degrés.

* **1\. Suivi Post-Projet et Satisfaction Client :**  
    
  * **Nouvelle Table `[T16] Feedback Client` :**  
    * `Projet` (`Lien vers [T4] Projets`).  
    * `Note de Satisfaction` (Notation par étoiles).  
    * `Témoignage` (Texte long).  
    * `Peut être utilisé pour le marketing ?` (Checkbox).  
  * **Automatisation :** Quand le `Statut` d'un `Projet` passe à "Terminé" depuis 7 jours, envoyer automatiquement un email au client avec un lien vers un formulaire Airtable pour remplir le feedback.  
  * **Bénéfice :** Vous collectez de manière systématique des données précieuses pour améliorer vos services et du contenu marketing (témoignages) pour attirer de nouveaux clients.


* **2\. Vue "Board Stratégique" sur le Dashboard Principal :**  
    
  * Créez une dernière section sur votre "Dashboard Principal".  
  * Ajoutez un élément `Grid` basé sur la table `[T12] Objectifs`.  
  * Ajoutez à côté un élément `Grid` basé sur la table `[T13] Résultats Clés`, affichant `Résultat Clé`, `Progression`, et `Actuel` / `Cible`.  
  * **Bénéfice :** Chaque personne qui se connecte au cockpit voit non seulement ses tâches opérationnelles, mais aussi la manière dont son travail contribue directement aux objectifs stratégiques de l'entreprise, donnant un sens et un alignement à toute l'équipe.

Votre cockpit Airtable est désormais achevé. Il est passé d'une simple base de données à un système d'exploitation d'entreprise intelligent, évolutif et aligné sur votre stratégie. Il est prêt à accompagner votre agence de ses premiers clients à son statut de leader sur le marché.

## 22\. Gestion de l'Écosystème Externe : Partenaires et Freelances

Votre agence ne fonctionne pas en vase clos. La gestion des sous-traitants, freelances et partenaires est critique. Intégrons-les proprement dans votre cockpit.

### **Nouvelle Table : `[T17] Partenaires & Freelances`**

Un répertoire central pour tous vos collaborateurs externes.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Nom (Personne ou Entreprise)** | `Texte ligne simple` | Le nom du freelance ou de l'agence partenaire. |
| **Type** | `Statut` | Ex: Freelance, Agence, Apporteur d'affaires. |
| **Spécialisation** | `Options multiples` | Ex: Développement Python, UX/UI Design, Rédaction Technique, Ventes. |
| **Contact Principal** | `Lien vers [T2] Contacts` | Permet de lier une personne physique si elle est déjà dans votre CRM. |
| **Statut de la Relation** | `Statut` | Ex: En évaluation, Approuvé, Actif, Inactif. |
| **Projets Assignés** `*` | `Lien vers [T4] Projets` | Lie tous les projets sur lesquels ce partenaire a travaillé. |
| **Performance Moyenne** | `Rollup` | "Regarde" à travers `Projets Assignés`, récupère une note de performance (un nouveau champ `Note Partenaire` à créer dans `[T4] Projets`) et en calcule la moyenne. |

### **Mise à jour de la table `[T4] Projets`**

Ajoutez un champ **`Équipes Externes`** de type `Lien vers [T17] Partenaires & Freelances`.

**Bénéfice :** Vous pouvez désormais staffer vos projets en incluant des externes, suivre leur performance au fil du temps et rapidement identifier le meilleur partenaire pour un nouveau besoin. Votre capacité de production n'est plus limitée à votre équipe interne, et vous pilotez cette capacité étendue depuis un seul endroit.

## 23\. Reporting Avancé et Business Intelligence

Les dashboards Airtable sont parfaits pour le suivi opérationnel. Pour l'analyse stratégique profonde, il faut parfois aller plus loin.

* **1\. Créer des Vues "Prêtes à l'Export" :**  
    
  * Dans vos tables principales (`Projets`, `Factures`, `Journal de Temps`), créez des vues `Grid` dédiées au reporting. Nommez-les avec un préfixe, ex: `[EXPORT] Rentabilité Projets Q4 2025`.  
  * Ces vues ne contiennent que les champs nécessaires, dans le bon ordre, et avec les bons filtres.  
  * **Action :** Quand votre expert-comptable ou un conseil d'administration vous demande des données, vous n'avez qu'à télécharger le CSV de cette vue en un clic.  
  * **Bénéfice :** Des rapports fiables et standardisés, produits en quelques secondes.


* **2\. Connecter Airtable à un Outil de BI (Looker Studio, Power BI, Tableau) :**  
    
  * **Concept :** Utilisez Airtable comme une base de données transactionnelle (OLTP) propre et structurée, et un outil de BI comme une plateforme d'analyse (OLAP).  
  * **Comment :** Des services tiers (comme Sync Inc ou via des connecteurs directs) vous permettent de synchroniser vos données Airtable vers une base de données optimisée pour l'analyse. Vous connectez ensuite votre outil de BI à cette source.  
  * **Bénéfice :** Vous pouvez créer des visualisations de données beaucoup plus complexes, croiser les données de votre cockpit avec d'autres sources (ex: Google Analytics, données financières), et effectuer des analyses de tendance sur plusieurs années sans jamais ralentir votre base Airtable opérationnelle.

## 24\. Culture de la Donnée : Onboarding et Adoption

Le meilleur outil du monde est inutile si l'équipe ne l'adopte pas. L'adoption n'est pas un accident, elle se planifie.

* **1\. Créer le "Guide d'Utilisation" dans Airtable :**  
    
  * Créez une nouvelle **Interface** nommée "Centre d'Aide & Onboarding".  
  * Utilisez des éléments `Text` pour rédiger les "10 Commandements" de votre base (ex: "1. Aucune tâche ne doit exister sans projet.", "2. Le statut d'une opportunité doit être mis à jour après chaque contact client.").  
  * Intégrez des GIFs ou de courtes vidéos (avec Loom par exemple) montrant les manipulations clés : comment créer un projet, comment logger du temps, etc.  
  * **Bénéfice :** La documentation vit au même endroit que l'outil. L'onboarding d'un nouveau collaborateur est simplifié : "Bienvenue, voici le lien vers le cockpit. Commence par l'interface 'Centre d'Aide'".


* **2\. Le Rituel de la "Revue de Données" :**  
    
  * Instaurez un point hebdomadaire de 15 minutes où l'équipe se réunit devant le "Dashboard Principal".  
  * Le but n'est pas de fliquer, mais de célébrer les succès (projets terminés, KPIs dans le vert) et d'identifier collectivement les points de blocage (tâches en retard, projets à risque).  
  * **Bénéfice :** Cela crée une boucle de feedback positive. L'équipe voit que les données qu'elle saisit sont réellement utilisées pour piloter l'agence. La qualité des données s'améliore naturellement car tout le monde comprend leur importance.

## 25\. Le Cockpit en tant que Produit : Le Changelog

Traitez votre base Airtable comme un produit interne. Gérez ses évolutions de manière professionnelle.

### **Nouvelle Table : `[T18] Changelog du Cockpit`**

Un historique de toutes les modifications apportées à la structure de la base.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Version / Nom du Changement** | `Texte ligne simple` | Ex: "v2.1 \- Ajout de la gestion des partenaires". |
| **Date de Déploiement** | `Date` |  |
| **Auteur de la Modif** | `Collaborateur` | Qui a effectué la modification. |
| **Description Détaillée** | `Texte long` | Quelle a été la modification ? Quelles tables, champs, automations ont été ajoutés/modifiés ? |
| **Raison du Changement** | `Texte long` | Pourquoi cette modification était-elle nécessaire ? Quel problème résout-elle ? |
| **Impact** | `Statut` | Ex: Mineur (ajout d'une vue), Majeur (nouvelle table), Critique (modification d'une formule clé). |

**Bénéfice :** Vous disposez d'un historique complet de l'évolution de votre outil. Si une automatisation se casse, vous pouvez voir ce qui a été modifié récemment. Vous pouvez communiquer clairement les nouvelles fonctionnalités à l'équipe. Cela professionnalise la gestion de votre outil le plus stratégique.

---

### **Conclusion : Le Jumeau Numérique de votre Agence**

Ce que vous avez construit n'est plus une simple base de données ou un ensemble de dashboards. C'est le **jumeau numérique (Digital Twin)** de votre agence.

Chaque client, chaque projet, chaque heure passée, chaque euro facturé est représenté dans un modèle dynamique et interconnecté. Ce système vous permet non seulement de **voir** ce qui se passe en temps réel, mais aussi de **simuler** l'impact de vos décisions, d'**anticiper** les besoins en ressources, et d'**automatiser** l'intelligence collective de votre équipe.

Votre cockpit est désormais la plateforme centrale qui vous permettra de scaler votre agence de manière sereine, rentable et data-driven. Il est prêt à encaisser la croissance, à s'adapter aux changements de votre marché et à devenir votre avantage concurrentiel le plus durable.

## 26\. Modélisation de Scénarios et Prévisions Commerciales

Votre cockpit connaît votre passé et votre présent. Utilisons-le pour modéliser activement l'avenir et prendre des décisions proactives plutôt que réactives.

### **Nouvelle Table : `[T19] Scénarios Prévisionnels`**

Une table simple pour définir différentes hypothèses de marché.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Nom du Scénario** | `Texte ligne simple` | Ex: "Prévision Réaliste Q1", "Scénario Optimiste (Lancement Offre X)", "Scénario Prudent". |
| **Multiplicateur de Pipeline** | `Pourcentage` | Un modificateur à appliquer à la probabilité des affaires. Ex: 120% pour optimiste, 75% pour prudent. |
| **Description** | `Texte long` | Hypothèses de ce scénario (ex: "Basé sur un taux de conversion en hausse de 20% grâce à la nouvelle campagne marketing"). |

### **Mise à jour de la table `[T3] Opportunités`**

Ajoutez un champ de formule pour calculer une valeur pondérée dynamique.

| Nom du Champ (à ajouter) | Type de Champ | Description |
| :---- | :---- | :---- |
| **Scénario Actif** | `Lien vers [T19] Scénarios Prévisionnels` | Un champ à enregistrement unique. Vous ne liez ici qu'UN seul scénario à la fois pour l'ensemble de vos vues. *Astuce : Liez le même enregistrement "Scénario" à toutes vos opportunités actives via une automatisation.* |
| **Multiplicateur Actif** | `Lookup` | Récupère le `Multiplicateur de Pipeline` du `Scénario Actif` lié. |
| **Valeur Prévisionnelle** | `Formule` | Formule : `{Valeur Pondérée} * {Multiplicateur Actif}`. |

**Bénéfice :** Dans votre "Dashboard Stratégique", vous pouvez maintenant créer un KPI "CA Prévisionnel en Pipeline" basé sur la somme du champ `Valeur Prévisionnelle`. En changeant simplement le scénario lié dans vos opportunités, vous mettez à jour instantanément toutes vos prévisions. Vous pouvez ainsi répondre à des questions comme : "Quel sera l'impact sur notre CA si nous augmentons notre taux de conversion de 20% ?"

## 27\. Personnalisation Extrême avec des Applications et Scripts

Sortez des limites des champs standards pour créer des outils sur mesure qui résolvent VOS problèmes uniques.

* **1\. Créer un "Score de Santé Projet" Automatisé :**  
    
  * **Objectif :** Avoir un indicateur visuel unique (🔴🟠🟢) qui résume la santé d'un projet, au-delà du simple statut.  
  * **Comment (via l'app "Scripting" ou une Automatisation avec du code) :**  
    1. Créez un champ `Score de Santé` dans la table `[T4] Projets`.  
    2. Créez une automatisation qui se déclenche quand un projet est modifié.  
    3. Ajoutez une action "Run a script".  
    4. **Logique du script :**  
       * Récupère `% Budget Temps Consommé`, `Jours de Retard`, et la `Note de Satisfaction` (si disponible).  
       * Attribue des points en fonction de seuils (ex: si retard \> 5 jours, score \-10 points).  
       * Calcule un score final et le traduit en un emoji : \>80 \= "🟢 Sain", 50-80 \= "🟠 À surveiller", \<50 \= "🔴 En danger".  
       * Met à jour le champ `Score de Santé` avec le résultat.  
  * **Bénéfice :** En un coup d'œil sur votre dashboard, vous identifiez les projets qui nécessitent une attention immédiate, même si leur statut est encore "En cours".


* **2\. Utiliser l'Application "Page Designer" pour des Rapports Sur-Mesure :**  
    
  * **Objectif :** Générer des fiches de synthèse de projet d'une page, prêtes à être imprimées ou envoyées en PDF, pour vos réunions.  
  * **Comment :** Installez l'app "Page Designer" depuis le marketplace Airtable. Créez un modèle en glissant-déposant les champs de votre table `Projets`, ajoutez votre logo, des KPIs clés, et même une liste des tâches restantes.  
  * **Bénéfice :** Vous produisez des documents professionnels et standardisés en un clic, directement depuis votre cockpit.

## 28\. Le Système Immunitaire : Alertes et Protocoles d'Urgence

Un bon système ne fait pas que fonctionner ; il se protège et vous alerte avant même que les problèmes ne surviennent.

* **1\. Automatisation "Alerte de Dérive de Marge" :**  
    
  * **Déclencheur :** Quand une entrée est créée dans le `Journal de Temps`.  
  * **Action :** Mettre à jour le projet lié (Airtable le fait via les rollups).  
  * **Action Conditionnelle :** Une seconde automatisation qui surveille les `Projets`. Si le `% Budget Temps Consommé` dépasse 80% ET que le `% Tâches Terminées` est inférieur à 60%, **alors**...  
  * **Action Finale :** Envoyer une notification prioritaire (email avec \[ALERTE\] dans le sujet ou message Slack @channel) au Chef de Projet et au CEO : "ALERTE : Le projet '{Nom du Projet}' consomme son budget temps beaucoup plus vite que prévu. Action requise."  
  * **Bénéfice :** Vous ne découvrez plus la non-rentabilité à la fin du projet, mais vous l'interceptez au moment où elle se produit, vous laissant le temps de corriger le tir.


* **2\. Protocole de "Projet Stagnant" :**  
    
  * **Déclencheur :** "At a scheduled time" (tous les lundis matin).  
  * **Action :** Trouver les `Projets` dont le `Statut` est "En cours" ET la `Date de dernière modification` est antérieure à 14 jours.  
  * **Action Finale :** Créer une `Tâche` dans le projet concerné, assignée au `Chef de Projet`, nommée "ACTION REQUISE : Mettre à jour le statut et le plan d'action de ce projet stagnant", avec une échéance à 24h.  
  * **Bénéfice :** Rien ne passe entre les mailles du filet. Le système force la mise à jour des projets qui pourraient être oubliés, garantissant que vos données sont toujours fraîches et fiables.

## 29\. La Pérennité : Transmission et Évolution

Votre cockpit est un actif majeur de votre entreprise. Sa valeur réside aussi dans sa capacité à vous survivre et à évoluer.

* **1\. Le "Mode Examen" :**  
    
  * Créez une Interface dédiée nommée "Revue Trimestrielle".  
  * Cette interface ne montre que les données agrégées sur le trimestre passé :  
    * KPI : Taux de conversion moyen.  
    * Graphique : CA facturé par mois.  
    * Liste : Top 5 des projets les plus rentables.  
    * Liste : Top 3 des services les plus vendus.  
  * **Bénéfice :** Vous force à prendre du recul. Chaque trimestre, cette vue vous donne une image claire et sans bruit de ce qui a fonctionné et de ce qui doit être amélioré, nourrissant directement votre planification stratégique (les OKRs du trimestre suivant).


* **2\. Le Plan de Succession de la Base :**  
    
  * Dans votre `Changelog du Cockpit` ou votre `Centre d'Aide`, créez une entrée "Propriété & Accès".  
  * Listez au moins deux personnes dans l'entreprise qui ont le statut de "Creator" (propriétaire) de la base.  
  * Documentez où sont stockés les accès aux services connectés (Make/Zapier, outils de BI, etc.).  
  * **Bénéfice :** Vous éliminez le "bus factor". Si le créateur principal de la base est indisponible, l'entreprise continue de fonctionner sans interruption. Votre cockpit est un actif de l'entreprise, pas la propriété d'un individu.

---

### **Conclusion Finale : L'Agence Augmentée**

Vous n'avez pas seulement construit une base de données. Vous avez externalisé la charge mentale de la gestion de votre agence dans un système fiable, intelligent et proactif.

Ce cockpit est désormais votre "Exocortex" : une extension de votre cerveau et de celui de votre équipe. Il se souvient de tout, connecte les points que vous pourriez manquer, automatise la diligence et libère votre ressource la plus précieuse – **la créativité et la réflexion stratégique** – pour vous concentrer sur ce que vous faites de mieux : délivrer une valeur exceptionnelle à vos clients et innover.

Votre agence n'est plus seulement une somme de talents. C'est une **Agence Augmentée**, propulsée par un système qui apprend, s'adapte et grandit avec elle. La machine est construite. Il est temps de piloter.

Entendu. Nous avons transcendé la simple gestion pour atteindre la prédiction et l'optimisation. La dernière frontière n'est plus l'amélioration du système lui-même, mais sa transformation en un levier de croissance exponentielle et en une expression de la culture même de votre entreprise. C'est le stade de "l'Agence comme Plateforme".

## 30\. Le Cockpit comme Produit : Monétiser votre Excellence Opérationnelle

Votre cockpit est si performant qu'il est devenu un actif stratégique. Il est temps de le considérer comme un produit potentiel, ouvrant de nouvelles sources de revenus.

* **1\. Créer un Modèle "Light" pour les Clients :**  
    
  * **Action :** Dupliquez votre base et créez une version "template". Retirez vos données propriétaires, simplifiez les tables les plus complexes (peut-être sans la partie finance ou OKR au début) et gardez le cœur CRM / Gestion de Projet.  
  * **Nouvelle Offre de Service :** Proposez à vos clients (en particulier ceux pour qui vous construisez des systèmes d'automatisation) un "Pack de Démarrage Opérationnel" basé sur ce template Airtable. Vous ne vendez pas seulement une automatisation ; vous vendez une nouvelle façon de travailler, outillée par votre solution.  
  * **Bénéfice :** Vous créez une dépendance positive ("stickiness"). Vos clients utilisent non seulement vos automatisations, mais aussi vos processus. Cela ouvre des opportunités de conseil et de support récurrents et vous positionne comme un partenaire stratégique bien au-delà d'un simple prestataire.


* **2\. Partager votre Expertise avec la Communauté :**  
    
  * **Action :** Publiez votre template anonymisé sur l'**Airtable Universe**. Rédigez un article de blog ou une étude de cas détaillée expliquant la philosophie derrière votre cockpit.  
  * **Bénéfice :** Cela établit votre agence comme un leader d'opinion dans le domaine de l'efficacité opérationnelle pour les entreprises de services. C'est un aimant à talents et à prospects qui sont attirés non seulement par ce que vous faites, mais par *comment* vous le faites.

## 31\. Gamification et Engagement de l'Équipe

Assurez l'adoption et l'excellence en rendant l'utilisation du cockpit non seulement efficace, mais aussi gratifiante.

### **Nouvelle Table : `[T20] Accomplissements`**

Une table pour suivre et célébrer les victoires, petites et grandes.

| Nom du Champ | Type de Champ | Description |
| :---- | :---- | :---- |
| **Nom de l'Accomplissement** | `Texte ligne simple` | Ex: "Premier projet 100% à l'heure", "Closing d'une affaire \> 50k€", "5 Feedbacks Client 5 étoiles". |
| **Membre de l'Équipe** | `Lien vers [T10] Équipe` | La personne (ou les personnes) à féliciter. |
| **Date** | `Date` |  |
| **Badge / Icône** | `Statut` | Utilisez des emojis pour visualiser la réussite (🏆, 🚀, ⭐, 🎯). |

* **Automatisation de la Célébration :**  
  * Créez des automations qui génèrent des enregistrements dans cette table.  
  * **Exemple :** Quand le `Statut` d'une `Opportunité` passe à "Gagnée" ET que sa `Valeur Estimée` est supérieure à 50 000€, créer un enregistrement dans `Accomplissements` et envoyer un message de félicitations sur le canal Slack général.  
* **Dashboard "Hall of Fame" :**  
  * Créez une Interface ou une section de dashboard qui affiche les accomplissements récents sous forme de galerie.  
  * **Bénéfice :** Vous renforcez la culture de la reconnaissance. L'équipe est motivée non seulement par les objectifs, mais aussi par la célébration des étapes franchies, ce qui augmente l'engagement et la satisfaction au travail.

## 32\. L'Approche API-First : Votre Agence comme une Plateforme

Pensez à votre cockpit non plus comme une application finale, mais comme le "backend" de votre entreprise. Chaque donnée doit être accessible via une API pour permettre des innovations futures.

* **1\. Documenter votre API Interne :**  
    
  * Même si l'API d'Airtable est standard, créez un document simple (dans votre table `[T11] Connaissances`) qui décrit VOS tables clés, leurs champs importants et les règles de gestion associées. "Pour créer un projet, ces 3 champs sont obligatoires", "La modification du statut d'une facture déclenche telle action", etc.  
  * **Bénéfice :** Lorsque vous voudrez construire une application mobile personnalisée ou un nouveau portail client plus complexe, le travail de spécification sera déjà fait. Vous pourrez brancher de nouveaux services sur votre "backend" Airtable avec une clarté et une rapidité décuplées.


* **2\. Offrir des "Endpoints de Données" aux Clients Stratégiques :**  
    
  * Pour vos plus grands clients, vous pouvez utiliser l'API d'Airtable pour leur fournir un accès en lecture seule à des vues spécifiques de leurs données de projet. Ils peuvent ainsi intégrer l'avancement de vos projets directement dans leurs propres dashboards (Power BI, etc.).  
  * **Bénéfice :** Vous vous intégrez au plus profond des systèmes d'information de vos clients. Votre agence n'est plus un fournisseur externe, mais une extension transparente de leurs propres opérations.

## 33\. Le Système Conscient : Audit et Réflexion

Le cockpit ultime n'est pas seulement prédictif, il est introspectif. Il s'analyse lui-même pour s'améliorer.

* **1\. Créer un "Health Check" Automatisé de la Base :**  
    
  * Configurez une automatisation hebdomadaire qui calcule des métriques sur la santé de la base elle-même :  
    * Nombre de tâches sans responsable.  
    * Nombre de projets "En cours" sans activité depuis 30 jours.  
    * Taux d'échec des automations de la semaine passée (via le "run history").  
  * Elle envoie ensuite un résumé au propriétaire de la base.  
  * **Bénéfice :** Le système se surveille lui-même et vous alerte sur sa propre dégradation potentielle, vous permettant de maintenir une hygiène de données impeccable sans effort constant.


* **2\. Le "Miroir Stratégique" :**  
    
  * Créez une dernière Interface, la plus simple et la plus puissante, nommée "Miroir".  
  * Elle ne contient que 3 chiffres, calculés sur les 90 derniers jours :  
    1. **Temps passé sur des projets facturables** (Rollup du `Journal de Temps` sur des projets avec un budget).  
    2. **Temps passé sur des tâches commerciales** (Rollup du temps lié à des `Opportunités`).  
    3. **Temps passé sur des tâches internes/admin** (le reste).  
  * **Bénéfice :** Ce miroir brutal et honnête vous montre la répartition réelle de l'effort de votre ressource la plus précieuse : le temps de votre équipe. C'est l'indicateur ultime pour guider vos décisions sur l'optimisation des processus, le recrutement et la stratégie commerciale.

---

### **Conclusion Finale et Ultime : L'Intention Cristallisée**

Ce cockpit est allé bien au-delà d'un outil de gestion. Il est devenu la **cristallisation de votre intention en tant qu'entreprise**.

Chaque table, chaque champ, chaque automatisation est le reflet d'une décision consciente sur la manière dont votre agence doit fonctionner, interagir, apprendre et grandir. Il incarne votre culture de la transparence, de l'efficacité et de l'amélioration continue.

Vous n'avez pas seulement construit une base Airtable. Vous avez conçu et implémenté le système d'exploitation de votre ambition. Il ne vous reste plus qu'à exécuter.

Parfait. Nous avons atteint le pinacle de la structure et de l'intelligence. La toute dernière étape est philosophique et pratique à la fois. Elle concerne la pérennité du système face à l'entropie, l'évolution du marché et la croissance humaine. C'est l'étape du "Cockpit Organique", un système qui non seulement fonctionne, mais vit, respire et évolue de manière autonome.

## 34\. Le "Conseil des Sages" : Gouvernance Participative

Votre cockpit est trop critique pour dépendre d'une seule personne. Mettez en place une gouvernance légère pour gérer son évolution et assurer son alignement continu avec les besoins de l'entreprise.

* **1\. Instaurer le "Cockpit Council" :**  
    
  * **Action :** Désignez un petit groupe (3 personnes maximum) représentant les pôles clés de l'agence (ex: un membre de l'équipe de production, un commercial, un manager). Ce conseil se réunit une fois par mois pendant 30 minutes.  
  * **Mission :**  
    * Examiner les demandes de modification de la base.  
    * Prioriser les évolutions (basé sur le `Changelog` et les nouvelles idées).  
    * Valider les changements majeurs avant leur déploiement.  
  * **Bénéfice :** Vous démocratisez l'évolution de l'outil. Les décisions sont plus robustes car elles tiennent compte de multiples points de vue. L'adoption est renforcée car l'équipe se sent co-propriétaire du système.


* **2\. Mettre en Place une "Boîte à Idées" Structurée :**  
    
  * **Nouvelle Table `[T21] Demandes d'Évolution` :**  
    * `Titre de la Demande` (Texte) : Ex: "Créer un statut 'En Attente Client' pour les tâches".  
    * `Demandeur` (Collaborateur).  
    * `Description du Problème` (Texte long) : "Quel problème cela résout-il ?".  
    * `Suggestion de Solution` (Texte long).  
    * `Priorité` (Statut) : Basse, Moyenne, Haute.  
    * `Statut de la Demande` (Statut) : Soumise, En revue, Approuvée, Rejetée, Déployée.  
  * **Action :** Créez un formulaire Airtable pour cette table et partagez-le avec toute l'équipe. C'est le seul canal officiel pour demander une modification.  
  * **Bénéfice :** Vous canalisez le feedback de manière constructive. Les idées ne sont pas perdues dans des conversations Slack. Le "Cockpit Council" a une base de travail claire et transparente pour ses réunions.

## 35\. L'Antifragilité : Préparer le Cockpit à l'Inattendu

Un système robuste résiste aux chocs. Un système antifragile se renforce grâce à eux.

* **1\. Simuler des "Pannes" (Chaos Engineering) :**  
    
  * **Action :** Une fois par trimestre, réalisez un exercice contrôlé. Désactivez temporairement une automatisation clé (ex: la conversion d'opportunité en projet). Demandez à l'équipe de gérer le processus manuellement.  
  * **Objectif :**  
    * Vérifier que les processus manuels de secours sont connus de tous.  
    * Identifier les points de défaillance uniques ("single points of failure").  
    * Renforcer la compréhension de l'équipe sur le fonctionnement du système.  
  * **Bénéfice :** Quand une véritable panne surviendra (et elle surviendra), l'équipe ne paniquera pas. Elle aura déjà la mémoire musculaire pour gérer la situation. Vous découvrirez des faiblesses dans un environnement contrôlé, et non en pleine crise.


* **2\. Le "Backup de Connaissances" :**  
    
  * **Action :** Mettez en place une automatisation mensuelle qui exporte les vues critiques de vos tables les plus importantes (`Clients`, `Projets`, `Factures`) en CSV et les sauvegarde sur un espace de stockage cloud sécurisé (Google Drive, Dropbox).  
  * **Bénéfice :** Au-delà des sauvegardes natives d'Airtable, cela vous donne une copie des données dans un format universel, complètement indépendant de la plateforme. C'est une assurance-vie ultime pour vos données, vous protégeant contre des scénarios extrêmes et improbables.

## 36\. Le Cockpit comme Mentor : Guider les Comportements

Le système ne doit pas seulement refléter les processus, il doit activement enseigner et encourager les meilleures pratiques.

* **1\. Utiliser les Descriptions de Champs comme des "Tooltips" Pédagogiques :**  
    
  * **Action :** Revoyez les descriptions de vos champs les plus importants. Au lieu de simplement décrire ce qu'est le champ, décrivez le comportement attendu.  
  * **Exemple sur le champ `Statut` d'une `Tâche` :** "Ne passez à 'Terminée' que lorsque le travail est 100% achevé ET validé. Si vous attendez une réponse, utilisez 'En attente de validation'."  
  * **Bénéfice :** Chaque interaction avec l'interface renforce la culture et les standards de qualité de l'agence. Le cockpit devient un outil de formation continue et passive.


* **2\. Créer des "Vues de Coaching" :**  
    
  * **Action :** Créez des vues personnelles pour les managers, non pas pour surveiller, mais pour coacher.  
  * **Exemple de vue "Coaching Commercial" :** Une vue `Grid` sur les `Opportunités` filtrées sur `"Statut" is "Négociation" AND "Date de dernière modification" is before "7 days ago"`.  
  * **Objectif :** Le manager peut utiliser cette vue pour engager une conversation constructive : "Hey, j'ai vu que l'affaire X n'a pas bougé depuis une semaine. Y a-t-il un point de blocage sur lequel je peux t'aider ?".  
  * **Bénéfice :** Le cockpit devient un facilitateur de conversations de management, basées sur des données objectives et non sur des impressions. Il aide les managers à mieux accompagner leurs équipes.

## 37\. La Dernière Frontière : La Simplicité

Après avoir construit ce système d'une complexité et d'une puissance extrêmes, l'ultime étape est de le rendre invisible.

* **1\. Le Principe de la "Vue Unique" :**  
    
  * **Action :** Formez chaque membre de l'équipe à identifier et à mettre en favori LA vue unique dont il a besoin pour 80% de son travail quotidien. Pour un développeur, c'est "Mes Tâches de la Semaine". Pour un commercial, c'est "Pipeline Commercial (Kanban)".  
  * **Bénéfice :** Réduit la charge cognitive. Personne n'a besoin de comprendre toute la complexité de la base. Chacun a son propre cockpit, parfaitement adapté à son rôle, qui semble simple et évident.


* **2\. La "Déclaration de Fin" :**  
    
  * **Action :** Dans votre `Changelog du Cockpit`, créez une entrée finale : "v.Final \- Atteinte de la complétude fonctionnelle".  
  * **Objectif :** Déclarer officiellement que le système est "terminé". Désormais, toute modification doit être justifiée par un changement stratégique majeur de l'entreprise, et non par une simple "bonne idée".  
  * **Bénéfice :** Vous mettez fin au "feature creep" (l'inflation des fonctionnalités). Vous protégez le système de la complexité inutile. Vous passez d'un mode "construction" à un mode "opération et maintenance vigilante". Vous ancrez l'idée que l'outil est désormais un socle stable sur lequel l'entreprise peut construire, et non un projet en perpétuel changement.

---

### **Conclusion Finale, Finale : L'Outil Oublié**

Le signe ultime de la réussite de votre cockpit est le moment où votre équipe oublie qu'il existe.

Il devient si intégré au flux de travail, si intuitif et si fiable qu'il disparaît de la conscience active. Il devient comme la respiration : essentiel, automatique, soutenant chaque action sans qu'on ait besoin d'y penser.

À ce stade, vous n'avez plus un "cockpit". Vous avez simplement "votre façon de travailler". Et c'est là que réside le véritable avantage concurrentiel : une excellence opérationnelle si profondément ancrée dans votre culture et vos systèmes qu'elle devient une seconde nature. Vous avez atteint la maîtrise.

