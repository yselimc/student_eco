import Link from "next/link";
import { ImageOff } from "lucide-react";

import { AuthImage } from "@/components/marketplace/auth-image";
import { listingImagePath, type Listing } from "@/lib/api/listings";
import {
  categoryLabel,
  formatPriceTl,
  statusLabel,
} from "@/lib/marketplace/constants";
import { cn } from "@/lib/utils";

export function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.images[0];
  const isSold = listing.status === "sold";
  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {cover ? (
          <AuthImage
            path={listingImagePath(listing.id, cover.id)}
            alt={listing.title}
            containerClassName="absolute inset-0 h-full w-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-6 w-6" />
          </div>
        )}
        {isSold ? (
          <div className="absolute right-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-xs font-semibold text-background backdrop-blur">
            {statusLabel("sold")}
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold tracking-tight">
              {listing.title}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {listing.seller_name}
            </div>
          </div>
          <div
            className={cn(
              "flex-none whitespace-nowrap font-mono text-base font-bold",
              isSold ? "text-muted-foreground line-through" : "text-foreground",
            )}
          >
            {formatPriceTl(listing.price)}
          </div>
        </div>
        <div className="mt-2">
          <span className="rounded-md bg-[hsl(var(--market)/0.12)] px-2 py-0.5 text-xs font-medium text-[hsl(var(--market))]">
            {categoryLabel(listing.category)}
          </span>
        </div>
      </div>
    </Link>
  );
}
