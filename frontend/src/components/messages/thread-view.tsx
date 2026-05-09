"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImageOff, Send } from "lucide-react";
import { toast } from "sonner";

import { AuthImage } from "@/components/marketplace/auth-image";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { getListing, listingImagePath, type Listing } from "@/lib/api/listings";
import {
  getListingThread,
  getOrphanThread,
  sendMessage,
  type Message,
} from "@/lib/api/messages";
import { getStoredUser } from "@/lib/auth";
import { formatPriceTl, statusLabel } from "@/lib/marketplace/constants";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 5000;

type ThreadViewProps = {
  listingId: string | null;
  otherUserId: string;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export function ThreadView({ listingId, otherUserId }: ThreadViewProps) {
  const isOrphan = listingId === null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentUserId(getStoredUser()?.id ?? null);
  }, []);

  useEffect(() => {
    if (!listingId) {
      setListing(null);
      return;
    }
    let cancelled = false;
    getListing(listingId)
      .then((l) => {
        if (!cancelled) setListing(l);
      })
      .catch(() => {
        if (!cancelled) setListing(null);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  useEffect(() => {
    let cancelled = false;

    async function fetchThread() {
      if (cancelled || pausedRef.current) return;
      try {
        const response = listingId
          ? await getListingThread(listingId, otherUserId)
          : await getOrphanThread(otherUserId);
        if (cancelled) return;
        setMessages(response.items);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError ? err.message : "Mesajlar yüklenemedi.";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    function startInterval() {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(fetchThread, POLL_INTERVAL_MS);
    }

    function clearPollInterval() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        pausedRef.current = true;
        clearPollInterval();
      } else {
        pausedRef.current = false;
        fetchThread();
        startInterval();
      }
    }

    function handleBeforeUnload() {
      clearPollInterval();
    }

    setLoading(true);
    fetchThread();
    startInterval();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      cancelled = true;
      clearPollInterval();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [listingId, otherUserId]);

  useEffect(() => {
    if (messages.length > lastCountRef.current) {
      const el = scrollAreaRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
    lastCountRef.current = messages.length;
  }, [messages.length]);

  function autoGrowComposer() {
    const ta = composerRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const max = 5 * 24;
    ta.style.height = `${Math.min(ta.scrollHeight, max)}px`;
  }

  async function handleSend() {
    if (isOrphan || sending) return;
    const body = composer.trim();
    if (!body) return;
    setSending(true);
    try {
      const created = await sendMessage({
        listing_id: listingId,
        recipient_id: otherUserId,
        body,
      });
      setMessages((m) => [...m, created]);
      setComposer("");
      requestAnimationFrame(() => {
        if (composerRef.current) composerRef.current.style.height = "auto";
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gönderilemedi.";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  const cover = listing?.images[0];
  const isSold = listing?.status === "sold";
  const composerDisabled = isOrphan || sending;
  const sendDisabled = composerDisabled || composer.trim().length === 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 lg:py-8">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2 self-start">
        <Link href="/messages">
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">Mesajlara dön</span>
        </Link>
      </Button>

      <header className="mb-4 rounded-lg border border-border bg-card p-3">
        {isOrphan ? (
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-md bg-muted text-muted-foreground">
              <ImageOff className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">
                Bu ilan kaldırıldı
              </div>
              <div className="text-xs text-muted-foreground">
                Geçmiş mesajları görebilirsin, yeni mesaj gönderemezsin.
              </div>
            </div>
          </div>
        ) : listing ? (
          <Link
            href={`/marketplace/${listing.id}`}
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="relative h-12 w-12 flex-none overflow-hidden rounded-md bg-muted">
              {cover ? (
                <AuthImage
                  path={listingImagePath(listing.id, cover.id)}
                  alt={listing.title}
                  containerClassName="absolute inset-0 h-full w-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <ImageOff className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-semibold text-foreground">
                  {listing.title}
                </div>
                <span
                  className={cn(
                    "flex-none rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                    isSold
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {statusLabel(listing.status)}
                </span>
              </div>
              <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                {formatPriceTl(listing.price)}
                <span className="mx-1.5">·</span>
                {listing.seller_name}
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 flex-none animate-pulse rounded-md bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        )}
      </header>

      <div
        ref={scrollAreaRef}
        className="min-h-[320px] flex-1 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4"
        aria-live="polite"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Yükleniyor...
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {isOrphan
              ? "Bu sohbette mesaj yok."
              : "Henüz mesaj yok. İlk mesajı sen gönder."}
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                className={cn(
                  "flex w-full",
                  mine ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <div
                    className={cn(
                      "mt-1 text-[10px] tabular-nums",
                      mine
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3">
        {isOrphan ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">
            Bu ilan kaldırıldığı için yeni mesaj gönderemezsin.
          </div>
        ) : (
          <div className="flex items-end gap-2 rounded-lg border border-border bg-card p-2">
            <textarea
              ref={composerRef}
              rows={1}
              value={composer}
              onChange={(e) => {
                setComposer(e.target.value);
                autoGrowComposer();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Mesaj yaz..."
              disabled={composerDisabled}
              className="min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={sendDisabled}
              aria-label="Mesaj gönder"
            >
              <Send className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">
                {sending ? "Gönderiliyor..." : "Gönder"}
              </span>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
