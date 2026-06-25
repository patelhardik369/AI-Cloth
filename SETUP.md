# Setup — Sari AI Fashion Generator

## 1. Install
```bash
npm install
```

## 2. Environment variables
Copy the template and fill in your keys:
```bash
cp .env.local.example .env.local
```
| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key (keep secret) |
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |

## 3. Database & storage
1. Open Supabase → **SQL Editor** → New query.
2. Paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and **Run**.
3. This creates the `profiles` and `generations` tables, RLS policies, the
   profile-on-signup trigger, and the two public storage buckets
   (`sari-uploads`, `generated-outputs`) with their policies.

> **Tip:** For the smoothest sign-up flow during development, disable email
> confirmation: Supabase → Authentication → Providers → Email → turn **off**
> "Confirm email". (With it on, new users are routed to `/login?confirm=1`.)

## 4. OpenRouter
- Add credit to your OpenRouter account (image models are paid per image).
- The app uses `google/gemini-3-pro-image-preview` (Nano Banana Pro) with
  `google/gemini-3.1-flash-image-preview` as an automatic fallback.

## 5. Run
```bash
npm run dev
# → http://localhost:3000
```

## 6. Smoke test
1. Sign up, log in.
2. Dashboard → **New shoot**.
3. Upload a clear, well-lit photo of a sari (JPG/PNG/WEBP, ≤10 MB).
4. Generate → pick a background → choose a resolution → download.

## Troubleshooting
- **401 / redirected to login:** check the three Supabase env vars and that you ran the SQL.
- **OpenRouter errors:** verify `OPENROUTER_API_KEY` and account credit; check the
  server logs (the route stores `error_message` on the generation row).
- **Upload denied:** ensure the storage buckets exist and the SQL policies were applied.
- **Images don't render:** confirm your Supabase host matches `next.config.ts`
  `images.remotePatterns` (defaults cover `*.supabase.co`).
