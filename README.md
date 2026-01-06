# CRM Axivity

[![Tests](https://github.com/Niconord59/crm_axivity/actions/workflows/test.yml/badge.svg)](https://github.com/Niconord59/crm_axivity/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/badge/coverage-72.55%25-yellowgreen)](https://github.com/Niconord59/crm_axivity/actions)

Cockpit opérationnel pour agence IA - Interface Next.js

## Stack Technique

| Technologie | Version |
|-------------|---------|
| Next.js | 16.x |
| React | 19.x |
| TypeScript | 5.x |
| Tailwind CSS | 3.x |
| Shadcn/UI | Latest |
| Supabase | Self-hosted |

## Installation

```bash
npm install
npm run dev
```

## Tests

```bash
# Lancer tous les tests
npm test

# Mode watch
npm run test:watch

# Rapport de couverture
npm run test:coverage
```

**843 tests** couvrant :
- Hooks React Query (7 fichiers)
- Mappers (6 fichiers)
- Routes API (4 fichiers)
- Composants métier (6 fichiers)
- Tests d'intégration (2 fichiers)

## Documentation

- [Guide de Tests](docs/TESTING.md)
- [CLAUDE.md](CLAUDE.md) - Instructions pour Claude Code

## Licence

Propriétaire - Axivity
