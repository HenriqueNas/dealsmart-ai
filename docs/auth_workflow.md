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
