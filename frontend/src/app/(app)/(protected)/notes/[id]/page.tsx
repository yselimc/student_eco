"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { deleteNote, downloadNote, getNote, type Note } from "@/lib/api/notes";
import { getStoredUser } from "@/lib/auth";
import { formatDateTr, formatFileSize } from "@/lib/notes/constants";

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUserId(getStoredUser()?.id ?? null);
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getNote(id)
      .then((n) => {
        if (!cancelled) setNote(n);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.status === 404 ? "Not bulunamadı." : err.message);
        } else {
          setError("Not yüklenemedi.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDownload() {
    if (!note) return;
    setDownloading(true);
    try {
      await downloadNote(note);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "İndirme başarısız. Tekrar dene.";
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    if (!note) return;
    if (!window.confirm(`"${note.title}" silinsin mi?`)) return;
    setDeleting(true);
    try {
      await deleteNote(note.id);
      toast.success("Not silindi");
      router.push("/notes");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Silme başarısız.";
      toast.error(msg);
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/notes">
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">Notlara dön</span>
        </Link>
      </Button>

      {loading ? (
        <div className="h-48 animate-pulse rounded-lg border border-border bg-muted/40" />
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </div>
      ) : note ? (
        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-[hsl(var(--notes)/0.12)] text-[hsl(var(--notes))]">
                <FileText className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold leading-tight tracking-tight">
                  {note.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="rounded-md bg-[hsl(var(--notes)/0.12)] px-2 py-0.5 font-mono text-xs font-semibold text-[hsl(var(--notes))]">
                    {note.course_code}
                  </span>
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    {note.semester}
                  </span>
                  <span aria-hidden className="text-muted-foreground/60">·</span>
                  <span>{note.author_name}</span>
                </div>
              </div>
            </div>
            <Button onClick={handleDownload} disabled={downloading}>
              <Download className="h-4 w-4" />
              <span className="ml-1.5">
                {downloading ? "İndiriliyor..." : "PDF indir"}
              </span>
            </Button>
          </div>

          {note.description ? (
            <>
              <hr className="my-5 border-border" />
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {note.description}
              </p>
            </>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
            <span>{formatFileSize(note.file_size_bytes)}</span>
            <span aria-hidden className="text-muted-foreground/60">·</span>
            <span>{formatDateTr(note.created_at)} tarihinde yüklendi</span>
          </div>

          {currentUserId === note.user_id ? (
            <div className="mt-6 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="ml-1">{deleting ? "Siliniyor..." : "Sil"}</span>
              </Button>
            </div>
          ) : null}
        </article>
      ) : null}
    </main>
  );
}
