# Sari AI — Image Generation API Cost Breakdown

_Updated 26 June 2026. The app now generates through **FASHN Product-to-Model**
(`api.fashn.ai`). Figures are FASHN's public list prices as of June 2026; treat as a
close estimate, not a contract. INR figures assume **₹86 = $1** — adjust to the live
rate._

---

## TL;DR (the numbers your client will ask for)

| What | Cost |
|---|---|
| **One advertisement-ready 4K image** (default "Quality" mode) | **≈ $0.375** (≈ ₹32) |
| Same image with credit top-ups (20–35% off) | **≈ $0.24–0.30** (≈ ₹21–26) |
| **One full shoot** | **= one image** (single-pass; see below) |
| Full-quality 4K download | **Free** (streamed from our storage) |

> We default to **"Quality"** mode because it matches FASHN's studio site — clean hands,
> sharp fine print and motifs. "Fast" mode is cheaper (~$0.225) but visibly degrades
> hands and fabric detail, so it's not used by default.

> Two things changed the economics vs the earlier estimate:
> 1. **Exact garment.** FASHN warps the *actual* uploaded sari onto the model, so the
>    print, border and colour are preserved — no more "the model is wearing a different
>    cloth." This was the main bug we fixed.
> 2. **Single pass.** Model, pose, background and props are produced in **one** call.
>    The old flow generated twice (model + background ≈ $0.48). One call ≈ halves that.

---

## 1. Which AI engine the app uses

| Role | Model | Endpoint |
|---|---|---|
| **Generation** | FASHN **Product-to-Model** | `POST https://api.fashn.ai/v1/run` |

Billed **per generated image** in *credits*; the credit count depends on the **quality
mode** and **resolution**. The app renders at **4K** in **"Quality"** mode by default.

---

## 2. Price per 4K image, by mode

FASHN credits are **$0.075 each** on-demand, with volume top-up discounts.

| 4K mode | Credits | On-demand | Tier II (−20%) | Tier III (−35%) |
|---|---|---|---|---|
| Fast | 3 | $0.225 (₹19) | $0.18 (₹15) | $0.146 (₹13) |
| Balanced | 4 | $0.30 (₹26) | $0.24 (₹21) | $0.195 (₹17) |
| **Quality — app default** | 5 | **$0.375** (₹32) | $0.30 (₹26) | $0.244 (₹21) |

_(Quality is the default for poster-grade output. Dropping to Balanced saves ~20% and to
Fast ~40%, at some cost to hands/fine-detail fidelity. Lower resolutions are cheaper
again, but the app uses 4K for print.)_

Optional add-on: a **face-identity reference** is +3 credits per image (only if used).

---

## 3. What one "shoot" actually costs in the app

A complete shoot is now **a single image-generation call** that already includes the
background and scene:

1. **Generate model wearing the exact garment + chosen scene** — 1 image (always).
2. **Download the full-quality 4K master** — **free**; streamed straight from our storage,
   no API call, no resizing.

| Scenario | Images generated | Cost (Quality) | Cost (Balanced) |
|---|---|---|---|
| **One finished shoot** | 1 | **$0.375** | $0.30 |
| Each extra regenerate (new look/seed) | +1 | +$0.375 | +$0.30 |

There is **no daily cap** in the app — spend scales directly with how many images you
generate.

---

## 4. Volume projections (4K Quality, on-demand unless noted)

| Monthly shoots | On-demand | With Tier II top-ups |
|---|---|---|
| 100 | $37.50 (≈ ₹3,200) | $30 (≈ ₹2,600) |
| 1,000 | $375 (≈ ₹32,250) | $300 (≈ ₹25,800) |
| 10,000 | $3,750 (≈ ₹3.23 L) | $3,000 (≈ ₹2.58 L) |

---

## 5. Levers to reduce cost (if the client wants)

- **Buy credits in bulk** — top-up tiers cut 10–35% off the per-image price.
- **Drop to "Balanced" mode** — ~20% cheaper than Quality, still good for most catalogue
  work (Quality is best for hero/poster shots where hands and fine print matter most).
- **Render at 2K** for web/social where 4K print isn't required → cheaper again.
- **Avoid needless regenerates** — each one is a fresh paid image.

---

## 6. Other (small) running costs

| Item | Rough cost |
|---|---|
| Image storage + CDN (Supabase) | A few MB per image → pennies per GB stored/served |
| App hosting (Vercel + Supabase) | Separate, modest monthly tiers |

---

## 7. Caveats to mention to the client

- These are **list prices (June 2026)** and may change.
- Exact cost depends on the chosen **mode** (Fast/Balanced/Quality) and **resolution**.
- Sari **draping** is AI-generated even though the fabric is preserved; complex drapes
  may need a prompt tweak — validate with the client's real saris.
- INR is converted at an **assumed ₹86/$** — use the live rate for quotes.

---

### Sources
- FASHN Product-to-Model API: https://docs.fashn.ai/api-reference/product-to-model
- FASHN API pricing: https://help.fashn.ai/plans-and-pricing/api-pricing
