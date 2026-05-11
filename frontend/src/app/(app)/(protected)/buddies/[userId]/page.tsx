"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  AtSign,
  Check,
  Copy,
  MessageCircle,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { getBuddyProfile, type BuddyProfileRead } from "@/lib/api/buddies";
import {
  formatTelefon,
  studyStyleLabel,
  weekdayLabel,
} from "@/lib/buddies/constants";

export default function BuddyProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;

  const [profile, setProfile] = useState<BuddyProfileRead | null>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "missing" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);
    getBuddyProfile(userId)
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

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/buddies">
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">Çalışma arkadaşlarına dön</span>
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
          <ProfileView profile={profile} />
        ) : null}
      </div>
    </main>
  );
}

function ProfileView({ profile }: { profile: BuddyProfileRead }) {
  return (
    <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {profile.display_name}
          </h1>
        </div>
        <span className="rounded-md bg-[hsl(var(--buddy)/0.12)] px-3 py-1 text-sm font-medium text-[hsl(var(--buddy))]">
          {studyStyleLabel(profile.study_style)}
        </span>
      </header>

      <Section label="Hakkında">
        <p className="whitespace-pre-line text-sm leading-relaxed">
          {profile.looking_for}
        </p>
      </Section>

      <Section label="Çalıştığı dersler">
        <div className="flex flex-wrap gap-1.5">
          {profile.courses.map((c) => (
            <span
              key={c}
              className="rounded-md border border-border bg-muted/40 px-2.5 py-1 font-mono text-xs"
            >
              {c}
            </span>
          ))}
        </div>
      </Section>

      <Section label="Müsait günler">
        <div className="flex flex-wrap gap-1.5">
          {profile.available_days.map((d) => (
            <span
              key={d}
              className="rounded-md bg-muted/60 px-2.5 py-1 text-xs text-foreground/80"
            >
              {weekdayLabel(d)}
            </span>
          ))}
        </div>
      </Section>

      <ContactSection profile={profile} />
    </article>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 border-t border-border pt-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function ContactSection({ profile }: { profile: BuddyProfileRead }) {
  const { instagram, discord, telefon } = profile.contact_info;
  const hasAny = Boolean(instagram || discord || telefon);

  return (
    <section className="mt-5 rounded-md border border-[hsl(var(--buddy)/0.3)] bg-[hsl(var(--buddy)/0.08)] p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--buddy))]">
        İletişim
      </h2>
      {hasAny ? (
        <ul className="mt-3 space-y-2">
          {instagram ? <InstagramRow handle={instagram} /> : null}
          {discord ? <DiscordRow handle={discord} /> : null}
          {telefon ? <TelefonRow digits={telefon} /> : null}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Henüz iletişim bilgisi yok.
        </p>
      )}
    </section>
  );
}

function InstagramRow({ handle }: { handle: string }) {
  const url = `https://instagram.com/${handle}`;
  return (
    <li className="flex items-center justify-between gap-3 rounded-md bg-background/60 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <AtSign className="h-4 w-4 flex-none text-[hsl(var(--buddy))]" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-sm font-medium hover:underline"
        >
          @{handle}
        </a>
      </div>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="flex-none"
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          Aç
        </a>
      </Button>
    </li>
  );
}

function DiscordRow({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(handle);
      setCopied(true);
      toast.success("Discord kullanıcı adı kopyalandı");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Kopyalanamadı");
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-md bg-background/60 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <MessageCircle className="h-4 w-4 flex-none text-[hsl(var(--buddy))]" />
        <span className="truncate font-mono text-sm">{handle}</span>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={copy}
        className="flex-none"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            <span className="ml-1">Kopyalandı</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span className="ml-1">Kopyala</span>
          </>
        )}
      </Button>
    </li>
  );
}

function TelefonRow({ digits }: { digits: string }) {
  const formatted = formatTelefon(digits);
  const href = `tel:+${digits.startsWith("90") ? digits : `90${digits}`}`;
  return (
    <li className="flex items-center justify-between gap-3 rounded-md bg-background/60 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <Phone className="h-4 w-4 flex-none text-[hsl(var(--buddy))]" />
        <a
          href={href}
          className="truncate font-mono text-sm hover:underline"
        >
          {formatted}
        </a>
      </div>
      <Button asChild size="sm" variant="outline" className="flex-none">
        <a href={href}>Ara</a>
      </Button>
    </li>
  );
}

function ProfileSkeleton() {
  return (
    <div
      className="animate-pulse rounded-lg border border-border bg-card p-6"
      aria-busy
    >
      <div className="flex items-start justify-between gap-3">
        <div className="h-6 w-40 rounded bg-muted" />
        <div className="h-7 w-24 rounded bg-muted" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
      </div>
      <div className="mt-6 flex gap-1.5">
        <div className="h-6 w-16 rounded bg-muted" />
        <div className="h-6 w-16 rounded bg-muted" />
        <div className="h-6 w-16 rounded bg-muted" />
      </div>
    </div>
  );
}

function MissingState() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center">
      <p className="text-base font-medium text-foreground">
        Bu kullanıcının çalışma profili yok.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Profil oluşturulmamış veya silinmiş olabilir.
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
