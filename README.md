# The Worker (הפועל)

A Hebrew game built on one shared historical data engine for Hapoel Tel Aviv:
trivia, historical lineup building, memory, and kit reconstruction.

- Architecture and data model — `docs/00-architecture.md`
- Visual identity and tokens — `docs/01-brand-concept.md`
- Open data questions — `docs/02-data-questions.md`
- Schema — `supabase/migrations/`

## Setup

```bash
cp .env.example .env.local     # fill in the Supabase keys
npm install
npm run dev
```

Stack: Next.js (App Router) · TypeScript strict · Tailwind + design tokens ·
Supabase (Postgres, RLS, Storage) · Vercel · Sentry.
