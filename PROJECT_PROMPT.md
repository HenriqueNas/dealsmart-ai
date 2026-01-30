# DealSmart AI Communications Hub - Project Brief

I'm building a **production-grade SaaS platform** that simulates an internal operator console for managing customer conversations with AI-assisted responses and CRM integration.

---

## 🎯 Project Goals

Build a modern web platform where dealership staff can:
- View and manage customer conversations in real-time
- Collaborate with AI to generate contextually appropriate responses
- Sync all activity seamlessly with HubSpot CRM
- Track conversation status and customer journey
- Never hallucinate vehicle prices or inventory (safety-first AI)

This is **NOT a toy demo** - code must follow production SaaS patterns suitable for real-world deployment.

---

## 📋 Product Requirements

### Core Features
1. **Conversation Management**
   - List all customer conversations with filtering (status, priority, date)
   - View full conversation thread with message history
   - Assign conversations to staff members
   - Track conversation status (open, pending, resolved)

2. **AI-Assisted Responses**
   - Get AI-generated response suggestions based on conversation context
   - Accept, reject, or edit AI suggestions before sending
   - Rate AI suggestions to improve quality
   - AI must NEVER invent vehicle prices, inventory, or customer data

3. **HubSpot CRM Integration**
   - Automatically sync customers as HubSpot contacts
   - Create deals when subscriptions are purchased
   - Log all activities (messages, status changes) to customer timeline
   - Track revenue and engagement metrics

4. **User Management**
   - Three user roles: User (basic), Creator (content management), Admin (full access)
   - JWT-based authentication with NextAuth
   - Role-based access control (RBAC) for all endpoints
   - Age verification for restricted content (18+)

5. **Content & Monetization** (Secondary features)
   - Creator profiles with bio, stats, and subscription tiers
   - Content creation (posts, videos, images) with access control
   - Stripe payment integration for subscriptions
   - Payout tracking for creators

---

## ⚖️ Business Rules

### AI Safety Rules (CRITICAL)
- AI must **NEVER** invent vehicle prices or inventory data
- AI can **ONLY** reference information from conversation context
- AI must ask clarifying questions when information is missing
- AI must flag uncertain responses for human review
- No hallucination of customer data or CRM records

### Access Control
- **User role**: Browse content, purchase subscriptions, message creators
- **Creator role**: All user permissions + create/manage content, view analytics, receive payments
- **Admin role**: All creator permissions + user management, platform configuration, financial reports

### Age Verification
- Users must verify age (18+) to access restricted content
- Age verification required before viewing/purchasing restricted items
- Unverified users see filtered content only

### Payment & Subscriptions
- All payments processed through Stripe
- Payment retry logic with exponential backoff
- Subscription auto-renewal configurable by user
- Platform fee calculation for creator payouts

### CRM Sync Rules
- Sync to HubSpot on user registration, profile update, subscription purchase
- Graceful degradation if HubSpot API fails (don't block user actions)
- Retry failed syncs with exponential backoff
- Log all sync attempts for debugging

---

## 🛠️ Tech Stack (MANDATORY)

### Backend
- **Runtime**: Node.js (Vercel Serverless)
- **Framework**: Next.js 16 (App Router)
- **API**: Next.js API Routes (versioned at `/api/v1/*`)
- **Database**: PostgreSQL
- **ORM**: Prisma 7
- **Authentication**: NextAuth (JWT-based sessions)
- **Validation**: Zod (all API inputs)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **State**: React hooks + Server Components
- **Forms**: React Hook Form (planned)

### External Integrations
- **CRM**: HubSpot (contact sync, deal tracking, activity logging)
- **Payments**: Stripe (subscriptions, payment methods, webhooks)
- **AI**: LLM provider via service abstraction (OpenAI, Anthropic, etc.)

### DevOps & Deployment
- **Deployment**: Vercel
- **Database Host**: Neon, Supabase, or AWS RDS
- **Testing**: Jest + React Testing Library
- **CI/CD**: Vercel automated deployments

---

## 🏗️ Architecture Principles

### API-First Development Strategy
1. **Phases 1-8**: Complete backend API development
   - Infrastructure, authentication, core architecture
   - All API routes with full business logic
   - External integrations (HubSpot, AI, payments)
   - Comprehensive API testing
2. **Phase 9**: Frontend development consuming tested APIs
3. **Phase 10**: Final optimization and deployment

### Layered Architecture (Strict Separation)
```
Route Handler → Middleware → Service → Repository/Integration → Database
```

**Rules**:
- Route handlers MUST NOT contain business logic
- Services MUST NOT access database directly
- Repositories MUST NOT contain business logic
- All external API calls MUST go through integration layer

### Folder Structure
```
app/              # Next.js App Router (UI + API routes)
lib/              # Shared code (frontend + backend)
server/           # Backend-only code (never bundled to client)
  ├── services/       # Business logic layer
  ├── repositories/   # Data access layer
  ├── integrations/   # External API wrappers
  ├── middleware/     # API middleware
  └── utils/          # Backend utilities
infra/            # Infrastructure (database, Docker)
config/           # Configuration files
tests/            # Test suite
docs/             # Documentation
```

---

## 🔒 Engineering Standards

### Code Quality
- TypeScript strict mode (no `any` types)
- All API inputs validated with Zod schemas
- Keep route handlers thin - delegate to services
- Never hardcode credentials or secrets
- Follow service/repository pattern

### External Service Calls
ALL external API calls (HubSpot, AI, Stripe) must include:
- Request timeouts (5-30s)
- Retry logic with exponential backoff
- Graceful error handling and fallback behavior
- Structured logging

### Security
- Use Prisma ORM (parameterized queries only)
- Implement Row Level Security (RLS) where applicable
- JWT tokens validated on all protected routes
- Rate limiting on all API endpoints
- Environment variables validated at startup
- Never expose service role keys or secrets

### API Design
- Version all routes under `/api/v1/`
- Use proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Return consistent error response format
- Implement pagination for list endpoints
- Document all endpoints (OpenAPI/Swagger)

---

## 📊 Success Metrics

### Technical
- API response time < 200ms (p95)
- Database query time < 50ms (p95)
- Test coverage > 80%
- Zero critical security vulnerabilities
- Uptime > 99.9%

### Business
- User registration conversion rate
- Creator onboarding completion rate
- Subscription conversion rate
- Payment success rate > 95%
- CRM sync success rate > 99%

---

## 🚫 Non-Goals

- No native mobile apps (web-first, mobile-responsive)
- No complex WebSocket setup (Vercel doesn't support persistent connections - use polling)
- No self-hosted deployment (Vercel-first architecture)
- No multi-tenancy (single platform instance)

---

## 📝 Current Status

**Progress**: 22/481 tasks complete (4.6%)  
**Phase**: Phase 1 - Foundation & Infrastructure Setup

**Completed**:
- ✅ Environment configuration (.env, .nvmrc)
- ✅ Docker Compose for PostgreSQL
- ✅ Prisma schema with User model
- ✅ TypeScript, ESLint, Prettier, Jest setup
- ✅ Development scripts and automation
- ✅ Complete documentation (README, CONTRIBUTING, architecture docs)

**Next Steps**:
- Create `lib/`, `server/`, `config/` folder structures
- Set up Zod environment validation
- Add NextAuth database models (Account, Session, VerificationToken)
- Build authentication API endpoints
- Implement service and repository layers

---

## 🎓 Learning Objectives

This project teaches:
- Production-grade Next.js architecture
- API-first development strategy
- Layered backend architecture (services, repositories, integrations)
- External API integration (HubSpot, Stripe, AI providers)
- JWT authentication and RBAC
- Database design with Prisma
- Testing strategies (unit, integration, E2E)
- Deployment to Vercel

---

## 💬 How You Can Help

Please assist me with:
1. **Code Reviews**: Ensure code follows architecture principles and best practices
2. **Implementation Guidance**: Help implement features according to the roadmap
3. **Problem Solving**: Debug issues and suggest solutions
4. **Testing**: Write comprehensive tests for all layers
5. **Documentation**: Keep documentation up-to-date as we build

**Important**: 
- Always validate that code follows the layered architecture
- Ensure all external API calls have timeouts, retries, and error handling
- Never skip input validation or security checks
- Follow the API-first development strategy (complete backend before frontend)

---

Ready to build! Let's create production-grade SaaS code. 🚀
