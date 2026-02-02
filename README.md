# DealSmart AI Communications Hub

This project is a production-grade SaaS platform that simulates DealSmart AI's internal operator console for managing customer conversations with AI-assisted responses and HubSpot CRM integration.

The live project can be found at: https://dealsmart-ai.vercel.app/

## About the Project

DealSmart AI is building an AI-powered operating system for automotive dealerships. This application is a mini Communications Hub that displays AI-assisted customer conversations, allowing dealership staff to view and manage these interactions.

The project is built with an API-first development strategy, ensuring a robust and scalable backend before implementing the frontend.

## How to Run

### Prerequisites

- Node.js 18+
- pnpm
- Docker & Docker Compose

### Setup and Development

1.  **Run the setup command:**

    ```bash
    make setup
    ```

    This will install dependencies and set up your environment variables.

2.  **Start the development server:**
    ```bash
    pnpm dev
    ```
    This command starts the PostgreSQL database, runs migrations, and starts the Next.js development server.

- **Application:** http://localhost:3000
- **API:** http://localhost:3000/api/v1/\*

### Available Scripts

- `pnpm dev`: Starts the development server.
- `pnpm test`: Runs the test suite.
- `pnpm lint:check`: Checks for linting issues.

## Project Tech Stack

- **Framework:** Next.js
- **Runtime:** Node.js (Vercel Serverless)
- **API:** Next.js API Routes (Versioned)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Testing:** Jest & React Testing Library

| Layer           | Technology                           |
| --------------- | ------------------------------------ |
| Runtime         | Node.js                              |
| Framework       | Next.js 16 (App Router)              |
| API             | Next.js API Routes (Versioned)       |
| Deployment      | Vercel                               |
| Database        | PostgreSQL                           |
| ORM             | Prisma 7                             |
| Styling         | Tailwind CSS v4                      |
| Validation      | Zod                                  |
| Authentication  | NextAuth (JWT-based)                 |
| CRM Integration | HubSpot                              |
| Authentication  | HubSpot Oauth                        |
| AI              | LLM provider via service abstraction |
| Testing         | Jest + React Testing Library         |

## Architecture and Structure

The project follows a layered architecture, separating concerns between the API, services, and data repositories.

```
Route Handler → Service Layer → Repository Layer → Database
```

The folder structure is organized as follows:

- `app/`: Next.js App Router (UI + API routes)
- `lib/`: Shared code (frontend and backend)
- `server/`: Backend-only code
- `infra/`: Infrastructure (database, migrations)
- `docs/`: Project documentation

```
.
├── app/        # Next.js App Router (UI + API routes)
│
├── infra/      # Infrastructure & environment setup
│   ├── compose.yaml  → local services
│   └── prisma        → database schema, migrations, types and seeds
│
├── server      # Core backend logic (your real application brain).
│   ├── middlewares   → request-level logic
│   ├── repositories  → data access layer
│   ├── services      → business rules
│   └── utils         → server-only helpers
│
├── lib         # Shared, framework-agnostic code (frontend + backend).
│   ├── schemas → validation schemas with Zod
│   ├── types   → TypeScript types & interfaces
│   └── utils
│
├── public/     # Stuff served as-is by the browser (Images, Icons, Fonts, Static files)
├── hubspot/    # HubSpot CRM integration layer
│
├── CLAUDE.md   # Instructions, architecture rules, conventions, and constraints for Claude Code AI
├── docs/       # General documentation
├── Makefile     # Utility commands for project setup & automation
│
└── tests
```

For more detailed information on the project's architecture and workflows, please see the documentation files:

- [Authentication Workflow](./docs/auth_workflow.md)
- [Backend Workflow](./docs/backend_workflow.md)
- [Implementation Steps](./docs/steps.md)
