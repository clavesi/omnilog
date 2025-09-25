# Omnilog

A SvelteKit app (Letterboxd-style) for logging all kinds of media. Uses Tailwind (via `@tailwindcss/vite`) and Drizzle ORM. Local development uses a Docker Postgres; production can point to Supabase Postgres.

## Stack

- SvelteKit + Vite
- SvelteKit adapter: `@sveltejs/adapter-vercel`
- Tailwind CSS (via `@tailwindcss/vite`)
- Drizzle ORM + postgres.js driver
- Postgres (Docker for local)

## Prerequisites

- Node 18+ (Node 20+ recommended)
- pnpm 8+
- Docker Desktop

## Getting started (local dev)

1. Install deps

```bash
pnpm install
```

2. Create `.env`

- If using the included Docker Postgres (from `docker-compose.yml`):

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/local
```

- If you change credentials in `docker-compose.yml`, update the URL accordingly.

3. Start Postgres (Docker)

```bash
pnpm db:start
```

This runs `docker compose up` using `docker-compose.yml`:

```yml
services:
  db:
    image: postgres
    restart: always
    ports:
      - 5432:5432
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: local
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

4. Push schema to DB (Drizzle)

```bash
pnpm db:push
# other useful commands
pnpm db:generate   # generate migrations
pnpm db:migrate    # apply migrations
pnpm db:studio     # open Drizzle Studio
```

5. Run dev server

```bash
pnpm dev
```

Open `http://localhost:5173`.

## Project scripts

```json
{
 "dev": "vite dev",
 "build": "vite build",
 "preview": "vite preview",
 "prepare": "svelte-kit sync || echo ''",
 "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
 "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
 "format": "prettier --write .",
 "lint": "prettier --check . && eslint .",
 "db:start": "docker compose up",
 "db:push": "drizzle-kit push",
 "db:generate": "drizzle-kit generate",
 "db:migrate": "drizzle-kit migrate",
 "db:studio": "drizzle-kit studio"
}
```

## Tailwind

- Tailwind is enabled via `@tailwindcss/vite` (see `vite.config.ts`).
- Global stylesheet imports Tailwind: `src/app.css` contains `@import 'tailwindcss';`.

## Database notes

- If `pnpm db:push` fails with ECONNREFUSED, ensure Docker is running and the container is healthy:

```bash
docker compose ps
```

- If you changed `POSTGRES_USER`/`POSTGRES_PASSWORD` after the first run, the existing Docker volume still uses the old credentials. Reset it:

```bash
docker compose down -v
pnpm db:start
```

- Confirm your `.env` `DATABASE_URL` matches the credentials in `docker-compose.yml`.

## Production (Supabase or any Postgres)

- Set `DATABASE_URL` to your production Postgres connection string (e.g., from Supabase project settings).
- Use Drizzle to generate/apply migrations against prod carefully:

```bash
# generate SQL from your schema changes
pnpm db:generate
# apply migrations (only run when you intend to update prod schema)
pnpm db:migrate
```

## Deploying the app

This project currently includes `@sveltejs/adapter-vercel` in `svelte.config.js`.

### Vercel

1. Push your repo to Git.
2. Import the repo in Vercel.
3. Set Environment Variables in Vercel:
   - `DATABASE_URL` (Supabase or your managed Postgres)
4. Build & deploy. Vercel will run `pnpm install` and `pnpm build`.

Pass environment variables via your process manager or `.env`.

## Development tips

- Add tables in `src/lib/server/db/schema.ts` using Drizzle’s `pg-core` API, import them in `src/lib/server/db/index.ts`, and run `pnpm db:push`.
- Use `+page.server.ts`/`+server.ts` for server-only DB operations.

## Troubleshooting

- Password authentication failed for user:
  - Your `DATABASE_URL` credentials do not match the running container. Reset volume or update `.env`.
- Types not updating:
  - Re-run `pnpm check` or restart the dev server after major type changes.

---

Feel free to ask for an auth flow to be added (BetterAuth, OAuth, etc.) or for a Supabase-managed migration workflow if you prefer pushing schema via Supabase CLI.
