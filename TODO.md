# TODO — Sari AI Fashion Generator

Status legend: ✅ done · 🔨 in progress · ⬜ todo

## Phase 0 — Scaffold & research ✅
- [x] Research OpenRouter Unified Image API (endpoint, `input_references`, `b64_json`)
- [x] Verify model slugs (Nano Banana Pro / 2) & prompt engineering for Indian garments
- [x] `create-next-app` (Next 16, React 19, TS, Tailwind v4, ESLint, App Router)
- [x] Install deps (`@supabase/ssr`, `supabase-js`, `sharp`, `lucide-react`, `cva`, `clsx`, `tailwind-merge`)

## Phase 1 — Foundation (shared contracts) ✅
- [x] Design tokens + dark mode + animations (`app/globals.css`)
- [x] Root layout: Playfair + Inter fonts, no-flash theme, `ToastProvider`
- [x] `types/index.ts` (Profile, Generation, API I/O, presets, Database + Relationships)
- [x] `lib/utils.ts`, `lib/constants.ts` (models, presets, resolutions, **prompt builders**)
- [x] `lib/openrouter.ts` (`generateFashionModel`, `changeBackground`, fallback)
- [x] Supabase clients: `client`, `server`, `admin`, `middleware`, `storage`
- [x] `lib/auth.ts` (user, daily usage), `proxy.ts` (route protection — Next 16 convention)
- [x] Auth server actions (`signIn`, `signUp`, `signOut`)
- [x] UI primitives + shell (Button, Input, Card, Badge, Toast, Progress, headers, footer, logo, theme)
- [x] Route-group layouts `(auth)` + `(protected)`
- [x] DB migration SQL (schema, RLS, triggers, storage buckets/policies)
- [x] `CLAUDE.md`, `SETUP.md`, `README.md`, `.env.local.example`

## Phase 2 — Features (built by 4 parallel agents) ✅
- [x] **Landing** (`app/page.tsx`) — hero, features, how-it-works, pricing, CTA
- [x] **Auth pages** — login (returnUrl + confirm notice) & signup
- [x] **Dashboard** — usage stats, history grid, empty state, generation cards
- [x] **Wizard** — 4 steps + ImageUploadZone, GenerationProgress, BackgroundPicker,
      ResolutionSelector, ComparisonSlider, Stepper, past-generation view
- [x] **API routes** — `/api/generate`, `/api/background`, `/api/download` (sharp)

## Phase 3 — Integration & QA ✅
- [x] `npx tsc --noEmit` clean (whole project)
- [x] `npm run build` clean (11 routes, 0 warnings after proxy + turbopack.root fixes)
- [x] `npm run lint` clean
- [x] Supabase migration verified applied (tables + buckets exist) — `npm run check:db`
- [x] Runtime smoke test: landing 200, protected → 307 `/login?returnUrl`, API → 401
- [x] Security hardening: auth-checked-before-validation in all API routes

## ⚠️ Action required by user (runtime)
- [x] Supabase project + URL/anon/service-role keys in `.env.local` — **done by user**
- [x] SQL migration run (tables + buckets verified) — **done**
- [ ] **Add a real `OPENROUTER_API_KEY` to `.env.local`** (currently a placeholder) — the
      only remaining step before AI generation works. Get one at https://openrouter.ai/keys
      and ensure the account has credit (image models are paid per image).

## Possible next steps (optional)
- [ ] End-to-end test with a real sari image once the OpenRouter key is set
- [ ] Add a favicon / OG image; replace default scaffold SVGs in `public/`
- [ ] Rate-limit feedback polish; per-generation delete from dashboard
- [ ] Commit to git (currently uncommitted)
