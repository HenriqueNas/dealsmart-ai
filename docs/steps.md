# Implementation Roadmap - DealSmart AI Communications Hub

This document outlines the step-by-step implementation plan for building the DealSmart AI Communications Hub.

---

## Overview

Build a **mini Communications Hub** - a real-time interface where dealership staff can view and manage AI-assisted customer conversations, integrated with HubSpot CRM.

### Key Features
1. Conversation list with status indicators
2. Conversation detail view with message thread
3. AI-suggested responses using Claude/OpenAI
4. HubSpot CRM integration for customer data
5. Real-time updates via polling

---

## Phase 1: Foundation & Infrastructure Setup ✅

**Goal**: Establish the base infrastructure and development environment.

### 1.1 Environment Configuration
- [x] Create comprehensive `.env.example`
- [x] Set up `.env.development` for local development
- [x] Set up `.nvmrc` file

### 1.2 Database Setup
- [x] Set up Docker Compose for local PostgreSQL
- [x] Configure Prisma ORM with schema
- [x] Set up Prisma client singleton pattern
- [x] Create User model with roles (USER, CREATOR, ADMIN)

### 1.3 Project Structure
- [x] Set up Next.js 16 App Router structure
- [x] Configure TypeScript paths
- [x] Set up testing framework (Jest)

### 1.4 Development Tooling
- [x] Configure TypeScript strict mode
- [x] Set up ESLint and Prettier
- [x] Create development scripts

---

## Phase 2: Authentication & Authorization ✅

**Goal**: Implement secure user authentication and role-based access control.

### 2.1 NextAuth Configuration
- [x] Set up NextAuth API route handler
- [x] Configure JWT session strategy
- [x] Set up HubSpot OAuth provider
- [x] Set up Credentials provider (email/password)

### 2.2 User Management API
- [x] `POST /api/v1/auth/register` - User registration
- [x] `POST /api/v1/auth/login` - User login
- [x] `POST /api/v1/auth/logout` - User logout
- [x] `POST /api/v1/auth/refresh` - Token refresh
- [x] `POST /api/v1/auth/forgot-password` - Password reset request
- [x] `POST /api/v1/auth/reset-password` - Password reset

### 2.3 Role-Based Access Control
- [x] `requireAuth` middleware
- [x] `requireRole` middleware
- [x] `requireAdmin` middleware
- [x] Role hierarchy (ADMIN > CREATOR > USER)

### 2.4 User Profile API
- [x] `GET /api/v1/users/me` - Get current user
- [x] `PATCH /api/v1/users/me` - Update profile
- [x] `DELETE /api/v1/users/me` - Delete account

---

## Phase 3: HubSpot CRM Integration ✅

**Goal**: Integrate with HubSpot CRM for customer data synchronization.

### 3.1 HubSpot Client Setup
- [x] Create HubSpot API client wrapper
- [x] Implement retry logic with exponential backoff
- [x] Handle rate limiting
- [x] Error handling and logging

### 3.2 Contact Synchronization
- [x] Sync users to HubSpot contacts on registration
- [x] Update HubSpot contacts on profile changes
- [x] Delete HubSpot contacts on user deletion

### 3.3 HubSpot API Endpoints
- [x] `GET /api/v1/integrations/hubspot` - Check status
- [x] `POST /api/v1/integrations/hubspot/contacts` - Sync contact
- [x] `POST /api/v1/integrations/hubspot/contacts/sync-all` - Batch sync
- [x] `POST /api/v1/integrations/hubspot/webhooks` - Webhook handler

### 3.4 Pending HubSpot Features
- [ ] Pull contacts from HubSpot to populate conversations
- [ ] Display customer HubSpot profile in conversation view
- [ ] Log sent messages as HubSpot activities/notes
- [ ] Cache HubSpot data to avoid rate limits

---

## Phase 4: Conversation & Message System 🔄

**Goal**: Build the core conversation and messaging infrastructure.

### 4.1 Database Schema
- [ ] Create Conversation model
  - Customer reference (HubSpot contact ID)
  - Status (new, in_progress, resolved)
  - Assigned agent (user ID)
  - Timestamps
- [ ] Create Message model
  - Conversation reference
  - Sender type (customer, agent, ai)
  - Content
  - Timestamps
  - Metadata (AI suggestion accepted/rejected)

### 4.2 Conversation Repository & Service
- [ ] CRUD operations for conversations
- [ ] Query conversations by status, agent
- [ ] Get conversation with messages
- [ ] Update conversation status

### 4.3 Message Repository & Service
- [ ] Create message in conversation
- [ ] Get messages for conversation
- [ ] Mark messages as read

### 4.4 Conversation API Endpoints
- [ ] `GET /api/v1/conversations` - List conversations (with filters)
- [ ] `GET /api/v1/conversations/:id` - Get conversation with messages
- [ ] `PATCH /api/v1/conversations/:id` - Update status/assignment
- [ ] `POST /api/v1/conversations/:id/messages` - Send message

### 4.5 Real-time Updates
- [ ] `GET /api/v1/conversations/:id/messages?since=timestamp` - Poll for new messages
- [ ] Implement efficient polling strategy

---

## Phase 5: LLM Integration (AI Suggestions) 🔄

**Goal**: Integrate Claude/OpenAI for AI-suggested responses.

### 5.1 LLM Service Abstraction
- [ ] Create LLM provider interface
- [ ] Implement Claude (Anthropic) adapter
- [ ] Implement OpenAI adapter (fallback)
- [ ] Configure timeouts and retries
- [ ] Handle API errors gracefully

### 5.2 Prompt Engineering
- [ ] Design system prompt for dealership context
- [ ] Include conversation history in context
- [ ] Include customer data from HubSpot
- [ ] Implement safety rules:
  - Never invent prices/inventory
  - Reference conversation details
  - Ask clarifying questions

### 5.3 AI Suggestion API
- [ ] `POST /api/v1/conversations/:id/suggest` - Generate AI suggestion
- [ ] `POST /api/v1/messages/:id/accept` - Accept AI suggestion
- [ ] `POST /api/v1/messages/:id/reject` - Reject AI suggestion
- [ ] Track suggestion acceptance rate

### 5.4 AI Safety & Quality
- [ ] Validate AI responses don't contain forbidden content
- [ ] Log all AI interactions for review
- [ ] Implement feedback mechanism

---

## Phase 6: Frontend - Communications Hub UI 🔄

**Goal**: Build the user interface for the Communications Hub.

### 6.1 shadcn/ui Components Setup
- [x] Initialize shadcn/ui
- [x] Create Button, Input, Card components
- [ ] Add Badge, Avatar, ScrollArea components
- [ ] Add Dialog, DropdownMenu components

### 6.2 Conversation List View
- [ ] Create conversation list component
- [ ] Display: customer name, last message, timestamp, status
- [ ] Status indicators (new/in-progress/resolved)
- [ ] Search and filter functionality
- [ ] Real-time updates with polling

### 6.3 Conversation Detail View
- [ ] Message thread with sender distinction
  - Customer messages (left-aligned)
  - Agent messages (right-aligned)
  - AI messages (styled differently)
- [ ] Customer profile panel (from HubSpot)
- [ ] Status and assignment controls

### 6.4 AI Suggestion Panel
- [ ] Display AI-suggested response
- [ ] "Send as-is" button
- [ ] "Edit & Send" button (opens editor)
- [ ] "Ignore suggestion" button
- [ ] Loading state while generating

### 6.5 Message Composer
- [ ] Text input for composing messages
- [ ] Send button
- [ ] Show typing indicator
- [ ] Handle send errors

### 6.6 Responsive Design
- [ ] Desktop layout (side-by-side list and detail)
- [ ] Mobile layout (stacked views)

---

## Phase 7: Database Seeding & Testing

**Goal**: Populate with sample data and ensure quality.

### 7.1 Seed Data
- [ ] Create seed script with sample conversations:
  - Sarah Chen (BMW X5 inquiry)
  - Mike Rodriguez (service scheduling)
  - Jennifer Walsh (price negotiation)
- [ ] Sync seed contacts to HubSpot

### 7.2 Testing
- [ ] Unit tests for services
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical flows
- [ ] Test HubSpot integration with mocks
- [ ] Test LLM integration with mocks

---

## Phase 8: Final Polish & Deployment

**Goal**: Production-ready deployment.

### 8.1 Performance Optimization
- [ ] Implement HubSpot data caching
- [ ] Optimize polling frequency
- [ ] Add loading states everywhere

### 8.2 Error Handling
- [ ] User-friendly error messages
- [ ] Fallback UI for failures
- [ ] Retry mechanisms in UI

### 8.3 Documentation
- [ ] API documentation
- [ ] Environment setup guide
- [ ] Deployment instructions

### 8.4 Production Deployment
- [ ] Configure Vercel project
- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Deploy and test

---

## Current Status Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | ✅ Complete | 100% |
| Phase 2: Authentication | ✅ Complete | 100% |
| Phase 3: HubSpot Integration | 🔄 Partial | 60% |
| Phase 4: Conversations | ⬜ Not Started | 0% |
| Phase 5: LLM Integration | ⬜ Not Started | 0% |
| Phase 6: Frontend UI | 🔄 Partial | 20% |
| Phase 7: Testing | ⬜ Not Started | 0% |
| Phase 8: Deployment | ⬜ Not Started | 0% |

---

## Next Priority: Phase 4 + 5 (Conversations + LLM)

The core of the assignment is the **conversation view with AI suggestions**. Priority order:

1. **Database schema** for conversations and messages
2. **Conversation API** (list, detail, send message)
3. **LLM integration** (Claude API for suggestions)
4. **AI suggestion API** (generate, accept, reject)
5. **Frontend** (list view, detail view, suggestion panel)

---

## Environment Variables Required

```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# JWT
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."

# HubSpot
HUBSPOT_ACCESS_TOKEN=""
HUBSPOT_CLIENT_ID=""
HUBSPOT_CLIENT_SECRET=""

# LLM (Claude)
ANTHROPIC_API_KEY=""

# LLM (OpenAI - fallback)
OPENAI_API_KEY=""
```
