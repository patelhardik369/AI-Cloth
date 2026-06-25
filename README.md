# Sari AI — Fashion Model Generator

Turn a single photo of an Indian sari (or any garment) into an **advertisement-ready
AI fashion shoot**. Upload a sari, generate a realistic model wearing it, swap the
background, and export in true **4K** — in under a minute.

Built for Indian fashion brands, e-commerce sellers, Instagram boutiques and ad agencies.

---

## ✨ Features
- **AI model generation** — a realistic fashion model wearing your exact sari, with
  garment fidelity (color, weave, zari border, pallu) preserved.
- **Background studio** — 8 curated presets (heritage palace, garden, beach sunset,
  Mughal archway, festive rangoli…), free-text custom scenes, or a solid color.
- **Any resolution export** — social square, IG portrait, Full-HD banner, 4K print,
  or a custom width × height — resized server-side with `sharp`.
- **Before/after comparison slider**, generation history, daily usage tracking.
- **Premium editorial UI** — Playfair Display + Inter, navy/champagne/gold palette,
  full dark mode, mobile-first and accessible.

## 🧱 Tech stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 (`@theme` tokens, class-based dark mode) |
| Auth / DB / Storage | Supabase (`@supabase/ssr`) |
| AI image engine | OpenRouter Unified Image API — `google/gemini-3-pro-image-preview` (Nano Banana Pro), with `gemini-3.1-flash-image-preview` fallback |
| Image resize | `sharp` |
| Icons / utils | lucide-react, class-variance-authority, clsx + tailwind-merge |

## 🏗️ How it works
```
Sari photo ──▶ Supabase Storage (sari-uploads)
            └─▶ /api/generate ──▶ Nano Banana Pro ──▶ generated-outputs ──▶ model image
                                /api/background ──▶ background-swapped image
                                /api/download  ──▶ sharp resize ──▶ PNG download
```
All AI calls are server-only; generated images are persisted to Supabase Storage
(never relying on transient model URLs).

## 🚀 Getting started
See **[SETUP.md](SETUP.md)** for the full guide. In short:
```bash
npm install
cp .env.local.example .env.local      # add Supabase + OpenRouter keys
# run supabase/migrations/0001_init.sql in the Supabase SQL editor
npm run dev                            # http://localhost:3000
```

## 📁 Project layout
```
app/
  (auth)/        login, signup, auth server actions
  (protected)/   dashboard, generate (4-step wizard), generate/[id]
  api/           generate, background, download
  page.tsx       landing
components/       ui/ primitives + feature components + app shell
lib/              supabase clients, openrouter client, auth, constants, utils
types/            shared type contract
supabase/         SQL migration (schema, RLS, storage)
```

## 📚 Docs
- **[CLAUDE.md](CLAUDE.md)** — architecture, conventions, design system, API contract
- **[SETUP.md](SETUP.md)** — environment, database, run & troubleshooting
- **[TODO.md](TODO.md)** — build status & roadmap
- **[PRD.md](PRD.md)** — original product spec

---
_Output quality depends on a clear, well-lit, front-facing sari photo. The model
renders a full-body editorial shot at 4K; downscale for web or keep 4K for print._
