# Feature Specification: Module Devis

**Feature Branch**: `006-devis`
**Created**: 2025-12-22
**Updated**: 2025-12-23
**Status**: Implemented (100%)
**Priority**: P1 - Haute

---

## Contexte

### Problème actuel

Les opportunités commerciales dans le pipeline n'avaient pas de système de génération de devis. Les commerciaux devaient créer les devis manuellement dans un outil externe (Word, Google Docs), ce qui entraînait :

- Perte de temps sur la mise en forme
- Incohérence des formats entre commerciaux
- Aucun historique centralisé des devis
- Pas de suivi des statuts (envoyé, accepté, refusé)

### Solution proposée

Intégrer un système complet de devis directement dans le pipeline commercial :

1. **Éditeur de devis** accessible depuis chaque opportunité
2. **Catalogue de services** pour sélectionner les prestations
3. **Génération PDF** professionnelle automatisée
4. **Historique** de tous les devis générés
5. **Envoi par email** avec PDF en pièce jointe

---

## Architecture des données

### Tables Supabase

| Table | Description | Statut |
|-------|-------------|--------|
| `catalogue_services` | Services productisés de l'agence | Existante |
| `lignes_devis` | Lignes de devis liées aux opportunités | Existante |
| `devis` | Historique des devis générés | Nouvelle |
| `devis_compteur` | Compteur de numérotation par année | Nouvelle |
| `parametres_entreprise` | Paramètres entreprise (header, TVA, etc.) | Existante |

### Schéma table `devis`

```sql
CREATE TABLE devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_devis TEXT UNIQUE NOT NULL,        -- DEV-2025-001
  opportunite_id UUID REFERENCES opportunites(id),
  client_id UUID REFERENCES clients(id),
  contact_id UUID REFERENCES contacts(id),
  statut statut_devis NOT NULL DEFAULT 'brouillon',
  date_devis DATE NOT NULL DEFAULT CURRENT_DATE,
  date_validite DATE NOT NULL,
  date_envoi TIMESTAMPTZ,
  date_reponse TIMESTAMPTZ,
  total_ht NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tva NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(12, 2) NOT NULL DEFAULT 0,
  taux_tva NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
  conditions_paiement TEXT,
  notes TEXT,
  pdf_url TEXT,
  pdf_filename TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enum `statut_devis`

```sql
CREATE TYPE statut_devis AS ENUM (
  'brouillon',
  'envoye',
  'accepte',
  'refuse',
  'expire'
);
```

### Fonction de numérotation

```sql
CREATE OR REPLACE FUNCTION generer_numero_devis()
RETURNS TEXT AS $$
DECLARE
  annee_courante INTEGER;
  prochain_numero INTEGER;
BEGIN
  annee_courante := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  INSERT INTO devis_compteur (annee, dernier_numero)
  VALUES (annee_courante, 1)
  ON CONFLICT (annee) DO UPDATE
  SET dernier_numero = devis_compteur.dernier_numero + 1
  RETURNING dernier_numero INTO prochain_numero;

  RETURN 'DEV-' || annee_courante || '-' || LPAD(prochain_numero::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
```

### Flux de données

```
Pipeline Commercial
       ↓
Bouton "Devis" sur OpportunityCard
       ↓
┌─────────────────────────────────────────┐
│         QuoteEditorSheet                │
│  ┌─────────────────────────────────┐    │
│  │   Onglet Éditeur                │    │
│  │   - ServiceSelector             │    │
│  │   - QuoteLinesTable             │    │
│  │   - Totaux (HT, TVA, TTC)       │    │
│  │   - Boutons: Prévisualiser,     │    │
│  │             Générer PDF         │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │   Onglet Historique             │    │
│  │   - Liste des devis générés     │    │
│  │   - Actions: Voir, Envoyer      │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
       ↓
Génération PDF (Puppeteer)
       ↓
┌─────────────────────────────────────────┐
│ - Numéro séquentiel (DEV-2025-001)      │
│ - Sauvegarde PDF dans Supabase Storage  │
│ - Création enregistrement table devis   │
└─────────────────────────────────────────┘
       ↓
Envoi email (optionnel)
       ↓
┌─────────────────────────────────────────┐
│ - Email HTML professionnel via Resend   │
│ - PDF en pièce jointe                   │
│ - Statut devis → "envoyé"               │
└─────────────────────────────────────────┘
```

---

## User Stories

### US-001: Ajouter des lignes de devis (P1-CRITIQUE)

**En tant que** commercial
**Je veux** ajouter des services depuis le catalogue à mon devis
**Afin de** construire rapidement une proposition commerciale

#### Acceptance Criteria

1. **Given** l'éditeur de devis ouvert, **When** je clique sur "Ajouter un service", **Then** un dialog affiche la liste des services du catalogue
2. **Given** le sélecteur de services, **When** je clique sur un service, **Then** il est ajouté au devis avec les valeurs par défaut (prix, quantité 1)
3. **Given** une ligne de devis, **When** je modifie la quantité ou le prix, **Then** le montant HT est recalculé automatiquement
4. **Given** une ligne de devis, **When** je clique sur "Dupliquer", **Then** une copie de la ligne est ajoutée
5. **Given** une ligne de devis, **When** je clique sur "Supprimer", **Then** elle est retirée du devis

### US-002: Générer un PDF de devis (P1-CRITIQUE)

**En tant que** commercial
**Je veux** générer un PDF professionnel de mon devis
**Afin de** l'envoyer à mon prospect

#### Acceptance Criteria

1. **Given** au moins une ligne dans le devis, **When** je clique sur "Générer PDF", **Then** un PDF est créé avec le template professionnel
2. **Given** le PDF généré, **Then** il contient : en-tête entreprise, informations client, lignes de devis, totaux (HT, TVA, TTC), conditions de paiement
3. **Given** le PDF généré, **Then** il est stocké dans Supabase Storage et enregistré dans la table devis
4. **Given** le PDF généré, **Then** il reçoit un numéro séquentiel unique (DEV-YYYY-NNN)
5. **Given** le PDF généré, **Then** il est téléchargé automatiquement dans le navigateur

### US-003: Prévisualiser avant génération (P1)

**En tant que** commercial
**Je veux** prévisualiser mon devis avant de le générer
**Afin de** vérifier le contenu sans créer de numéro définitif

#### Acceptance Criteria

1. **Given** au moins une ligne dans le devis, **When** je clique sur "Prévisualiser", **Then** un PDF temporaire s'ouvre dans un nouvel onglet
2. **Given** le PDF de prévisualisation, **Then** le numéro affiché est "DEV-YYYY-XXX" (non définitif)
3. **Given** le PDF de prévisualisation, **Then** aucun enregistrement n'est créé en base de données

### US-004: Consulter l'historique des devis (P1)

**En tant que** commercial
**Je veux** voir tous les devis générés pour une opportunité
**Afin de** suivre l'évolution de la négociation

#### Acceptance Criteria

1. **Given** l'onglet "Historique" du sheet, **When** il s'affiche, **Then** je vois la liste des devis triés par date décroissante
2. **Given** un devis dans la liste, **Then** je vois : numéro, date, montant TTC, statut (badge coloré)
3. **Given** un devis, **When** je clique sur "Voir", **Then** le PDF s'ouvre dans un nouvel onglet
4. **Given** un devis non envoyé, **When** je clique sur "Envoyer", **Then** un email est préparé avec le PDF en pièce jointe

### US-005: Envoyer un devis par email (P2)

**En tant que** commercial
**Je veux** envoyer le devis par email directement depuis l'application
**Afin de** gagner du temps et tracer l'envoi

#### Acceptance Criteria

1. **Given** un devis généré, **When** je clique sur "Envoyer", **Then** un email est envoyé au contact de l'opportunité
2. **Given** l'email envoyé, **Then** il contient : objet professionnel, corps HTML avec résumé, PDF en pièce jointe
3. **Given** l'envoi réussi, **Then** le statut du devis passe à "envoyé" et la date d'envoi est enregistrée
4. **Given** l'envoi échoué, **Then** un message d'erreur explicite est affiché

---

## Architecture technique

### Composants React

| Composant | Chemin | Description |
|-----------|--------|-------------|
| `QuoteEditorSheet` | `components/devis/QuoteEditorSheet.tsx` | Sheet principal avec onglets Éditeur/Historique |
| `QuoteLinesTable` | `components/devis/QuoteLinesTable.tsx` | Table des lignes avec actions CRUD |
| `ServiceSelector` | `components/devis/ServiceSelector.tsx` | Dialog de sélection de service |

### Hooks React Query

| Hook | Fichier | Description |
|------|---------|-------------|
| `useServices` | `hooks/use-services.ts` | Liste des services du catalogue |
| `useLignesDevis` | `hooks/use-lignes-devis.ts` | CRUD lignes de devis |
| `useCreateLigneDevis` | `hooks/use-lignes-devis.ts` | Création de ligne |
| `useUpdateLigneDevis` | `hooks/use-lignes-devis.ts` | Mise à jour de ligne |
| `useDeleteLigneDevis` | `hooks/use-lignes-devis.ts` | Suppression de ligne |
| `useDevisByOpportunite` | `hooks/use-devis.ts` | Liste des devis d'une opportunité |
| `useSendDevisEmail` | `hooks/use-devis.ts` | Envoi d'email |

### API Routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/devis/generate` | POST | Génère le PDF final et l'enregistre |
| `/api/devis/preview` | POST | Génère un PDF temporaire pour aperçu |
| `/api/devis/send` | POST | Envoie le devis par email via Resend |

### Template PDF

Le template HTML (`lib/templates/devis-template.ts`) génère un devis professionnel avec :

- **En-tête** : Logo/header entreprise (depuis `parametres_entreprise.header_devis_url`)
- **Informations entreprise** : Nom, forme juridique, SIRET, RCS, TVA intra, adresse
- **Informations client** : Nom, SIRET, adresse complète
- **Contact** : Nom, prénom, email, téléphone, poste
- **Tableau des lignes** : Description, quantité, prix unitaire, remise, montant HT
- **Totaux** : Total HT, TVA (20%), Total TTC
- **Conditions** : Conditions de paiement, validité du devis
- **Pied de page** : Mentions légales

### Génération PDF

Utilisation de **Puppeteer** pour générer le PDF :

```typescript
const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle0" });

const pdfBuffer = await page.pdf({
  format: "A4",
  printBackground: true,
  margin: {
    top: "20mm",
    right: "15mm",
    bottom: "20mm",
    left: "15mm",
  },
});

await browser.close();
```

### Envoi email

Utilisation de **Resend API** pour l'envoi :

```typescript
const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${resendApiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: `${fromName} <${fromEmail}>`,
    to: [recipientEmail],
    subject: `Devis ${numeroDevis} - ${opportuniteNom}`,
    html: emailHTML,
    attachments: [{
      filename: `${numeroDevis}.pdf`,
      content: base64Content,
    }],
  }),
});
```

---

## Types TypeScript

### DevisData

```typescript
interface DevisData {
  numeroDevis: string;
  dateDevis: string;
  dateValidite: string;
  entreprise?: DevisCompanyInfo;
  client: {
    nom: string;
    siret?: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
    pays?: string;
  };
  contact?: {
    nom: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    poste?: string;
  };
  opportunite: {
    nom: string;
    notes?: string;
  };
  lignes: LigneDevis[];
  totalHT: number;
  tva: number;
  totalTTC: number;
  conditionsPaiement?: string;
}
```

### LigneDevis

```typescript
interface LigneDevis {
  id: string;
  opportuniteId: string;
  serviceId?: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  remisePourcent: number;
  montantHT: number;
  serviceNom?: string;
  serviceCategorie?: string;
}
```

### Devis (historique)

```typescript
interface Devis {
  id: string;
  numero_devis: string;
  opportunite_id: string;
  client_id?: string;
  contact_id?: string;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
  date_devis: string;
  date_validite: string;
  date_envoi?: string;
  total_ht: number;
  tva: number;
  total_ttc: number;
  taux_tva: number;
  conditions_paiement?: string;
  pdf_url?: string;
  pdf_filename?: string;
  created_at: string;
}
```

---

## Variables d'environnement

```env
# Resend (envoi d'emails)
RESEND_API_KEY=re_xxxxxxxxxx

# Supabase (stockage PDF)
NEXT_PUBLIC_SUPABASE_URL=https://supabase.axivity.cloud
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Dépendances

| Package | Version | Usage |
|---------|---------|-------|
| `puppeteer` | ^23.x | Génération PDF côté serveur |
| `resend` | - | Envoi d'emails (API directe) |

---

## Migration SQL

Fichier : `supabase/migrations/18_devis_table.sql`

Contenu :
- Type ENUM `statut_devis`
- Table `devis`
- Table `devis_compteur`
- Fonction `generer_numero_devis()`
- Trigger `update_updated_at`
- Index pour les recherches
- RLS policies
- Storage bucket `devis-pdf`

---

## Tests manuels

### Scénario 1 : Création de devis complet

1. Ouvrir une opportunité dans le pipeline
2. Cliquer sur le bouton "Devis"
3. Ajouter 2-3 services depuis le catalogue
4. Modifier les quantités et prix
5. Cliquer sur "Prévisualiser" → vérifier le PDF temporaire
6. Cliquer sur "Générer PDF" → vérifier le téléchargement
7. Vérifier l'onglet "Historique" → le devis apparaît

### Scénario 2 : Envoi par email

1. Dans l'historique, cliquer sur "Envoyer"
2. Vérifier que l'email est envoyé au contact
3. Vérifier que le statut passe à "envoyé"
4. Vérifier la réception de l'email avec le PDF en pièce jointe

### Scénario 3 : Duplication de ligne

1. Créer une ligne de devis
2. Cliquer sur "Dupliquer"
3. Vérifier qu'une copie identique est créée
4. Modifier la copie → vérifier que l'originale reste inchangée

---

*Spécification créée le 22 décembre 2025*
*Dernière mise à jour : 23 décembre 2025*
