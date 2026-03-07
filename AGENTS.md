# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Brutify is a French-language SaaS Next.js 14 app for content creators. It provides competitive analysis of social media creators, AI-powered script generation, video transcription, and content strategy tools. Uses a dark theme with gold accents.

### Running the app

- Dev server: `npm run dev` (port 3000, uses Turbopack)
- Build: `npm run build`
- Lint: `npm run lint`
- See `package.json` for all scripts

### Architecture

Single Next.js app (not a monorepo). Key directories:
- `src/app/api/` — 48+ API routes
- `src/lib/ai/` — AI providers (OpenRouter for Claude, OpenAI for Whisper)
- `src/components/` — React components
- `src/hooks/` — SWR-based data fetching hooks

### AI providers (important)

- **Text generation**: OpenRouter (`OPENROUTER_API_KEY`) → model `anthropic/claude-sonnet-4.6`
- **Audio transcription**: OpenAI direct (`OPENAI_API_KEY`) → model `whisper-1`
- Never mix providers: text generation must go through OpenRouter, Whisper must go through OpenAI direct
- See `.cursor/rules/ai-providers.mdc` for authoritative rules

### Required secrets for full functionality

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — required for any backend functionality
- `OPENROUTER_API_KEY` — required for AI analysis and script generation
- `OPENAI_API_KEY` — required for video transcription
- `STRIPE_SECRET_KEY` — required for payment flows
- `APIFY_API_KEY` — required for social media scraping

### Gotchas

- `next.config.mjs` has `ignoreBuildErrors: true` for both ESLint and TypeScript, so `npm run build` will succeed even with type errors. Run `npm run lint` separately.
- The app uses Supabase hosted (cloud), not local Supabase CLI. No Docker needed.
- ESLint has some pre-existing warnings (unused vars, missing deps in hooks) — these are not from any recent changes.
- **Database migrations**: SQL migration files are in `supabase/`. They must be run manually in the Supabase Dashboard SQL Editor. The `creator_analyses` table (required for competitive analysis feature) is defined in `supabase/creator_analyses.sql`.
- **Scripts page**: Hook and Structure selection fields appear empty until a competitive analysis has been completed — this is by design, not a bug. The data comes from `/api/scripts/insights` which aggregates completed creator analyses.
- **Direct DB access**: The cloud VM cannot reach Supabase PostgreSQL directly (IPv6 only, network restricted). Use Supabase Dashboard SQL Editor for DDL operations.
