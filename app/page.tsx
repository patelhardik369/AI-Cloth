import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Maximize,
  Sparkles,
  UploadCloud,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRESET_BACKGROUNDS } from "@/lib/constants";

export const metadata: Metadata = {
  title: { absolute: "Sari AI — Turn Any Sari Into a 4K AI Fashion Shoot" },
  description:
    "Upload a sari and get an advertisement-ready AI fashion model wearing your exact garment. Describe the model, pose and scene, then export in true 4K — in a single generation.",
};

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: UploadCloud,
    title: "Upload any sari",
    desc: "Drop in a photo of any sari or garment. We read its colours, motifs, weave and border in fine detail.",
  },
  {
    icon: Sparkles,
    title: "A model, styled in seconds",
    desc: "A poised Indian fashion model appears wearing your exact sari, draped in an elegant Nivi style.",
  },
  {
    icon: Wand2,
    title: "Set any scene",
    desc: `Describe the pose, backdrop and props in one prompt — or tap one of ${PRESET_BACKGROUNDS.length} curated scenes. It all renders in a single pass.`,
  },
  {
    icon: Maximize,
    title: "Export in true 4K",
    desc: "Download advertisement-ready images from social square to 4K print — pin-sharp every time.",
  },
];

const GALLERY: { src: string; title: string; tag: string; alt: string }[] = [
  {
    src: "/images/model-f.jpg",
    title: "Heritage",
    tag: "Palace",
    alt: "Model in an embellished gown beside a carved mirror",
  },
  {
    src: "/images/model-a.jpg",
    title: "Bridal",
    tag: "Studio",
    alt: "Close-up of a model in a gold-bordered veil",
  },
  {
    src: "/images/model-c.jpg",
    title: "Festive",
    tag: "Courtyard",
    alt: "Model in a bandhani veil and silver jewellery",
  },
];

const STEPS: { n: string; title: string; desc: string }[] = [
  { n: "01", title: "Upload & describe", desc: "Add your sari and describe the model, pose, scene and props." },
  { n: "02", title: "Generate", desc: "One AI pass renders a lifelike model wearing your exact sari." },
  { n: "03", title: "Export", desc: "Choose a resolution and download a campaign-ready 4K image." },
];

const INCLUDED: string[] = [
  "Your exact garment on the model — never restyled or recoloured",
  "Model, pose, scene & backdrop in one native-4K generation",
  "Full-quality 4K downloads — unlimited and always free",
  "No subscription and no daily cap — pay only per image",
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* ------------------------------ HERO ------------------------------ */}
        {/* `dark` scope keeps CTAs/tokens light-on-dark over the photo. */}
        <section className="dark relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden border-b border-border">
          <Image
            src="/images/model-e.jpg"
            alt="Indian fashion model wearing a magenta Banarasi sari"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_22%]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/72 to-ink-950/25"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-transparent to-ink-950/45"
          />

          <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="kicker animate-fade-up">AI Atelier · Indian Garments</span>
              <h1
                className="mt-6 text-balance font-display text-[clamp(2.85rem,7vw,5.75rem)] leading-[0.97] tracking-[-0.02em] text-bone-50 animate-fade-up"
                style={{ animationDelay: "60ms" }}
              >
                One sari photo,
                <br className="hidden sm:block" /> a{" "}
                <span className="font-display italic text-clay-300">full fashion</span> shoot.
              </h1>
              <p
                className="mt-6 max-w-xl text-base leading-relaxed text-bone-100/80 animate-fade-up sm:text-lg"
                style={{ animationDelay: "120ms" }}
              >
                Upload a sari and receive an advertisement-ready model wearing your exact garment —
                describe the pose and scene, then export in true 4K. No studio. No model. No shoot
                day.
              </p>
              <div
                className="mt-9 flex flex-col gap-3 animate-fade-up sm:flex-row"
                style={{ animationDelay: "180ms" }}
              >
                <Link href="/signup" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
                  Begin a shoot
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="#how"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-bone-100/30 bg-transparent text-bone-50 backdrop-blur-sm hover:bg-bone-100/10 hover:text-bone-50",
                  )}
                >
                  See how it works
                </Link>
              </div>
              <div
                className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-bone-100/75 animate-fade-up"
                style={{ animationDelay: "220ms" }}
              >
                <span className="flex items-center gap-2">
                  <Check className="size-4 text-success" aria-hidden />
                  Unlimited shoots
                </span>
                <span>True 4K export</span>
                <span>Exact garment fidelity</span>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------- LOOKBOOK STRIP ----------------------- */}
        <section className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-7 gap-y-2 px-4 py-5 text-[0.7rem] uppercase tracking-[0.2em] text-muted sm:px-6 lg:px-8">
            {["Banarasi", "Kanjivaram", "Chikankari", "Bandhani", "Paithani", "Patola"].map((w, i) => (
              <span key={w} className="flex items-center gap-7">
                {i > 0 && <span className="size-1 rounded-full bg-accent/60" aria-hidden />}
                {w}
              </span>
            ))}
          </div>
        </section>

        {/* ----------------------------- FEATURES --------------------------- */}
        <section id="features" className="scroll-mt-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-28">
            <div className="lg:col-span-4">
              <span className="kicker">What you get</span>
              <h2 className="mt-5 text-balance font-display text-[clamp(1.9rem,3.5vw,2.75rem)] leading-[1.05] tracking-tight">
                A campaign, without the production.
              </h2>
              <p className="mt-5 max-w-sm leading-relaxed text-muted">
                From a single garment photo to a polished, advertisement-grade image — no crew, no
                studio, no shoot day.
              </p>
            </div>
            <div className="lg:col-span-8">
              <div className="border-t border-border">
                {FEATURES.map((f, i) => (
                  <div
                    key={f.title}
                    className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 border-b border-border py-7 sm:gap-8"
                  >
                    <span className="font-display text-2xl tabular text-accent-strong">0{i + 1}</span>
                    <div>
                      <h3 className="font-display text-lg tracking-tight sm:text-xl">{f.title}</h3>
                      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">{f.desc}</p>
                    </div>
                    <f.icon
                      className="size-5 self-center text-muted transition-colors group-hover:text-accent-strong"
                      aria-hidden
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ GALLERY --------------------------- */}
        <section className="border-y border-border bg-surface-2">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <span className="kicker">The result</span>
                <h2 className="mt-5 text-balance font-display text-[clamp(1.9rem,3.5vw,2.75rem)] leading-[1.05] tracking-tight">
                  Editorial-grade, every time.
                </h2>
              </div>
              <p className="max-w-sm leading-relaxed text-muted">
                From flat-lay to finished campaign — backdrops, lighting and 4K polish, generated in
                under a minute.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {GALLERY.map((g) => (
                <figure
                  key={g.src}
                  className="group relative overflow-hidden rounded-md border border-border"
                >
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={g.src}
                      alt={g.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/5 to-transparent"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
                    <span className="font-display text-lg tracking-tight text-bone-50">{g.title}</span>
                    <span className="text-[0.6rem] uppercase tracking-[0.18em] text-bone-100/70">
                      {g.tag}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------- HOW IT WORKS ------------------------- */}
        <section id="how" className="scroll-mt-20">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="max-w-2xl">
              <span className="kicker">The process</span>
              <h2 className="mt-5 text-balance font-display text-[clamp(1.9rem,3.5vw,2.75rem)] leading-[1.05] tracking-tight">
                Three steps to a finished shoot.
              </h2>
            </div>
            <ol className="mt-14 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3 lg:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="bg-background p-7">
                  <span className="font-display text-4xl tabular text-foreground/15">{s.n}</span>
                  <h3 className="mt-4 font-display text-lg tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------- BACKDROPS --------------------------- */}
        <section className="border-y border-border bg-surface-2">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <span className="kicker">Backdrops</span>
                <h2 className="mt-5 text-balance font-display text-[clamp(1.9rem,3.5vw,2.75rem)] leading-[1.05] tracking-tight">
                  A wardrobe of worlds.
                </h2>
              </div>
              <p className="max-w-sm leading-relaxed text-muted">
                Place your model in a curated scene — heritage palace, garden, festive rangoli — or
                describe a world entirely your own.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {PRESET_BACKGROUNDS.map((b) => (
                <figure key={b.id} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-border">
                    <div
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      style={{ background: b.gradient }}
                      aria-hidden
                    />
                    <div
                      className="absolute inset-0 bg-ink-950/15 transition-colors group-hover:bg-ink-950/0"
                      aria-hidden
                    />
                  </div>
                  <figcaption className="mt-2.5 flex items-baseline justify-between gap-2">
                    <span className="font-display text-sm tracking-tight">{b.name}</span>
                    <span className="text-[0.6rem] uppercase tracking-[0.16em] text-muted">
                      {b.description}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------- PRICING ---------------------------- */}
        <section id="pricing" className="scroll-mt-20">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <span className="kicker">Pricing</span>
              <h2 className="mt-5 text-balance font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.04] tracking-tight">
                Pay per image. <span className="accent-italic">No subscription.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted">
                You&apos;re billed only for the images you create — at the real AI generation cost.
                No monthly fee, no daily cap, and every full-quality 4K download is free.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-md">
              <div className="flex flex-col rounded-2xl border border-accent/40 bg-surface p-7 shadow-lift">
                <span className="kicker">From</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-semibold tracking-tight">₹32</span>
                  <span className="text-sm text-muted">/ 4K image</span>
                </div>
                <p className="mt-1.5 text-sm text-muted">
                  ≈ $0.375 · one image = one finished, poster-ready shoot
                </p>
                <ul className="mt-6 flex flex-col gap-3">
                  {INCLUDED.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-7 w-full")}
                >
                  Create your free studio
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
              <p className="mx-auto mt-5 max-w-md text-center text-xs leading-relaxed text-muted">
                Price is the per-image AI generation cost, shown at ₹86 = $1. The prompt and your
                uploaded photo add under ₹1 per image. Resizing and downloads are free.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------- FINAL CTA --------------------------- */}
        <section className="dark relative isolate overflow-hidden border-t border-border bg-ink-950 text-bone-100">
          <Image
            src="/images/model-a.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center opacity-25"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/85 to-ink-950/70" />
          <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
            <span className="kicker">Ready when you are</span>
            <h2 className="mt-6 text-balance font-display text-[clamp(2.2rem,5vw,4rem)] leading-[1.02] tracking-tight text-bone-50">
              Your next campaign starts with a single <span className="accent-italic">sari.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl leading-relaxed text-bone-100/75">
              Create your studio free — your first advertisement-ready 4K shoot is minutes away.
            </p>
            <Link
              href="/signup"
              className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-10")}
            >
              Begin a shoot
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
