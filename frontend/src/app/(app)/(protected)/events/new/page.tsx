"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { createEvent, type EventCategory } from "@/lib/api/events";
import {
  EVENT_CATEGORY_OPTIONS,
  turkeyLocalToUtcIso,
} from "@/lib/events/constants";

export default function NewEventPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>(
    EVENT_CATEGORY_OPTIONS[0].key as EventCategory,
  );
  const [location, setLocation] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [endsAtLocal, setEndsAtLocal] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!title.trim()) {
      setSubmitError("Başlık zorunludur.");
      return;
    }
    if (!startsAtLocal) {
      setSubmitError("Başlangıç tarihi ve saati zorunludur.");
      return;
    }
    const startsUtc = turkeyLocalToUtcIso(startsAtLocal);
    if (!startsUtc) {
      setSubmitError("Başlangıç tarihi geçersiz.");
      return;
    }
    let endsUtc: string | null = null;
    if (endsAtLocal) {
      endsUtc = turkeyLocalToUtcIso(endsAtLocal);
      if (!endsUtc) {
        setSubmitError("Bitiş tarihi geçersiz.");
        return;
      }
      if (new Date(endsUtc) < new Date(startsUtc)) {
        setSubmitError("Bitiş, başlangıçtan önce olamaz.");
        return;
      }
    }

    let maxAttendeesValue: number | null = null;
    if (maxAttendees.trim()) {
      const parsed = Number(maxAttendees);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
        setSubmitError("Kontenjan en az 1 olmalı.");
        return;
      }
      maxAttendeesValue = parsed;
    }

    setSubmitting(true);
    try {
      const created = await createEvent({
        title: title.trim(),
        description: description.trim() || null,
        category,
        location: location.trim() || null,
        starts_at: startsUtc,
        ends_at: endsUtc,
        max_attendees: maxAttendeesValue,
      });
      toast.success("Etkinlik yayınlandı");
      router.push(`/events/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Yayınlama başarısız. Tekrar dene.");
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/events">
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">Etkinliklere dön</span>
        </Link>
      </Button>

      <h1 className="text-3xl font-bold tracking-tight">Yeni etkinlik</h1>
      <p className="mt-1 text-muted-foreground">
        Tarih, yer ve kategoriyi seç. Saatler Türkiye saati olarak yorumlanır.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm"
        noValidate
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kalkülüs II final çalışma grubu"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <select
                id="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {EVENT_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Konum</Label>
              <Input
                id="location"
                maxLength={200}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Kütüphane, 204 numaralı oda"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="starts_at">Başlangıç</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                required
                value={startsAtLocal}
                onChange={(e) => setStartsAtLocal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends_at">Bitiş (opsiyonel)</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                value={endsAtLocal}
                onChange={(e) => setEndsAtLocal(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_attendees">Kontenjan (opsiyonel)</Label>
            <Input
              id="max_attendees"
              type="number"
              inputMode="numeric"
              step={1}
              min={1}
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              placeholder="Sınırsız"
            />
            <p className="text-xs text-muted-foreground">
              Boş bırakırsan herkes katılabilir.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <textarea
              id="description"
              maxLength={2000}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ne çalışacaksınız, ne getirilmeli…"
              className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {submitError ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {submitError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/events")}
              disabled={submitting}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={submitting}>
              <Upload className="h-4 w-4" />
              <span className="ml-1.5">
                {submitting ? "Yayınlanıyor..." : "Yayınla"}
              </span>
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
