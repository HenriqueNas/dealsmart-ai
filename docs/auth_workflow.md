# Authentication & Authorization Workflow

This document outlines the authentication and authorization system for DealSmart AI Communications Hub using NextAuth.js.

---

## Overview

The platform uses **NextAuth.js** with **JWT-based sessions** for authentication and role-based access control (RBAC) for authorization.

### Key Components

- **NextAuth.js**: Authentication library for Next.js
- **JWT Tokens**: Stateless session management
- **Database Sessions**: Optional persistent session storage
- **Role-Based Access Control**: Three roles (user, creator, admin)
- **OAuth Providers**: Google, GitHub (optional)
- **Email/Password**: Credentials-based authentication

---

## Authentication Flow

### 1. Initial Authentication

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Initiates Login                        │
│  Clicks "Sign In" → /app/(public)/(auth)/login/page.tsx         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NextAuth SignIn Endpoint                      │
│  POST /api/auth/signin                                          │
│                                                                 │
│  Options:                                                       │
│  1. OAuth (Google, GitHub) → Redirect to provider              │
│  2. Credentials (Email/Password) → Verify locally               │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│   OAuth Provider Flow     │  │  Credentials Flow         │
│                           │  │                           │
│  1. Redirect to Google    │  │  1. Validate email/pass   │
│  2. User authorizes       │  │  2. Query database        │
│  3. Receive auth code     │  │  3. Verify password hash  │
│  4. Exchange for tokens   │  │  4. Create session        │
│  5. Get user profile      │  │                           │
└───────────────────────────┘  └───────────────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Callback Handler                              │
│  /api/auth/callback/[provider]                                  │
│                                                                 │
│  1. Receive provider response                                   │
│  2. Look up or create user in database                          │
│  3. Fetch user role and permissions                             │
│  4. Generate JWT with claims                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   JWT Token Creation                            │
│                                                                 │
│  Token Payload (Claims):                                        │
│  {                                                              │
│    sub: "user_xxx",              // User ID                     │
│    email: "user@example.com",    // User email                  │
│    name: "John Doe",             // Display name                │
│    role: "creator",              // admin | creator | user      │
│    creatorId: "creator_xxx",     // If role is creator          │
│    verified: true,               // Email verified              │
│    ageVerified: true,            // Age verification (18+)      │
│    iat: 1234567890,              // Issued at                   │
│    exp: 1234657890,              // Expires at (30 days)        │
│  }                                                              │
│                                                                 │
│  Token signed with NEXTAUTH_SECRET                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Set Session Cookie                            │
│                                                                 │
│  Cookie: next-auth.session-token                                │
│  • HttpOnly: true (not accessible via JavaScript)              │
│  • Secure: true (HTTPS only in production)                     │
│  • SameSite: lax (CSRF protection)                             │
│  • Max-Age: 30 days                                             │
│                                                                 │
│  Redirect user to dashboard or original destination             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Session Validation Flow

### Every Protected Request

```
┌─────────────────────────────────────────────────────────────────┐
│                   Client Makes Request                          │
│  GET /api/v1/content?userId=123                                 │
│  Cookie: next-auth.session-token=xxx                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Auth Middleware                               │
│  server/middleware/auth.middleware.ts                           │
│                                                                 │
│  1. Extract session token from cookie                           │
│  2. Verify JWT signature                                        │
│  3. Check expiration                                            │
│  4. Decode claims                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│   Valid Token             │  │   Invalid Token           │
│                           │  │                           │
│  • Extract user claims    │  │  • Return 401             │
│  • Attach to request      │  │  • Log attempt            │
│  • Continue to handler    │  │  • Clear cookie           │
└───────────────────────────┘  └───────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Authorization Check                           │
│  Check if user has required role/permissions                    │
│                                                                 │
│  Examples:                                                      │
│  • requireRole('admin') - Admin only                            │
│  • requireRole('creator') - Creator or Admin                    │
│  • requireOwnership(resourceId) - Owner or Admin                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Process Request                               │
│  User is authenticated and authorized                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## NextAuth Configuration

### File Structure

```
app/api/auth/[...nextauth]/
├── route.ts                 # NextAuth API route handler
└── options.ts               # NextAuth configuration
```

### Configuration Example

```typescript
// app/api/auth/[...nextauth]/options.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/infra/prisma/prisma';
import { comparePassword } from '@/lib/utils/password';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await comparePassword(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.creatorId = user.creatorId;
        token.verified = user.verified;
        token.ageVerified = user.ageVerified;
      }
      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.creatorId = token.creatorId as string;
        session.user.verified = token.verified as boolean;
        session.user.ageVerified = token.ageVerified as boolean;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after login
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    }
  },

  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login/error',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
```

---

## Role-Based Access Control

### User Roles

| Role | Permissions | Description |
|------|-------------|-------------|
| `user` | Basic access | Can browse content, purchase subscriptions, message creators |
| `creator` | Content management | All user permissions + create/manage content, view analytics, receive payments |
| `admin` | Full access | All creator permissions + user management, platform configuration, financial reports |

### Authorization Helpers

```typescript
// server/middleware/auth.middleware.ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new UnauthorizedError('Authentication required');
  }
  
  return session;
}

export async function requireRole(role: string | string[]) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new UnauthorizedError('Authentication required');
  }
  
  const roles = Array.isArray(role) ? role : [role];
  
  if (!roles.includes(session.user.role)) {
    throw new ForbiddenError('Insufficient permissions');
  }
  
  return session;
}

export async function requireOwnership(resourceOwnerId: string) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new UnauthorizedError('Authentication required');
  }
  
  // Admins can access anything
  if (session.user.role === 'admin') {
    return session;
  }
  
  // Check ownership
  if (session.user.id !== resourceOwnerId) {
    throw new ForbiddenError('You do not own this resource');
  }
  
  return session;
}
```

### Usage in API Routes

```typescript
// app/api/v1/content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/middleware/auth.middleware';
import { contentService } from '@/server/services/content.service';

// Only creators and admins can create content
export async function POST(request: NextRequest) {
  const session = await requireRole(['creator', 'admin']);
  
  const data = await request.json();
  const content = await contentService.create(session.user.id, data);
  
  return NextResponse.json({ content }, { status: 201 });
}
```

---

## Client-Side Authentication

### Using NextAuth Hooks

```typescript
// app/dashboard/page.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div>
        <p>You are not signed in</p>
        <button onClick={() => signIn()}>Sign In</button>
      </div>
    );
  }

  return (
    <div>
      <p>Welcome {session?.user?.name}</p>
      <p>Role: {session?.user?.role}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Protecting Pages with Middleware

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      // Protect admin routes
      if (req.nextUrl.pathname.startsWith('/admin')) {
        return token?.role === 'admin';
      }
      
      // Protect creator routes
      if (req.nextUrl.pathname.startsWith('/creator')) {
        return token?.role === 'creator' || token?.role === 'admin';
      }
      
      // All other routes require authentication
      return !!token;
    },
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/creator/:path*', '/admin/:path*'],
};
```

---

## Database Schema

### User Model

```prisma
// infra/prisma/schema.prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  passwordHash  String?   // For credentials auth
  
  // Role & Permissions
  role          String    @default("user") // user | creator | admin
  verified      Boolean   @default(false)
  ageVerified   Boolean   @default(false)
  
  // Creator Profile (if role is creator)
  creatorId     String?   @unique
  creator       Creator?  @relation(fields: [creatorId], references: [id])
  
  // NextAuth fields
  accounts      Account[]
  sessions      Session[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
}
```

---

## Security Best Practices

### 1. JWT Secret Management

```bash
# Generate a strong secret (32+ characters)
openssl rand -base64 32

# Add to .env
NEXTAUTH_SECRET="your-generated-secret-here"
```

### 2. Password Hashing

```typescript
// lib/utils/password.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

### 3. Token Refresh Strategy

- JWT tokens expire after 30 days
- Use refresh tokens for long-lived sessions
- Implement automatic token refresh on client

### 4. Session Invalidation

```typescript
// Invalidate all user sessions on password change
async function invalidateUserSessions(userId: string) {
  await prisma.session.deleteMany({
    where: { userId }
  });
}
```

---

## Age Verification Flow

For restricted (18+) content access:

```typescript
// server/services/age-verification.service.ts
class AgeVerificationService {
  async verifyAge(userId: string, birthDate: Date): Promise<boolean> {
    const age = this.calculateAge(birthDate);
    
    if (age < 18) {
      return false;
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { ageVerified: true }
    });
    
    return true;
  }
  
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}
```

---

## Error Handling

### Authentication Errors

```typescript
export class UnauthorizedError extends Error {
  statusCode = 401;
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
```

### Error Response Format

```typescript
// 401 Unauthorized
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}

// 403 Forbidden
{
  "error": {
    "message": "Insufficient permissions",
    "code": "FORBIDDEN"
  }
}
```

---

## Testing Authentication

### Generate Test Tokens

```typescript
// tests/utils/auth.ts
import jwt from 'jsonwebtoken';

export function generateTestToken(payload: {
  id?: string;
  email?: string;
  role?: string;
}) {
  return jwt.sign(
    {
      sub: payload.id || 'test-user-id',
      email: payload.email || 'test@example.com',
      role: payload.role || 'user',
      verified: true,
      ageVerified: true,
    },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: '1h' }
  );
}
```

### Test Protected Routes

```typescript
// tests/integrations/api/v1/content/route.test.ts
describe('POST /api/v1/content', () => {
  it('should reject unauthenticated requests', async () => {
    const response = await fetch('http://localhost:3000/api/v1/content', {
      method: 'POST',
    });
    
    expect(response.status).toBe(401);
  });
  
  it('should reject requests from users without creator role', async () => {
    const token = generateTestToken({ role: 'user' });
    
    const response = await fetch('http://localhost:3000/api/v1/content', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    expect(response.status).toBe(403);
  });
  
  it('should allow creators to create content', async () => {
    const token = generateTestToken({ role: 'creator' });
    
    const response = await fetch('http://localhost:3000/api/v1/content', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Content',
        description: 'Test',
      }),
    });
    
    expect(response.status).toBe(201);
  });
});
```

---

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [backend_workflow.md](./backend_workflow.md) - Backend architecture
- [steps.md](./steps.md) - Implementation roadmap
