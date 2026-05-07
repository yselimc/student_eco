"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteCard } from "@/components/notes/note-card";
import { ApiError } from "@/lib/api";
import { listNotes, type Note } from "@/lib/api/notes";
import { NOTE_COURSE_OPTIONS, NOTE_SEMESTER_OPTIONS } from "@/lib/notes/constants";

export default function NotesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const courseParam = searchParams.get("course_code") ?? "";
  const semesterParam = searchParams.get("semester") ?? "";
  const qParam = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(qParam);
  const [notes, setNotes] = useState<Note[]>([]);
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
    listNotes({
      course_code: courseParam || undefined,
      semester: semesterParam || undefined,
      q: qParam || undefined,
    })
      .then((response) => {
        if (cancelled) return;
        setNotes(response.items);
        setTotal(response.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Notlar yüklenemedi. Tekrar dene.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseParam, semesterParam, qParam]);

  function updateFilters(next: { course_code?: string; semester?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const apply = (key: string, value: string | undefined) => {
      if (value && value.length > 0) params.set(key, value);
      else params.delete(key);
    };
    if ("course_code" in next) apply("course_code", next.course_code);
    if ("semester" in next) apply("semester", next.semester);
    if ("q" in next) apply("q", next.q);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateFilters({ q: searchInput.trim() });
  }

  const hasFilters = Boolean(courseParam || semesterParam || qParam);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notlar</h1>
          <p className="mt-1 text-muted-foreground">
            Ders notlarını ve geçmiş sınavları paylaş.
          </p>
        </div>
        <Button asChild>
          <Link href="/notes/new">
            <Plus className="h-4 w-4" />
            <span className="ml-1.5">Not yükle</span>
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Başlık veya ders ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            aria-label="Notlarda ara"
          />
        </form>
        <select
          value={courseParam}
          onChange={(e) => updateFilters({ course_code: e.target.value })}
          aria-label="Kurs kodu filtresi"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Tüm dersler</option>
          {NOTE_COURSE_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={semesterParam}
          onChange={(e) => updateFilters({ semester: e.target.value })}
          aria-label="Dönem filtresi"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Tüm dönemler</option>
          {NOTE_SEMESTER_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <NotesListSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : notes.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            <div className="mb-3 text-sm text-muted-foreground">
              {total} sonuç
            </div>
            <div className="flex flex-col gap-3">
              {notes.map((n) => (
                <NoteCard key={n.id} note={n} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function NotesListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-muted/40" />
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center">
      <p className="text-sm font-medium text-foreground">
        {hasFilters ? "Bu filtrelerle eşleşen not yok." : "Henüz not yok."}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasFilters ? "Filtreleri sıfırla veya farklı bir arama dene." : "İlk notu sen yükle."}
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
