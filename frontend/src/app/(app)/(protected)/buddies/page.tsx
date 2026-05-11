"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Search, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BuddyCard } from "@/components/buddies/buddy-card";
import { ApiError } from "@/lib/api";
import { listBuddies, type BuddyProfileRead } from "@/lib/api/buddies";
import {
  STUDY_STYLE_OPTIONS,
  WEEKDAY_OPTIONS,
  isStudyStyle,
  isWeekday,
} from "@/lib/buddies/constants";

const PAGE_SIZE = 20;

export default function BuddiesPage() {
  return (
    <Suspense fallback={<BuddiesPageFallback />}>
      <BuddiesPageContent />
    </Suspense>
  );
}

function BuddiesPageFallback() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <div className="h-9 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-10 animate-pulse rounded bg-muted" />
      <div className="mt-6 flex flex-col gap-3" aria-busy>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-muted/40" />
        ))}
      </div>
    </main>
  );
}

function BuddiesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const courseParam = searchParams.get("course") ?? "";
  const dayRaw = searchParams.get("day") ?? "";
  const dayParam = isWeekday(dayRaw) ? dayRaw : "";
  const styleRaw = searchParams.get("style") ?? "";
  const styleParam = isStudyStyle(styleRaw) ? styleRaw : "";

  const [searchInput, setSearchInput] = useState(courseParam);
  const [buddies, setBuddies] = useState<BuddyProfileRead[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(courseParam);
  }, [courseParam]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setOffset(0);
    listBuddies({
      course: courseParam || undefined,
      day: dayParam || undefined,
      study_style: styleParam || undefined,
      limit: PAGE_SIZE,
      offset: 0,
    })
      .then((response) => {
        if (cancelled) return;
        setBuddies(response.items);
        setTotal(response.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Profiller yüklenemedi. Tekrar dene.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseParam, dayParam, styleParam]);

  function updateFilters(next: { course?: string; day?: string; style?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const apply = (key: string, value: string | undefined) => {
      if (value && value.length > 0) params.set(key, value);
      else params.delete(key);
    };
    if ("course" in next) apply("course", next.course);
    if ("day" in next) apply("day", next.day);
    if ("style" in next) apply("style", next.style);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateFilters({ course: searchInput.trim() });
  }

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextOffset = offset + PAGE_SIZE;
    try {
      const response = await listBuddies({
        course: courseParam || undefined,
        day: dayParam || undefined,
        study_style: styleParam || undefined,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });
      setBuddies((prev) => [...prev, ...response.items]);
      setTotal(response.total);
      setOffset(nextOffset);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Daha fazla profil yüklenemedi.");
      }
    } finally {
      setLoadingMore(false);
    }
  }

  const hasFilters = Boolean(courseParam || dayParam || styleParam);
  const hasMore = buddies.length < total;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Çalışma arkadaşı</h1>
          <p className="mt-1 text-muted-foreground">
            Aynı dersi alan birini bul, dışarıdan iletişime geç.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/buddies/me">
            <UserCog className="h-4 w-4" />
            <span className="ml-1.5">Profilimi düzenle</span>
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Ders ara (örn. CS301, MATH)…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            aria-label="Ders ara"
          />
        </form>
        <select
          value={dayParam}
          onChange={(e) => updateFilters({ day: e.target.value })}
          aria-label="Gün filtresi"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Tüm günler</option>
          {WEEKDAY_OPTIONS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
        <select
          value={styleParam}
          onChange={(e) => updateFilters({ style: e.target.value })}
          aria-label="Stil filtresi"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Tüm stiller</option>
          {STUDY_STYLE_OPTIONS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <GridSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : buddies.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            <div className="mb-3 text-sm text-muted-foreground">{total} sonuç</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {buddies.map((b) => (
                <BuddyCard key={b.id} buddy={b} />
              ))}
            </div>
            {hasMore ? (
              <div className="mt-6 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Yükleniyor..." : "Daha fazla yükle"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

function GridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      aria-busy
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-border bg-card p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-5 w-20 rounded bg-muted" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </div>
          <div className="mt-4 flex gap-1.5">
            <div className="h-5 w-14 rounded bg-muted" />
            <div className="h-5 w-14 rounded bg-muted" />
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
        {hasFilters
          ? "Bu filtrelerle eşleşen profil yok."
          : "Henüz çalışma profili yok."}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasFilters
          ? "Filtreleri sıfırla veya farklı bir arama dene."
          : "İlk profili sen oluştur."}
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
