# Prompts de Remédiation Sécurité - CRM Axivity

**Source :** Rapport d'audit de sécurité du 2026-02-23
**Cible :** Supabase instance `https://supabase.axivity.cloud`

---

## Organisation par Priorité

### P0 - Critique (Action Immédiate)

| # | Fichier | Objectif | Spécialistes |
|---|---------|----------|-------------|
| 1 | `P0-01-activer-rls-toutes-tables.md` | Activer RLS sur les 33 tables | DB Security Engineer + Supabase Architect |
| 2 | `P0-02-politiques-rls-base.md` | Créer les politiques RLS restrictives de base | DB Security Engineer + IAM Specialist |
| 3 | `P0-03-securiser-fonctions-rpc.md` | Révoquer l'accès anon aux fonctions RPC | DB Security Engineer + AppSec Engineer |
| 4 | `P0-04-politiques-rls-granulaires.md` | Implémenter RLS granulaire par rôle | DB Security Engineer + IAM Architect |

### P1 - Haute

| # | Fichier | Objectif | Spécialistes |
|---|---------|----------|-------------|
| 5 | `P1-01-reduire-exposition-api.md` | Réduire l'exposition des tables via PostgREST | API Security Specialist + Backend Engineer |
| 6 | `P1-02-proteger-donnees-business.md` | Protéger les KPIs et données pipeline | Data Security Analyst + BI Architect |

### P2 - Moyenne

| # | Fichier | Objectif | Spécialistes |
|---|---------|----------|-------------|
| 7 | `P2-01-durcir-jwt-auth.md` | Durcir JWT et configuration auth | Identity & Access Management Specialist |
| 8 | `P2-02-nettoyer-edge-functions.md` | Nettoyer les Edge Functions | Cloud Security Engineer + DevOps |

### P3 - Faible

| # | Fichier | Objectif | Spécialistes |
|---|---------|----------|-------------|
| 9 | `P3-01-reduire-surface-attaque.md` | Réduire la surface d'attaque générale | Infrastructure Security Engineer |

### Orchestration

| # | Fichier | Objectif | Spécialistes |
|---|---------|----------|-------------|
| 10 | `ORCHESTRATION-remediation-complete.md` | Prompt global d'orchestration | Security Architect (Lead) + toute l'équipe |

---

## Ordre d'exécution recommandé

```
P0-01 → P0-02 → P0-03 → P0-04 → P1-01 → P1-02 → P2-01 → P2-02 → P3-01
  │                                  │
  └──── URGENCE ABSOLUE ────────────┘
```

> **Note :** Les prompts P0-01 et P0-02 doivent être exécutés **ensemble** pour éviter de casser l'application (activer RLS sans politiques = accès bloqué pour tous).
