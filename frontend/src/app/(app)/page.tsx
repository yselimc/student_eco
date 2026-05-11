"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Calendar,
  FileText,
  ShoppingBag,
  Users,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { listEvents, type EventRead } from "@/lib/api/events";
import { listListings, type Listing } from "@/lib/api/listings";
import { listNotes, type Note } from "@/lib/api/notes";
import { getStoredUser, type AuthUser } from "@/lib/auth";
import {
  dateBlockParts,
  formatTimeRange,
} from "@/lib/events/constants";
import { formatPriceTl } from "@/lib/marketplace/constants";
import { cn } from "@/lib/utils";

type SectionState<T> = {
  status: "loading" | "loaded" | "error";
  items: T[];
  error?: string;
};

const QUICK_LINKS = [
  {
    href: "/notes",
    label: "Notlar",
    desc: "Ders notlarına ve geçmiş sınavlara göz at.",
    icon: FileText,
    tint: "notes",
  },
  {
    href: "/marketplace",
    label: "Marketplace",
    desc: "Kitap, eşya al-sat ilanlarını gör.",
    icon: ShoppingBag,
    tint: "market",
  },
  {
    href: "/events",
    label: "Etkinlikler",
    desc: "Yaklaşan etkinliklere katıl.",
    icon: Calendar,
    tint: "events",
  },
  {
    href: "/buddies",
    label: "Buddy",
    desc: "Çalışma arkadaşı bul.",
    icon: Users,
    tint: "buddy",
  },
] as const;

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <main className="flex-1" />;
  }

  if (!user) {
    return <GuestLanding />;
  }

  return <AuthedHome user={user} />;
}

function GuestLanding() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Student Ecosystem</h1>
      <p className="text-muted-foreground max-w-md text-center">
        Not, pazaryeri, etkinlik, arkadaş. Hepsi tek yerde.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/register">Hemen başla</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Giriş yap</Link>
        </Button>
      </div>
    </main>
  );
}

function AuthedHome({ user }: { user: AuthUser }) {
  const [notes, setNotes] = useState<SectionState<Note>>({
    status: "loading",
    items: [],
  });
  const [listings, setListings] = useState<SectionState<Listing>>({
    status: "loading",
    items: [],
  });
  const [nextEvent, setNextEvent] = useState<SectionState<EventRead>>({
    status: "loading",
    items: [],
  });

  useEffect(() => {
    let cancelled = false;
    const nowIso = new Date().toISOString();

    listNotes({ limit: 3 })
      .then((r) => {
        if (cancelled) return;
        setNotes({ status: "loaded", items: r.items });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setNotes({
          status: "error",
          items: [],
          error: err instanceof ApiError ? err.message : "Yüklenemedi.",
        });
      });

    listListings({ status: "active", limit: 3 })
      .then((r) => {
        if (cancelled) return;
        setListings({ status: "loaded", items: r.items });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setListings({
          status: "error",
          items: [],
          error: err instanceof ApiError ? err.message : "Yüklenemedi.",
        });
      });

    listEvents({ mine: true, from: nowIso, limit: 1 })
      .then((r) => {
        if (cancelled) return;
        setNextEvent({ status: "loaded", items: r.items });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setNextEvent({
          status: "error",
          items: [],
          error: err instanceof ApiError ? err.message : "Yüklenemedi.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex items-center gap-4 rounded-lg border border-border bg-card p-6 shadow-sm">
        <Avatar src={user.avatar_url} name={user.display_name} size="xl" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Hoş geldin, {user.display_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Not, pazaryeri, etkinlik, arkadaş. Hepsi tek yerde.
          </p>
        </div>
      </header>

      <section
        aria-label="Hızlı erişim"
        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/50"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md",
                  link.tint === "notes" && "bg-[hsl(var(--notes)/0.12)] text-[hsl(var(--notes))]",
                  link.tint === "market" && "bg-[hsl(var(--market)/0.12)] text-[hsl(var(--market))]",
                  link.tint === "events" && "bg-[hsl(var(--events)/0.12)] text-[hsl(var(--events))]",
                  link.tint === "buddy" && "bg-[hsl(var(--buddy)/0.12)] text-[hsl(var(--buddy))]",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="text-sm font-semibold tracking-tight">{link.label}</div>
              <p className="text-xs text-muted-foreground">{link.desc}</p>
            </Link>
          );
        })}
      </section>

      <section aria-labelledby="son-aktivite-heading" className="mt-8">
        <h2
          id="son-aktivite-heading"
          className="text-lg font-semibold tracking-tight"
        >
          Son aktivite
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <NotesBlock state={notes} />
          <ListingsBlock state={listings} />
          <NextEventBlock state={nextEvent} />
        </div>
      </section>
    </main>
  );
}

function BlockShell({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Link
          href={href}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          Tümü
        </Link>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function NotesBlock({ state }: { state: SectionState<Note> }) {
  return (
    <BlockShell title="Son notlar" href="/notes">
      {state.status === "loading" ? (
        <RowSkeleton rows={3} />
      ) : state.status === "error" ? (
        <ErrorRow message={state.error ?? "Yüklenemedi."} />
      ) : state.items.length === 0 ? (
        <EmptyRow message="Henüz not yok." />
      ) : (
        <ul className="space-y-2">
          {state.items.map((n) => (
            <li key={n.id}>
              <Link
                href={`/notes/${n.id}`}
                className="block rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-accent/50"
              >
                <div className="truncate text-sm font-medium">{n.title}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <span className="rounded bg-[hsl(var(--notes)/0.12)] px-1.5 font-mono text-[10px] font-semibold text-[hsl(var(--notes))]">
                    {n.course_code}
                  </span>
                  <span>{n.author_name}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </BlockShell>
  );
}

function ListingsBlock({ state }: { state: SectionState<Listing> }) {
  return (
    <BlockShell title="Yeni ilanlar" href="/marketplace">
      {state.status === "loading" ? (
        <RowSkeleton rows={3} />
      ) : state.status === "error" ? (
        <ErrorRow message={state.error ?? "Yüklenemedi."} />
      ) : state.items.length === 0 ? (
        <EmptyRow message="Henüz aktif ilan yok." />
      ) : (
        <ul className="space-y-2">
          {state.items.map((l) => (
            <li key={l.id}>
              <Link
                href={`/marketplace/${l.id}`}
                className="flex items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{l.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {l.seller_name}
                  </div>
                </div>
                <span className="flex-none whitespace-nowrap font-mono text-sm font-semibold">
                  {formatPriceTl(l.price)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </BlockShell>
  );
}

function NextEventBlock({ state }: { state: SectionState<EventRead> }) {
  return (
    <BlockShell title="Sıradaki etkinliğin" href="/events">
      {state.status === "loading" ? (
        <RowSkeleton rows={1} tall />
      ) : state.status === "error" ? (
        <ErrorRow message={state.error ?? "Yüklenemedi."} />
      ) : state.items.length === 0 ? (
        <EmptyRow message="Yaklaşan etkinliğin yok." />
      ) : (
        <Link
          href={`/events/${state.items[0].id}`}
          className="flex items-start gap-3 rounded-md border border-transparent p-2 transition-colors hover:border-border hover:bg-accent/50"
        >
          {(() => {
            const e = state.items[0];
            const block = dateBlockParts(e.starts_at);
            const time = formatTimeRange(e.starts_at, e.ends_at);
            return (
              <>
                <div className="flex h-[60px] w-14 flex-none flex-col items-center justify-center rounded-md border border-border bg-card">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--events))]">
                    {block.monthShort}
                  </div>
                  <div className="text-xl font-bold leading-none tracking-tight">
                    {block.day}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{e.title}</div>
                  <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                    {time}
                    {e.location ? ` · ${e.location}` : ""}
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {e.organizer_name}
                  </div>
                </div>
              </>
            );
          })()}
        </Link>
      )}
    </BlockShell>
  );
}

function RowSkeleton({ rows, tall }: { rows: number; tall?: boolean }) {
  return (
    <div className="space-y-2" aria-busy>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded bg-muted",
            tall ? "h-16" : "h-10",
          )}
        />
      ))}
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <p className="px-2 py-3 text-sm text-muted-foreground">{message}</p>;
}

function ErrorRow({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}
