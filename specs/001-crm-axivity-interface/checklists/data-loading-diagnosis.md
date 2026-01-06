# Checklist: Diagnostic Loader Infini - Données Non Chargées

**Purpose**: Diagnostiquer pourquoi les pages nécessitent un hard reload (Ctrl+Shift+R) pour afficher les données
**Created**: 2026-01-06
**Resolved**: 2026-01-06 ✅
**Domain**: Data Loading / Next.js Router Cache / RSC

---

## Cause Racine Identifiée

**Le Router Cache RSC de Next.js était activé par défaut**, causant des payloads de navigation désynchronisés.

| Symptôme | Cause |
|----------|-------|
| Loader infini sur toutes les pages | Cache RSC corrompu/stale |
| Requête `?_rsc=xxxxx` avec erreur | Payload RSC introuvable |
| Ctrl+Shift+R fonctionne | Hard refresh vide le cache navigateur |
| F5 ne fonctionne pas | Soft refresh utilise le cache RSC |

**Message d'erreur dans DevTools Network** :
```
Request URL: http://localhost:3000/opportunites?_rsc=17c7p
"Failed to load response data: No data found for resource with given identifier"
```

---

## Solution Appliquée ✅

### 1. Désactiver le Router Cache dans `next.config.mjs`

```javascript
experimental: {
  staleTimes: {
    dynamic: 0,  // Pas de cache pour les pages dynamiques
    static: 0,   // Pas de cache pour les pages statiques
  },
},
```

### 2. Supprimer le cache `.next`

```bash
rm -rf .next
npm run dev
```

---

## Explication Technique

Le **Router Cache** de Next.js App Router met en cache les payloads RSC (React Server Components) :
- **30 secondes** par défaut pour les pages dynamiques
- **5 minutes** pour les pages statiques

Quand ce cache se désynchronise (après un build, hot reload, ou erreur), les navigations côté client échouent car Next.js cherche un payload qui n'existe plus.

**Documentation officielle** : https://nextjs.org/docs/app/api-reference/next-config-js/staleTimes

---

## Vérifications Post-Fix

- [x] CHK001 - Configuration `staleTimes` ajoutée dans `next.config.mjs`
- [x] CHK002 - Cache `.next` supprimé et serveur redémarré
- [x] CHK003 - Dashboard : données chargées sans hard reload
- [x] CHK004 - Page clients : liste affichée au premier chargement
- [x] CHK005 - Page opportunités : Kanban affiché correctement
- [x] CHK006 - Navigation entre pages : données rafraîchies
- [x] CHK007 - Plus d'erreur "No data found for resource" dans Network

---

## Note pour le Futur

Si ce problème réapparaît :
1. Vérifier que `staleTimes` est toujours dans la config
2. Supprimer `.next` et redémarrer
3. Vérifier la console Network pour les erreurs `_rsc`
