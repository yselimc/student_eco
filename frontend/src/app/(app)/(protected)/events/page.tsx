"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CalendarDays, List as ListIcon, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventRow } from "@/components/events/event-row";
import { ApiError } from "@/lib/api";
import { listEvents, type EventRead } from "@/lib/api/events";
import { cn } from "@/lib/utils";
import {
  EVENT_CATEGORY_OPTIONS,
  TIME_RANGE_OPTIONS,
  rangeBounds,
  type TimeRangeKey,
} from "@/lib/events/constants";

const EventCalendar = dynamic(
  () => import("@/components/events/event-calendar").then((m) => m.EventCalendar),
  { ssr: false, loading: () => <CalendarSkeleton /> },
);

const DEFAULT_RANGE: TimeRangeKey = "all";

type ViewMode = "list" | "calendar";
const DEFAULT_VIEW: ViewMode = "list";
const VIEW_STORAGE_KEY = "student_eco.events.view";

function isTimeRangeKey(value: string): value is TimeRangeKey {
  return TIME_RANGE_OPTIONS.some((o) => o.key === value);
}

function isViewMode(value: string | null): value is ViewMode {
  return value === "list" || value === "calendar";
}

export default function EventsPage() {
  return (
    <Suspense fallback={<EventsPageFallback />}>
      <EventsPageContent />
    </Suspense>
  );
}

function EventsPageFallback() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <div className="h-9 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-10 animate-pulse rounded bg-muted" />
      <div className="mt-6 flex flex-col gap-3" aria-busy>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-muted/40" />
        ))}
      </div>
    </main>
  );
}

function EventsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category") ?? "";
  const qParam = searchParams.get("q") ?? "";
  const rangeRaw = searchParams.get("range") ?? DEFAULT_RANGE;
  const rangeParam: TimeRangeKey = isTimeRangeKey(rangeRaw) ? rangeRaw : DEFAULT_RANGE;

  const [searchInput, setSearchInput] = useState(qParam);
  const [events, setEvents] = useState<EventRead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>(DEFAULT_VIEW);

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (isViewMode(stored)) setView(stored);
  }, []);

  function selectView(next: ViewMode) {
    setView(next);
    window.localStorage.setItem(VIEW_STORAGE_KEY, next);
  }

  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const { from, to } = rangeBounds(rangeParam);
    listEvents({
      category: categoryParam || undefined,
      q: qParam || undefined,
      from,
      to,
    })
      .then((response) => {
        if (cancelled) return;
        setEvents(response.items);
        setTotal(response.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Etkinlikler yüklenemedi. Tekrar dene.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryParam, qParam, rangeParam]);

  function updateFilters(next: { category?: string; q?: string; range?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const apply = (key: string, value: string | undefined) => {
      if (value && value.length > 0) params.set(key, value);
      else params.delete(key);
    };
    if ("category" in next) apply("category", next.category);
    if ("q" in next) apply("q", next.q);
    if ("range" in next) apply("range", next.range === DEFAULT_RANGE ? "" : next.range);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateFilters({ q: searchInput.trim() });
  }

  const hasFilters = Boolean(categoryParam || qParam || rangeParam !== DEFAULT_RANGE);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Etkinlikler</h1>
          <p className="mt-1 text-muted-foreground">
            Çalışma grupları, sosyal buluşmalar, kültür etkinlikleri.
          </p>
        </div>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="h-4 w-4" />
            <span className="ml-1.5">Etkinlik oluştur</span>
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Etkinlik ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            aria-label="Etkinliklerde ara"
          />
        </form>
        <select
          value={categoryParam}
          onChange={(e) => updateFilters({ category: e.target.value })}
          aria-label="Kategori filtresi"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Tüm kategoriler</option>
          {EVENT_CATEGORY_OPTIONS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={rangeParam}
          onChange={(e) => updateFilters({ range: e.target.value })}
          aria-label="Zaman aralığı"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {TIME_RANGE_OPTIONS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        <div
          role="tablist"
          aria-label="Görünüm"
          className="flex flex-none items-center rounded-md border border-input bg-background p-0.5 text-sm"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "list"}
            onClick={() => selectView("list")}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded px-3 transition-colors",
              view === "list"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ListIcon className="h-4 w-4" />
            Liste
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "calendar"}
            onClick={() => selectView("calendar")}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded px-3 transition-colors",
              view === "calendar"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Takvim
          </button>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          view === "calendar" ? <CalendarSkeleton /> : <ListSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : view === "calendar" ? (
          <EventCalendar events={events} />
        ) : events.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            <div className="mb-3 text-sm text-muted-foreground">{total} sonuç</div>
            <div className="flex flex-col gap-3">
              {events.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function CalendarSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4" aria-busy>
      <div className="h-[640px] animate-pulse rounded-md bg-muted/50" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-start gap-4 rounded-lg border border-border bg-card p-4"
        >
          <div className="h-[72px] w-16 flex-none rounded-md bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
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
        {hasFilters ? "Bu filtrelerle eşleşen etkinlik yok." : "Henüz etkinlik yok."}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasFilters
          ? "Filtreleri sıfırla veya farklı bir arama dene."
          : "İlk etkinliği sen oluştur."}
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
