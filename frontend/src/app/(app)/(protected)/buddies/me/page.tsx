"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import {
  deleteMyBuddyProfile,
  getMyBuddyProfile,
  upsertMyBuddyProfile,
  type BuddyProfileRead,
  type StudyStyle,
  type Weekday,
} from "@/lib/api/buddies";
import {
  STUDY_STYLE_OPTIONS,
  WEEKDAY_OPTIONS,
} from "@/lib/buddies/constants";

const LOOKING_FOR_MIN = 10;
const LOOKING_FOR_MAX = 500;

type Mode = "loading" | "empty" | "editing";

type FormState = {
  lookingFor: string;
  coursesInput: string;
  days: Weekday[];
  studyStyle: StudyStyle;
  instagram: string;
  discord: string;
  telefon: string;
};

const EMPTY_FORM: FormState = {
  lookingFor: "",
  coursesInput: "",
  days: [],
  studyStyle: "quiet",
  instagram: "",
  discord: "",
  telefon: "",
};

function profileToForm(p: BuddyProfileRead): FormState {
  return {
    lookingFor: p.looking_for,
    coursesInput: p.courses.join(", "),
    days: [...p.available_days],
    studyStyle: p.study_style,
    instagram: p.contact_info.instagram ?? "",
    discord: p.contact_info.discord ?? "",
    telefon: p.contact_info.telefon ?? "",
  };
}

function parseCourses(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export default function MyBuddyProfilePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("loading");
  const [profile, setProfile] = useState<BuddyProfileRead | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyBuddyProfile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setForm(profileToForm(p));
        setMode("editing");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setMode("empty");
          return;
        }
        if (err instanceof ApiError) {
          setLoadError(err.message);
        } else {
          setLoadError("Profil yüklenemedi.");
        }
        setMode("empty");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleDay(day: Weekday) {
    setForm((f) => {
      const has = f.days.includes(day);
      const next = has ? f.days.filter((d) => d !== day) : [...f.days, day];
      return { ...f, days: next };
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const lookingFor = form.lookingFor.trim();
    if (lookingFor.length < LOOKING_FOR_MIN) {
      setSubmitError(`En az ${LOOKING_FOR_MIN} karakter yaz.`);
      return;
    }
    const courses = parseCourses(form.coursesInput);
    if (courses.length === 0) {
      setSubmitError("En az bir ders ekle.");
      return;
    }
    if (form.days.length === 0) {
      setSubmitError("En az bir müsait gün seç.");
      return;
    }
    const instagram = form.instagram.trim().replace(/^@+/, "");
    const discord = form.discord.trim();
    const telefon = form.telefon.replace(/\D/g, "");
    if (!instagram && !discord && !telefon) {
      setSubmitError(
        "Instagram, Discord veya telefondan en az birini doldur.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const saved = await upsertMyBuddyProfile({
        looking_for: lookingFor,
        courses,
        available_days: form.days,
        study_style: form.studyStyle,
        contact_info: {
          instagram: instagram || null,
          discord: discord || null,
          telefon: telefon || null,
        },
      });
      setProfile(saved);
      setForm(profileToForm(saved));
      setMode("editing");
      toast.success("Profil kaydedildi");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "BUDDY_CONTACT_REQUIRED") {
          setSubmitError(
            "Instagram, Discord veya telefondan en az birini doldur.",
          );
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError("Kaydetme başarısız. Tekrar dene.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!profile) return;
    if (
      !window.confirm(
        "Çalışma profilini silmek istediğine emin misin? Diğer öğrenciler artık seni göremez.",
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await deleteMyBuddyProfile();
      setProfile(null);
      setForm(EMPTY_FORM);
      setMode("empty");
      toast.success("Profil silindi");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Silme başarısız.");
      }
    } finally {
      setDeleting(false);
    }
  }

  if (mode === "loading") {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
        <BackLink />
        <div className="mt-6 animate-pulse rounded-lg border border-border bg-card p-6">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="mt-4 space-y-3">
            <div className="h-20 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  if (mode === "empty") {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
        <BackLink />
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          Çalışma profilim
        </h1>
        <p className="mt-1 text-muted-foreground">
          Diğer öğrenciler seni bu bilgilerle bulur.
        </p>

        {loadError ? (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {loadError}
          </div>
        ) : null}

        <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center">
          <p className="text-base font-medium text-foreground">
            Henüz çalışma profilin yok.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Profil oluştur, dersler ve müsait günlerle birlikte arananlara çık.
          </p>
          <Button
            type="button"
            className="mt-5"
            onClick={() => setMode("editing")}
          >
            <UserPlus className="h-4 w-4" />
            <span className="ml-1.5">Profil oluştur</span>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <BackLink />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        {profile ? "Profilimi düzenle" : "Profil oluştur"}
      </h1>
      <p className="mt-1 text-muted-foreground">
        Diğer öğrenciler seni bu bilgilerle görür.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm"
        noValidate
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="looking_for">Hakkında</Label>
              <span
                className={
                  form.lookingFor.length > LOOKING_FOR_MAX
                    ? "text-xs font-medium text-destructive"
                    : "text-xs text-muted-foreground"
                }
              >
                {form.lookingFor.length}/{LOOKING_FOR_MAX}
              </span>
            </div>
            <textarea
              id="looking_for"
              maxLength={LOOKING_FOR_MAX}
              rows={4}
              value={form.lookingFor}
              onChange={(e) =>
                setForm((f) => ({ ...f, lookingFor: e.target.value }))
              }
              placeholder="Vize hazırlığı için kısa, odaklanmış seanslar tercih ediyorum…"
              className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground">
              En az {LOOKING_FOR_MIN} karakter.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="courses">Dersler</Label>
            <Input
              id="courses"
              value={form.coursesInput}
              onChange={(e) =>
                setForm((f) => ({ ...f, coursesInput: e.target.value }))
              }
              placeholder="CS301, MATH210, PHYS101"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Virgülle ayır. Örn: CS301, MATH210
            </p>
          </div>

          <div className="space-y-2">
            <Label>Müsait günler</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((d) => {
                const active = form.days.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    aria-pressed={active}
                    className={
                      active
                        ? "rounded-md border border-[hsl(var(--buddy))] bg-[hsl(var(--buddy)/0.12)] px-3 py-1.5 text-sm font-medium text-[hsl(var(--buddy))]"
                        : "rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Çalışma stili</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {STUDY_STYLE_OPTIONS.map((s) => {
                const active = form.studyStyle === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, studyStyle: s.key }))
                    }
                    aria-pressed={active}
                    className={
                      active
                        ? "rounded-md border border-[hsl(var(--buddy))] bg-[hsl(var(--buddy)/0.12)] px-3 py-2 text-sm font-medium text-[hsl(var(--buddy))]"
                        : "rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
            <div>
              <Label className="text-sm font-semibold">İletişim</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                En az birini doldur. Diğer öğrenciler buradan ulaşır.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram" className="text-xs">
                Instagram
              </Label>
              <Input
                id="instagram"
                value={form.instagram}
                onChange={(e) =>
                  setForm((f) => ({ ...f, instagram: e.target.value }))
                }
                placeholder="kullanici_adi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discord" className="text-xs">
                Discord
              </Label>
              <Input
                id="discord"
                value={form.discord}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discord: e.target.value }))
                }
                placeholder="kullanici#0000 veya kullaniciadi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefon" className="text-xs">
                Telefon
              </Label>
              <Input
                id="telefon"
                value={form.telefon}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telefon: e.target.value }))
                }
                placeholder="+90 5XX XXX XX XX"
                inputMode="tel"
              />
            </div>
          </div>

          {submitError ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {submitError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            {profile ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting || submitting}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="ml-1">
                  {deleting ? "Siliniyor..." : "Profili sil"}
                </span>
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/buddies")}
                disabled={submitting || deleting}
              >
                Vazgeç
              </Button>
              <Button type="submit" disabled={submitting || deleting}>
                <Save className="h-4 w-4" />
                <span className="ml-1.5">
                  {submitting ? "Kaydediliyor..." : "Kaydet"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2">
      <Link href="/buddies">
        <ArrowLeft className="h-4 w-4" />
        <span className="ml-1">Çalışma arkadaşlarına dön</span>
      </Link>
    </Button>
  );
}
