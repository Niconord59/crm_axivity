# Quickstart: Interface Web CRM Axivity

**Feature**: 001-crm-axivity-interface
**Date**: 2025-12-14

## Prerequisites

- Node.js 18.x ou supérieur
- npm ou pnpm
- Clé API Airtable (avec accès à la base `appEf6JtWFdfLwsU6`)

## Setup Initial

### 1. Créer le projet Next.js

```bash
npx create-next-app@latest crm-axivity-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd crm-axivity-app
```

### 2. Installer les dépendances

```bash
# UI Components
npx shadcn@latest init
# Choisir: New York style, Slate color, CSS variables: yes

# Shadcn components
npx shadcn@latest add button card input select checkbox table badge avatar progress skeleton dialog alert-dialog sheet tabs toast tooltip dropdown-menu command breadcrumb calendar form textarea separator scroll-area navigation-menu toggle switch popover

# State management & data fetching
npm install @tanstack/react-query

# Drag and drop
npm install @hello-pangea/dnd

# Charts
npm install recharts

# Calendar
npm install react-big-calendar date-fns

# Forms
npm install react-hook-form @hookform/resolvers zod

# File parsing (for lead import)
npm install xlsx papaparse
npm install -D @types/papaparse

# Dev dependencies
npm install -D @types/react-big-calendar
```

### 3. Configuration environnement

Créer `.env.local`:
```env
NEXT_PUBLIC_AIRTABLE_API_KEY=pat_xxxxxxxxxxxxx
NEXT_PUBLIC_AIRTABLE_BASE_ID=appEf6JtWFdfLwsU6
```

### 4. Structure initiale

```bash
# Créer les dossiers
mkdir -p src/lib/hooks
mkdir -p src/types
mkdir -p src/components/{layout,dashboard,projets,opportunites,taches,clients,factures,equipe,shared}
mkdir -p src/app/\(auth\)/{login,register}
mkdir -p src/app/\(dashboard\)/{projets,opportunites,taches,clients,factures,equipe,rapports}
mkdir -p src/app/\(dashboard\)/projets/\[id\]
mkdir -p src/app/\(dashboard\)/clients/\[id\]
mkdir -p src/app/\(dashboard\)/taches/calendrier
mkdir -p src/app/\(dashboard\)/factures/relances
mkdir -p src/app/\(dashboard\)/equipe/charge
mkdir -p src/app/portail/\[clientId\]/{projets,factures}
```

## Fichiers de Base

### lib/airtable-tables.ts

```typescript
export const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!;
export const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY!;

export const TABLES = {
  CLIENTS: 'tbljVwWGbg2Yq9toR',
  CONTACTS: 'tblNHBh9qBi6OeFca',
  OPPORTUNITES: 'tbl8QiX8vGLQfRu0G',
  PROJETS: 'tblwNbd9Lk8SxixAI',
  TACHES: 'tbl6x2Ju4HJyh8SW2',
  FACTURES: 'tbl0d2o8Df9Sj827M',
  INTERACTIONS: 'tblUoIhmQVr3ie5BQ',
  EQUIPE: 'tblozWfDZEFW3Nkwv',
} as const;
```

### lib/airtable.ts

```typescript
import { AIRTABLE_BASE_ID, AIRTABLE_API_KEY } from './airtable-tables';

const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

interface AirtableRecord<T> {
  id: string;
  createdTime: string;
  fields: T;
}

interface AirtableResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

class AirtableError extends Error {
  constructor(
    public status: number,
    public type: string,
    message: string
  ) {
    super(message);
    this.name = 'AirtableError';
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '30', 10);
      await sleep(retryAfter * 1000);
      continue;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new AirtableError(
        response.status,
        error.error?.type || 'UNKNOWN',
        error.error?.message || 'Unknown error'
      );
    }

    return response;
  }
  throw new AirtableError(429, 'RATE_LIMIT', 'Rate limit exceeded after retries');
}

export async function fetchRecords<T>(
  tableId: string,
  params?: Record<string, string>
): Promise<(T & { id: string })[]> {
  const searchParams = new URLSearchParams(params);
  const url = `${BASE_URL}/${tableId}?${searchParams}`;

  const response = await fetchWithRetry(url, { method: 'GET' });
  const data: AirtableResponse<T> = await response.json();

  return data.records.map(record => ({
    id: record.id,
    ...record.fields,
  }));
}

export async function fetchRecord<T>(
  tableId: string,
  recordId: string
): Promise<T & { id: string }> {
  const url = `${BASE_URL}/${tableId}/${recordId}`;

  const response = await fetchWithRetry(url, { method: 'GET' });
  const record: AirtableRecord<T> = await response.json();

  return {
    id: record.id,
    ...record.fields,
  };
}

export async function createRecord<T>(
  tableId: string,
  fields: Partial<T>
): Promise<T & { id: string }> {
  const url = `${BASE_URL}/${tableId}`;

  const response = await fetchWithRetry(url, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
  const record: AirtableRecord<T> = await response.json();

  return {
    id: record.id,
    ...record.fields,
  };
}

export async function updateRecord<T>(
  tableId: string,
  recordId: string,
  fields: Partial<T>
): Promise<T & { id: string }> {
  const url = `${BASE_URL}/${tableId}/${recordId}`;

  const response = await fetchWithRetry(url, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
  const record: AirtableRecord<T> = await response.json();

  return {
    id: record.id,
    ...record.fields,
  };
}

export async function deleteRecord(
  tableId: string,
  recordId: string
): Promise<void> {
  const url = `${BASE_URL}/${tableId}/${recordId}`;
  await fetchWithRetry(url, { method: 'DELETE' });
}
```

### app/providers.tsx

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
```

### app/layout.tsx

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CRM Axivity',
  description: 'Cockpit opérationnel pour Agence IA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Lancer le projet

```bash
npm run dev
```

Ouvrir http://localhost:3000

## Vérification

- [ ] Page d'accueil s'affiche
- [ ] Pas d'erreur console
- [ ] Variables d'environnement chargées
- [ ] Requête Airtable test réussie (ajouter un console.log temporaire)

## Prochaines étapes

1. Implémenter les composants layout (Sidebar, Header, MobileNav)
2. Créer le dashboard avec les KPIs
3. Développer les pages par ordre de priorité (P1 → P2 → P3)

Voir `tasks.md` pour la liste complète des tâches d'implémentation.
