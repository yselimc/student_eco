"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import {
  listConversations,
  type ConversationItem,
} from "@/lib/api/messages";
import { cn } from "@/lib/utils";

const TURKISH_MONTHS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
] as const;

function formatRelativeTr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const today = startOfDay(now).getTime();
  const that = startOfDay(d).getTime();
  const dayDelta = Math.round((today - that) / 86_400_000);
  if (dayDelta <= 0) {
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }
  if (dayDelta === 1) return "Dün";
  if (dayDelta < 7) return `${dayDelta} gün önce`;
  return `${d.getDate()} ${TURKISH_MONTHS[d.getMonth()]}`;
}

function threadHref(item: ConversationItem): string {
  if (item.listing_id) {
    return `/messages/listings/${item.listing_id}/with/${item.other_user_id}`;
  }
  return `/messages/with/${item.other_user_id}`;
}

export default function MessagesInboxPage() {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(initial: boolean) {
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await listConversations();
      setItems(response.items);
      setError(null);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Sohbetler yüklenemedi.";
      if (initial) setError(msg);
      else toast.error(msg);
    } finally {
      if (initial) setLoading(false);
      else setRefreshing(false);
    }
  }

  useEffect(() => {
    load(true);
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mesajlar</h1>
          <p className="mt-1 text-muted-foreground">
            Satıcılar ve alıcılarla yazışmaların.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => load(false)}
          disabled={loading || refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-1.5">Yenile</span>
        </Button>
      </div>

      <div className="mt-6">
        {loading ? (
          <InboxSkeleton />
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : items.length === 0 ? (
          <EmptyInbox />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {items.map((item) => (
              <li key={`${item.listing_id ?? "orphan"}-${item.other_user_id}`}>
                <Link
                  href={threadHref(item)}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary-soft text-primary-strong">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {item.other_user_name}
                      </div>
                      <div className="flex flex-none items-center gap-2">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatRelativeTr(item.last_message_at)}
                        </span>
                        {item.unread_count > 0 ? (
                          <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                            {item.unread_count}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.listing_id ? (
                        <span className="font-medium text-foreground/80">
                          {item.listing_title ?? "İlan"}
                        </span>
                      ) : (
                        <span className="italic">Bu ilan kaldırıldı</span>
                      )}
                      <span className="mx-1.5">·</span>
                      <span
                        className={cn(
                          item.unread_count > 0
                            ? "font-medium text-foreground"
                            : "",
                        )}
                      >
                        {item.last_message_body}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function InboxSkeleton() {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card" aria-busy>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 flex-none animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyInbox() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center">
      <p className="text-sm font-medium text-foreground">Henüz sohbetin yok.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Bir ilana göz at ve satıcıyla iletişime geç.
      </p>
      <div className="mt-4">
        <Button asChild size="sm" variant="secondary">
          <Link href="/marketplace">Pazaryerine git</Link>
        </Button>
      </div>
    </div>
  );
}
