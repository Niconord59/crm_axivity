# Guide des Lifecycle Stages

**Feature**: 009-lifecycle-model
**Inspiré de**: HubSpot CRM
**Date**: 2026-01-28

---

## Définition des Stages

| Stage | Label FR | Couleur | Signification |
|-------|----------|---------|---------------|
| **Lead** | Lead | Gris | Contact importé, jamais contacté |
| **MQL** | MQL | Bleu | Marketing Qualified Lead - a interagi avec du contenu (site web, email, etc.) |
| **SQL** | SQL | Indigo | Sales Qualified Lead - contacté par un commercial (appel effectué) |
| **Opportunity** | Opportunité | Violet | Au moins une opportunité active liée |
| **Customer** | Client | Vert | Au moins une opportunité "Gagnée" liée |
| **Evangelist** | Ambassadeur | Ambre | Client satisfait, potentiel ambassadeur/référent |
| **Churned** | Perdu | Rouge | Client perdu (tous deals fermés sans succès) |

---

## Progression dans le Funnel

```
Lead → MQL → SQL → Opportunity → Customer → Evangelist
                                    ↓
                                 Churned
```

### Explication du parcours

1. **Lead** : Le contact vient d'être ajouté (import CSV, création manuelle). Aucune interaction commerciale n'a eu lieu.

2. **MQL (Marketing Qualified Lead)** : Le contact a montré un intérêt (visite site web, téléchargement livre blanc, inscription newsletter). Il est "qualifié marketing".

3. **SQL (Sales Qualified Lead)** : Un commercial a pris contact (appel, email personnalisé). Le contact est "qualifié commercial".

4. **Opportunity** : Une opportunité commerciale a été créée. Le contact est en cours de négociation.

5. **Customer** : L'opportunité a été gagnée. Le contact est devenu client.

6. **Evangelist** : Le client est très satisfait et recommande activement l'entreprise. Potentiel ambassadeur pour des témoignages ou références.

7. **Churned** : Le client a été perdu (résiliation, non-renouvellement, échec de toutes les opportunités).

---

## Transitions Automatiques

| Événement déclencheur | Transition lifecycle_stage |
|-----------------------|----------------------------|
| Contact créé via import CSV | → **Lead** |
| Premier appel effectué | → **SQL** (si était Lead ou MQL) |
| Opportunité créée et liée au contact | → **Opportunity** |
| Opportunité passée à statut "Gagné" | → **Customer** |
| Toutes opportunités fermées sans succès | → **Churned** (si était Customer) |

---

## Règles de Protection

### Pas de rétrogradation automatique

Le lifecycle stage ne régresse **jamais** automatiquement :

- Un **Customer** ne redevient jamais **SQL** ou **Lead**
- Un **Evangelist** ne redevient jamais **Customer**

### Exception : Churned

Le passage vers **Churned** est une régression explicite qui :
- Peut venir de n'importe quel stage (Customer, Evangelist, Opportunity...)
- Demande une confirmation (AlertDialog) dans l'UI
- Est généralement déclenché manuellement après analyse

### Rétrogradation manuelle

Si un utilisateur force une rétrogradation (ex: Customer → SQL) :
1. Un warning de confirmation s'affiche
2. L'utilisateur doit confirmer explicitement
3. Une interaction "Changement lifecycle stage" est créée pour l'audit

---

## Cohabitation avec statut_prospection

Les deux champs coexistent et servent des objectifs différents :

| Champ | Usage | Exemple |
|-------|-------|---------|
| `lifecycle_stage` | Position **stratégique** dans le funnel global | "Où en est ce contact dans notre relation ?" |
| `statut_prospection` | Suivi **tactique** des appels | "Quand dois-je rappeler ?" |

### Exemple concret

Un contact peut être :
- `lifecycle_stage` = **SQL** (qualifié commercialement)
- `statut_prospection` = **Rappeler** (à rappeler demain à 14h)

Les deux informations sont complémentaires :
- Le lifecycle stage indique sa maturité dans le funnel
- Le statut prospection indique l'action immédiate à effectuer

---

## Métriques du Funnel (Dashboard)

### Taux de conversion

Calculés entre stages adjacents :

| Métrique | Calcul |
|----------|--------|
| Lead → MQL | COUNT(MQL+) / COUNT(Lead+) × 100 |
| MQL → SQL | COUNT(SQL+) / COUNT(MQL+) × 100 |
| SQL → Opportunity | COUNT(Opportunity+) / COUNT(SQL+) × 100 |
| Opportunity → Customer | COUNT(Customer+) / COUNT(Opportunity+) × 100 |

*Note: "Stage+" signifie "contacts qui ont atteint ce stage ou au-delà"*

### Cycle moyen Lead → Customer

```
AVG(lifecycle_stage_changed_at - created_at)
```

Pour les contacts ayant atteint le stage **Customer**.

---

## Bonnes Pratiques

1. **Ne pas sauter de stages** : Même si un contact devient client rapidement, il passe par Lead → SQL → Opportunity → Customer

2. **Documenter les Churned** : Toujours ajouter une note expliquant pourquoi un client est passé en Churned

3. **Identifier les Evangelists** : Après un projet réussi avec feedback positif, penser à promouvoir en Evangelist

4. **Surveiller le funnel** : Un goulot d'étranglement (ex: beaucoup de SQL mais peu d'Opportunity) indique un problème de qualification ou de proposition commerciale

---

*Documentation créée le 28 janvier 2026*
*CRM Axivity - Lifecycle Model v1.0*
