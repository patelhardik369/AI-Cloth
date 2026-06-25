<sequential_thinking>
Use sequential thinking MCP for ALL architectural decisions, feature planning, API integration logic, and UI/UX flow design. Think through every step explicitly before writing any code. Break the build into discrete phases and reason through tradeoffs at each decision point.
</sequential_thinking>

<context7>
Use Context7 MCP to fetch the latest official documentation for: Next.js 14+ App Router, Supabase JS v2 client, Supabase Auth, Supabase Storage, OpenRouter Image API (unified image endpoint), and Tailwind CSS v3. Retrieve and reference the actual API signatures, hooks, and configuration patterns before writing any integration code.
</context7>

---

# PROJECT: AI Sari Fashion Model Generator — Full-Stack Web App

## Overview
Build a production-ready full-stack web application where users upload an image of an Indian traditional sari (or any garment), and the system uses AI (via OpenRouter's Image API) to:
1. Generate a realistic AI fashion model wearing that sari
2. Allow users to change the background of the generated image
3. Export the final image at any custom resolution the user specifies
4. The output must be advertisement-ready and showcase-quality for Indian fashion brands

This is a B2B SaaS tool targeting Indian fashion brands, e-commerce sellers, Instagram boutiques, and advertising agencies.

---

## Tech Stack
- **Frontend**: Next.js 14+ App Router (TypeScript)
- **Styling**: Tailwind CSS v3
- **Auth + Database**: Supabase (Auth, PostgreSQL, Storage)
- **AI Image Generation & Editing**: OpenRouter Image API
  - **Primary Model**: `google/gemini-3-pro-image` (Nano Banana Pro — Gemini 3 Pro Image)
  - **Fallback Model**: `google/gemini-3.1-flash-image` (Nano Banana 2 — for cheaper retries)
  - Nano Banana Pro is chosen because it supports: identity preservation, localized edits, background replacement, native 2K/4K output, and high-fidelity garment texture rendering
- **Image Resizing**: `sharp` npm package (server-side)
- **File Storage**: Supabase Storage

---

## Core Features to Build

### 1. Authentication (Supabase Auth)
- Sign Up page with email + password
- Login page with email + password
- Protected routes — redirect unauthenticated users to login
- User session persistence via Supabase Auth JS v2
- Profile stored in Supabase `profiles` table (id, email, full_name, created_at, generation_count)
- Supabase auth middleware in `middleware.ts` to protect all `/dashboard` and `/generate` routes

### 2. Dashboard (Post-login home)
- Show user's generation history (past sari uploads + generated model image thumbnails)
- Display generation count used / daily limit (10 per day)
- CTA button: "Generate New Fashion Shoot"
- Each history card shows: sari image thumbnail, generated model thumbnail, date, background type used, resolution, download button

### 3. Sari Upload & AI Model Generation Flow (4-Step Wizard)

**Step 1 — Upload Sari Image**
- Drag-and-drop or click-to-upload image input
- Accept: JPG, PNG, WEBP (max 10MB)
- Show preview of uploaded sari image
- Validate file type and dimensions client-side before upload
- Upload to Supabase Storage bucket: `sari-uploads/{user_id}/{uuid}.{ext}`
- Return the public CDN URL for use in the next step

**Step 2 — AI Model Generation**
- Call OpenRouter Image API using model `google/gemini-3-pro-image` (Nano Banana Pro)
- Use this dynamically constructed prompt: "A professional Indian female fashion model wearing this traditional Indian sari from the reference image.
The model is posed elegantly in a clean white studio setting with soft diffused lighting.
Full body shot showing the complete drape and pallu of the sari.
The sari fabric texture, embroidery, and border details are clearly visible.
The model has a natural, confident expression.
High-end fashion photography style, advertisement quality, sharp focus, 4K resolution."
- Pass the Supabase Storage public URL of the uploaded sari image as the input image reference
- Call OpenRouter's unified Image API endpoint: `POST https://openrouter.ai/api/v1/images/generations`
- Use `google/gemini-3-pro-image` as the model parameter
- Show a loading state with animated progress bar and estimated time message ("This usually takes 20–40 seconds…")
- Poll or await the response; on success display the generated model image side-by-side with the original sari
- Upload the generated output image to Supabase Storage: `generated-outputs/{user_id}/{uuid}.png`
- Save generation record to `generations` table in DB with status `completed`

**Step 3 — Background Customization**
- Show the generated model image prominently
- Provide a background selection panel with three modes:
a. **Preset Backgrounds** — clickable grid of preset options with preview thumbnails:
   - White Studio
   - Outdoor Garden (lush greenery)
   - Heritage Palace / Mahal
   - Modern City Skyline
   - Pastel Abstract Bokeh
   - Festive Rangoli Floor
   - Beach at Sunset
   - Mughal Architecture Archway
b. **Custom Background** — text input field: "Describe your background…" (e.g., "Rajasthan palace courtyard at golden hour with warm amber lighting")
c. **Solid Color** — color picker (hex input + visual swatch selector)
- On user selection, call OpenRouter Image API again:
- Model: `google/gemini-3-pro-image`
- Input image: the generated model image URL
- Prompt: `"Replace the background of this image with: [user selection]. Keep the model, her pose, and the sari exactly as they are — do not change any garment details, colors, or the model's appearance. Seamlessly blend the new background. Photorealistic, advertisement quality, sharp focus."`
- Show a before/after comparison slider (drag handle) once background is applied
- Store the background-changed image in Supabase Storage and update the `generations` record

**Step 4 — Resolution & Export**
- Show the final image (with background applied)
- Resolution selector:
- Social Media Square (1080×1080)
- Instagram Portrait (1080×1350)
- Full HD Banner (1920×1080)
- 4K Print (3840×2160)
- Custom — two number inputs for width (px) and height (px), min 256, max 8192 per side
- "Download Image" button — calls `/api/download` route which uses `sharp` to resize to requested resolution and streams the PNG back to the browser for download
- "Copy Link" button — copies the Supabase Storage public CDN URL of the final image
- Save final resolution to `generations` table (resolution_width, resolution_height fields)

---

## Database Schema (Supabase PostgreSQL)

```sql
-- Run this in the Supabase SQL Editor

CREATE TABLE profiles (
id UUID REFERENCES auth.users(id) PRIMARY KEY,
email TEXT,
full_name TEXT,
avatar_url TEXT,
generation_count INTEGER DEFAULT 0,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generations (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
sari_image_url TEXT NOT NULL,
generated_image_url TEXT,
background_image_url TEXT,
final_image_url TEXT,
background_type TEXT,          -- 'preset' | 'custom' | 'solid'
background_value TEXT,         -- preset name, custom description, or hex color
resolution_width INTEGER,
resolution_height INTEGER,
prompt_used TEXT,
model_used TEXT DEFAULT 'google/gemini-3-pro-image',
status TEXT DEFAULT 'pending', -- 'pending' | 'generating' | 'completed' | 'failed'
error_message TEXT,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
INSERT INTO public.profiles (id, email)
VALUES (NEW.id, NEW.email);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own their generations" ON generations FOR ALL USING (auth.uid() = user_id);
```

---

## Supabase Storage Setup

Create two buckets via Supabase dashboard or migration:

1. **`sari-uploads`** — Public read, authenticated write
 - Max file size: 10MB
 - Allowed MIME types: image/jpeg, image/png, image/webp

2. **`generated-outputs`** — Public read, authenticated write
 - For all AI-generated model images, background-changed images, and final exports

Storage helper functions to build in `lib/supabase/storage.ts`:
- `uploadSariImage(file: File, userId: string): Promise<string>` → returns public URL
- `uploadGeneratedImage(imageUrl: string, userId: string, filename: string): Promise<string>` → fetches image from OpenRouter response URL, uploads to Supabase, returns CDN URL
- `getPublicUrl(bucket: string, path: string): string`

---

## OpenRouter API Integration

Use Context7 to fetch the latest OpenRouter Image API documentation before implementing.

```typescript
// lib/openrouter.ts

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Primary model for this project
export const PRIMARY_MODEL = "google/gemini-3-pro-image";      // Nano Banana Pro
export const FALLBACK_MODEL = "google/gemini-3.1-flash-image"; // Nano Banana 2 (cheaper retries)

// Function: Generate AI model wearing the sari
export async function generateFashionModel(
sariImageUrl: string,
customPrompt?: string
): Promise<string> {
// Call POST /images/generations with PRIMARY_MODEL
// Pass sariImageUrl as input image reference
// Return the generated image URL
}

// Function: Replace background of generated model image
export async function changeBackground(
modelImageUrl: string,
backgroundDescription: string
): Promise<string> {
// Call POST /images/generations with PRIMARY_MODEL
// Pass modelImageUrl as input image
// Prompt: replace background, preserve model + sari exactly
// Return the new image URL
}
```

---

## Next.js API Routes (App Router)

### `app/api/generate/route.ts` — POST
- Verify Supabase session (reject if unauthenticated)
- Check user's daily generation count (max 10/day from `generations` table)
- Accept: `{ sariImageUrl: string, userId: string, generationId: string }`
- Update `generations` status to `generating`
- Call `generateFashionModel()` from `lib/openrouter.ts`
- Upload result to Supabase Storage via `uploadGeneratedImage()`
- Update `generations` record with `generated_image_url` and status `completed`
- Increment `profiles.generation_count`
- Return: `{ generatedImageUrl: string }`

### `app/api/background/route.ts` — POST
- Verify Supabase session
- Accept: `{ modelImageUrl: string, backgroundType: string, backgroundValue: string, generationId: string }`
- Build background prompt based on `backgroundType` (preset name / custom text / hex color)
- Call `changeBackground()` from `lib/openrouter.ts`
- Upload result to Supabase Storage
- Update `generations` record with `background_image_url`, `final_image_url`, `background_type`, `background_value`
- Return: `{ backgroundImageUrl: string }`

### `app/api/download/route.ts` — POST
- Verify Supabase session
- Accept: `{ imageUrl: string, width: number, height: number, generationId: string }`
- Validate width/height (256–8192 range)
- Fetch image from Supabase CDN URL
- Use `sharp` to resize to requested dimensions (`sharp(buffer).resize(width, height).png({ quality: 100 })`)
- Update `generations` record with `resolution_width` and `resolution_height`
- Return the resized PNG as a stream with `Content-Disposition: attachment` header

---

## File & Folder Structure
project-root/
├── app/
│ ├── (auth)/
│ │ ├── login/
│ │ │ └── page.tsx
│ │ └── signup/
│ │ └── page.tsx
│ ├── (protected)/
│ │ ├── dashboard/
│ │ │ └── page.tsx
│ │ └── generate/
│ │ ├── page.tsx ← 4-step wizard
│ │ └── [id]/
│ │ └── page.tsx ← view past generation
│ ├── api/
│ │ ├── generate/
│ │ │ └── route.ts
│ │ ├── background/
│ │ │ └── route.ts
│ │ └── download/
│ │ └── route.ts
│ ├── layout.tsx
│ ├── page.tsx ← landing page
│ └── globals.css
├── components/
│ ├── ui/ ← base reusable components (Button, Input, Badge, Toast)
│ ├── ImageUploadZone.tsx ← drag-drop with preview + progress
│ ├── GenerationProgress.tsx ← animated loading with estimated time
│ ├── BackgroundPicker.tsx ← preset grid + custom text + color picker
│ ├── ResolutionSelector.tsx ← preset buttons + custom width/height inputs
│ ├── ComparisonSlider.tsx ← before/after drag slider
│ └── GenerationCard.tsx ← history card in dashboard
├── lib/
│ ├── supabase/
│ │ ├── client.ts ← browser Supabase client (createBrowserClient)
│ │ ├── server.ts ← server Supabase client (createServerClient)
│ │ └── storage.ts ← upload/download helpers
│ ├── openrouter.ts ← OpenRouter API client + model functions
│ └── utils.ts ← helper functions (cn, formatDate, etc.)
├── types/
│ └── index.ts ← TypeScript interfaces for Profile, Generation, API responses
├── middleware.ts ← Supabase session refresh + route protection
├── .env.local ← environment variables (do not commit)
├── next.config.ts
├── tailwind.config.ts
└── package.json


---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## UI/UX Design

### Design Language
- Premium, fashion-forward, editorial aesthetic
- Color palette: Deep Navy `#0F172A` + Warm Champagne `#F5E6D3` + Gold accent `#C9A84C`
- Typography: `Playfair Display` (Google Fonts) for headings — gives editorial/fashion magazine feel; `Inter` for all body and UI text
- All pages fully mobile-responsive (375px to 2560px)
- Dark mode support via Tailwind `dark:` classes

### Pages
/ → Landing page: hero + 3 key features + how-it-works + pricing teaser + CTA
/auth/login → Login with email/password
/auth/signup → Sign up with email/password
/dashboard → Generation history grid + usage stats + new generation CTA
/generate → 4-step wizard (Upload → Generate → Background → Export)
/generate/[id] → View / re-download a past generation result


### Key UI Behaviors
- Wizard steps show a progress stepper at the top (Step 1 of 4 → Step 2 of 4, etc.)
- During AI generation (Step 2): show pulsing animated placeholder card + progress text ("Placing model in sari…", "Adding lighting details…", "Finalizing image…")
- Background picker presets have hover previews
- Comparison slider in Step 3 uses a draggable vertical divider between original and background-changed version
- Toast notifications for: upload success, generation complete, generation failed (with retry), download started
- Empty state on dashboard: illustrated prompt encouraging first generation

---

## Error Handling

- OpenRouter API failure → catch error, update `generations.status` to `failed`, store error in `generations.error_message`, show retry button in UI
- Supabase upload failure → surface error toast with retry option
- Rate limit exceeded (10/day) → show friendly message with count reset time (midnight)
- Session expired → redirect to `/auth/login?returnUrl=/generate`
- Image too large (>10MB) → client-side validation error before any upload
- Invalid resolution input → clamp to min/max in the download API route

---

## Implementation Order (Sequential Steps — use sequential thinking MCP for each)

1. Initialize Next.js 14 project with TypeScript + Tailwind CSS + ESLint
2. Install dependencies: `@supabase/ssr`, `@supabase/supabase-js`, `sharp`, `lucide-react`
3. Configure Supabase clients (`lib/supabase/client.ts`, `lib/supabase/server.ts`) and `middleware.ts`
4. Run database schema SQL in Supabase dashboard (profiles + generations tables + RLS policies)
5. Create Supabase Storage buckets (`sari-uploads`, `generated-outputs`) with policies
6. Build auth pages: login + signup using Supabase Auth
7. Build landing page (`app/page.tsx`)
8. Build dashboard page with generation history grid
9. Build the 4-step generation wizard UI (all 4 steps, frontend only, with mock data first)
10. Build `lib/openrouter.ts` with `generateFashionModel()` and `changeBackground()` functions using Nano Banana Pro (`google/gemini-3-pro-image`)
11. Build API routes: `/api/generate`, `/api/background`, `/api/download`
12. Wire wizard steps to their respective API routes
13. Add `GenerationProgress` loading states, error boundaries, and toast notifications
14. Build `ComparisonSlider` and `ResolutionSelector` components
15. Test full end-to-end flow with a real sari image
16. Polish UI/UX + verify mobile responsiveness at 375px
17. Final QA: auth flow, generation flow, background change, download at custom resolution

---

## Notes for Claude Code
- Use `@supabase/ssr` package (NOT the deprecated `@supabase/auth-helpers-nextjs`) for all Supabase client/server/middleware setup
- Use `sharp` in the `/api/download` route — it runs server-side only, so add `{ "sharp": "next/dist/compiled/..." }` exclusion in `next.config.ts` if needed or just install sharp as a direct dependency
- For the comparison slider in Step 3, build it as a pure CSS + JS component (no external library needed) using a range input overlaid on two absolutely-positioned images
- The Nano Banana Pro model (`google/gemini-3-pro-image`) was released June 18, 2026 and is currently the most advanced image generation/editing model on OpenRouter — use it as the primary model for all image operations
- Include `X-Title: Sari AI Fashion Generator` and `HTTP-Referer: [NEXT_PUBLIC_APP_URL]` headers in all OpenRouter API calls (required by OpenRouter)
- Store all generated images in Supabase Storage (do not rely on OpenRouter's response URLs as permanent storage — they may expire)