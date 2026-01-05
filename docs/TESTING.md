# Guide de Tests - CRM Axivity

Documentation des tests pour le projet CRM Axivity.

## Stack de Tests

| Outil | Version | Usage |
|-------|---------|-------|
| **Vitest** | 4.x | Test runner |
| **Testing Library** | 16.x | Tests composants React |
| **MSW** | 2.x | Mock API (disponible) |

## Commandes

```bash
# Lancer les tests
npm test

# Mode watch (relance sur modifications)
npm run test:watch

# Rapport de couverture
npm run test:coverage

# Interface Vitest UI
npm run test:ui
```

## Structure des Tests

```text
src/
├── test/
│   ├── setup.ts           # Setup global Vitest
│   ├── utils.tsx          # Render wrapper React Query
│   └── mocks/
│       └── supabase.ts    # Mock Supabase client
├── lib/
│   └── __tests__/
│       ├── utils.test.ts  # Tests utilitaires (42 tests)
│       └── export.test.ts # Tests export CSV/Excel (15 tests)
├── hooks/
│   └── __tests__/
│       └── use-clients.test.ts # Tests hooks (9 tests)
└── components/
    ├── shared/__tests__/
    │   ├── empty-state.test.tsx   # Tests EmptyState (9 tests)
    │   └── ExportButton.test.tsx  # Tests ExportButton (11 tests)
    └── opportunites/widgets/__tests__/
        ├── AmountSelector.test.tsx      # (15 tests)
        ├── ProbabilitySlider.test.tsx   # (11 tests)
        └── InteractionTimeline.test.tsx # (13 tests)
```

## Configuration

### vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

## Mocks

### Mock Supabase

Le mock Supabase est configuré dans `src/test/mocks/supabase.ts` et utilise `vi.hoisted()` pour être disponible avant les imports.

```typescript
// Exemple d'utilisation dans un test
import { mockSupabase, mockQueryBuilder } from "@/test/mocks/supabase";

// Configurer les données de retour
mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.single.mockResolvedValue({
  data: { id: "1", nom: "Test" },
  error: null,
});
```

### Mock ResizeObserver / IntersectionObserver

Ces mocks sont configurés automatiquement dans `setup.ts` :

```typescript
// Déjà configuré dans setup.ts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

## Render Wrapper

Pour tester des composants avec React Query, utilisez le wrapper fourni :

```typescript
import { renderWithProviders } from "@/test/utils";

test("mon test", () => {
  const { getByText } = renderWithProviders(<MonComposant />);
  expect(getByText("Hello")).toBeInTheDocument();
});
```

## Conventions

### Nommage des fichiers

- `*.test.ts` ou `*.test.tsx` pour les tests
- Placer dans un dossier `__tests__/` adjacent au code testé

### Structure d'un test

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

describe("NomDuComposant", () => {
  it("should render correctly", () => {
    render(<Component />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("should handle click", async () => {
    const onClick = vi.fn();
    render(<Component onClick={onClick} />);

    await fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalled();
  });
});
```

### Bonnes pratiques

1. **Un describe par fichier** correspondant au composant/fonction testée
2. **it() décrit le comportement** en anglais (should do X when Y)
3. **Arrange-Act-Assert** : setup, action, vérification
4. **Mock minimal** : ne mocker que ce qui est nécessaire
5. **Tests indépendants** : chaque test peut s'exécuter seul

## Couverture Actuelle

| Catégorie | Tests | Statut |
|-----------|-------|--------|
| Utilitaires (`lib/utils.ts`) | 42 | ✅ |
| Export (`lib/export.ts`) | 15 | ✅ |
| Hooks (`use-clients.ts`) | 9 | ✅ |
| EmptyState | 9 | ✅ |
| ExportButton | 11 | ✅ |
| AmountSelector | 15 | ✅ |
| ProbabilitySlider | 11 | ✅ |
| InteractionTimeline | 13 | ✅ |
| **Total** | **125** | ✅ |

## Ajout de Nouveaux Tests

### Tester un utilitaire

```typescript
// src/lib/__tests__/ma-fonction.test.ts
import { describe, it, expect } from "vitest";
import { maFonction } from "../ma-fonction";

describe("maFonction", () => {
  it("should return expected value", () => {
    expect(maFonction("input")).toBe("output");
  });
});
```

### Tester un hook

```typescript
// src/hooks/__tests__/use-mon-hook.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useMonHook } from "../use-mon-hook";
import { createWrapper } from "@/test/utils";

describe("useMonHook", () => {
  it("should fetch data", async () => {
    const { result } = renderHook(() => useMonHook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### Tester un composant

```typescript
// src/components/__tests__/mon-composant.test.tsx
import { render, screen } from "@testing-library/react";
import { MonComposant } from "../MonComposant";

describe("MonComposant", () => {
  it("should render title", () => {
    render(<MonComposant title="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
```

---

*Dernière mise à jour : 24 décembre 2025*
