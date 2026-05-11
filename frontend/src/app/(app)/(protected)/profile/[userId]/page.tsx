"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  GraduationCap,
  Pencil,
  ShoppingBag,
  UserCircle,
  Users,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { getPublicProfile, type PublicProfile } from "@/lib/api/users";
import { getStoredUser } from "@/lib/auth";

type Status = "loading" | "loaded" | "missing" | "error";

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUserId(getStoredUser()?.id ?? null);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);
    getPublicProfile(userId)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setStatus("loaded");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setStatus("missing");
          return;
        }
        if (err instanceof ApiError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage("Profil yüklenemedi.");
        }
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const isOwnProfile = Boolean(profile && currentUserId && profile.id === currentUserId);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">Ana sayfaya dön</span>
        </Link>
      </Button>

      <div className="mt-4">
        {status === "loading" ? (
          <ProfileSkeleton />
        ) : status === "missing" ? (
          <MissingState />
        ) : status === "error" ? (
          <ErrorState message={errorMessage ?? "Bir şeyler ters gitti."} />
        ) : profile ? (
          <ProfileView profile={profile} isOwn={isOwnProfile} />
        ) : null}
      </div>
    </main>
  );
}

function ProfileView({
  profile,
  isOwn,
}: {
  profile: PublicProfile;
  isOwn: boolean;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={profile.avatar_url} name={profile.display_name} size="lg" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {profile.display_name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Üye olma:{" "}
              {new Date(profile.created_at).toLocaleDateString("tr-TR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        {isOwn ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/profile/me">
              <Pencil className="h-3.5 w-3.5" />
              <span className="ml-1.5">Profilimi düzenle</span>
            </Link>
          </Button>
        ) : null}
      </header>

      <section className="mt-5 border-t border-border pt-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Okul
        </h2>
        {profile.university || profile.department ? (
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow
              icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
              label="Üniversite"
              value={profile.university}
            />
            <InfoRow
              icon={
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              }
              label="Bölüm"
              value={profile.department}
            />
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Okul bilgisi paylaşılmamış.
          </p>
        )}
      </section>

      <section className="mt-5 border-t border-border pt-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Etkinlik
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <CountTile
            icon={<FileText className="h-4 w-4" />}
            label="Not"
            value={profile.notes_count}
          />
          <CountTile
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Aktif ilan"
            value={profile.listings_count}
          />
          <CountTile
            icon={<Calendar className="h-4 w-4" />}
            label="Düzenlenen etkinlik"
            value={profile.events_organized_count}
          />
        </div>
      </section>

      {profile.buddy_profile_id ? (
        <section className="mt-5 rounded-md border border-[hsl(var(--buddy)/0.3)] bg-[hsl(var(--buddy)/0.08)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--buddy))]">
              <Users className="h-4 w-4" />
              <span className="font-medium">
                Çalışma arkadaşı profili var
              </span>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/buddies/${profile.id}`}>
                Buddy profilini gör
              </Link>
            </Button>
          </div>
        </section>
      ) : null}
    </article>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex-none">{icon}</div>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium">
          {value ?? <span className="text-muted-foreground">—</span>}
        </dd>
      </div>
    </div>
  );
}

function CountTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div
      className="animate-pulse rounded-lg border border-border bg-card p-6"
      aria-busy
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="h-3 w-28 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="h-16 rounded bg-muted" />
        <div className="h-16 rounded bg-muted" />
        <div className="h-16 rounded bg-muted" />
      </div>
    </div>
  );
}

function MissingState() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center">
      <UserCircle className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-3 text-base font-medium text-foreground">
        Bu kullanıcı bulunamadı.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Hesap silinmiş veya bağlantı hatalı olabilir.
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
