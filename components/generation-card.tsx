import Image from "next/image";
import Link from "next/link";
import { Download, Eye, ImageOff } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Generation } from "@/types";

/** A single finished shoot in the dashboard grid. Server component. */
export function GenerationCard({ generation }: { generation: Generation }) {
  const imageUrl = generation.final_image_url ?? generation.generated_image_url;

  return (
    <Card className="group flex flex-col overflow-hidden animate-fade-up transition-shadow duration-300 hover:shadow-lift">
      {/* Image — 4:5 portrait */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-xl bg-surface-2">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="AI fashion shoot generated from your garment"
            fill
            sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, 92vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
            <ImageOff className="size-8" aria-hidden />
            <span className="text-xs font-medium">No image</span>
          </div>
        )}

        {/* Source garment thumbnail */}
        {generation.sari_image_url && (
          <div
            className="absolute right-3 top-3 size-12 overflow-hidden rounded-lg shadow-soft ring-2 ring-background/80"
            title="Source garment"
          >
            <Image
              src={generation.sari_image_url}
              alt="Source garment"
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* Body */}
      <CardContent className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-sm font-medium text-foreground">
          {formatRelativeTime(generation.created_at)}
        </p>
        <p className="text-xs text-muted">Poster-ready 4K</p>
      </CardContent>

      {/* Footer */}
      <CardFooter className="gap-2 p-4 pt-0">
        <Link
          href={`/generate/${generation.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 gap-1.5")}
        >
          <Eye className="size-4" aria-hidden />
          View
        </Link>
        {imageUrl && (
          <a
            href={imageUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
            aria-label="Download image"
          >
            <Download className="size-4" aria-hidden />
            Download
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
