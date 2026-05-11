"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { fetchMe, updateMe, type AuthUser } from "@/lib/auth";

type FormState = {
  displayName: string;
  university: string;
  department: string;
};

function userToForm(u: AuthUser): FormState {
  return {
    displayName: u.display_name,
    university: u.university ?? "",
    department: u.department ?? "",
  };
}

export default function MyProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setForm(userToForm(u));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setLoadError(err.message);
        } else {
          setLoadError("Profil yüklenemedi.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form || !user) return;
    setSubmitError(null);

    const displayName = form.displayName.trim();
    if (!displayName) {
      setSubmitError("Görünen ad boş olamaz.");
      return;
    }
    if (displayName.length > 100) {
      setSubmitError("Görünen ad en fazla 100 karakter olabilir.");
      return;
    }

    const universityTrimmed = form.university.trim();
    const departmentTrimmed = form.department.trim();

    const payload: Parameters<typeof updateMe>[0] = {};
    if (displayName !== user.display_name) {
      payload.display_name = displayName;
    }
    const nextUniversity = universityTrimmed || null;
    if (nextUniversity !== (user.university ?? null)) {
      payload.university = nextUniversity;
    }
    const nextDepartment = departmentTrimmed || null;
    if (nextDepartment !== (user.department ?? null)) {
      payload.department = nextDepartment;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("Değişiklik yok.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateMe(payload);
      setUser(updated);
      setForm(userToForm(updated));
      toast.success("Profil kaydedildi");
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Kaydetme başarısız. Tekrar dene.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">Ana sayfaya dön</span>
        </Link>
      </Button>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">Profilim</h1>
      <p className="mt-1 text-muted-foreground">
        Görünen adın ve okul bilgilerin diğer öğrencilere bu profilde
        görünür.
      </p>

      {loadError ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      {form && user ? (
        <>
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm"
            noValidate
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" value={user.email} disabled readOnly />
                <p className="text-xs text-muted-foreground">
                  E-postanı değiştiremezsin.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Görünen ad</Label>
                <Input
                  id="display_name"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, displayName: e.target.value } : f))
                  }
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="university">Üniversite</Label>
                <Input
                  id="university"
                  value={form.university}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, university: e.target.value } : f))
                  }
                  maxLength={100}
                  placeholder="Örn. İstanbul Üniversitesi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Bölüm</Label>
                <Input
                  id="department"
                  value={form.department}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, department: e.target.value } : f))
                  }
                  maxLength={100}
                  placeholder="Örn. Bilgisayar Mühendisliği"
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

              <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                  <Save className="h-4 w-4" />
                  <span className="ml-1.5">
                    {submitting ? "Kaydediliyor..." : "Kaydet"}
                  </span>
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-4 flex justify-end">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/profile/${user.id}`}>
                Herkese açık profilimi gör
                <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </>
      ) : !loadError ? (
        <ProfileFormSkeleton />
      ) : null}
    </main>
  );
}

function ProfileFormSkeleton() {
  return (
    <div
      className="mt-6 animate-pulse rounded-lg border border-border bg-card p-6"
      aria-busy
    >
      <div className="space-y-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
