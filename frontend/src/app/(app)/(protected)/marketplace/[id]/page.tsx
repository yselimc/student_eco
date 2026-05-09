"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  MessageCircle,
  PackageCheck,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AuthImage } from "@/components/marketplace/auth-image";
import { ApiError } from "@/lib/api";
import {
  deleteListing,
  getListing,
  listingImagePath,
  updateListingStatus,
  type Listing,
} from "@/lib/api/listings";
import { getStoredUser } from "@/lib/auth";
import {
  categoryLabel,
  formatPriceTl,
  statusLabel,
} from "@/lib/marketplace/constants";
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

function formatDateTr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${TURKISH_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [statusBusy, setStatusBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCurrentUserId(getStoredUser()?.id ?? null);
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getListing(id)
      .then((l) => {
        if (cancelled) return;
        setListing(l);
        setImageIndex(0);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.status === 404 ? "İlan bulunamadı." : err.message);
        } else {
          setError("İlan yüklenemedi.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleToggleStatus() {
    if (!listing) return;
    const next = listing.status === "active" ? "sold" : "active";
    setStatusBusy(true);
    try {
      const updated = await updateListingStatus(listing.id, next);
      setListing(updated);
      toast.success(next === "sold" ? "Satıldı olarak işaretlendi" : "Tekrar yayında");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Durum güncellenemedi.";
      toast.error(msg);
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleDelete() {
    if (!listing) return;
    if (!window.confirm(`"${listing.title}" silinsin mi?`)) return;
    setDeleting(true);
    try {
      await deleteListing(listing.id);
      toast.success("İlan silindi");
      router.push("/marketplace");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Silme başarısız.";
      toast.error(msg);
      setDeleting(false);
    }
  }

  const isOwner = listing && currentUserId === listing.seller_id;
  const images = listing?.images ?? [];
  const activeImage = images[imageIndex];
  const isSold = listing?.status === "sold";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/marketplace">
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">Pazaryerine dön</span>
        </Link>
      </Button>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="aspect-[4/3] animate-pulse rounded-lg border border-border bg-muted/40 lg:col-span-3" />
          <div className="space-y-3 lg:col-span-2">
            <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-32 animate-pulse rounded bg-muted/40" />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </div>
      ) : listing ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-muted">
              {activeImage ? (
                <AuthImage
                  key={activeImage.id}
                  path={listingImagePath(listing.id, activeImage.id)}
                  alt={`${listing.title} — görsel ${imageIndex + 1}`}
                  containerClassName="absolute inset-0 h-full w-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <ImageOff className="h-8 w-8" />
                </div>
              )}
              {isSold ? (
                <div className="absolute right-3 top-3 rounded-full bg-foreground/80 px-3 py-1 text-xs font-semibold text-background backdrop-blur">
                  {statusLabel("sold")}
                </div>
              ) : null}
              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow transition-colors hover:bg-background"
                    aria-label="Önceki görsel"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow transition-colors hover:bg-background"
                    aria-label="Sonraki görsel"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}
            </div>
            {images.length > 1 ? (
              <div className="mt-3 flex justify-center gap-1.5">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setImageIndex(i)}
                    aria-label={`${i + 1}. görsele git`}
                    className={cn(
                      "h-2 w-2 rounded-full transition-colors",
                      i === imageIndex
                        ? "bg-primary"
                        : "bg-muted-foreground/40 hover:bg-muted-foreground/70",
                    )}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-5 lg:col-span-2">
            <div>
              <h1 className="text-2xl font-bold leading-tight tracking-tight">
                {listing.title}
              </h1>
              <div
                className={cn(
                  "mt-2 font-mono text-3xl font-bold",
                  isSold ? "text-muted-foreground line-through" : "text-foreground",
                )}
              >
                {formatPriceTl(listing.price)}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[hsl(var(--market)/0.12)] px-2 py-0.5 text-xs font-medium text-[hsl(var(--market))]">
                  {categoryLabel(listing.category)}
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium",
                    isSold
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {statusLabel(listing.status)}
                </span>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-4 text-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Satıcı
              </div>
              <div className="mt-1 font-semibold text-foreground">
                {listing.seller_name}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDateTr(listing.created_at)} tarihinde yayınlandı
              </div>
            </div>

            {!isOwner ? (
              <Button asChild className="w-full" disabled={isSold}>
                <Link
                  href={`/messages/listings/${listing.id}/with/${listing.seller_id}`}
                  aria-disabled={isSold}
                  className={isSold ? "pointer-events-none opacity-60" : undefined}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="ml-1.5">Satıcıya mesaj gönder</span>
                </Link>
              </Button>
            ) : null}

            {isOwner ? (
              <div className="space-y-2 rounded-md border border-dashed border-border p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Satıcı işlemleri
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleToggleStatus}
                    disabled={statusBusy || deleting}
                  >
                    {listing.status === "active" ? (
                      <PackageCheck className="h-4 w-4" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    <span className="ml-1.5">
                      {statusBusy
                        ? "Güncelleniyor..."
                        : listing.status === "active"
                          ? "Satıldı işaretle"
                          : "Tekrar yayına al"}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting || statusBusy}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-1">
                      {deleting ? "Siliniyor..." : "Sil"}
                    </span>
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          {listing.description ? (
            <section className="lg:col-span-5">
              <div className="rounded-lg border border-border bg-card p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Açıklama
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {listing.description}
                </p>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
