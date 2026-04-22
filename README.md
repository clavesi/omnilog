# omnilog

A SvelteKit app for discovering and logging media.

**Production:** [https://omnilog.vercel.app/](https://omnilog.vercel.app/) on [Vercel](https://vercel.com/).

## Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/) (Svelte 5), [Vite](https://vitejs.dev/), TypeScript
- **Auth:** [Lucia](https://lucia-auth.com/)-style sessions, [Oslo](https://oslojs.dev/), and [Arctic](https://arcticjs.dev/) for OAuth, `@node-rs/argon2` for password hashes
- **UI:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) via [Drizzle ORM](https://orm.drizzle.team/)
- **Hosting:** [Vercel](https://vercel.com/) with `@sveltejs/adapter-vercel`
- **Tooling:** [Biome](https://biomejs.dev/) (lint/format)

## Requirements

- **Node.js** 24.x (see `engines` in `package.json`)
- **pnpm** (lockfile: `pnpm-lock.yaml`)
- A **PostgreSQL** database (e.g. [Neon](https://neon.tech/); use a direct URL for migrations if your provider distinguishes pooled vs direct connections)

## Setup

1. **Clone and install**

   ```sh
   pnpm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and fill in the values documented there. At minimum you need database URLs:

   | Variable | Purpose |
   |----------|---------|
   | `DATABASE_URL` | PostgreSQL connection string (app runtime) |
   | `DIRECT_DATABASE_URL` | Non-pooled URL for Drizzle migrations/push (recommended for Neon) |

3. **Database schema**

   Push or migrate the schema (Drizzle reads `DATABASE_URL` / `DIRECT_DATABASE_URL` from the environment):

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
