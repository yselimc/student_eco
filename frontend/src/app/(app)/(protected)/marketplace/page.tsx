"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/marketplace/listing-card";
import { ApiError } from "@/lib/api";
import { listListings, type Listing } from "@/lib/api/listings";
import { LISTING_CATEGORY_OPTIONS } from "@/lib/marketplace/constants";

export default function MarketplacePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category") ?? "";
  const qParam = searchParams.get("q") ?? "";
  const includeSold = searchParams.get("include_sold") === "1";

  const [searchInput, setSearchInput] = useState(qParam);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listListings({
      category: categoryParam || undefined,
      q: qParam || undefined,
      status: includeSold ? undefined : "active",
    })
      .then((response) => {
        if (cancelled) return;
        setListings(response.items);
        setTotal(response.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("İlanlar yüklenemedi. Tekrar dene.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryParam, qParam, includeSold]);

  function updateFilters(next: {
    category?: string;
    q?: string;
    include_sold?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const apply = (key: string, value: string | undefined) => {
      if (value && value.length > 0) params.set(key, value);
      else params.delete(key);
    };
    if ("category" in next) apply("category", next.category);
    if ("q" in next) apply("q", next.q);
    if ("include_sold" in next) apply("include_sold", next.include_sold);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateFilters({ q: searchInput.trim() });
  }

  const hasFilters = Boolean(categoryParam || qParam || includeSold);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pazaryeri</h1>
          <p className="mt-1 text-muted-foreground">
            Kitap, eşya ve daha fazlasını öğrencilerle al-sat.
          </p>
        </div>
        <Button asChild>
          <Link href="/marketplace/new">
            <Plus className="h-4 w-4" />
            <span className="ml-1.5">İlan ver</span>
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Başlık ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            aria-label="İlanlarda ara"
          />
        </form>
        <select
          value={categoryParam}
          onChange={(e) => updateFilters({ category: e.target.value })}
          aria-label="Kategori filtresi"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Tüm kategoriler</option>
          {LISTING_CATEGORY_OPTIONS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="flex flex-none items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={!includeSold}
            onChange={(e) =>
              updateFilters({ include_sold: e.target.checked ? "" : "1" })
            }
            className="h-4 w-4 accent-primary"
          />
          Sadece aktif
        </label>
      </div>

      <div className="mt-6">
        {loading ? (
          <ListingsGridSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : listings.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            <div className="mb-3 text-sm text-muted-foreground">{total} sonuç</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ListingsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-lg border border-border bg-card"
        >
          <div className="aspect-[4/3] w-full bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center">
      <p className="text-sm font-medium text-foreground">
        {hasFilters ? "Bu filtrelerle eşleşen ilan yok." : "Henüz ilan yok."}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasFilters
          ? "Filtreleri sıfırla veya farklı bir arama dene."
          : "İlk ilanı sen yayınla."}
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
      {message}
    </div>
  );
}
