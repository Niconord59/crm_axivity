# Tasks: 010-clients-filtering

**Feature**: Filtrage Clients Réels (facture payée)
**Status**: 80% - 12/15 tasks
**Priority**: P2 - Medium
**Last Updated**: 2026-01-29

---

## Phase 1 : Implementation du toggle (8 tasks)

### 1.1 Preparation

- [x] **T1.1.1** Verifier que `useFactures` retourne bien `clientId` et `statut`
- [x] **T1.1.2** Verifier les types dans `src/types/index.ts` pour `Facture`

### 1.2 Logique de filtrage

- [x] **T1.2.1** Ajouter import `useFactures` dans `src/app/(main)/clients/page.tsx`
- [x] **T1.2.2** Ajouter etat `showOnlyPaidClients` (useState boolean, default false)
- [x] **T1.2.3** Calculer `paidClientIds` avec useMemo (Set des client_id avec facture "Payé")
- [x] **T1.2.4** Ajouter condition de filtrage dans `filteredClients`

### 1.3 Composant UI

- [x] **T1.3.1** Ajouter composant `Checkbox` (Shadcn) avec label "Afficher uniquement les clients facturés"
- [x] **T1.3.2** Positionner le toggle au-dessus de la barre de filtres existante

---

## Phase 2 : Badge visuel (4 tasks)

### 2.1 Badge "Client"

- [x] **T2.1.1** Ajouter Badge "Client" (vert) sur les cartes des clients avec facture payée
- [x] **T2.1.2** Utiliser icone `CheckCircle` de Lucide
- [x] **T2.1.3** Positionner le badge a cote du badge Secteur existant

### 2.2 Compteur (optionnel)

- [x] **T2.2.1** Afficher compteur "X clients facturés sur Y total" quand toggle actif

---

## Phase 3 : Tests et documentation (3 tasks)

### 3.1 Tests

- [ ] **T3.1.1** Ajouter tests unitaires pour la logique de filtrage (paidClientIds) - SKIP: tests manuels suffisants pour cette feature simple
- [ ] **T3.1.2** Tester combinaison toggle + autres filtres (search, secteur, statut) - SKIP: tests manuels suffisants

### 3.2 Documentation

- [ ] **T3.2.1** Mettre a jour `crm/CLAUDE.md` section "010-clients-filtering" - A faire si besoin

---

## Resume

| Phase | Taches | Effort estime |
|-------|--------|---------------|
| Phase 1 : Toggle | 8 | 2h |
| Phase 2 : Badge | 4 | 1h |
| Phase 3 : Tests & Doc | 3 | 1h |
| **Total** | **15** | **~4h** |

---

## Dependances

### Prerequis

- Aucun (utilise les hooks existants `useClients` et `useFactures`)

### Bloque par cette feature

- Aucune feature bloquee

---

## Notes d'implementation

### Ordre recommande

1. **T1.1.x** : Verification des types (5 min)
2. **T1.2.x** : Logique de filtrage (30 min)
3. **T1.3.x** : UI toggle (15 min)
4. **T2.x** : Badge visuel (30 min)
5. **T3.x** : Tests et doc (1h)

### Points d'attention

- **Performance** : Utiliser `useMemo` pour eviter de recalculer le Set a chaque render
- **Statut exact** : Le statut facture doit etre exactement `'Payée'` (avec accent)
- **Compatibilite** : Le toggle doit se combiner avec les filtres existants (AND logique)

### Code de reference

```typescript
// Exemple d'implementation complete du filtre
const { data: factures } = useFactures();

const paidClientIds = useMemo(() => {
  if (!factures) return new Set<string>();
  return new Set(
    factures
      .filter(f => f.statut === 'Payée')
      .map(f => f.clientId)
  );
}, [factures]);

const filteredClients = clients?.filter((client) => {
  // Toggle "clients factures uniquement"
  if (showOnlyPaidClients && !paidClientIds.has(client.id)) {
    return false;
  }
  // Filtre recherche
  if (search && !client.nom.toLowerCase().includes(search.toLowerCase())) {
    return false;
  }
  // Filtre secteur
  if (secteurFilter !== "all" && client.secteurActivite !== secteurFilter) {
    return false;
  }
  // Filtre statut
  if (statutFilter !== "all" && client.statut !== statutFilter) {
    return false;
  }
  return true;
});
```

---

## Evolution future (hors scope v1)

Si la performance devient un probleme (> 1000 factures) :

1. **Migration SQL** : Ajouter colonne `has_paid_invoice` boolean
2. **Trigger** : Mise a jour automatique quand facture passe a "Payée"
3. **Hook** : Modifier `useClients` pour inclure ce champ

Cette evolution sera tracee dans une spec separee si necessaire.

---

*Tasks creees le 29 janvier 2026*
*Issue de la spec 010-clients-filtering*
*Version : 1.0*
