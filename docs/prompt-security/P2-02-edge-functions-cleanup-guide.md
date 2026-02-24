# P2-02 : Nettoyage Edge Functions - Guide d'exécution

## Inventaire et décision

| Fonction | Décision | Justification |
|----------|----------|---------------|
| `hello` | **SUPPRIMER** | Artefact de développement, aucune utilité |
| `send-email` | **SUPPRIMER** | Cassée (InvalidWorkerCreation), l'envoi email est géré par les API routes Next.js + Resend |
| `webhook` | **SUPPRIMER** | HTTP 500, non référencée, non utilisée |
| `process` | **SUPPRIMER** | HTTP 500, non référencée, non utilisée |
| `generate` | **SUPPRIMER** | HTTP 500, non référencée, non utilisée |
| `notify` | **SUPPRIMER** | HTTP 500, non référencée, non utilisée |

## Vérification des dépendances

**Frontend** : Aucune référence trouvée
```bash
# Grep exécuté - 0 résultat
grep -r "functions/v1/" crm/src/
```

**N8N** : Les ID de nœuds "send-email" dans les workflows N8N sont des noms de nœuds internes, pas des appels aux Edge Functions Supabase. Les workflows utilisent les nœuds "Send Email" de N8N natifs (Gmail/SMTP).

## Commandes de suppression

### Option A : Via Supabase Dashboard

1. Aller dans Supabase Dashboard → Edge Functions
2. Pour chaque fonction, cliquer sur "Delete" :
   - `hello`
   - `send-email`
   - `webhook`
   - `process`
   - `generate`
   - `notify`

### Option B : Via Supabase CLI (si configuré)

```bash
# Supprimer chaque fonction
supabase functions delete hello
supabase functions delete send-email
supabase functions delete webhook
supabase functions delete process
supabase functions delete generate
supabase functions delete notify
```

**Note :** Le CLI Supabase n'est pas installé localement. Préférer la suppression via le Dashboard.

### Option C : Via l'API Management (self-hosted)

Pour un Supabase self-hosted, les Edge Functions peuvent être gérées directement via Docker/Coolify. Vérifier dans les volumes Docker s'il y a un dossier `supabase/functions/` à nettoyer.

## Vérification post-suppression

Après suppression, vérifier que les endpoints retournent 404 :

```bash
curl -s -o /dev/null -w "%{http_code}" https://supabase.axivity.cloud/functions/v1/hello
# Attendu : 404

curl -s -o /dev/null -w "%{http_code}" https://supabase.axivity.cloud/functions/v1/send-email
# Attendu : 404
```

## Architecture email actuelle (référence)

L'envoi d'emails est géré par :
- **Transactionnel (auth)** : GoTrue → Resend SMTP (`smtp.resend.com:465`)
- **Business (devis, relances)** : API routes Next.js → Resend API
  - `POST /api/devis/send` : Envoi devis par email
  - `POST /api/email/send` : Email de suivi prospects
- **Automatisé (N8N)** : Nœuds Send Email N8N → Gmail/SMTP

Aucune Edge Function n'est nécessaire pour ces flux.
