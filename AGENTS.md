# Agents & MCP tools for this repository

This file documents the AI agents and Model Context Protocol (MCP) tooling that are available and useful when working on OmniLog.

## Project-specific notes

- Auth
  - This repo uses `better-auth` with the Drizzle adapter. Server config is in `src/lib/auth.ts`. The Next App Router catch-all route is at `src/app/api/auth/[...all]/route.ts`.
  - Client helper: `src/lib/auth-client.ts` exports `authClient` (created with `createAuthClient`) used by client components like `src/components/auth/sign-in-button.tsx` and `src/components/auth/sign-up-button.tsx`.
  - Server helpers: `src/lib/session.ts` provides `getSession()` and `requireAuth()` for Server Components, Server Actions, and route handlers.

- DB
  - Drizzle + `postgres` (postgres.js) are used. `src/lib/db.ts` and `src/lib/schema.ts` define the connection and tables.

- UI
  - Tailwind + shadcn-style components are referenced (component code under `src/components`).

- Useful Context7 MCP IDs for this project:
  - Next.js: `/vercel/next.js`
  - React: `/reactjs/react.dev`
  - Better Auth: `/better-auth/better-auth` (and `www.better-auth.com/llmstxt`)
  - Drizzle ORM: `/drizzle-team/drizzle-orm` (and `llmstxt/orm_drizzle_team-llms.txt`)
  - Tailwind: `/tailwindlabs/tailwindcss.com`
  - shadcn/ui: `/shadcn-ui/ui`
