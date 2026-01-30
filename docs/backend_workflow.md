# Backend Architecture & Workflow

This document outlines the layered architecture pattern used in DealSmart AI Communications Hub.

---

## Architecture Overview

The backend follows a **strict layered architecture** to ensure separation of concerns, testability, and maintainability:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Request                          │
│  GET /api/v1/content?userId=123                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Route Handler                         │
│  app/api/v1/content/route.ts                                │
│                                                             │
│  Responsibilities:                                          │
│  • Parse and validate request                               │
│  • Apply middleware (auth, rate-limit, validation)          │
│  • Delegate business logic to service layer                 │
│  • Format and return HTTP response                          │
│  • Handle HTTP-specific concerns (status codes, headers)    │
│                                                             │
│  MUST NOT:                                                  │
│  • Contain business logic                                   │
│  • Access database directly                                 │
│  • Perform calculations or transformations                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Middleware Layer                       │
│  server/middleware/                                         │
│                                                             │
│  • auth.middleware.ts - JWT validation, role checks         │
│  • validation.middleware.ts - Zod schema validation         │
│  • rate-limit.middleware.ts - Request throttling            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                          │
│  server/services/content.service.ts                         │
│                                                             │
│  Responsibilities:                                          │
│  • Business logic implementation                            │
│  • Orchestrate multiple repositories/integrations           │
│  • Define transaction boundaries                            │
│  • Enforce authorization rules                              │
│  • Data transformation and validation                       │
│  • Error handling and logging                               │
│                                                             │
│  Example Services:                                          │
│  • user.service.ts                                          │
│  • content.service.ts                                       │
│  • subscription.service.ts                                  │
│  • payment.service.ts                                       │
│  • analytics.service.ts                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│    Repository Layer       │  │   Integration Layer       │
│  server/repositories/     │  │  server/integrations/     │
│                           │  │                           │
│  Responsibilities:        │  │  Responsibilities:        │
│  • Data access logic      │  │  • External API clients   │
│  • Query building         │  │  • Third-party SDKs       │
│  • Prisma operations      │  │  • API wrappers           │
│  • Database transactions  │  │  • Retry logic            │
│  • Caching strategies     │  │  • Timeout handling       │
│                           │  │                           │
│  MUST NOT:                │  │  Examples:                │
│  • Contain business logic │  │  • HubSpot CRM            │
│  • Call other services    │  │  • Stripe Payments        │
│  • Make HTTP requests     │  │  • AWS S3 Storage         │
│                           │  │  • AI LLM Provider        │
│  Examples:                │  │                           │
│  • base.repository.ts     │  │  Integration Requirements:│
│  • user.repository.ts     │  │  • Request timeouts       │
│  • content.repository.ts  │  │  • Exponential backoff    │
│  • subscription.repo.ts   │  │  • Graceful fallbacks     │
└───────────────────────────┘  └───────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database (Prisma)                       │
│  PostgreSQL with Row Level Security                         │
│                                                             │
│  infra/prisma/schema.prisma                                 │
│  infra/prisma/prisma.ts - Singleton client                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### 1. API Route Handler (app/api/)

**Purpose**: Handle HTTP requests and responses

**Allowed**:
- Parse request parameters, query strings, body
- Apply middleware (auth, validation, rate-limiting)
- Call service layer methods
- Format responses with proper HTTP status codes
- Handle HTTP-specific errors (400, 401, 403, 404, etc.)

**Not Allowed**:
- Business logic
- Direct database access
- Data transformations
- Calculations

**Example**:

```typescript
// app/api/v1/content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/server/middleware/auth.middleware';
import { contentService } from '@/server/services/content.service';

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const session = await authMiddleware(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Extract parameters
  const userId = request.nextUrl.searchParams.get('userId');

  // 3. Delegate to service
  try {
    const content = await contentService.getByUser(userId);
    return NextResponse.json({ data: content }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 2. Middleware Layer (server/middleware/)

**Purpose**: Cross-cutting concerns applied to requests

**Types of Middleware**:

1. **Authentication** (`auth.middleware.ts`)
   - Validate JWT tokens
   - Extract user claims
   - Verify session validity

2. **Authorization** (part of `auth.middleware.ts`)
   - Check user roles
   - Enforce permissions
   - Resource ownership validation

3. **Validation** (`validation.middleware.ts`)
   - Zod schema validation
   - Input sanitization
   - Type coercion

4. **Rate Limiting** (`rate-limit.middleware.ts`)
   - Request throttling
   - API quota enforcement
   - DDoS protection

**Example**:

```typescript
// server/middleware/auth.middleware.ts
import { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/utils/jwt';

export async function authMiddleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    const payload = await verifyJWT(token);
    return payload;
  } catch (error) {
    return null;
  }
}

export function requireRole(role: string) {
  return async (request: NextRequest) => {
    const session = await authMiddleware(request);
    if (!session || session.role !== role) {
      throw new Error('Forbidden');
    }
    return session;
  };
}
```

---

### 3. Service Layer (server/services/)

**Purpose**: Implement business logic and orchestrate operations

**Responsibilities**:
- Encapsulate business rules
- Coordinate multiple repositories
- Define transaction boundaries
- Enforce authorization policies
- Transform and validate data
- Log business events
- Handle errors gracefully

**Example**:

```typescript
// server/services/content.service.ts
import { contentRepository } from '@/server/repositories/content.repository';
import { userRepository } from '@/server/repositories/user.repository';
import { hubspotIntegration } from '@/server/integrations/hubspot';
import { logger } from '@/server/utils/logger';

class ContentService {
  async getByUser(userId: string) {
    // Business logic: Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Business logic: Check permissions
    if (!user.verified) {
      throw new Error('User must be verified to access content');
    }

    // Fetch content
    const content = await contentRepository.findByUserId(userId);

    // Business logic: Filter restricted content
    const filtered = content.filter(item => {
      if (item.restricted && !user.ageVerified) {
        return false;
      }
      return true;
    });

    // Log event
    logger.info('Content retrieved', { userId, count: filtered.length });

    return filtered;
  }

  async createContent(userId: string, data: CreateContentDto) {
    // Orchestrate multiple operations in a transaction
    return await contentRepository.transaction(async (tx) => {
      // Create content
      const content = await tx.content.create({ data });

      // Sync to CRM
      await hubspotIntegration.syncContent(content);

      // Update user stats
      await tx.user.update({
        where: { id: userId },
        data: { contentCount: { increment: 1 } }
      });

      return content;
    });
  }
}

export const contentService = new ContentService();
```

---

### 4. Repository Layer (server/repositories/)

**Purpose**: Abstract database access and queries

**Responsibilities**:
- Execute database queries
- Build complex queries
- Handle Prisma operations
- Implement caching strategies
- Define reusable query methods

**Not Allowed**:
- Business logic
- Calling other services
- Making HTTP requests
- Authorization checks

**Example**:

```typescript
// server/repositories/content.repository.ts
import { prisma } from '@/infra/prisma/prisma';

class ContentRepository {
  async findById(id: string) {
    return await prisma.content.findUnique({
      where: { id },
      include: {
        creator: true,
        tags: true,
      },
    });
  }

  async findByUserId(userId: string) {
    return await prisma.content.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateContentInput) {
    return await prisma.content.create({
      data,
    });
  }

  async transaction<T>(fn: (tx: PrismaTransaction) => Promise<T>) {
    return await prisma.$transaction(fn);
  }
}

export const contentRepository = new ContentRepository();
```

---

### 5. Integration Layer (server/integrations/)

**Purpose**: Interact with external services and APIs

**Requirements**:
- **Timeouts**: All requests must have timeouts (5-30s)
- **Retries**: Implement exponential backoff for transient failures
- **Fallbacks**: Graceful degradation when service is unavailable
- **Error Handling**: Never expose internal errors to clients
- **Logging**: Log all external API calls

**Example**:

```typescript
// server/integrations/hubspot/client.ts
import { retryWithBackoff } from '@/server/utils/retry';
import { logger } from '@/server/utils/logger';

class HubSpotIntegration {
  private apiKey = process.env.HUBSPOT_ACCESS_TOKEN;
  private baseUrl = 'https://api.hubapi.com';

  async syncContact(contact: Contact) {
    try {
      return await retryWithBackoff(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/v1/contact`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contact),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
          throw new Error(`HubSpot API error: ${response.status}`);
        }

        return await response.json();
      }, { maxRetries: 3, initialDelay: 1000 });
    } catch (error) {
      logger.error('HubSpot sync failed', { error, contact });
      // Graceful fallback: Don't fail the entire operation
      return null;
    }
  }
}

export const hubspotIntegration = new HubSpotIntegration();
```

---

## Data Flow Examples

### Example 1: User Registration

```
1. POST /api/v1/auth/register
   ↓
2. validation.middleware (Zod schema)
   ↓
3. user.service.register()
   • Check if email exists (userRepository)
   • Hash password
   • Create user (userRepository)
   • Send welcome email (emailIntegration)
   • Create CRM contact (hubspotIntegration)
   ↓
4. Return JWT token
```

### Example 2: Create Subscription

```
1. POST /api/v1/subscriptions
   ↓
2. auth.middleware (verify JWT)
   ↓
3. validation.middleware (Zod schema)
   ↓
4. subscription.service.create()
   • Get user (userRepository)
   • Check creator exists (userRepository)
   • Create payment intent (stripeIntegration)
   • Create subscription (subscriptionRepository) [transaction]
   • Update creator stats (userRepository) [same transaction]
   • Log analytics event (analyticsService)
   ↓
5. Return subscription object
```

---

## Best Practices

### 1. Keep Route Handlers Thin

```typescript
// ❌ BAD: Business logic in route handler
export async function POST(request: NextRequest) {
  const data = await request.json();
  const user = await prisma.user.create({ data });
  await fetch('https://api.hubspot.com/contacts', {
    method: 'POST',
    body: JSON.stringify(user),
  });
  return NextResponse.json({ user });
}

// ✅ GOOD: Delegate to service layer
export async function POST(request: NextRequest) {
  const data = await request.json();
  const user = await userService.register(data);
  return NextResponse.json({ user });
}
```

### 2. Use Transactions for Multi-Step Operations

```typescript
// ✅ GOOD: Atomic operations
async createSubscription(data: CreateSubscriptionDto) {
  return await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({ data });
    await tx.user.update({
      where: { id: data.creatorId },
      data: { subscriberCount: { increment: 1 } }
    });
    return subscription;
  });
}
```

### 3. Always Handle External API Failures

```typescript
// ✅ GOOD: Graceful degradation
async syncToHubSpot(contact: Contact) {
  try {
    await hubspotIntegration.syncContact(contact);
  } catch (error) {
    logger.error('HubSpot sync failed, continuing anyway', { error });
    // Don't fail the entire operation
  }
}
```

### 4. Validate All Inputs

```typescript
// ✅ GOOD: Zod validation
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['user', 'creator', 'admin']),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = CreateUserSchema.parse(body); // Throws if invalid
  // ...
}
```

---

## Testing Strategy

### Unit Tests
- Test services in isolation
- Mock repositories and integrations
- Focus on business logic

### Integration Tests
- Test API routes end-to-end
- Use real database (test environment)
- Verify middleware chains

### Example Test

```typescript
// tests/integrations/api/v1/content/route.test.ts
describe('POST /api/v1/content', () => {
  it('should create content for authenticated creator', async () => {
    const token = await generateTestToken({ role: 'creator' });
    
    const response = await fetch('http://localhost:3000/api/v1/content', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Content',
        description: 'Test Description',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.content).toHaveProperty('id');
  });
});
```

---

## Error Handling

### Error Types

1. **Validation Errors** (400)
   - Invalid input
   - Missing required fields
   - Type mismatches

2. **Authentication Errors** (401)
   - Missing token
   - Invalid token
   - Expired session

3. **Authorization Errors** (403)
   - Insufficient permissions
   - Resource ownership violation

4. **Not Found Errors** (404)
   - Resource doesn't exist

5. **Server Errors** (500)
   - Unexpected exceptions
   - External API failures
   - Database errors

### Error Response Format

```typescript
{
  "error": {
    "message": "User-friendly error message",
    "code": "ERROR_CODE",
    "details": {} // Optional additional context
  }
}
```

---

## Performance Considerations

1. **Database Queries**
   - Use indexes for frequently queried fields
   - Implement pagination for large datasets
   - Use `select` to fetch only needed fields

2. **Caching**
   - Cache expensive computations
   - Use Redis for session storage
   - Implement API response caching

3. **Serverless Optimization**
   - Minimize cold start time
   - Keep dependencies lean
   - Use Edge runtime when possible

---

## Security Checklist

- [ ] All inputs validated with Zod
- [ ] JWT tokens verified on protected routes
- [ ] Role-based access control implemented
- [ ] SQL injection prevented (Prisma parameterized queries)
- [ ] XSS prevented (React escapes by default)
- [ ] CSRF protection (for cookie-based auth)
- [ ] Rate limiting enabled
- [ ] Secrets never committed to git
- [ ] Environment variables validated at startup
- [ ] Error messages don't leak sensitive info

---

## References

- [CLAUDE.md](../CLAUDE.md) - Project context
- [auth_workflow.md](./auth_workflow.md) - Authentication flow
- [steps.md](./steps.md) - Implementation roadmap
