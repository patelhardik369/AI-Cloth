import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm text-muted">
              AI fashion shoots for Indian garments — model generation, background swaps and 4K
              export, in one studio.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterCol
              title="Product"
              links={[
                { label: "Features", href: "/#features" },
                { label: "How it works", href: "/#how" },
                { label: "Pricing", href: "/#pricing" },
              ]}
            />
            <FooterCol
              title="Account"
              links={[
                { label: "Log in", href: "/login" },
                { label: "Sign up", href: "/signup" },
                { label: "Dashboard", href: "/dashboard" },
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                { label: "Privacy", href: "/#" },
                { label: "Terms", href: "/#" },
              ]}
            />
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Sari AI. All rights reserved.</p>
          <p>
            Made by{" "}
            <a
              href="https://www.hardikpatel.site/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-strong underline-offset-4 transition-colors hover:underline"
            >
              Hardik Patel
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="kicker mb-3">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-muted transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
