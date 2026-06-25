# CLAUDE.md — Sari AI Fashion Generator

Guidance for Claude Code (and any sub-agents) working in this repository.

## What this is
A production B2B SaaS web app: a user uploads a photo of an Indian sari (or any
garment); the app uses AI to (1) generate a realistic fashion model wearing that
sari, (2) replace the background, and (3) export the result at any resolution.
Target users: Indian fashion brands, e-commerce sellers, Instagram boutiques, ad
agencies. Output must be advertisement-ready and 4K-capable.

## Tech stack (as actually installed — note deviations from PRD.md)
- **Next.js 16.2** App Router + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** — tokens via `@theme` in `app/globals.css`. There is **no**
  `tailwind.config.ts` (PRD assumed v3; we use v4). Dark mode is **class-based**
  (`@custom-variant dark`).
- **Supabase** via `@supabase/ssr` (Auth, Postgres, Storage)
- **OpenRouter Unified Image API** for generation/editing
- **sharp** for server-side resize in the download route
- **lucide-react** icons, **class-variance-authority**, **clsx + tailwind-merge** (`cn`)

## ⚠️ OpenRouter facts (verified — PRD.md was partly wrong)
- Endpoint is **`POST https://openrouter.ai/api/v1/images`** (NOT `/images/generations`).
- Input/reference images for editing go in **`input_references: [{ type:"image_url", image_url:{ url } }]`**.
- Response returns **base64** at **`data[0].b64_json`** (NOT a URL). We decode →
  `Buffer` → upload to Supabase Storage (our permanent source of truth).
- Models (verified slugs):
  - Primary: `google/gemini-3-pro-image-preview` (Nano Banana Pro)
  - Fallback: `google/gemini-3.1-flash-image-preview` (Nano Banana 2)
- Always send headers `Authorization: Bearer …`, `HTTP-Referer`, `X-Title`.
- Request also sends `resolution:"4K"`, `aspect_ratio:"3:4"`, `output_format:"png"`.
- All OpenRouter calls are **server-only** (`lib/openrouter.ts` imports `server-only`).

## Architecture & data flow
1. **Upload (client):** browser uploads the sari File to `sari-uploads/{userId}/…`
   via the anon Supabase client → public URL. A `generations` row is created.
2. **Generate (`/api/generate`):** verifies session, enforces daily limit, calls
   `generateFashionModel(sariUrl)`, uploads the returned base64 to
   `generated-outputs/…` (service role), updates the row → returns our CDN URL.
3. **Background (`/api/background`):** calls `changeBackground(modelUrl, type, value)`,
   uploads, updates row.
4. **Download (`/api/download`):** fetches the final image, `sharp.resize(w,h)`,
   streams a PNG attachment; records the chosen resolution.

## Key conventions
- **Supabase clients:** `lib/supabase/client.ts` (browser), `server.ts` (RLS, per
  request — `cookies()` is async, `await createClient()`), `admin.ts` (service role,
  server-only, bypasses RLS), `middleware.ts` (`updateSession`).
- **Auth/usage helpers:** `lib/auth.ts` — `getAuthenticatedUser`, `getDailyUsage`,
  `countTodayUsage`. Daily limit = `DAILY_GENERATION_LIMIT` (10).
- **Server actions:** `app/(auth)/actions.ts` → `signIn`, `signUp`, `signOut`.
- **Types are the contract:** import shared types from `@/types`. API request/response
  shapes live there (`GenerateRequest`, `BackgroundResponse`, etc.). Don't redefine.
- **Constants & prompts:** `lib/constants.ts` — models, limits, `PRESET_BACKGROUNDS`,
  `RESOLUTION_PRESETS`, `buildGenerationPrompt`, `buildBackgroundPrompt`. Prompt
  engineering for garment fidelity / 4K lives here; reuse it, don't inline prompts.
- **Import alias:** `@/*` → repo root.

## Design system (use these — do not hardcode hex in components)
- Fonts: `font-display` (Playfair Display, headings), `font-sans` (Inter, body).
- Semantic color utilities (auto light/dark): `bg-background`, `bg-surface`,
  `bg-surface-2`, `text-foreground`, `text-muted`, `border-border`,
  `bg-primary text-primary-foreground`, `bg-accent text-accent-foreground`,
  `text-accent-strong` (WCAG-safe gold for text/links), `ring-ring`,
  `text-destructive`, `text-success`.
- Static brand scale: `navy-{950..500}`, `champagne-{50..300}`, `gold-{300..700}`.
- Helpers: `.kicker` (uppercase gold eyebrow), `.hairline` (gold divider),
  `.shimmer` (skeletons), `.text-gradient-gold`, `shadow-soft`, `shadow-lift`.
- Animations: `animate-fade-up`, `animate-fade-in`, `animate-scale-in`.
- Primitives in `components/ui/`: `Button` (+`buttonVariants`), `Input`, `Textarea`,
  `Label`, `Card*`, `Badge`, `Spinner`, `Skeleton`, `Progress`, toast via
  `useToast()` from `@/components/ui/toast`. Theme: `<ThemeToggle/>`.
- Aesthetic: premium editorial fashion — generous whitespace, gold hairline accents,
  Playfair display headings, subtle motion (150–400ms), full mobile responsiveness
  (375→2560px), accessible (focus rings, 44px targets, `prefers-reduced-motion`).

## Commands
```bash
npm run dev          # start dev server (http://localhost:3000)
npm run build        # production build (also full typecheck)
npm run lint         # eslint
npx tsc --noEmit     # typecheck only
```

## Setup (see SETUP.md for detail)
1. `cp .env.local.example .env.local` and fill Supabase + OpenRouter keys.
2. Run `supabase/migrations/0001_init.sql` in the Supabase SQL Editor (creates
   tables, RLS, triggers, storage buckets + policies).
3. `npm run dev`.

## Gotchas
- Next 16: `cookies()`/`headers()` are async — always `await`.
- Never import `lib/supabase/admin.ts` or `lib/openrouter.ts` into client components.
- Generated images are persisted to Storage; never rely on transient model URLs.
- The middleware + the `(protected)` layout both guard routes (defense in depth).
