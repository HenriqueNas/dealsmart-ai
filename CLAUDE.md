# Project Context — DealSmart AI Communications Hub

This project is a take-home assignment simulating a **mini version of DealSmart AI's internal operator console**.

The system allows dealership staff to:
- View customer conversations
- Collaborate with AI on responses
- Sync activity with HubSpot CRM
- Receive real-time updates

This is **NOT** a toy demo. Code should reflect **production SaaS patterns** even though scope is limited.

---

## Architecture Overview

This is a **Vercel-first** Next.js application with API Routes for the backend. The project is optimized for deployment on Vercel with serverless functions.

### Project Structure

```
.
├── app/
│   ├── (public)/                    # Public routes (no auth required)
│   │   ├── page.tsx                 # Landing page
│   │   ├── [username]/              # Public creator profiles
│   │   │   └── page.tsx
│   │   ├── explore/
│   │   │   └── page.tsx
│   │   └── (auth)/                      # Auth-related pages
│   │       ├── login/page.tsx
│   │       ├── register/page.tsx
│   │       └── layout.tsx               # Minimal layout for auth pages
│   │
│   ├── api/                         # API Routes (see section 5)
│   │   ├── route.ts                 # GET /api - API info
│   │   └── v1/                      # Versioned API
│   │       ├── auth/
│   │       ├── users/
│   │       ├── content/
│   │       ├── subscriptions/
│   │       ├── payments/
│   │       └── admin/
│   │
│   ├── components/                  # React components
│   ├── hooks/                       # Custom React hooks
│   ├── types/                       # Frontend-specific types
│   └── styles/                      # Additional styles
│
├── lib/                             # Shared code (frontend + backend)
│   ├── schemas/                     # Zod schemas (shared validation)
│   ├── types/                       # Shared TypeScript types
│   ├── constants/                   # Application constants
│   └── utils/                       # Pure utility functions
│   
├── server/                          # Backend-only code (never bundled to client)
│   │
│   ├── services/                    # Business logic layer
│   │   ├── user.service.ts
│   │   ├── content.service.ts
│   │   ├── subscription.service.ts
│   │   ├── payment.service.ts
│   │   └── analytics.service.ts
│   │
│   ├── repositories/                # Data access layer
│   │   ├── user.repository.ts
│   │   ├── content.repository.ts
│   │   └── base.repository.ts
│   │
│   ├── integrations/                # External service adapters
│   │   └── hubspot/
│   │
│   ├── middleware/                  # API middleware
│   │   ├── auth.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── validation.middleware.ts
│   │
│   └── utils/                       # Backend utilities
│       ├── errors.ts                # Custom error classes
│       ├── logger.ts
│       └── retry.ts                 # Retry with backoff
│   
├── infra/                           # Infrastructure
│   │
│   ├── prisma/                      # Prisma ORM
│   │   ├── schema.prisma
│   │   ├── prisma.ts                # Singleton client
│   │   ├── generated/
│   │   └── seed.ts                  # Database seeding
│   ├── migrations/                  # List of migrations
│   └── compose.yaml/                # Docker Compose configuration
│
├── config/
│   ├── site.config.ts               # Site metadata
│   ├── features.config.ts           # Feature flags
│   └── env.ts                       # Validated environment variables
│
├── tests/
│   └── integrations/
│       └── api/v1/..
│
└── CLAUDE.md                       # You are here
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (Vercel)
| Framework | Next.js 16 (App Router) |
| API | Next.js API Routes |
| Deployment | Vercel |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Styling | Tailwind CSS v4 |
| Validation | Zod |
| Authentication | Next Auth (JWT-based) |
| CRM | HubSpot |
| AI | LLM provider via service abstraction |

---

## Engineering Standards

- Never hardcode credentials
- All external calls (HubSpot, AI) must have:
  - timeouts
  - retry logic
  - graceful fallback
- Use service pattern for business logic
- Validate ALL inputs with Zod
- Keep API routes thin - delegate to services

---

## AI Safety Rules

AI must:
- Never invent vehicle prices or inventory
- Only reference conversation context
- Ask clarifying questions when missing info

---

## Non-goals

- No authentication system (will use Supabase)
- No mobile polish
- No complex WebSocket setup (Vercel doesn't support persistent connections)

---

## What Good Code Looks Like Here

- Clear folder structure
- Small focused services
- Reusable types in `/lib`
- No side effects in route handlers
- Edge-compatible where possible
- Node.js runtime only when needed (database operations)
