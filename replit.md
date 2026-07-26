# TownFeed

A Minecraft server city catalog for the "TownFeed" server. Players can browse cities, view detailed city pages with photos and stats, leave comments, and admins can manage cities and news from a protected panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from env)
- `pnpm --filter @workspace/townsend run dev` — run the frontend (port from env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS, Wouter, TanStack Query, Fuse.js
- Backend: Express 5
- Database: Supabase (PostgreSQL via @supabase/supabase-js with service role key)
- API codegen: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)
- Fonts: Inter (body), Press Start 2P (pixel headings)

## Where things live

- `artifacts/townsend/` — React frontend (dark pixel-art Minecraft theme)
- `artifacts/api-server/` — Express API server
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod schemas for server-side validation
- `artifacts/api-server/src/lib/supabase.ts` — Supabase admin client
- `artifacts/api-server/src/lib/auth.ts` — Admin token generation/validation

## Environment Variables & Secrets

- `SUPABASE_URL` — Supabase project URL (set as env var)
- `SUPABASE_ANON_KEY` — Supabase anon/publishable key (set as env var)
- `SUPABASE_SERVICE_ROLE_KEY` — **Secret** — service role key for admin operations
- `ADMIN_PASSWORD` — **Secret** — password for the /admin panel

## Supabase Tables

Run this SQL in your Supabase SQL editor to create the required tables:

```sql
-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  treasury TEXT NOT NULL,
  reputation TEXT NOT NULL,
  founder TEXT NOT NULL,
  population TEXT NOT NULL,
  coordinates_x TEXT NOT NULL,
  coordinates_z TEXT NOT NULL,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  map_link TEXT,
  spawn_command TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News table
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security (backend uses service role key — bypasses RLS)
ALTER TABLE cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE news DISABLE ROW LEVEL SECURITY;
```

## Architecture decisions

- Uses Supabase directly (not Drizzle ORM) — service role key bypasses RLS for admin operations from the Express backend.
- Admin auth is a simple password-based token (base64 encoded, validated server-side). Token stored in localStorage on frontend.
- Fuzzy search (Fuse.js) runs client-side on the cities list — no backend search endpoint needed.
- Google OAuth mentioned by user but Supabase Auth handles that on the Supabase side. Not wired to comments yet.

## User preferences

- Dark theme only — pixel-art Minecraft aesthetic
- Fonts: Press Start 2P for headings/city names, Inter for body text
- No emojis in the UI
- Russian-speaking user (project brief was in Russian)
