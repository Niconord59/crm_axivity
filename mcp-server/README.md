# MCP Server — CRM Axivity

Serveur MCP (Model Context Protocol) pour le CRM Axivity. Permet a Claude Code, Claude Desktop ou tout client MCP compatible d'interagir avec les donnees du CRM en langage naturel.

## Architecture

```
Client MCP (Claude Code / Desktop)
        |
        | HTTPS + Bearer Token
        v
  MCP Server (Streamable HTTP)
        |
        | Service Role Key
        v
    Supabase (PostgreSQL + RLS)
```

- **Transport** : Streamable HTTP (spec MCP 2025-03-26)
- **Auth** : API Keys liees aux profils Supabase (SHA-256 hashees)
- **OAuth** : Pass-through auto-approve pour compatibilite Claude Code
- **Deploiement** : Docker multi-stage sur Coolify

## Prerequis

- Node.js >= 22
- Un compte dans le CRM Axivity (profil dans la table `profiles`)
- La migration `27_mcp_api_keys.sql` appliquee sur Supabase

---

## Installation rapide (equipe)

### 1. Demander une API Key

Contacte un administrateur du CRM. Il generera une cle pour toi avec :

```bash
cd mcp-server
npx tsx scripts/generate-api-key.ts "TON_USER_ID" "Claude Code - Prenom"
```

Tu recevras une cle au format `axv_xxxxxxxxxxxxxxxxxxxx`.

> **Important** : cette cle ne sera affichee qu'une seule fois. Conserve-la en lieu sur.

### 2. Configurer Claude Code

Cree ou modifie le fichier `~/.mcp.json` :

```json
{
  "mcpServers": {
    "crm-axivity": {
      "type": "http",
      "url": "https://mcp.axivity.cloud/mcp",
      "headers": {
        "Authorization": "Bearer axv_TA_CLE_ICI"
      }
    }
  }
}
```

### 3. Redemarrer Claude Code

Ferme et relance Claude Code. Les outils CRM apparaitront automatiquement (57 tools).

### 4. Utiliser

Exemples de requetes en langage naturel :

```
"Liste mes clients actifs"
"Montre les KPIs du CRM"
"Quelles opportunites sont en negociation ?"
"Cree un contact pour le client Acme"
"Quelles factures sont impayees ?"
"Montre la charge de travail de l'equipe"
"Log 2h sur la tache X du projet Y"
```

---

## Outils disponibles (57 tools)

### Clients (5)
| Outil | Description |
|-------|-------------|
| `list_clients` | Liste les clients avec filtres (statut, type, recherche) |
| `get_client` | Fiche client avec contacts, projets, factures |
| `create_client` | Creer un nouveau client |
| `update_client` | Modifier un client |
| `delete_client` | Supprimer un client |

### Contacts (7)
| Outil | Description |
|-------|-------------|
| `list_contacts` | Liste avec filtres (client, prospection, lifecycle) |
| `get_contact` | Fiche contact avec opportunites et interactions |
| `create_contact` | Creer un contact lie a un client |
| `update_contact` | Modifier un contact |
| `update_prospect_status` | Changer le statut de prospection |
| `update_lifecycle_stage` | Changer le lifecycle stage (Lead, MQL, SQL...) |
| `delete_contact` | Supprimer un contact |

### Opportunites (7)
| Outil | Description |
|-------|-------------|
| `list_opportunites` | Pipeline commercial avec filtres |
| `get_opportunite` | Detail avec lignes de devis et contacts |
| `create_opportunite` | Creer une opportunite |
| `update_opportunite` | Modifier (recalcul valeur ponderee auto) |
| `move_opportunity_stage` | Deplacer dans le pipeline (Kanban) |
| `get_pipeline_kanban` | Vue Kanban complete du pipeline |
| `delete_opportunite` | Supprimer une opportunite |

### Projets (6)
| Outil | Description |
|-------|-------------|
| `list_projets` | Liste avec filtres (statut, client, chef) |
| `get_projet` | Detail avec taches, factures, membres |
| `create_projet` | Creer un projet |
| `update_projet` | Modifier un projet |
| `get_project_progress` | Avancement (% taches, heures, budget) |
| `delete_projet` | Supprimer un projet |

### Taches (6)
| Outil | Description |
|-------|-------------|
| `list_taches` | Liste avec filtres (projet, statut, priorite) |
| `get_tache` | Detail avec temps passe |
| `create_tache` | Creer une tache dans un projet |
| `update_tache` | Modifier (statut, priorite, assignation) |
| `list_taches_en_retard` | Taches en retard |
| `delete_tache` | Supprimer une tache |

### Factures (6)
| Outil | Description |
|-------|-------------|
| `list_factures` | Liste avec filtres (statut, client, projet) |
| `get_facture` | Detail avec infos client (SIRET, adresse) |
| `create_facture` | Creer une facture (calcul TTC auto) |
| `update_facture` | Modifier (recalcul TTC auto) |
| `list_factures_impayees` | Factures impayees avec total |
| `delete_facture` | Supprimer une facture |

### Devis (5)
| Outil | Description |
|-------|-------------|
| `list_lignes_devis` | Lignes de devis d'une opportunite |
| `add_ligne_devis` | Ajouter une ligne (calcul HT auto) |
| `update_ligne_devis` | Modifier une ligne |
| `delete_ligne_devis` | Supprimer une ligne |
| `calculate_devis_total` | Total HT + TTC du devis |

### Interactions (3)
| Outil | Description |
|-------|-------------|
| `list_interactions` | Historique (emails, appels, reunions) |
| `create_interaction` | Enregistrer une interaction |
| `get_last_interaction` | Derniere interaction avec un client |

### Journal de temps (3)
| Outil | Description |
|-------|-------------|
| `log_time` | Enregistrer du temps sur une tache/projet |
| `get_timesheet` | Feuille de temps d'un membre |
| `get_project_hours` | Heures par membre sur un projet |

### Equipe (2)
| Outil | Description |
|-------|-------------|
| `list_equipe` | Membres de l'equipe avec roles |
| `get_workload` | Charge de travail (taches + heures/semaine) |

### Catalogue de services (3)
| Outil | Description |
|-------|-------------|
| `list_services` | Catalogue des services |
| `create_service` | Ajouter un service |
| `update_service` | Modifier un service |

### Dashboard (4)
| Outil | Description |
|-------|-------------|
| `get_kpis` | KPIs globaux (clients, pipeline, CA, alertes) |
| `get_pipeline_value` | Valeur du pipeline par etape |
| `get_lifecycle_funnel` | Funnel lifecycle avec taux de conversion |
| `get_revenue_chart` | CA mensuel sur 12 mois |

### Resources MCP (2)
| Resource | URI | Description |
|----------|-----|-------------|
| Schema CRM | `crm://schema` | Structure complete des tables |
| Enums | `crm://enums` | Toutes les valeurs d'enum |

---

## Administration

### Generer une API Key

```bash
cd mcp-server

# 1. Trouver le user_id
# Dans Supabase SQL Editor :
# SELECT id, email, role FROM profiles WHERE email = 'user@axivity.fr';

# 2. Generer la cle
npx tsx scripts/generate-api-key.ts "USER_ID" "Claude Code - Prenom"

# 3. Executer le SQL INSERT affiche dans Supabase SQL Editor
```

### Revoquer une API Key

```sql
-- Par label
UPDATE mcp_api_keys SET revoked = true WHERE label = 'Claude Code - Prenom';

-- Par user
UPDATE mcp_api_keys SET revoked = true WHERE user_id = 'USER_ID';
```

### Lister les cles actives

```sql
SELECT
  k.label,
  k.created_at,
  k.last_used_at,
  p.email,
  p.role
FROM mcp_api_keys k
JOIN profiles p ON p.id = k.user_id
WHERE k.revoked = false
ORDER BY k.last_used_at DESC;
```

---

## Developpement local

### Lancer le serveur

```bash
cd mcp-server
cp .env.example .env
# Editer .env avec les valeurs staging

npm install
npm run dev
```

### Tester

```bash
# Health check
curl http://localhost:3001/health

# Configurer Claude Code en local
# ~/.mcp.json → url: "http://localhost:3001/mcp"
```

### Build

```bash
npm run build      # Compile TypeScript
npm run typecheck   # Verification types sans build
```

---

## Deploiement (Coolify)

### Variables d'environnement

| Variable | Description | Buildtime | Runtime |
|----------|-------------|-----------|---------|
| `SUPABASE_URL` | URL Supabase | Non | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Non | Oui |
| `PORT` | Port du serveur (3001) | Non | Oui |
| `NODE_ENV` | production | Non | Oui |
| `PUBLIC_URL` | URL publique (https://mcp.axivity.cloud) | Non | Oui |
| `LOG_LEVEL` | Niveau de log (info) | Non | Oui |

> **Important** : decocher "Available at Buildtime" pour `SUPABASE_SERVICE_ROLE_KEY`.

### Health check

```
Command: /usr/bin/curl http://localhost:3001/health
Interval: 30s | Timeout: 10s | Retries: 3 | Start Period: 10s
```

---

## Securite

- Les API Keys sont stockees **hashees en SHA-256** (jamais en clair)
- Chaque cle est liee a un profil utilisateur Supabase
- Le serveur utilise la `service_role` key pour acceder a Supabase
- Les cles peuvent etre revoquees instantanement
- Le champ `last_used_at` permet l'audit d'utilisation
- HTTPS obligatoire en production
