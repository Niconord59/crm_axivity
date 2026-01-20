# CRM Axivity

Operational cockpit for an AI Agency - managing the entire client lifecycle: prospecting, sales pipeline, project execution, invoicing, and client retention.

## Project Structure

```
CRM_Axivity/
├── crm/                    # Next.js application (production code)
├── supabase/               # Database infrastructure (migrations)
├── workflows/              # Automations (N8N)
├── docs/                   # Documentation
├── .github/                # CI/CD
└── .claude/, _bmad/        # AI tooling
```

## Quick Start

```bash
# Install dependencies
cd crm && npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Tech Stack

| Technology | Version |
|------------|---------|
| Next.js | 16.x (Turbopack) |
| React | 19.x |
| Supabase | Self-hosted |
| Tailwind CSS | 3.x |
| Shadcn/UI | Latest |

## Documentation

- [Architecture](docs/architecture/architecture.md)
- [API Contracts](docs/architecture/api-contracts.md)
- [Data Models](docs/architecture/data-models.md)
- [Feature Specs](docs/specs/)

## Deployment

- **CRM**: `https://crm.axivity.cloud`
- **Supabase**: `https://supabase.axivity.cloud`
- **CI/CD**: GitHub Actions → Coolify
