# CLAUDE.md — Sari AI Fashion Generator

Guidance for Claude Code (and any sub-agents) working in this repository.

## What this is
A production B2B SaaS web app: a user uploads a photo of an Indian sari (or any
garment); the app uses AI to generate a realistic fashion model wearing **the exact
same garment**, in a **single pass** that also sets the pose/scene/background from a
user-editable prompt, then exports the result at any resolution. Target users: Indian
fashion brands, e-commerce sellers, Instagram boutiques, ad agencies. Output must be
advertisement-ready and 4K-capable.

## Tech stack (as actually installed — note deviations from PRD.md)
- **Next.js 16.2** App Router + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** — tokens via `@theme` in `app/globals.css`. There is **no**
  `tailwind.config.ts` (PRD assumed v3; we use v4). Dark mode is **class-based**
  (`@custom-variant dark`).
- **Supabase** via `@supabase/ssr` (Auth, Postgres, Storage)
- **FASHN Product-to-Model API** (`api.fashn.ai`) for generation — chosen over Gemini
  because it warps the *actual garment pixels* onto the model (exact-garment fidelity)
  and renders native 4K in one call. (Gemini/OpenRouter was removed; it re-painted the
  cloth.)
- **sharp** for server-side resize in the download route
- **lucide-react** icons, **class-variance-authority**, **clsx + tailwind-merge** (`cn`)

## ⚠️ FASHN facts (verified)
- Run: **`POST https://api.fashn.ai/v1/run`**, header `Authorization: Bearer <FASHN_API_KEY>`.
  Body: `{ model_name: "product-to-model", inputs: {…} }`.
- Inputs we send: `product_image` (the sari's Supabase public URL), `prompt`
  (free-text: model/pose/scene/props), `aspect_ratio:"3:4"`, `resolution:"4k"`,
  `generation_mode:"fast"`, `output_format:"png"`, `return_base64:false`, `num_images:1`,
  `seed` (**randomised per call** in `lib/fashn.ts` so "Regenerate" differs).
- **Async:** run returns `{ id }`; poll **`GET /v1/status/{id}`** until
  `status:"completed"` → `output:[cdnUrl]` (or `"failed"` with `error`).
- Output is a **hosted CDN URL** → we fetch it → `Buffer` → upload to Supabase Storage
  (our permanent source of truth) via `uploadGeneratedImageFromUrl`.
- All FASHN calls are **server-only** (`lib/fashn.ts` imports `server-only`).
- Tunables live in `lib/constants.ts` (`FASHN_*`). 4k modes: fast≈$0.225, balanced≈$0.30,
  quality≈$0.375 per image.

## Architecture & data flow
1. **Upload (client):** browser uploads the sari File to `sari-uploads/{userId}/…`
   via the anon Supabase client → public URL. A `generations` row is created.
2. **Generate (`/api/generate`) — single pass:** verifies session + row ownership,
   calls `generateFashionModel(sariUrl, prompt)` (one FASHN call carrying all
   instructions), fetches the FASHN CDN result and re-uploads it to `generated-outputs/…`
   (service role), updates the row (`generated_image_url == final_image_url`) → returns
   our CDN URL. **No daily limit.** There is **no** separate background step.
3. **Download (`/api/download`):** fetches the final image, `sharp.resize(w,h)`,
   streams a PNG attachment; records the chosen resolution.

## Key conventions
- **Supabase clients:** `lib/supabase/client.ts` (browser), `server.ts` (RLS, per
  request — `cookies()` is async, `await createClient()`), `admin.ts` (service role,
  server-only, bypasses RLS), `middleware.ts` (`updateSession`).
- **Auth helpers:** `lib/auth.ts` — `getAuthenticatedUser`, `getProfile`. (No usage/limit
  helpers — the daily cap was removed.)
- **Server actions:** `app/(auth)/actions.ts` → `signIn`, `signUp`, `signOut`.
- **Types are the contract:** import shared types from `@/types`. API request/response
  shapes live there (`GenerateRequest` — now carries `prompt`, `GenerateResponse`,
  `DownloadRequest`). Don't redefine.
- **Constants & prompt:** `lib/constants.ts` — `FASHN_*` settings, `PRESET_BACKGROUNDS`
  (also used as "quick scene" chips), `RESOLUTION_PRESETS`, and `DEFAULT_GENERATION_PROMPT`
  (seeds the editable prompt textarea in the wizard). Reuse it; don't inline prompts.
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
1. `cp .env.local.example .env.local` and fill Supabase + `FASHN_API_KEY`.
2. Run `supabase/migrations/0001_init.sql` in the Supabase SQL Editor (creates
   tables, RLS, triggers, storage buckets + policies).
3. `npm run dev`.

## Gotchas
- Next 16: `cookies()`/`headers()` are async — always `await`.
- Never import `lib/supabase/admin.ts` or `lib/fashn.ts` into client components.
- Generated images are persisted to Storage; never rely on transient FASHN CDN URLs.
- FASHN is async (run → poll); the generate route's `maxDuration=120` bounds the poll
  loop (`FASHN_POLL_TIMEOUT_MS≈110s`).
- The middleware + the `(protected)` layout both guard routes (defense in depth).
