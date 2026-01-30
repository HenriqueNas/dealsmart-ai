# DealSmart AI Communications Hub

A production-grade SaaS platform simulating DealSmart AI's internal operator console for managing customer conversations with AI-assisted responses and HubSpot CRM integration.

This is **NOT** a toy demo. The codebase follows production SaaS patterns suitable for real-world deployment on Vercel.

---

## Overview

### Development Approach

This project follows an **API-first development strategy**:
- Complete backend API development (Phases 1-8) before frontend implementation
- All API endpoints fully tested and documented before UI development begins
- Frontend consumes stable, tested APIs with clear contracts
- Enables parallel development and multiple client support (web, mobile, integrations)

The DealSmart AI Communications Hub enables dealership staff to:
- View and manage customer conversations
- Collaborate with AI on response generation
- Sync activity with HubSpot CRM
- Receive real-time updates on customer interactions

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (Vercel Serverless) |
| Framework | Next.js 16 (App Router) |
| API | Next.js API Routes (Versioned) |
| Deployment | Vercel |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Styling | Tailwind CSS v4 |
| Validation | Zod (planned) |
| Authentication | NextAuth (JWT-based) |
| CRM Integration | HubSpot |
| AI | LLM provider via service abstraction |
| Testing | Jest + React Testing Library |

---

## Project Structure

```
dealsmart-ai/
├── app/                             # Next.js App Router
│   ├── (public)/                    # Public routes (no auth)
│   │
│   ├── api/                         # API Routes
│   │   ├── route.ts                 # GET /api - API info
│   │   └── v1/                      # Versioned API
│   │
│   ├── components/                  # React components
│   ├── hooks/                       # Custom React hooks
│   ├── types/                       # Frontend TypeScript types
│   └── globals.css                  # Global styles (Tailwind v4)
│
├── lib/                             # Shared code (frontend + backend)
│   ├── schemas/                     # Zod validation schemas
│   ├── types/                       # Shared TypeScript types
│   ├── constants/                   # Application constants
│   └── utils/                       # Pure utility functions
│
├── server/                          # Backend-only code
│   ├── services/                    # Business logic layer
│   ├── repositories/                # Data access layer
│   ├── integrations/                # External service adapters
│   ├── middleware/                  # API middleware
│   └── utils/                       # Backend utilities
│
├── infra/                           # Infrastructure
│   ├── prisma/                      # Prisma ORM
│   │   ├── schema.prisma            # Database schema
│   │   ├── prisma.ts                # Prisma client singleton
│   │   ├── generated/               # Generated client
│   │   ├── migrations/                  # Database migrations
│   │   └── seed.ts                  # Database seeding
│   └── compose.yaml                 # Docker Compose (local dev)
│
├── config/                          # Configuration
│
├── tests/                           # Test suite
│   └── integrations/api/v1/         # API integration tests
│
├── docs/                            # Documentation
│
├── .env.example                     # Environment variables template
├── CLAUDE.md                        # AI assistant context
├── CONTRIBUTING.md                  # Development guidelines
└── Makefile                         # Development commands
```

---

## Quick Start

### Prerequisites

- Node.js 18+ (LTS/Krypton)
- pnpm package manager
- Docker & Docker Compose (for local database)

### One-Command Setup (Recommended)

```bash
make setup
```

This command will:
- Copy `.env.example` to `.env` and `.env.development`
- Install all dependencies with pnpm
- Prepare the development environment

### Start Development Server

```bash
pnpm dev
```

This command will:
1. Start PostgreSQL via Docker Compose
2. Wait for database to be ready
3. Run pending database migrations
4. Start Next.js development server

**Services will be available at:**
- **Next.js App**: http://localhost:3000
- **API Endpoints**: http://localhost:3000/api/v1/*
- **PostgreSQL**: localhost:5432

### Manual Setup

If you prefer manual setup:

```bash
# 1. Copy environment configuration
cp .env.example .env
cp .env.example .env.development

# 2. Install dependencies
pnpm install

# 3. Start database
pnpm services:up

# 4. Run migrations
pnpm migration:up

# 5. Start development server
next dev
```

---

## Available Scripts

### Development

```bash
pnpm dev              # Start dev server (DB + migrations + Next.js)
pnpm lint:check       # Check code formatting with Prettier
pnpm lint:fix         # Fix code formatting with Prettier
```

### Testing

```bash
pnpm test             # Run Jest tests
pnpm test:watch       # Run Jest in watch mode
```

### Database

```bash
pnpm services:up      # Start PostgreSQL container
pnpm services:stop    # Stop PostgreSQL container
pnpm services:down    # Stop and remove PostgreSQL container

pnpm migration:create <name>    # Create new migration
pnpm migration:up               # Run pending migrations
pnpm migration:generate         # Generate Prisma client
```

### Make Commands

```bash
make setup           # Complete initial setup
make clean           # Remove all build artifacts and containers
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
POSTGRES_USER=local_user
POSTGRES_PASSWORD=local_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=local_db
DATABASE_URL=postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-at-least-32-characters"

# HubSpot
HUBSPOT_ACCESS_TOKEN=""

# Feature Flags
FEATURE_RESTRICTED_CONTENT="true"
```

---

## Engineering Standards

### Code Quality

- All code must follow TypeScript strict mode
- Use Zod for input validation on all API routes
- Keep API route handlers thin - delegate to service layer
- Never hardcode credentials or secrets
- Follow the service/repository pattern for business logic

### External Service Calls

All external API calls (HubSpot, AI providers) must include:
- Request timeouts
- Retry logic with exponential backoff
- Graceful error handling and fallback behavior

### Database

- Use Prisma migrations for all schema changes
- Never run raw SQL without parameterization
- Implement Row Level Security (RLS) policies where applicable

### API Design

- Version all API routes under `/api/v1/`
- Use proper HTTP status codes
- Return consistent error response format
- Validate all inputs with Zod schemas

---

## Architecture Principles

### Layered Architecture

```
Route Handler → Service Layer → Repository Layer → Database
                     ↓
              Integration Layer (External APIs)
```

### Folder Organization

- `app/` - Next.js App Router (UI + API routes)
- `lib/` - Shared code (used by both frontend and backend)
- `server/` - Backend-only code (never bundled to client)
- `infra/` - Infrastructure (database, migrations, Docker)
- `config/` - Configuration and environment validation

### Edge Compatibility

- Keep route handlers Edge-compatible when possible
- Use Node.js runtime only when needed (database operations)
- Optimize for serverless deployment on Vercel

---

## AI Safety Rules

The AI assistant must:
- Never invent vehicle prices or inventory data
- Only reference information from conversation context
- Ask clarifying questions when information is missing
- Never hallucinate customer data or CRM records

---

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Project context for AI assistants
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Development guidelines
- **[docs/steps.md](./docs/steps.md)** - Implementation roadmap
- **[docs/backend_workflow.md](./docs/backend_workflow.md)** - Backend architecture
- **[docs/auth_workflow.md](./docs/auth_workflow.md)** - Authentication flow

---

## Contributing

This is a take-home assignment project. For development guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

MIT

---

## Author

@henriquenas
