# Tech Stack & Configuration

## Auth

- This repo uses `better-auth` with the Drizzle adapter. Server config is in `src/lib/auth.ts`. The Next App Router catch-all route is at `src/app/api/auth/[...all]/route.ts`.
- Client helper: `src/lib/auth-client.ts` exports `authClient` (created with `createAuthClient`) used by client components like `src/components/auth/sign-in-button.tsx` and `src/components/auth/sign-up-button.tsx`.
- Server helpers: `src/lib/session.ts` provides `getSession()` and `requireAuth()` for Server Components, Server Actions, and route handlers.

## DB

- Drizzle + `postgres` (postgres.js) are used. `src/lib/db.ts` and `src/lib/schema.ts` define the connection and tables.
- Supabase is used as the PostgreSQL host. Migrations are managed via drizzle-kit and stored in `supabase/migrations/`.
- Database scripts: `db:generate` (generate migrations), `db:migrate` (run migrations), `db:push` (push schema changes).

## UI

- Tailwind CSS v4 is used with custom CSS variables for theming (defined in `src/app/globals.css`).
- shadcn/ui components are styled using CSS variables (e.g., `bg-background`, `text-foreground`, `border-border`).
- Dark mode is supported via `.dark` class (CSS variables are defined for both light and dark themes).
- Use the `cn()` utility from `@/lib/utils` to merge Tailwind classes conditionally.
- Components use kebab-case for file names (e.g., `sign-in-button.tsx`).

## Code Quality

- Biome is used for linting and formatting. Configuration is in `biome.json`.
- Code should follow Biome rules: tabs for indentation, double quotes, semicolons, etc.
- Format code with `npm run lint-format` before committing.

## Environment Variables

- Use `dotenv` (configured in files via `import "dotenv/config"`).
- Required variables: `DATABASE_URL` (PostgreSQL connection string), `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (for OAuth).
- Access via `process.env.VARIABLE_NAME` (typed as `string` with `!` assertion when required).
