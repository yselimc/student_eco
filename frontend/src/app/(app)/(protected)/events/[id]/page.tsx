"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Check, Clock, MapPin, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PastEventBadge } from "@/components/events/past-event-badge";
import { ApiError } from "@/lib/api";
import {
  cancelRsvp,
  deleteEvent,
  getEvent,
  listAttendees,
  rsvpEvent,
  type Attendee,
  type EventRead,
} from "@/lib/api/events";
import { getStoredUser } from "@/lib/auth";
import {
  categoryLabel,
  formatLongDate,
  formatTimeRange,
  isPastEvent,
} from "@/lib/events/constants";
import { cn } from "@/lib/utils";

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [event, setEvent] = useState<EventRead | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCurrentUserId(getStoredUser()?.id ?? null);
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getEvent(id), listAttendees(id)])
      .then(([ev, att]) => {
        if (cancelled) return;
        setEvent(ev);
        setAttendees(att.items);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.status === 404 ? "Etkinlik bulunamadı." : err.message);
        } else {
          setError("Etkinlik yüklenemedi.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleToggleRsvp() {
    if (!event || !currentUserId) return;
    const isGoing = attendees.some((a) => a.user_id === currentUserId);
    setRsvpBusy(true);
    try {
      if (isGoing) {
        await cancelRsvp(event.id);
        toast.success("Katılım iptal edildi");
      } else {
        await rsvpEvent(event.id);
        toast.success("Katılıyorsun");
      }
      const att = await listAttendees(event.id);
      setAttendees(att.items);
      setEvent({ ...event, attendee_count: att.total });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "İşlem başarısız.";
      toast.error(msg);
    } finally {
      setRsvpBusy(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    if (!window.confirm(`"${event.title}" silinsin mi?`)) return;
    setDeleting(true);
    try {
      await deleteEvent(event.id);
      toast.success("Etkinlik silindi");
      router.push("/events");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Silme başarısız.";
      toast.error(msg);
      setDeleting(false);
    }
  }

  const isOrganizer = event && currentUserId === event.organizer_id;
  const isGoing = Boolean(currentUserId) && attendees.some((a) => a.user_id === currentUserId);
  const past = event ? isPastEvent(event.starts_at) : false;
  const isFull =
    event !== null &&
    event.max_attendees !== null &&
    event.attendee_count >= event.max_attendees;
  const rsvpDisabled = rsvpBusy || past || !currentUserId || (isFull && !isGoing);
  const rsvpDisabledReason = past
    ? "Geçmiş etkinlik"
    : isFull && !isGoing
      ? "Dolu"
      : null;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/events">
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">Etkinliklere dön</span>
        </Link>
      </Button>

      {loading ? (
        <DetailSkeleton />
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </div>
      ) : event ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section className="space-y-5 lg:col-span-3">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[hsl(var(--events)/0.12)] px-2 py-0.5 text-xs font-medium text-[hsl(var(--events))]">
                  {categoryLabel(event.category)}
                </span>
                {past ? <PastEventBadge /> : null}
              </div>
              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight">
                {event.title}
              </h1>

              <div className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatLongDate(event.starts_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">
                    {formatTimeRange(event.starts_at, event.ends_at)}
                  </span>
                </div>
                {event.location ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                ) : null}
              </div>

              {event.description ? (
                <>
                  <hr className="my-5 border-border" />
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {event.description}
                  </p>
                </>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleToggleRsvp}
                  disabled={rsvpDisabled}
                  variant={isGoing ? "secondary" : "default"}
                  title={rsvpDisabledReason ?? undefined}
                >
                  {isGoing ? <Check className="h-4 w-4" /> : null}
                  <span className={isGoing ? "ml-1.5" : undefined}>
                    {rsvpBusy
                      ? "Güncelleniyor..."
                      : isGoing
                        ? "Katılıyorum"
                        : rsvpDisabledReason ?? "Katıl"}
                  </span>
                </Button>
                {isOrganizer ? (
                  <Button
                    variant="ghost"
                    onClick={handleDelete}
                    disabled={deleting || rsvpBusy}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-1">
                      {deleting ? "Siliniyor..." : "Etkinliği sil"}
                    </span>
                  </Button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="space-y-4 lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Katılımcılar
                </div>
                <div className="flex items-center gap-2">
                  {isFull ? (
                    <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      Dolu
                    </span>
                  ) : null}
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {event.max_attendees !== null
                      ? `${event.attendee_count} / ${event.max_attendees}`
                      : event.attendee_count}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                {attendees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Henüz katılımcı yok.{!past ? " İlk sen ol." : ""}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {attendees.map((a) => (
                      <li
                        key={a.user_id}
                        className={cn(
                          "flex items-center gap-2 text-sm",
                          a.user_id === currentUserId && "font-semibold",
                        )}
                      >
                        <Avatar src={a.avatar_url} name={a.display_name} size="sm" />
                        <Link
                          href={`/profile/${a.user_id}`}
                          className="truncate hover:underline"
                        >
                          {a.display_name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Organizatör
              </div>
              <Link
                href={`/profile/${event.organizer_id}`}
                className="mt-1 flex items-center gap-2 hover:underline"
              >
                <Avatar
                  src={event.organizer_avatar_url}
                  name={event.organizer_name}
                  size="sm"
                />
                <span className="font-semibold">{event.organizer_name}</span>
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5" aria-busy>
      <div className="space-y-3 rounded-lg border border-border bg-card p-6 lg:col-span-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded bg-muted/40" />
      </div>
      <div className="space-y-3 rounded-lg border border-border bg-card p-5 lg:col-span-2">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
