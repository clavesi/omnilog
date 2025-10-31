# OmniLog

A Next.js application with PostgreSQL database, authentication, and modern UI components.

## Getting Started

### Prerequisites

- Node.js and pnpm (or npm/yarn)
- Docker (for local database)

### Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start the local database:**

   ```bash
   docker-compose up -d
   ```

3. **Configure environment variables:**

   Create a `.env.local` file with:

   ```env
   DATABASE_URL=postgresql://omnilog:omnilog_dev_password@localhost:5432/omnilog
   URL_LOCAL=http://localhost:3000
   URL_PUBLIC=https://your-production-domain.com
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. **Run database migrations:**

   ```bash
   pnpm db:migrate
   ```

5. **Start the development server:**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Database Commands

- `pnpm db:generate` - Generate migration files from schema changes
- `pnpm db:migrate` - Run pending migrations
- `pnpm db:push` - Push schema changes directly (dev only)

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint-format` - Lint and format code

## Stack

- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM
- [Better Auth](https://better-auth.com) - Authentication
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Biome](https://biomejs.dev) - Linting and formatting
