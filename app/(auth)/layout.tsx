import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Editorial brand panel — always a dark espresso island (forces dark tokens) */}
      <aside className="dark relative hidden overflow-hidden border-r border-white/5 bg-ink-950 p-10 text-bone-100 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 55% at 78% 12%, rgba(168,72,47,0.30) 0%, transparent 60%), radial-gradient(55% 45% at 6% 96%, rgba(110,42,34,0.34) 0%, transparent 55%)",
          }}
        />
        <Logo className="relative" />
        <div className="relative max-w-md">
          <div className="rule-accent mb-7 w-16" />
          <h2 className="font-display text-[2.6rem] leading-[1.04] tracking-tight text-balance">
            Where heritage textiles meet the future of fashion photography.
          </h2>
          <p className="mt-5 leading-relaxed text-bone-100/65">
            Upload a sari. Receive an advertisement-ready model shoot in 4K — backgrounds,
            resolutions and all — in under a minute.
          </p>
        </div>
        <p className="relative text-[0.7rem] uppercase tracking-[0.22em] text-bone-100/45">
          Boutiques · E-commerce · Ad agencies across India
        </p>
      </aside>

      {/* Form area */}
      <main className="flex flex-col">
        <header className="flex items-center justify-between p-6">
          <div className="lg:invisible">
            <Logo />
          </div>
          <ThemeToggle />
        </header>
        <div className="flex flex-1 items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
