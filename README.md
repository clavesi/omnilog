# omnilog

A SvelteKit app for discovering and logging media.

**Production:** [https://omnilog.vercel.app/](https://omnilog.vercel.app/) on [Vercel](https://vercel.com/).

## Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/) (Svelte 5), [Vite](https://vitejs.dev/), TypeScript
- **Auth:** [Better Auth](https://www.better-auth.com/) with the username plugin and GitHub/Google OAuth, `@node-rs/argon2` for password hashes. Server-only — all calls go through `auth.api.*` from SvelteKit actions, with no client-side auth client.
- **UI:** [Tailwind CSS](https://tailwindcss.com/), [bits-ui](https://bits-ui.com/) primitives, [Lucide](https://lucide.dev/) icons
- **Email:** [Resend](https://resend.com/) (verification and password reset)
- **Database:** [PostgreSQL](https://www.postgresql.org/) via [Drizzle ORM](https://orm.drizzle.team/)
- **External data:** TMDB (film/TV), IGDB (games), Tenrai (anime/manga), MusicBrainz (albums), Open Library (books)
- **Hosting:** [Vercel](https://vercel.com/) with `@sveltejs/adapter-vercel`
- **Tooling:** [Biome](https://biomejs.dev/) (lint/format)

## Requirements

- **Node.js** 24.x (see `engines` in `package.json`)
- **pnpm** (lockfile: `pnpm-lock.yaml`)
- **Local dev:** [Docker](https://www.docker.com/) (Postgres via `docker-compose.yml`)
- **Production:** a hosted **PostgreSQL** database (e.g. [Neon](https://neon.tech/); use a direct URL for migrations if your provider distinguishes pooled vs direct connections)

## Setup

1. **Clone and install**

   ```sh
   pnpm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and fill in production values (Neon URLs, TMDB key, etc.).

   Local development uses `.env.development`, which points at the Docker Postgres defined in `docker-compose.yml`. Vite loads it automatically when you run `pnpm dev`; you do not need to change `.env` for local work.

   | Variable | Purpose |
   |----------|---------|
   | `DATABASE_URL` | PostgreSQL connection string (app runtime) |
   | `DIRECT_DATABASE_URL` | Non-pooled URL for Drizzle migrations/push (recommended for Neon) |

3. **Local database**

   Start Postgres:

   ```sh
   pnpm db:up
   ```

4. **Database schema**

   Push or migrate the schema against the local database:

   ```sh
   pnpm db:push
   ```

   Or generate and apply migrations:

   ```sh
   pnpm db:generate
   pnpm db:migrate
   ```

   Optional: open Drizzle Studio with `pnpm db:studio`.

## Development

```sh
pnpm dev
```

Open the URL Vite prints (use `pnpm dev -- --open` to launch a browser tab).

## Production build

```sh
pnpm build
pnpm preview
```

`preview` serves the production build locally.

## License

Private project
