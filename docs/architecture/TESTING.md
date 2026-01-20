# Guide de Tests - CRM Axivity

Documentation complète des tests pour le projet CRM Axivity.

## Table des matières

- [Stack de Tests](#stack-de-tests)
- [Commandes](#commandes)
- [Structure des Tests](#structure-des-tests)
- [Configuration](#configuration)
- [Écrire un Test](#écrire-un-test)
- [Mocks Disponibles](#mocks-disponibles)
- [Patterns de Test](#patterns-de-test)
- [Couverture de Code](#couverture-de-code)
- [CI/CD](#cicd)
- [Checklist PR](#checklist-pr)

---

## Stack de Tests

| Outil | Version | Usage |
|-------|---------|-------|
| **Vitest** | 4.x | Test runner (compatible Jest) |
| **React Testing Library** | 16.x | Tests composants React |
| **@testing-library/user-event** | 14.x | Simulation interactions utilisateur |
| **jsdom** | - | Environnement DOM virtuel |

---

## Commandes

```bash
# Lancer tous les tests
npm test

# Mode watch (relance sur modifications)
npm run test:watch

# Rapport de couverture
npm run test:coverage

# Interface Vitest UI
npm run test:ui

# Lancer un fichier spécifique
npm test -- --run src/hooks/__tests__/use-opportunites.test.ts

# Lancer les tests d'un dossier
npm test -- --run src/components/opportunites/
```

---

## Structure des Tests

```text
src/
├── __tests__/
│   └── integration/              # Tests d'intégration
│       ├── devis-flow.test.ts    # Flux devis complet (29 tests)
│       └── pipeline-flow.test.ts # Flux pipeline Kanban (34 tests)
├── hooks/
│   └── __tests__/                # Tests des hooks React Query
│       ├── use-opportunites.test.ts  # (30 tests)
│       ├── use-factures.test.ts      # (35 tests)
│       ├── use-devis.test.ts         # (43 tests)
│       ├── use-prospects.test.ts     # (36 tests)
│       ├── use-projets.test.ts       # (30 tests)
│       ├── use-taches.test.ts        # (37 tests)
│       └── use-interactions.test.ts  # (26 tests)
├── lib/
│   ├── mappers/__tests__/        # Tests des mappers
│   │   ├── base.mapper.test.ts       # (62 tests)
│   │   ├── client.mapper.test.ts     # (14 tests)
│   │   ├── opportunite.mapper.test.ts# (17 tests)
│   │   ├── facture.mapper.test.ts    # (18 tests)
│   │   ├── projet.mapper.test.ts     # (20 tests)
│   │   └── tache.mapper.test.ts      # (23 tests)
│   └── __tests__/                # Tests utilitaires
│       ├── utils.test.ts             # (42 tests)
│       └── export.test.ts            # (15 tests)
├── components/
│   ├── opportunites/
│   │   ├── __tests__/
│   │   │   └── OpportunityCard.test.tsx  # (41 tests)
│   │   └── widgets/__tests__/
│   │       └── widgets.test.tsx          # (60 tests)
│   ├── prospection/__tests__/
│   │   ├── LeadCard.test.tsx             # (40 tests)
│   │   └── ProspectionKPIs.test.tsx      # (17 tests)
│   ├── devis/__tests__/
│   │   ├── QuoteLinesTable.test.tsx      # (22 tests)
│   │   └── ServiceSelector.test.tsx      # (23 tests)
│   └── shared/__tests__/
│       ├── empty-state.test.tsx          # (9 tests)
│       └── ExportButton.test.tsx         # (11 tests)
├── app/api/
│   ├── devis/
│   │   ├── generate/__tests__/route.test.ts  # (18 tests)
│   │   └── send/__tests__/route.test.ts      # (13 tests)
│   └── factures/
│       ├── generate/__tests__/route.test.ts  # (19 tests)
│       └── relance/__tests__/route.test.ts   # (11 tests)
└── test/
    ├── setup.ts              # Configuration globale Vitest
    ├── utils.tsx             # Render wrapper React Query
    └── mocks/
        └── supabase.ts       # Mock Supabase client
```

---

## Configuration

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        '**/__tests__/**',
      ],
      thresholds: {
        statements: 60,
        branches: 55,
        functions: 60,
        lines: 60,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## Écrire un Test

### Structure de base

```typescript
// CRM Axivity - [Component/Hook Name] Tests
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("[ComponentName]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // SECTION NAME
  // ===========================================================================
  describe("Section Name", () => {
    it("should [expected behavior]", () => {
      // Arrange
      const input = "test";

      // Act
      const result = doSomething(input);

      // Assert
      expect(result).toBe("expected");
    });
  });
});
```

### Test de composant React

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyComponent } from "../MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent prop="value" />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("should handle user interaction", async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    render(<MyComponent onClick={onClickMock} />);
    await user.click(screen.getByRole("button"));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
```

### Test de hook React Query

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { createTestQueryWrapper } from "@/test/utils";
import { useMyHook } from "../use-my-hook";

// Mock Supabase AVANT les imports
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

describe("useMyHook", () => {
  it("should fetch data", async () => {
    const { result } = renderHook(() => useMyHook(), {
      wrapper: createTestQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});
```

### Test de route API

```typescript
import { describe, it, expect, vi } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

// Mock Supabase service client
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
        })),
      })),
    })),
  })),
}));

describe("/api/my-route", () => {
  it("should return 200 on success", async () => {
    const request = new NextRequest("http://localhost/api/my-route", {
      method: "POST",
      body: JSON.stringify({ id: "test-id" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

---

## Mocks Disponibles

### Mock Supabase Client

```typescript
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: "new-id" }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
}));
```

### Mock Next.js Navigation

```typescript
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/test-path",
  useSearchParams: () => new URLSearchParams(),
}));
```

### Mock Resend (Email)

```typescript
vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn(() => Promise.resolve({ data: { id: "email-id" }, error: null })),
    },
  })),
}));
```

### Mock PDF Generation

```typescript
vi.mock("@/lib/pdf/browser-pool", () => ({
  generatePDF: vi.fn(() => Promise.resolve(Buffer.from("fake-pdf-content"))),
}));
```

### Mock scrollIntoView (pour cmdk/Command)

```typescript
// Ajouter en haut du fichier de test
Element.prototype.scrollIntoView = vi.fn();
```

### Mock @hello-pangea/dnd (Drag & Drop)

```typescript
vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) => children({
    droppableProps: {},
    innerRef: vi.fn(),
    placeholder: null,
  }),
  Draggable: ({ children }) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: vi.fn(),
  }),
}));
```

---

## Patterns de Test

### Tester les états de chargement

```typescript
it("should show loading state", () => {
  mockUseHook.mockReturnValue({
    data: undefined,
    isLoading: true,
    error: null,
  });

  const { container } = render(<MyComponent />);

  const skeletons = container.querySelectorAll("[class*='skeleton']");
  expect(skeletons.length).toBeGreaterThan(0);
});
```

### Tester les callbacks

```typescript
it("should call callback with correct arguments", async () => {
  const user = userEvent.setup();
  const onChangeMock = vi.fn();

  render(<MyComponent onChange={onChangeMock} />);

  const input = screen.getByRole("textbox");
  await user.clear(input);
  await user.type(input, "test value");
  fireEvent.blur(input);

  expect(onChangeMock).toHaveBeenCalledWith("test value");
});
```

### Tester les styles conditionnels

```typescript
it("should apply destructive variant when error", () => {
  const { container } = render(<MyComponent hasError={true} />);

  const element = container.querySelector(".border-destructive");
  expect(element).toBeInTheDocument();
});
```

### Tester les calculs métier

```typescript
it("should calculate total HT correctly", () => {
  const quantite = 5;
  const prixUnitaire = 1500;
  const remisePourcent = 10;

  const montantHT = quantite * prixUnitaire * (1 - remisePourcent / 100);

  expect(montantHT).toBe(6750);
});
```

### Tester les nombres formatés (locale française)

```typescript
// Les nombres en français utilisent des espaces insécables (NBSP)
it("should display formatted value", () => {
  render(<AmountDisplay value={50000} />);

  const input = screen.getByRole("textbox");
  // Utiliser une regex pour matcher avec ou sans NBSP
  expect(input.getAttribute("value")).toMatch(/50.000/);
});
```

---

## Couverture de Code

### Seuils de couverture

| Métrique | Seuil |
|----------|-------|
| Statements | 60% |
| Branches | 55% |
| Functions | 60% |
| Lines | 60% |

### Objectifs par type de fichier

| Type | Couverture cible |
|------|------------------|
| Hooks (`use-*.ts`) | 80% |
| Routes API (`route.ts`) | 80% |
| Mappers (`*.mapper.ts`) | 90% |
| Composants métier | 70% |
| Utilitaires | 80% |

### Générer un rapport

```bash
npm run test:coverage
```

Le rapport HTML est disponible dans `coverage/index.html`.

---

## CI/CD

### GitHub Actions

Le workflow `.github/workflows/test.yml` s'exécute sur :
- Push sur `main` ou `develop`
- Pull requests vers `main` ou `develop`

Jobs exécutés :
1. **Lint** - Vérification ESLint
2. **Tests** - Exécution de tous les tests
3. **Coverage** - Vérification des seuils
4. **Build** - Vérification de la compilation

---

## Checklist PR

### Tests requis

- [ ] Tous les tests existants passent (`npm test`)
- [ ] Nouveaux fichiers ont des tests associés
- [ ] Modifications de code existant ont des tests mis à jour
- [ ] Edge cases sont testés

### Couverture

- [ ] La couverture ne diminue pas
- [ ] Nouveaux hooks ont ≥80% de couverture
- [ ] Nouvelles routes API ont ≥80% de couverture

### Qualité

- [ ] Pas d'erreurs ESLint (`npm run lint`)
- [ ] Le build passe (`npm run build`)
- [ ] Mocks sont nettoyés (`vi.clearAllMocks()` dans `beforeEach`)

### Structure

- [ ] Tests organisés en sections avec `describe`
- [ ] Noms descriptifs ("should [action]")
- [ ] Commentaires séparateurs pour les sections

---

## Couverture Actuelle

| Catégorie | Fichiers | Tests |
|-----------|----------|-------|
| **Mappers** | 6 | 154 |
| **Hooks** | 7 | 237 |
| **Routes API** | 4 | 61 |
| **Composants métier** | 6 | 203 |
| **Utilitaires** | 2 | 57 |
| **Intégration** | 2 | 63 |
| **Autres** | 3 | 5 |
| **Total** | **30+** | **780** |

---

*Dernière mise à jour : 6 janvier 2026*
*Epic : 008-test-coverage*
