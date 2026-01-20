---
stepsCompleted: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - docs/index.md
  - docs/architecture.md
  - docs/api-contracts.md
  - docs/data-models.md
  - docs/hooks-reference.md
  - docs/components-catalog.md
  - docs/TESTING.md
  - specs/001-crm-axivity-interface/research.md
  - docs/project-scan-report.json
workflowType: 'prd'
lastStep: 11
projectType: 'brownfield'
---

# Product Requirements Document - Interface

**Author:** Nicolas
**Date:** 2026-01-06
**Status:** ✅ Complete

---

## Executive Summary

### Vision

CRM Axivity Phase 2 transforms the existing operational cockpit into a comprehensive, AI-powered business management platform for AI agencies. This major enhancement brings 26 new features across 7 categories, positioning Axivity as the first CRM that "practices what it preaches" - an AI agency tool that leverages AI throughout its own operations.

### Strategic Positioning

CRM Axivity becomes the first self-hosted, AI-native CRM specifically designed for AI agencies. By demonstrating AI capabilities through actual daily usage, the platform serves as living proof of the agency's technical expertise - turning the internal tool into a competitive differentiator.

### Problem Statement

While CRM Axivity successfully manages the client lifecycle from prospecting to invoicing, several gaps remain:

1. **Manual Intelligence** - Sales teams manually prioritize leads and draft communications without AI assistance
2. **Limited Mobility** - Field sales lack mobile-optimized access to critical data
3. **Disconnected Workflows** - Document signing, payments, and accounting require external tools
4. **Reactive Management** - No predictive analytics or automated recommendations
5. **Basic Client Portal** - Clients cannot self-serve for payments, support, or real-time project tracking

### Solution Overview

Phase 2 delivers a unified platform enhancement with:

- **AI-Native Operations** - Lead scoring, email suggestions, meeting summaries, and next-best-action recommendations powered by LLMs
- **Predictive Analytics** - Sales forecasting, customizable dashboards, and automated reporting
- **Enhanced Collaboration** - Internal comments, activity feeds, push notifications, and Slack/Teams integration
- **Mobile-First PWA** - Installable app with offline capabilities and touch-optimized quick actions
- **Document Lifecycle** - Templates, e-signatures (Yousign/DocuSign), versioning, and contract management
- **Self-Service Portal** - Enhanced client portal with Stripe payments, support tickets, and automated NPS
- **Open Platform** - Public REST API, webhooks, LinkedIn import, and accounting sync

### Target Users

**5 rôles système** : `admin`, `developpeur_nocode`, `developpeur_automatisme`, `commercial`, `client`

| User Type | Rôle Système | Primary Benefits |
|-----------|--------------|------------------|
| **Commercial** | `commercial` | AI-assisted prospecting, mobile access, faster deal closing |
| **Développeur NoCode** | `developpeur_nocode` | Project management, team workload, client delivery |
| **Développeur Automatisme** | `developpeur_automatisme` | Project management, team workload, client delivery |
| **Admin** | `admin` | Forecasting, team metrics, API integrations, system config |
| **Client** | `client` | Self-service portal, online payments, real-time project visibility |

### What Makes This Special

1. **AI Agency Dogfooding** - An AI agency CRM that demonstrates AI capabilities in its own operations
2. **End-to-End Automation** - From lead scoring to payment collection without leaving the platform
3. **Self-Hosted Control** - Full data sovereignty with Supabase on Coolify infrastructure
4. **Modern DX/UX** - Built on Next.js 16 + React 19 with consistent Shadcn/UI design system

---

## Project Classification

| Attribute | Value |
|-----------|-------|
| **Technical Type** | Web Application (SaaS B2B) |
| **Domain** | Business Management / CRM |
| **Complexity** | High (26 features, AI integration, payments, APIs) |
| **Project Context** | Brownfield - Extending existing Next.js 16 + Supabase system |

### Phased Delivery Roadmap

| Phase | Focus | Key Features | Rationale |
|-------|-------|--------------|-----------|
| **Phase 1: Quick Wins** | Collaboration & Visibility | C1, C3, B4, A2 | High impact, moderate effort |
| **Phase 2: Core AI** | Intelligence Layer | A1, A3, A4, B1, B2, B3 | Key differentiator |
| **Phase 3: Revenue** | Monetization | E2, F2, G1, G2 | Business model enhancement |
| **Phase 4: Mobile** | Field Sales | D1, D2, D3 | Complete mobile experience |
| **Phase 5: Ecosystem** | Integrations | C4, E1, E3, E4, F1, F3, F4, G3, G4 | Platform completion |

### Architectural Considerations

The existing architecture provides a solid foundation:

- **Frontend**: Next.js 16 App Router with 91 existing components (Shadcn/UI)
- **State Management**: React Query with 23 custom hooks
- **Backend**: Supabase with 21 PostgreSQL tables and RLS
- **Integrations**: Google/Microsoft OAuth, Resend email, N8N workflows

New infrastructure requirements:

| Capability | Technology Options | Purpose |
|------------|-------------------|---------|
| AI Services | OpenAI / Anthropic API | Intelligent features (A1-A4) |
| Job Queue | BullMQ / Supabase Edge Functions | Async AI processing, webhooks |
| Payments | Stripe Connect | Invoice payments (F2) |
| E-Signatures | Yousign / DocuSign | Document signing (E2) |
| Real-time | Supabase Realtime | Activity feeds, notifications |

### UX Consistency Commitment

All 26 features will:
- Follow the existing Shadcn/UI (new-york style) design system
- Implement progressive disclosure to avoid overwhelming users
- Support touch-first interactions for mobile features
- Include contextual onboarding for feature discovery

---

## Feature Scope Summary

| Category | Features | Complexity | Phase |
|----------|----------|------------|-------|
| A. AI & Automation | 4 | High | 1-2 |
| B. Analytics & Reporting | 4 | Medium | 1-2 |
| C. Communication & Collaboration | 4 | Medium | 1, 5 |
| D. Mobile Experience | 3 | Medium | 4 |
| E. Document Management | 4 | Medium-High | 3, 5 |
| F. Client Portal & Self-Service | 4 | Medium-High | 3, 5 |
| G. Integrations & API | 4 | High | 3, 5 |
| **Total** | **26** | **High** | 1-5 |

### Feature List by Category

#### A. AI & Automation (4 features)
- **A1. Lead Scoring IA** - Automatic prospect scoring based on behavior and data
- **A2. Email Suggestions IA** - AI-generated follow-up email drafts
- **A3. Meeting Summaries IA** - Automatic transcription and summary of meetings
- **A4. Next Best Action IA** - AI recommendations based on history

#### B. Analytics & Reporting (4 features)
- **B1. Sales Forecast** - Pipeline-based revenue predictions
- **B2. Customizable Dashboard** - Drag & drop KPI widgets
- **B3. Automated Reports** - Weekly/monthly email reports
- **B4. Performance by Commercial** - Individual metrics (calls, conversions, revenue)

#### C. Communication & Collaboration (4 features)
- **C1. Internal Comments** - Discussion threads on opportunities/projects
- **C2. Activity Feed** - Real-time activity timeline per client
- **C3. Push Notifications** - Browser alerts for critical events
- **C4. Slack/Teams Integration** - Team channel notifications

#### D. Mobile Experience (3 features)
- **D1. PWA Mobile** - Installable smartphone application
- **D2. Offline Mode** - Data consultation without connection
- **D3. Quick Actions Mobile** - Log call, create note in 2 taps

#### E. Document Management (4 features)
- **E1. Document Templates** - Customizable templates (contracts, proposals)
- **E2. Electronic Signature** - DocuSign/Yousign integration
- **E3. Quote Versioning** - Version history with comparison
- **E4. Contract Management** - Contract tracking with renewal alerts

#### F. Client Portal & Self-Service (4 features)
- **F1. Enhanced Client Portal** - Real-time project, invoices, documents tracking
- **F2. Online Payment** - Stripe integration for invoice payment
- **F3. Support Requests** - Ticket system from portal
- **F4. Automated Feedback** - Automatic post-project NPS collection

#### G. Integrations & API (4 features)
- **G1. Public REST API** - API for external integrations
- **G2. Real-time Webhooks** - Real-time notifications to third-party systems
- **G3. LinkedIn Import** - Contact enrichment from LinkedIn
- **G4. Accounting Sync** - Export to Pennylane/QuickBooks

---

## Success Criteria

### User Success

#### Commercial (`commercial`)

| Metric | Current State | Target | Improvement | Related Feature |
|--------|---------------|--------|-------------|-----------------|
| Average lead qualification time | 15 min | 9 min | -40% | A1 - Lead Scoring AI |
| Follow-up email drafting time | 10 min | 4 min | -60% | A2 - Email Suggestions AI |
| Leads processed per day | Baseline | +30% | +30% | A4 - Next Best Action |
| Internal NPS (sales team satisfaction) | N/A | ≥ 40 | New metric | All features |
| Mobile sessions per week | 0 | ≥ 3/user | New capability | D1, D2, D3 - PWA |

**Success moment:** Sales rep receives AI-suggested email, sends it with minor edits, and closes follow-up in under 2 minutes instead of 10.

#### Admin (`admin`)

| Metric | Current State | Target | Improvement | Related Feature |
|--------|---------------|--------|-------------|-----------------|
| Forecast accuracy vs actual | Manual estimates | ≥ 85% | New capability | B1 - Sales Forecast |
| Weekly reporting preparation time | 2 hours | 25 min | -80% | B3 - Automated Reports |
| Team performance visibility | Delayed | Real-time 100% | New capability | B4 - Performance Metrics |
| Custom dashboard adoption | N/A | 100% admins | New capability | B2 - Customizable Dashboard |

**Success moment:** Admin opens Monday meeting with auto-generated report already in inbox, spends time coaching instead of compiling data.

#### Client (`client`)

| Metric | Current State | Target | Improvement | Related Feature |
|--------|---------------|--------|-------------|-----------------|
| Support questions avoided (self-service) | Baseline | -50% | -50% | F1 - Enhanced Portal |
| Average invoice payment delay | Baseline | -10 days | Faster cash flow | F2 - Stripe Payments |
| Portal satisfaction (CSAT) | N/A | ≥ 4.5/5 | New metric | F1, F2, F3 |
| Portal adoption rate | N/A | ≥ 80% active clients | New capability | F1 |

**Success moment:** Client receives invoice notification, clicks "Pay Now", completes payment in 30 seconds without contacting the agency.

---

### Business Success

#### Phase 1 - Quick Wins (Month 3)

| Metric | Target | Validation Purpose |
|--------|--------|-------------------|
| Team adoption of collaboration features (C1, C3) | ≥ 70% | Validates engagement and daily use |
| Internal comments created per week | ≥ 50 | Proves C1 utility |
| AI-generated emails used (sent or edited) | ≥ 30% | Validates A2 quick win |
| Push notification opt-in rate | ≥ 80% | Validates C3 value |

**Phase 1 Success Gate:** 70% team adoption + 30% AI email utilization

#### Phase 2 - Core AI (Month 6)

| Metric | Target | Validation Purpose |
|--------|--------|-------------------|
| Pipeline conversion rate | +15% | Measures AI impact on sales |
| Qualified leads per month | +25% | Validates Lead Scoring effectiveness |
| Sales cycle duration | -20% | Measures overall AI efficiency |
| AI suggestion utilization rate | ≥ 60% | Validates AI feature adoption |

**Phase 2 Success Gate:** +15% conversion rate + 60% AI utilization

#### Phase 3 - Revenue (Month 9)

| Metric | Target | Validation Purpose |
|--------|--------|-------------------|
| Invoices paid online | ≥ 40% | Validates Stripe adoption |
| Average collection delay | -30% | Measures cash flow improvement |
| Quotes signed electronically | ≥ 60% | Validates e-signature adoption |
| Quote-to-signature time | -40% | Measures closing acceleration |

**Phase 3 Success Gate:** 40% online payments + 60% e-signatures

#### Phase 4-5 - Mobile & Ecosystem (Month 12)

| Metric | Target | Validation Purpose |
|--------|--------|-------------------|
| PWA sessions per month | ≥ 500 | Validates mobile adoption |
| Active API integrations | ≥ 3 clients | Validates API value |
| Accounting sync adoption | ≥ 50% clients | Validates G4 utility |
| Overall client NPS | ≥ 50 | Measures global satisfaction |

**Phase 4-5 Success Gate:** NPS ≥ 50 + API adopted by clients

---

### Technical Success

#### Performance Requirements

| Metric | Target | Category |
|--------|--------|----------|
| AI feature response time | < 3 seconds | Performance |
| Client portal uptime | ≥ 99.5% | Reliability |
| Public API response time (p95) | < 500ms | Performance |
| Webhook delivery success rate | ≥ 99% | Reliability |
| PWA Time to Interactive | < 3 seconds | Mobile Performance |

#### Quality Requirements

| Metric | Target | Category |
|--------|--------|----------|
| Test coverage for new features | ≥ 80% | Quality |
| CI/CD build time | < 5 minutes | Developer Experience |
| Critical production errors per week | < 5 | Stability |
| Mean Time to Recovery (MTTR) | < 1 hour | Resilience |
| Lighthouse PWA score | ≥ 90 | Mobile Quality |

#### Security Requirements

| Metric | Target | Category |
|--------|--------|----------|
| Authentication success rate | ≥ 99.9% | Security |
| API rate limiting effectiveness | 100% enforced | Security |
| Data encryption at rest and transit | 100% | Compliance |
| Stripe PCI compliance | Maintained | Payments |

---

### Measurable Outcomes Summary

| Horizon | Primary KPI | Target | Secondary KPI | Target |
|---------|-------------|--------|---------------|--------|
| **Month 3** | Team adoption | ≥ 70% | AI email usage | ≥ 30% |
| **Month 6** | Pipeline conversion | +15% | AI utilization | ≥ 60% |
| **Month 9** | Online payments | ≥ 40% | E-signatures | ≥ 60% |
| **Month 12** | Client NPS | ≥ 50 | API clients | ≥ 3 |

---

## Product Scope

### MVP - Phase 1 (Quick Wins)

**Minimum features required to validate the concept:**

| Feature | Priority | Justification |
|---------|----------|---------------|
| C1 - Internal Comments | Must Have | Immediate collaboration value, moderate effort |
| C3 - Push Notifications | Must Have | Real-time engagement, low effort |
| B4 - Performance per Commercial | Must Have | Critical manager visibility |
| A2 - AI Email Suggestions | Must Have | Visible AI quick win, proves "dogfooding" |

**MVP Success Criteria:**
- 70% team adoption within 4 weeks of launch
- 30% of follow-up emails use AI suggestions
- Positive internal feedback (NPS > 20)

**MVP Exclusions:**
- Full AI suite (A1, A3, A4) - requires more infrastructure
- Payment integration - requires Stripe setup
- Mobile PWA - requires additional development

---

### Growth Features (Post-MVP)

**Features that make the product competitive:**

| Feature | Phase | Strategic Value |
|---------|-------|-----------------|
| A1 - Lead Scoring AI | Phase 2 | Key differentiator for AI agency |
| A3 - Meeting Summaries AI | Phase 2 | Demonstrates advanced AI capability |
| A4 - Next Best Action AI | Phase 2 | Completes AI-native positioning |
| B1 - Sales Forecast | Phase 2 | Manager must-have |
| B2 - Customizable Dashboard | Phase 2 | Flexibility for different roles |
| B3 - Automated Reports | Phase 2 | Time-saving for managers |
| E2 - Electronic Signature | Phase 3 | Accelerates deal closing |
| F2 - Stripe Payments | Phase 3 | Direct revenue impact |
| G1 - Public REST API | Phase 3 | Opens ecosystem |
| G2 - Webhooks | Phase 3 | Enables integrations |

**Growth Success Criteria:**
- +15% pipeline conversion rate
- 40% invoices paid online
- 60% quotes signed electronically

---

### Vision (Future)

**The complete platform dream:**

| Feature | Phase | Long-term Value |
|---------|-------|-----------------|
| D1 - PWA Mobile | Phase 4 | 100% mobile-enabled team |
| D2 - Offline Mode | Phase 4 | Field sales reliability |
| D3 - Quick Actions Mobile | Phase 4 | Productivity on the go |
| C4 - Slack/Teams Integration | Phase 5 | Workflow integration |
| E1 - Document Templates | Phase 5 | Consistency and efficiency |
| E3 - Quote Versioning | Phase 5 | Audit trail and comparison |
| E4 - Contract Management | Phase 5 | Complete document lifecycle |
| F1 - Enhanced Client Portal | Phase 5 | Full self-service |
| F3 - Support Tickets | Phase 5 | Client support channel |
| F4 - Automated NPS | Phase 5 | Continuous feedback |
| G3 - LinkedIn Import | Phase 5 | Data enrichment |
| G4 - Accounting Sync | Phase 5 | Financial workflow |

**Vision Success Criteria:**
- NPS ≥ 50 across all client segments
- API adopted by external clients
- Platform recognized as "AI-native CRM" in market

---

## User Journeys

### Journey 1 : Lucas Martin, Commercial Terrain

**Persona** : Lucas, 28 ans, commercial terrain, équipé d'un smartphone et d'un laptop

**Contexte** : Lundi matin, Lucas consulte son pipeline depuis le train vers un client.

Lucas ouvre l'application PWA (**D1**) sur son iPhone. Même avec une connexion intermittente dans le tunnel, les données se chargent instantanément grâce au mode **Offline** (**D2**). Il voit immédiatement ses opportunités triées par score IA (**A1**) - les leads les plus "chauds" en haut.

Une notification push (**C3**) apparaît : "Biotech SA a ouvert votre devis 3 fois ce matin". Lucas tape sur la notification, ouvre l'opportunité, et voit la suggestion d'email générée par l'IA (**A2**) : "Bonjour M. Dupont, j'ai remarqué votre intérêt pour notre proposition...". Il édite légèrement le ton, appuie sur Envoyer.

En arrivant chez le client, il utilise **Quick Actions** (**D3**) pour logger son appel en 2 taps : "RDV effectué - Intéressé budget Q2". L'IA analyse l'historique et suggère la **Next Best Action** (**A4**) : "Planifier une démo technique avec le CTO dans les 5 jours".

**Features couvertes** : A1, A2, A4, D1, D2, D3, C3

---

### Journey 2 : Sophie Durand, Admin (Directrice Commerciale)

**Persona** : Sophie, 42 ans, directrice commerciale, rôle `admin` dans le CRM

**Contexte** : Lundi 8h30, préparation de la réunion d'équipe hebdomadaire.

Sophie ouvre son **Dashboard personnalisé** (**B2**) qu'elle a configuré avec ses KPIs favoris : pipeline par commercial, taux de conversion, CA prévisionnel. Elle drag & drop un nouveau widget "Leads en retard" pour surveiller la vélocité.

Le **Sales Forecast** (**B1**) affiche une prévision de 127k€ pour le trimestre avec un intervalle de confiance de 85%. L'algorithme a détecté que 3 opportunités risquent de glisser au mois suivant.

Elle consulte les **Performance par Commercial** (**B4**) : Lucas excelle en conversion (45%), mais Marie a un pipeline plus large. Elle prépare ses points de coaching individuels.

À 9h, son **Rapport automatique** (**B3**) arrive en inbox : résumé de la semaine précédente, comparaison vs objectifs, alertes automatiques. Elle le forward à la direction en ajoutant un commentaire.

Pendant la réunion, elle utilise les **Internal Comments** (**C1**) pour assigner des actions : "@Lucas vérifier budget Biotech avant jeudi".

**Features couvertes** : B1, B2, B3, B4, C1

---

### Journey 3 : Thomas Petit, Admin Technique

**Persona** : Thomas, 35 ans, responsable technique et administrateur CRM

**Contexte** : Mise en place d'intégrations avec l'écosystème existant.

Thomas configure l'**API REST publique** (**G1**) pour connecter le CRM au site web de l'agence. Il génère une clé API, consulte la documentation Swagger, et teste les endpoints. En 2 heures, le formulaire de contact du site crée automatiquement des leads dans le CRM.

Il configure ensuite les **Webhooks** (**G2**) pour notifier leur outil de BI interne à chaque nouvelle opportunité gagnée. Le JSON payload est personnalisable, il map les champs selon leurs besoins.

Pour la comptabilité, il active la **synchronisation Pennylane** (**G4**). Les factures validées sont automatiquement exportées avec le bon plan comptable. Catherine (comptable) n'a plus besoin de ressaisir les données.

Enfin, il connecte **Slack** (**C4**) : les deals > 50k€ déclenchent une notification dans #sales-wins avec les détails et un lien direct vers l'opportunité.

**Features couvertes** : G1, G2, G4, C4

---

### Journey 4 : Marie Leblanc, Cliente de l'Agence

**Persona** : Marie, 45 ans, directrice marketing d'une PME cliente depuis 2 ans

**Contexte** : Suivi de son projet de chatbot IA en cours de développement.

Marie reçoit un email avec un lien vers le **Portail Client amélioré** (**F1**). Elle se connecte et voit immédiatement : son projet à 65% d'avancement, les 3 dernières tâches terminées, et la prochaine échéance.

Elle consulte sa dernière facture de 15 000€. Plutôt que d'initier un virement bancaire, elle clique sur "Payer maintenant" et utilise le **paiement Stripe** (**F2**). En 30 secondes, la facture est réglée par carte. Elle télécharge le reçu PDF pour sa comptabilité.

Une question sur une fonctionnalité du chatbot ? Elle ouvre un **ticket support** (**F3**) directement depuis le portail. L'équipe reçoit une notification et répond dans l'heure.

Le projet se termine. 48h après la livraison, Marie reçoit un email **NPS automatique** (**F4**) : "Comment évaluez-vous votre expérience ?" Elle donne 9/10 et suggère une amélioration pour la prochaine fois.

**Features couvertes** : F1, F2, F3, F4

---

### Journey 5 : Julie Moreau, Développeur NoCode (Relation Client)

**Persona** : Julie, 30 ans, chargée de relation client, rôle `developpeur_nocode` dans le CRM

**Contexte** : Gestion quotidienne des demandes clients et suivi des projets.

Julie démarre sa journée en consultant l'**Activity Feed** (**C2**) de ses clients assignés. Elle voit en temps réel : "Projet TechCorp - Tâche 'Design maquettes' terminée il y a 2h", "Client DataFlow - Nouveau commentaire sur le ticket #234".

Une notification push (**C3**) l'alerte : "Ticket urgent - Client VIP". Elle ouvre le **ticket support** (**F3**) et voit l'historique complet des échanges. Elle ajoute un **commentaire interne** (**C1**) pour le développeur : "@Alex peux-tu vérifier le bug mentionné ?".

Elle utilise le feed d'activité pour préparer ses appels de suivi hebdomadaires, voyant d'un coup d'œil ce qui s'est passé sur chaque compte.

**Features couvertes** : C1, C2, C3, F3

---

### Journey 6 : Alexandre Chen, Développeur Automatisme (Intégrateur)

**Persona** : Alexandre, 32 ans, développeur full-stack, rôle `developpeur_automatisme` dans le CRM

**Contexte** : Intégration du CRM Axivity avec le SI du client.

Alexandre consulte la documentation de l'**API REST** (**G1**). Il apprécie la structure RESTful claire, les exemples de code, et le playground interactif pour tester les endpoints.

Il configure les **Webhooks** (**G2**) pour synchroniser les contacts entre le CRM Axivity et le CRM interne de son client. Chaque nouveau contact déclenche un webhook qui alimente leur base.

Il développe un petit dashboard interne qui agrège les données de plusieurs sources, dont l'API Axivity. Le rate limiting et l'authentification JWT sont bien documentés, l'intégration prend 2 jours au lieu d'une semaine estimée.

**Features couvertes** : G1, G2

---

### Journey 7 : Catherine Dupont, Admin (Comptable)

**Persona** : Catherine, 50 ans, responsable comptable, rôle `admin` dans le CRM

**Contexte** : Clôture mensuelle et rapprochement des factures.

Catherine ouvre Pennylane et constate que toutes les factures CRM sont déjà synchronisées grâce à l'**Accounting Sync** (**G4**). Les écritures comptables sont automatiquement générées avec le bon plan comptable.

Elle vérifie la correspondance : 45 factures émises ce mois, 45 écritures dans Pennylane. Les codes analytiques (par projet) sont corrects. Elle économise 4 heures de saisie manuelle.

Pour les factures payées en ligne (Stripe), le rapprochement bancaire est automatique. Elle peut se concentrer sur l'analyse plutôt que la saisie.

**Features couvertes** : G4

---

### Journey 8 : Lucas en RDV Client (Meeting Summaries)

**Persona** : Lucas Martin, Commercial (suite du Journey 1)

Lucas vient de terminer un appel de découverte de 45 minutes avec un prospect important. Avant, il passait 20 minutes à rédiger ses notes de réunion. Maintenant, grâce à **Meeting Summaries IA** (**A3**), la transcription démarre automatiquement dès le début de l'appel.

À la fin de la réunion, Lucas ouvre CRM Axivity. En moins de 30 secondes, un résumé structuré apparaît :
- **Points clés** : Budget confirmé 50k€, timeline Q2, décideur = DG
- **Actions identifiées** : Envoyer proposition technique, planifier démo
- **Sentiment détecté** : Positif, intérêt marqué pour l'IA

Lucas relit rapidement, ajoute une précision sur un concurrent mentionné, et valide. Le résumé est automatiquement attaché à l'opportunité. **Temps économisé : 15 minutes par réunion**.

**Feature couverte** : A3

---

### Journey 9 : Sophie Prépare une Proposition (Documents)

**Persona** : Sophie Durand, Admin (Directrice Commerciale)

Sophie doit envoyer une proposition commerciale à un client stratégique. Elle ouvre **Document Templates** (**E1**) et sélectionne le modèle "Proposition Agence IA - Grande Entreprise".

Le template se pré-remplit automatiquement avec les données du CRM : nom du client, contact, historique des échanges, services discutés. Sophie personnalise la partie méthodologique et ajuste les tarifs.

Avant d'envoyer, elle consulte l'historique via **Quote Versioning** (**E3**). Elle compare cette V3 avec la V2 envoyée il y a un mois : le client avait demandé plus de support, elle vérifie que c'est bien inclus. Un diff visuel lui montre les changements en surbrillance.

Satisfaite, elle envoie la proposition avec **Electronic Signature (DocuSign)** (**E2**). Le client reçoit un email professionnel, peut signer en 3 clics sur son mobile. Sophie reçoit une notification push dès la signature.

**Features couvertes** : E1, E2, E3

---

### Journey 10 : Thomas Gère les Contrats

**Persona** : Thomas Petit, Admin (suite du Journey 3)

Chaque lundi matin, Thomas consulte son tableau de bord **Contract Management** (**E4**). Ce matin, trois alertes l'attendent :

1. **Contrat Biotech SA** - Renouvellement dans 60 jours
2. **Contrat Fintech Corp** - Option d'extension non exercée (J-30)
3. **Contrat Retail Plus** - Échéance dans 15 jours, aucune action

Pour Biotech SA, Thomas clique sur "Préparer renouvellement". Le système génère automatiquement un avenant de reconduction avec les mêmes conditions +3% (indexation configurée). Il assigne la validation au commercial concerné.

Pour Retail Plus (urgent), il appelle directement le client depuis le CRM. L'appel est tracé, le client confirme vouloir continuer. Thomas planifie l'envoi du nouveau contrat via e-signature.

**Fin du trimestre** : zéro contrat oublié, 100% de reconductions traitées dans les temps.

**Feature couverte** : E4

---

### Journey 11 : Alexandre Enrichit les Leads (LinkedIn)

**Persona** : Alexandre Chen, Développeur (suite du Journey 6)

L'équipe commerciale a importé 200 leads d'un salon professionnel. Les données sont partielles : nom, entreprise, email. Sophie demande à Alexandre d'enrichir ces contacts.

Alexandre configure **LinkedIn Import** (**G3**) via le panneau admin. Il mappe les emails aux profils LinkedIn Sales Navigator. Le processus s'exécute en arrière-plan.

30 minutes plus tard, les résultats sont impressionnants :
- **180 profils enrichis** (90% match rate)
- Données récupérées : poste actuel, ancienneté, taille entreprise, secteur
- **Lead Scoring mis à jour** : 45 leads passent automatiquement en "Hot" grâce aux signaux LinkedIn

Lucas reçoit une notification : "45 leads prioritaires enrichis depuis LinkedIn". Il commence ses appels par les leads les plus prometteurs.

**Feature couverte** : G3

---

### Couverture des Features (26/26)

| Feature | Journey | Rôle(s) |
|---------|---------|---------|
| A1 - Lead Scoring IA | Journey 1 (Lucas) | `commercial` |
| A2 - Email Suggestions IA | Journey 1 (Lucas) | `commercial` |
| A3 - Meeting Summaries IA | Journey 8 (Lucas - RDV) | `commercial` |
| A4 - Next Best Action IA | Journey 1 (Lucas) | `commercial` |
| B1 - Sales Forecast | Journey 2 (Sophie) | `admin` |
| B2 - Customizable Dashboard | Journey 2 (Sophie) | `admin` |
| B3 - Automated Reports | Journey 2 (Sophie) | `admin` |
| B4 - Performance par Commercial | Journey 2 (Sophie) | `admin` |
| C1 - Internal Comments | Journey 2, 5 (Sophie, Julie) | `admin`, `developpeur_nocode` |
| C2 - Activity Feed | Journey 5 (Julie) | `developpeur_nocode` |
| C3 - Push Notifications | Journey 1, 5 (Lucas, Julie) | `commercial`, `developpeur_nocode` |
| C4 - Slack/Teams Integration | Journey 3 (Thomas) | `admin` |
| D1 - PWA Mobile | Journey 1 (Lucas) | `commercial` |
| D2 - Offline Mode | Journey 1 (Lucas) | `commercial` |
| D3 - Quick Actions Mobile | Journey 1 (Lucas) | `commercial` |
| E1 - Document Templates | Journey 9 (Sophie) | `admin` |
| E2 - Electronic Signature | Journey 9 (Sophie) | `admin` |
| E3 - Quote Versioning | Journey 9 (Sophie) | `admin` |
| E4 - Contract Management | Journey 10 (Thomas) | `admin` |
| F1 - Enhanced Client Portal | Journey 4 (Marie) | `client` |
| F2 - Online Payment | Journey 4 (Marie) | `client` |
| F3 - Support Tickets | Journey 4, 5 (Marie, Julie) | `client`, `developpeur_nocode` |
| F4 - Automated NPS | Journey 4 (Marie) | `client` |
| G1 - Public REST API | Journey 3, 6 (Thomas, Alexandre) | `admin`, `developpeur_automatisme` |
| G2 - Webhooks | Journey 3, 6 (Thomas, Alexandre) | `admin`, `developpeur_automatisme` |
| G3 - LinkedIn Import | Journey 11 (Alexandre) | `developpeur_automatisme` |
| G4 - Accounting Sync | Journey 3, 7 (Thomas, Catherine) | `admin` |

---

## Innovation & Novel Patterns

### Detected Innovation Areas

#### 1. AI Agency Dogfooding (Innovation Majeure)

CRM Axivity représente une innovation de positionnement unique : un outil interne qui devient preuve de compétences externes.

**Le concept** : Une agence IA utilise un CRM IA qu'elle a développé, démontrant ainsi sa maîtrise technique à chaque interaction client.

**Différenciation** :
- Salesforce, HubSpot, Pipedrive : CRM généralistes sans positionnement "AI Agency"
- CRM spécialisés (agences marketing) : Focus workflows, pas IA
- CRM Axivity : Démonstration active des capacités IA de l'agence

#### 2. Self-Hosted AI Stack

Combinaison rare : souveraineté totale des données + capacités IA avancées.

**Architecture innovante** :
- Supabase self-hosted (Coolify) : Contrôle complet des données clients
- AI APIs (OpenAI/Anthropic) : Intelligence sans compromis sur la confidentialité
- Edge processing : Certains traitements IA locaux possibles

**Avantage** : Réponse aux préoccupations RGPD des clients européens tout en offrant des fonctionnalités IA de pointe.

#### 3. AI Pervasiveness (IA Omniprésente)

L'IA n'est pas un "add-on" mais le cœur de l'expérience :
- Prospection : Lead Scoring IA (A1)
- Communication : Email Suggestions (A2), Meeting Summaries (A3)
- Décision : Next Best Action (A4)
- Analyse : Sales Forecast (B1)

### Validation Approach

| Innovation | Méthode de Validation | Métrique Clé |
|------------|----------------------|--------------|
| Dogfooding | Feedback clients sur perception | "L'outil vous donne-t-il confiance dans nos compétences IA ?" |
| Self-Hosted AI | Audit sécurité + benchmark performance | Temps de réponse IA < 3s |
| AI Pervasiveness | Taux d'utilisation des features IA | ≥ 60% AI utilization |

### Risk Mitigation

| Risque | Mitigation |
|--------|------------|
| **AI Performance** | Fallback manuel pour chaque feature IA |
| **Data Privacy** | Architecture edge-first, processing local quand possible |
| **Adoption** | Onboarding progressif, features IA opt-in |
| **Dependency** | Multi-provider AI (OpenAI + Anthropic) |

---

## SaaS B2B Specific Requirements

### Tenant Model

| Attribute | Value |
|-----------|-------|
| **Model** | Single-Tenant Self-Hosted |
| **Data Isolation** | Complete (dedicated Supabase instance) |
| **Deployment** | Coolify on dedicated infrastructure |
| **Customization** | Full control over configuration |

**Rationale:** CRM Axivity is designed for internal AI agency use with full data sovereignty. Each deployment is a complete self-hosted instance.

### RBAC Matrix (Row Level Security)

**5 rôles système** : `admin`, `developpeur_nocode`, `developpeur_automatisme`, `commercial`, `client`

| Permission | admin | developpeur_nocode | developpeur_automatisme | commercial | client |
|------------|:-----:|:------------------:|:-----------------------:|:----------:|:------:|
| **Dashboard** | ✅ Full | ✅ Team | ✅ Team | ✅ Personal | ❌ |
| **Pipeline (Opportunités)** | ✅ Full | ✅ View | ✅ View | ✅ Full | ❌ |
| **Prospection** | ✅ Full | ✅ View | ✅ View | ✅ Full | ❌ |
| **Projets** | ✅ Full | ✅ Assigned | ✅ Assigned | ✅ View | 👁️ Portal |
| **Tâches** | ✅ Full | ✅ Assigned | ✅ Assigned | ✅ View | ❌ |
| **Clients** | ✅ Full | ✅ Assigned | ✅ View | ✅ Full | 👁️ Own |
| **Factures** | ✅ Full | ✅ View | ✅ View | ✅ View | 👁️ Own |
| **Équipe** | ✅ Full | ✅ View | ✅ View | ❌ | ❌ |
| **Rapports** | ✅ Full | ✅ Team | ✅ Team | ✅ Personal | ❌ |
| **Portail Client** | ✅ Manage | ❌ | ❌ | ❌ | ✅ Full |
| **API & Webhooks (G1, G2)** | ✅ Config | ❌ | ✅ Config | ❌ | ❌ |
| **Integrations (G3, G4)** | ✅ Full | ❌ | ✅ Execute | ❌ | ❌ |
| **AI Features (A1-A4)** | ✅ Full | ✅ Use | ✅ Use | ✅ Use | ❌ |
| **Settings & Admin** | ✅ Full | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Full: Complete CRUD access
- ✅ Use: Can use the feature
- ✅ View: Read-only access
- ✅ Assigned: Access to assigned items only
- ✅ Team: Access to team-related data
- ✅ Personal: Access to own data only
- ✅ Config: Can configure settings
- ✅ Execute: Can run operations
- 👁️ Portal/Own: Portal view or own data only
- ❌ No access

### Subscription Tiers (Future Consideration)

*Note: Currently single-deployment model. Subscription tiers may be relevant for future multi-tenant SaaS offering.*

| Tier | Description | AI Features | Integrations | Support |
|------|-------------|-------------|--------------|---------|
| **Internal** | Current model | All included | All enabled | Direct team |
| **Partner** (Future) | For partner agencies | Core AI | Limited | Email |
| **Enterprise** (Future) | Multi-agency | Full AI + Custom | Full + Custom | Dedicated |

### Integration List

#### Existing Integrations (Phase 1)

| Integration | Purpose | Status |
|-------------|---------|--------|
| **Google Calendar** | Calendar sync, meetings | ✅ Active |
| **Microsoft 365** | Calendar + email | ✅ Active |
| **Resend** | Transactional emails | ✅ Active |
| **N8N** | Workflow automation | ✅ Active |
| **API Gouv** | Company data enrichment | ✅ Active |
| **Google Places** | Contact enrichment | ✅ Active |

#### Phase 2 Integrations

| Integration | Feature | Phase |
|-------------|---------|-------|
| **OpenAI / Anthropic** | AI features (A1-A4) | Phase 2 |
| **Stripe Connect** | Online payments (F2) | Phase 3 |
| **Yousign / DocuSign** | E-signatures (E2) | Phase 3 |
| **LinkedIn Sales Nav** | Contact import (G3) | Phase 5 |
| **Pennylane / QuickBooks** | Accounting sync (G4) | Phase 5 |
| **Slack / Teams** | Notifications (C4) | Phase 5 |

### Compliance Requirements

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| **RGPD** | Required | Data encryption, consent management, data portability |
| **PCI-DSS** | Required (Stripe) | Handled by Stripe Connect (no card data storage) |
| **eIDAS** | Recommended | E-signature via qualified providers (Yousign/DocuSign) |
| **AI Act** | Awareness | Transparency on AI usage, human oversight on AI decisions |

### Data Retention Policy

| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| **Client data** | Indefinite (client-controlled) | Business continuity |
| **Interactions** | 7 years | Legal accounting requirements |
| **Invoices** | 10 years | French fiscal requirements |
| **Logs & audit trails** | 2 years | Security and debugging |
| **AI processing data** | 30 days | Performance optimization only |
| **Session tokens** | 24 hours | Security best practice |

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Revenue MVP + Problem-Solving MVP Hybride

L'approche combine deux stratégies :
1. **Problem-Solving** : Résoudre le manque de visibilité et collaboration (C1, C3, B4)
2. **Revenue-Ready** : Démontrer la valeur IA immédiatement (A2) pour valider le positionnement

**Resource Requirements:**

| Phase | Durée | Équipe Minimale | Compétences Clés |
|-------|-------|-----------------|------------------|
| **Phase 1 (MVP)** | 3 mois | 2 développeurs | Next.js, Supabase, React Query |
| **Phase 2 (Core AI)** | 3 mois | 2-3 développeurs | + LLM Integration, Prompt Engineering |
| **Phase 3 (Revenue)** | 3 mois | 2-3 développeurs | + Stripe, E-signatures, PDF |
| **Phase 4-5 (Mobile + Ecosystem)** | 6 mois | 3 développeurs | + PWA, Service Workers, API Design |

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Journey 2 (Sophie - Admin) : Dashboard + Performance + Comments
- Journey 1 (Lucas - Commercial) : Email Suggestions IA + Push Notifications
- Journey 5 (Julie - Développeur NoCode) : Collaboration + Activity visibility

**Must-Have Capabilities:**

| Feature | Justification | Effort |
|---------|---------------|--------|
| **C1 - Internal Comments** | Collaboration immédiate, haute valeur perçue | Medium |
| **C3 - Push Notifications** | Engagement temps réel, faible effort | Low |
| **B4 - Performance par Commercial** | Visibilité manager critique | Medium |
| **A2 - Email Suggestions IA** | Quick Win IA visible, prouve le dogfooding | Medium |

**MVP Success Criteria:**
- 70% team adoption en 4 semaines
- 30% emails utilisent les suggestions IA
- NPS interne > 20

**MVP Exclusions (avec justification):**
- A1, A3, A4 (Full AI Suite) → Infrastructure LLM requise, Phase 2
- F2 (Stripe) → Setup juridique/comptable, Phase 3
- D1-D3 (PWA) → Développement conséquent, Phase 4

### Post-MVP Features

**Phase 2 - Core AI (Month 4-6):**

| Feature | Strategic Value | Dependencies |
|---------|-----------------|--------------|
| A1 - Lead Scoring IA | Différenciateur clé | OpenAI/Anthropic API |
| A3 - Meeting Summaries | Demo avancée IA | Transcription service |
| A4 - Next Best Action | Complète le positionnement AI-native | Historique interactions |
| B1 - Sales Forecast | Must-have managers | Données pipeline suffisantes |
| B2 - Custom Dashboard | Flexibilité par rôle | Drag & drop library |
| B3 - Automated Reports | Gain de temps managers | Email scheduler |

**Phase 3 - Revenue (Month 7-9):**

| Feature | Business Impact | Dependencies |
|---------|-----------------|--------------|
| E2 - Electronic Signature | Accélère closing (-40%) | Yousign/DocuSign API |
| F2 - Online Payment | Cash flow direct | Stripe Connect setup |
| G1 - Public REST API | Ouvre l'écosystème | API versioning strategy |
| G2 - Webhooks | Enables integrations | Queue system (BullMQ) |

**Phase 4-5 - Expansion (Month 10-12):**

Mobile PWA (D1-D3), Enhanced Portal (F1, F3, F4), Slack/Teams (C4), Documents (E1, E3, E4), LinkedIn (G3), Accounting (G4)

### Risk Mitigation Strategy

#### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **AI API latency** | Medium | High | Cache responses, fallback manuel, streaming UI |
| **LLM response quality** | Medium | High | Prompt engineering, human review, feedback loop |
| **Stripe compliance** | Low | High | Use Stripe Elements (no PII handling) |
| **PWA offline complexity** | Medium | Medium | Progressive enhancement, essential data only |

#### Market Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Low AI adoption** | Medium | High | Opt-in features, demonstrate value first |
| **Feature overload** | Low | Medium | Phased rollout, contextual onboarding |
| **Competitor catch-up** | Medium | Medium | Speed to market, unique positioning |

#### Resource Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Reduced team size** | Medium | High | MVP cut: remove A2, keep C1+C3+B4 only |
| **Timeline pressure** | Medium | Medium | Phase gates with Go/No-go decisions |
| **Skill gaps (AI/ML)** | Low | Medium | OpenAI API (no ML expertise needed) |

### Contingency Plan

**If resources reduced by 50%:**
- **Super-MVP** : C1 (Comments) + C3 (Notifications) seulement
- AI features (A1-A4) reportées à budget disponible
- Paiements (F2) via workaround (lien Stripe externe)

**If timeline compressed to 6 months:**
- Phases 1-3 seulement
- Mobile (D1-D3) et Ecosystem (Phase 5) reportés
- Focus sur ROI immédiat (AI + Revenue features)

---

## Functional Requirements

### 1. AI-Powered Intelligence

#### Lead Scoring (A1)
- FR1: Commercial can view AI-generated lead scores on each prospect
- FR2: Commercial can filter and sort prospects by AI score
- FR3: System can calculate lead scores based on behavior and interaction history
- FR4: Admin can configure scoring criteria and weights

#### Email Suggestions (A2)
- FR5: Commercial can request AI-generated follow-up email drafts
- FR6: Commercial can edit AI-suggested emails before sending
- FR7: Commercial can accept or dismiss AI suggestions with feedback
- FR8: System can generate contextual emails based on interaction history

#### Meeting Summaries (A3)
- FR9: Commercial can trigger automatic transcription during calls
- FR10: System can generate structured meeting summaries with key points
- FR11: Commercial can edit and validate AI-generated summaries
- FR12: System can extract action items from meeting transcripts

#### Next Best Action (A4)
- FR13: Commercial can view AI-recommended next actions per opportunity
- FR14: System can suggest actions based on pipeline stage and history
- FR15: Commercial can execute suggested actions directly from the recommendation

---

### 2. Analytics & Reporting

#### Sales Forecast (B1)
- FR16: Admin can view pipeline-based revenue forecasts
- FR17: Admin can see forecast confidence intervals
- FR18: System can identify at-risk opportunities affecting forecast

#### Customizable Dashboard (B2)
- FR19: Admin can create personalized dashboards with drag-and-drop widgets
- FR20: Admin can configure widget data sources and visualization types
- FR21: Admin can save and share dashboard configurations

#### Automated Reports (B3)
- FR22: Admin can schedule automatic report generation (daily/weekly/monthly)
- FR23: Admin can configure report recipients and content
- FR24: System can send reports via email on schedule

#### Performance Metrics (B4)
- FR25: Admin can view performance metrics per commercial
- FR26: Admin can compare team member performance over time periods
- FR27: Admin can see conversion rates, call volumes, and revenue per commercial

---

### 3. Team Collaboration

#### Internal Comments (C1)
- FR28: All internal users can add comments on opportunities and projects
- FR29: Users can mention team members in comments with @username
- FR30: Users can see comment threads in chronological order
- FR31: System can notify mentioned users of new comments

#### Activity Feed (C2)
- FR32: Developpeur_nocode can view real-time activity feed per client
- FR33: Users can filter activity feed by activity type
- FR34: System can aggregate activities from all entity types

#### Push Notifications (C3)
- FR35: Users can receive browser push notifications for critical events
- FR36: Users can configure notification preferences by event type
- FR37: System can deliver notifications in real-time

#### Chat Integration (C4)
- FR38: Admin can configure Slack/Teams channel notifications
- FR39: System can send deal alerts to configured channels
- FR40: Users can receive formatted notifications with direct CRM links

---

### 4. Mobile Experience

#### PWA Application (D1)
- FR41: Commercial can install the application on mobile devices
- FR42: Users can access full CRM functionality from mobile browser
- FR43: System can provide responsive interface optimized for touch

#### Offline Mode (D2)
- FR44: Commercial can view critical data without internet connection
- FR45: System can sync data when connection is restored
- FR46: Users can see offline indicator when disconnected

#### Quick Actions (D3)
- FR47: Commercial can log a call in 2 taps or less
- FR48: Commercial can create a quick note from mobile
- FR49: Users can access most-used actions from mobile home screen

---

### 5. Document Management

#### Document Templates (E1)
- FR50: Admin can create and manage document templates
- FR51: System can auto-populate templates with CRM data
- FR52: Users can customize templates before generation

#### Electronic Signature (E2)
- FR53: Admin can send documents for electronic signature
- FR54: Client can sign documents electronically via secure link
- FR55: System can track signature status and notify on completion

#### Quote Versioning (E3)
- FR56: Admin can view version history of quotes
- FR57: Users can compare two quote versions side by side
- FR58: System can track changes between versions

#### Contract Management (E4)
- FR59: Admin can track active contracts with renewal dates
- FR60: System can alert users of upcoming contract renewals
- FR61: Admin can generate renewal documents from contracts

---

### 6. Client Self-Service

#### Enhanced Portal (F1)
- FR62: Client can view their projects with real-time progress
- FR63: Client can access and download their invoices and documents
- FR64: Client can see upcoming milestones and deliverables

#### Online Payment (F2)
- FR65: Client can pay invoices online via secure payment page
- FR66: System can process credit card payments via Stripe
- FR67: System can automatically mark invoices as paid after successful payment

#### Support Tickets (F3)
- FR68: Client can create support tickets from the portal
- FR69: Developpeur_nocode can manage and respond to client tickets
- FR70: Client can view ticket history and status

#### Automated Feedback (F4)
- FR71: System can send NPS surveys after project completion
- FR72: Client can submit feedback via simple survey interface
- FR73: Admin can view aggregated feedback metrics

---

### 7. Platform & Integrations

#### Public REST API (G1)
- FR74: Developpeur_automatisme can access CRM data via REST API
- FR75: Admin can generate and manage API keys
- FR76: System can enforce rate limiting on API requests
- FR77: System can provide API documentation

#### Webhooks (G2)
- FR78: Admin can configure webhooks for CRM events
- FR79: System can deliver webhook payloads in real-time
- FR80: Admin can customize webhook payload content

#### LinkedIn Import (G3)
- FR81: Developpeur_automatisme can import contacts from LinkedIn
- FR82: System can enrich existing contacts with LinkedIn data
- FR83: System can match LinkedIn profiles to existing contacts

#### Accounting Sync (G4)
- FR84: Admin can configure accounting software connection
- FR85: System can export invoices to accounting software automatically
- FR86: Admin can view sync status and resolve conflicts

---

## Non-Functional Requirements

### Performance

#### User-Facing Performance
- NFR1: Page load time (LCP) must be < 2.5 seconds on 4G connection
- NFR2: Time to Interactive (TTI) must be < 3.5 seconds on mobile devices
- NFR3: Client-side JavaScript bundle size must be < 300KB gzipped
- NFR4: Form submissions must complete within 1 second

#### AI Feature Performance
- NFR5: AI email suggestions (A2) must return within 3 seconds
- NFR6: Lead scoring calculations (A1) must complete within 5 seconds
- NFR7: Meeting summary generation (A3) must complete within 30 seconds
- NFR8: Next Best Action suggestions (A4) must return within 2 seconds

#### API Performance
- NFR9: Public API endpoints (G1) must respond within 500ms (p95)
- NFR10: Webhook delivery (G2) must occur within 5 seconds of trigger event
- NFR11: Search operations must return results within 1 second

---

### Security

#### Data Protection
- NFR12: All data must be encrypted at rest (AES-256)
- NFR13: All data in transit must use TLS 1.3
- NFR14: Database connections must use SSL certificates
- NFR15: Sensitive data (API keys, tokens) must be stored in encrypted secrets

#### Authentication & Authorization
- NFR16: Session tokens must expire after 24 hours of inactivity
- NFR17: API keys must support revocation and rotation
- NFR18: Failed login attempts must be rate-limited (5 per minute)
- NFR19: RLS policies must enforce role-based data isolation

#### Compliance
- NFR20: System must comply with RGPD requirements (consent, data portability, right to erasure)
- NFR21: Payment processing must use Stripe Elements (PCI-DSS compliance)
- NFR22: Audit logs must be maintained for 2 years
- NFR23: E-signatures must use qualified providers (eIDAS compliance)

---

### Reliability

#### Availability
- NFR24: Client portal (F1) must maintain 99.5% uptime
- NFR25: API endpoints (G1) must maintain 99.9% uptime during business hours
- NFR26: Critical production errors must be < 5 per week
- NFR27: Mean Time to Recovery (MTTR) must be < 1 hour

#### Data Integrity
- NFR28: Webhook delivery success rate must be ≥ 99%
- NFR29: Payment processing must achieve 99.9% success rate
- NFR30: Database backups must occur daily with 7-day retention
- NFR31: Offline data sync (D2) must achieve eventual consistency within 5 minutes

---

### Integration

#### External Service Dependencies
- NFR32: AI API failures must gracefully degrade with manual fallback
- NFR33: Stripe integration must handle webhook retries automatically
- NFR34: LinkedIn import (G3) must support rate limiting and pagination
- NFR35: Accounting sync (G4) must include conflict detection and resolution

#### API Standards
- NFR36: Public API must follow RESTful conventions
- NFR37: API must return consistent error formats (JSON with error codes)
- NFR38: API must support pagination for all list endpoints
- NFR39: API documentation must be OpenAPI 3.0 compliant

---

### Scalability

#### Capacity Planning
- NFR40: System must support 10 concurrent users without performance degradation
- NFR41: System must handle 1000 API requests per hour per client
- NFR42: Database must support 100,000 records per table
- NFR43: PDF generation must support 50 documents per hour

#### Growth Readiness
- NFR44: Architecture must support future multi-tenant deployment
- NFR45: AI provider must be switchable (OpenAI ↔ Anthropic) without code changes
- NFR46: Queue system must support horizontal scaling

---

### Accessibility

#### WCAG Compliance
- NFR47: Web interface must meet WCAG 2.1 Level AA compliance
- NFR48: All interactive elements must be keyboard navigable
- NFR49: Color contrast ratio must be ≥ 4.5:1 for normal text
- NFR50: Form inputs must have visible focus indicators

#### Mobile Accessibility
- NFR51: Touch targets must be ≥ 44x44 pixels
- NFR52: Text must be readable without zooming (16px minimum)
- NFR53: Orientation changes must not break layout

---

### Maintainability

#### Code Quality
- NFR54: Test coverage for new features must be ≥ 80%
- NFR55: CI/CD build time must be < 5 minutes
- NFR56: TypeScript strict mode must be enforced
- NFR57: No critical security vulnerabilities in dependencies

#### Observability
- NFR58: All API errors must be logged with request context
- NFR59: Performance metrics must be tracked for all critical paths
- NFR60: User actions must be tracked for analytics (anonymized)

---

## Dependencies and Constraints

### Technical Dependencies

| Dependency | Type | Impact |
|------------|------|--------|
| **Supabase** | Infrastructure | Core database and auth - existing |
| **OpenAI / Anthropic** | External API | AI features (A1-A4) - Phase 2 |
| **Stripe Connect** | External API | Payments (F2) - Phase 3 |
| **Yousign / DocuSign** | External API | E-signatures (E2) - Phase 3 |
| **LinkedIn Sales Nav** | External API | Contact import (G3) - Phase 5 |
| **Pennylane / QuickBooks** | External API | Accounting sync (G4) - Phase 5 |

### Constraints

| Constraint | Category | Mitigation |
|------------|----------|------------|
| **Self-hosted only** | Architecture | No multi-tenant SaaS model (by design) |
| **RGPD Compliance** | Legal | Data stored in EU, consent management |
| **Budget timeline** | Resource | Phased delivery over 12 months |
| **Existing codebase** | Technical | Brownfield - must maintain compatibility |
| **Team size** | Resource | 2-3 developers, must prioritize features |

### Assumptions

1. AI API costs are manageable within budget (~$100-500/month)
2. Stripe and e-signature providers support French market
3. Team has or can acquire necessary skills (LLM integration, Stripe)
4. Users will adopt AI features with proper onboarding
5. LinkedIn API access remains available for Sales Navigator users

---

## Appendices

### Input Documents Reference
1. `docs/index.md` - Master documentation index
2. `docs/architecture.md` - System architecture
3. `docs/api-contracts.md` - API reference (11 endpoints)
4. `docs/data-models.md` - TypeScript entities (21 tables)
5. `docs/hooks-reference.md` - React Query hooks (23 hooks)
6. `docs/components-catalog.md` - UI components (91 components)
7. `docs/TESTING.md` - Test guide (125 tests)
8. `specs/001-crm-axivity-interface/research.md` - Technical decisions
9. `docs/project-scan-report.json` - Scan report
