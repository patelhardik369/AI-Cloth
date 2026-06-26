# Sari AI — Image Generation API Cost Breakdown

_Prepared 26 June 2026. Figures are public list prices from OpenRouter / Google as of
June 2026. These are "preview" models and prices can change; treat this as a close
estimate, not a contract. INR figures assume **₹86 = $1** — adjust to the live rate._

---

## TL;DR (the numbers your client will ask for)

| What | Primary engine (Nano Banana Pro) | Economy engine (Nano Banana 2) |
|---|---|---|
| **One advertisement-ready 4K image** | **≈ $0.24** (≈ ₹21) | **≈ $0.15** (≈ ₹13) |
| **One full "shoot"** (model + 1 background swap = 2 images) | **≈ $0.48** (≈ ₹41) | **≈ $0.30** (≈ ₹26) |
| Final high-res download / resize | **Free** (done on our server) | **Free** |

> The cost is driven almost entirely by the **generated image**. The text prompt plus
> the customer's uploaded sari photo together cost **under $0.01** per call — effectively
> a rounding error.

---

## 1. Which AI engine the app uses

The app generates images through **OpenRouter**, which gives us one API plus an automatic
fallback if the top model is busy.

| Role | Model | OpenRouter slug |
|---|---|---|
| **Primary** (best quality) | Google **Nano Banana Pro** (Gemini 3 Pro Image) | `google/gemini-3-pro-image-preview` |
| **Fallback / economy** | Google **Nano Banana 2** (Gemini 3.1 Flash Image) | `google/gemini-3.1-flash-image-preview` |

Both are billed **per generated image**, and the price depends on the **output
resolution**. The app is currently set to render at **4K** for advertisement quality.

---

## 2. Price per image, by resolution

| Output resolution | Nano Banana Pro (primary) | Nano Banana 2 (economy) |
|---|---|---|
| 2K (≈ 4 MP) | $0.134 (≈ ₹12) | $0.101 (≈ ₹9) |
| **4K (≈ 12–16 MP) — app default** | **$0.24 (≈ ₹21)** | **$0.151 (≈ ₹13)** |

_Plus the per-call input (prompt + reference photo): a few thousand tokens at
$2 / 1M (Pro) or $0.50 / 1M (economy) = **< $0.01**, so it does not change the totals._

---

## 3. What one "shoot" actually costs in the app

A complete shoot in the wizard can make **up to two** image-generation calls:

1. **Generate model wearing the sari** — 1 image (always).
2. **Swap the background** — 1 image (optional; the user can skip and keep the studio shot).
3. **Download at any resolution** — **free**; resizing is done on our own server with
   `sharp`, no API call.

| Scenario | Images generated | Primary cost | Economy cost |
|---|---|---|---|
| Model only (no background change) | 1 | $0.24 | $0.15 |
| **Full shoot (model + 1 background)** | 2 | **$0.48** | **$0.30** |
| Each extra retry / regenerate / re-background | +1 | +$0.24 | +$0.15 |

A built-in **daily cap of 10 generations per user** bounds the worst case to about
**$2.40–$4.80 per user per day** (primary engine).

---

## 4. Volume projections (4K, primary engine unless noted)

| Monthly volume | Model-only (1 image each) | Full shoots (2 images each) | Full shoots on economy engine |
|---|---|---|---|
| 100 | $24 (≈ ₹2,100) | $48 (≈ ₹4,100) | $30 (≈ ₹2,600) |
| 1,000 | $240 (≈ ₹20,600) | $480 (≈ ₹41,300) | $300 (≈ ₹25,800) |
| 10,000 | $2,400 (≈ ₹2.06 L) | $4,800 (≈ ₹4.13 L) | $3,000 (≈ ₹2.58 L) |

---

## 5. Levers to reduce cost (if the client wants)

- **Render at 2K instead of 4K** → ~**45% cheaper** ($0.134 vs $0.24) and still
  print-sharp for web, catalogue and social.
- **Default to the economy engine** (Nano Banana 2) → ~**37% cheaper** per image, very
  close quality for most garments; keep Pro for hero/campaign shots.
- **Batch mode** (Google's async batch API) is ~**50% cheaper**, suitable for bulk
  catalogue jobs where instant results aren't required.
- The **daily cap** already prevents runaway spend; it can be tuned per plan/tier.

---

## 6. Other (small) running costs

| Item | Rough cost |
|---|---|
| Image storage + CDN (Supabase) | A few MB per image → pennies per GB stored/served |
| OpenRouter credit top-up fee | ~5% one-time fee when adding credit (card) |
| App hosting (Vercel + Supabase) | Separate, modest monthly tiers |

OpenRouter charges the **same per-image price as Google's direct API** (it's pass-through);
it simply adds the unified API and automatic fallback. We can also **log the exact cost
OpenRouter returns on every call** for precise, per-customer billing if needed.

---

## 7. Caveats to mention to the client

- These are **preview-model list prices (June 2026)** and may change.
- Exact cost varies slightly with prompt length, the customer's photo size, and the final
  pixel count of the chosen aspect ratio.
- INR is converted at an **assumed ₹86/$** — use the live rate for quotes.

---

### Sources
- OpenRouter — Nano Banana Pro: https://openrouter.ai/google/gemini-3-pro-image-preview
- OpenRouter — Nano Banana 2: https://openrouter.ai/google/gemini-3.1-flash-image-preview
- Google Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Per-image / per-resolution breakdowns: pricepertoken.com and laozhang.ai pricing guides (June 2026)
