# Project Context — DealSmart AI Communications Hub

## About DealSmart AI

DealSmart AI is building an AI-powered operating system for automotive dealerships. The platform helps dealerships manage customer communications, qualify leads, and close more deals using AI agents that work across SMS, email, and voice.

## Assignment Overview

This is a take-home assignment to build a **mini Communications Hub** - a real-time interface where dealership staff can view and manage AI-assisted customer conversations, integrated with HubSpot CRM.

This is **NOT** a toy demo. Code should reflect **production SaaS patterns** even though scope is limited.

---

## Core Requirements

### 1. Frontend (React/Next.js)

- **Conversation List**: Customer name, last message preview, timestamp, status (new/in-progress/resolved)
- **Conversation Detail View**: Full message thread with clear distinction between:
  - Customer messages
  - Human agent messages
  - AI agent messages (Max)
- **AI Suggestion Panel**: AI-generated suggested response when viewing a conversation
- **Action Buttons**: "Send as-is", "Edit & Send", "Ignore suggestion"
- **Real-time Updates**: New messages appear without page refresh
- **Responsive**: Desktop required, mobile is bonus

### 2. Backend (Node.js/Next.js API Routes)

- REST API for:
  - Listing conversations
  - Getting conversation details
  - Sending messages
  - Generating AI suggestions
- Data persistence with PostgreSQL (Prisma ORM)
- LLM integration (Claude or OpenAI) for response suggestions
- Real-time updates via polling (Vercel doesn't support WebSocket)

### 3. AI Integration

When viewing a conversation:
1. Send conversation context to LLM (Claude or GPT)
2. Generate suggested response as a helpful dealership sales advisor
3. Display suggestion in the UI

**AI Safety Rules:**
- Be helpful and professional
- Reference specific details from the conversation
- **NEVER** invent vehicle prices, inventory, or availability
- Ask clarifying questions when missing information

### 4. HubSpot CRM Integration (Critical)

**Setup:**
- HubSpot developer account at developers.hubspot.com
- Test app with API credentials
- 5-10 test contacts (name, email, phone, notes)

**Required Integration:**
- Pull contacts from HubSpot to populate conversation list
- Display customer's HubSpot profile data (name, email, phone, custom properties)
- Log sent messages as activities/notes on HubSpot contacts
- OAuth or API key authentication (no hardcoded credentials)

**What's Evaluated:**
- API documentation reading and implementation
- Secure handling of auth tokens/credentials
- Error handling when CRM API is slow or fails
- Appropriate caching to avoid API rate limits

---

## Architecture Overview

This is a **Vercel-first** Next.js application with API Routes for the backend.

### Project Structure

```
.
├── app/
│   ├── (auth)/                      # Auth pages (login, register)
│   │   └── layout.tsx               # Minimal layout for auth
│   ├── (main)/                      # Main app with header
│   │   ├── layout.tsx               # Layout with Header
│   │   ├── page.tsx                 # Landing page
│   │   ├── profile/                 # User profile
│   │   └── conversations/           # Communications Hub
│   │       ├── page.tsx             # Conversation list
│   │       └── [id]/page.tsx        # Conversation detail
│   │
│   ├── api/                         # API Routes
│   │   ├── v1/
│   │   │   ├── auth/                # Authentication
│   │   │   ├── users/               # User management
│   │   │   ├── conversations/       # Conversation CRUD
│   │   │   ├── messages/            # Message handling
│   │   │   ├── ai/                  # AI suggestion generation
│   │   │   └── integrations/
│   │   │       └── hubspot/         # HubSpot CRM integration
│   │
│   ├── components/                  # React components
│   ├── hooks/                       # Custom React hooks
│   └── types/                       # Frontend-specific types
│
├── lib/                             # Shared code (frontend + backend)
│   ├── schemas/                     # Zod schemas
│   ├── types/                       # Shared TypeScript types
│   └── utils/                       # Pure utility functions
│
├── server/                          # Backend-only code
│   ├── services/                    # Business logic layer
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── conversation.service.ts
│   │   ├── message.service.ts
│   │   └── ai.service.ts
│   │
│   ├── repositories/                # Data access layer
│   │   ├── user.repository.ts
│   │   ├── conversation.repository.ts
│   │   └── message.repository.ts
│   │
│   ├── integrations/                # External service adapters
│   │   ├── hubspot/                 # HubSpot CRM
│   │   └── llm/                     # LLM provider (Claude/OpenAI)
│   │
│   ├── middleware/                  # API middleware
│   └── utils/                       # Backend utilities
│
├── infra/                           # Infrastructure
│   └── prisma/                      # Prisma ORM
│
└── tests/                           # Test files
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (Vercel) |
| Framework | Next.js 16 (App Router) |
| API | Next.js API Routes |
| Deployment | Vercel |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Validation | Zod |
| Authentication | NextAuth (JWT-based) |
| CRM | HubSpot |
| AI | Claude API (Anthropic) |

---

## Engineering Standards

- Never hardcode credentials
- All external calls (HubSpot, LLM) must have:
  - Timeouts
  - Retry logic with exponential backoff
  - Graceful fallback/error handling
- Use service pattern for business logic
- Validate ALL inputs with Zod
- Keep API routes thin - delegate to services
- Cache HubSpot data appropriately

---

## Sample Conversations (Seed Data)

### Conversation 1: Sarah Chen
- **Customer:** "Hi, I saw your ad for the 2024 BMW X5. Is it still available?"
- **AI Agent (Max):** "Hi Sarah! Yes, we have the 2024 X5 in stock. Are you interested in the xDrive40i or the M50?"
- **Customer:** "The M50. What colors do you have?"

### Conversation 2: Mike Rodriguez
- **Customer:** "I need to schedule service for my 330i. Check engine light came on."
- **AI Agent (Max):** "I'm sorry to hear that, Mike. I can help you schedule a diagnostic. What days work best for you this week?"

### Conversation 3: Jennifer Walsh
- **Customer:** "What's your best price on the X3? I'm also looking at the Audi Q5."

---

## What Good Code Looks Like Here

- Clear folder structure
- Small focused services
- Reusable types in `/lib`
- No side effects in route handlers
- Proper error handling
- Real-time feel with polling
- Professional UI for dealership staff
