"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { createListing } from "@/lib/api/listings";
import {
  LISTING_CATEGORY_OPTIONS,
  MAX_IMAGES_PER_LISTING,
  MAX_IMAGE_BYTES,
  formatPriceTl,
} from "@/lib/marketplace/constants";
import { cn } from "@/lib/utils";

const ALLOWED_MIME = ["image/jpeg", "image/png"];
const ALLOWED_EXT = [".jpg", ".jpeg", ".png"];

type FilePreview = {
  file: File;
  url: string;
};

export default function NewListingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState<string>(LISTING_CATEGORY_OPTIONS[0].key);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const previewsRef = useRef<FilePreview[]>([]);
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  function validateFile(file: File): string | null {
    const lower = file.name.toLowerCase();
    const matchesExt = ALLOWED_EXT.some((e) => lower.endsWith(e));
    if (!ALLOWED_MIME.includes(file.type) && !matchesExt) {
      return "Sadece JPG ve PNG yükleyebilirsin.";
    }
    if (file.size > MAX_IMAGE_BYTES) return "Görsel 5 MB sınırını aşıyor.";
    if (file.size === 0) return "Görsel boş.";
    return null;
  }

  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming);
    setFileError(null);
    setPreviews((current) => {
      const next = [...current];
      let firstError: string | null = null;
      for (const f of arr) {
        if (next.length >= MAX_IMAGES_PER_LISTING) {
          firstError = `En fazla ${MAX_IMAGES_PER_LISTING} görsel ekleyebilirsin.`;
          break;
        }
        const err = validateFile(f);
        if (err) {
          firstError ??= err;
          continue;
        }
        next.push({ file: f, url: URL.createObjectURL(f) });
      }
      if (firstError) setFileError(firstError);
      return next;
    });
  }

  function removePreview(index: number) {
    setPreviews((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((_, i) => i !== index);
    });
    setFileError(null);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    if (previews.length === 0) {
      setFileError("En az bir görsel ekle.");
      return;
    }
    if (!price.trim()) {
      setSubmitError("Fiyat zorunludur.");
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || !Number.isInteger(priceNum) || priceNum < 0) {
      setSubmitError("Fiyat sıfırdan büyük tam sayı olmalı.");
      return;
    }
    setSubmitting(true);
    const form = new FormData();
    form.set("title", title.trim());
    form.set("price", String(priceNum));
    form.set("category", category);
    if (description.trim()) form.set("description", description.trim());
    for (const p of previews) {
      form.append("files", p.file, p.file.name);
    }
    try {
      const listing = await createListing(form);
      toast.success("İlan yayınlandı");
      router.push(`/marketplace/${listing.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Yayınlama başarısız. Tekrar dene.");
      }
      setSubmitting(false);
    }
  }

  const priceNum = Number(price);
  const pricePreview =
    price.trim() && Number.isFinite(priceNum) && priceNum >= 0
      ? formatPriceTl(Math.floor(priceNum))
      : null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/marketplace">
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">Pazaryerine dön</span>
        </Link>
      </Button>

      <h1 className="text-3xl font-bold tracking-tight">Yeni ilan</h1>
      <p className="mt-1 text-muted-foreground">
        Görselleri ekle, ilanı yayına al.
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
              placeholder="CLRS — Algoritmalar (3. baskı)"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Fiyat (TL)</Label>
              <Input
                id="price"
                type="number"
                inputMode="numeric"
                step={1}
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="350"
              />
              {pricePreview ? (
                <p className="text-xs text-muted-foreground">
                  Görüntülenecek: <span className="font-mono">{pricePreview}</span>
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <select
                id="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {LISTING_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <textarea
              id="description"
              maxLength={2000}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Durumunu, kullanım süresini, takas seçeneklerini yaz."
              className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Görseller (en fazla {MAX_IMAGES_PER_LISTING})</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed bg-muted/40 px-6 py-8 text-center transition-colors hover:bg-muted/60",
                dragActive ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm font-medium text-foreground">
                Görselleri buraya bırak
              </div>
              <div className="text-xs text-muted-foreground">
                veya{" "}
                <span className="font-medium text-primary">dosya seç</span> · JPG/PNG · her biri en fazla 5 MB
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
            </div>

            {previews.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {previews.map((p, index) => (
                  <div
                    key={p.url}
                    className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={p.file.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePreview(index);
                      }}
                      className="absolute right-1 top-1 rounded-full bg-foreground/80 p-1 text-background opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                      aria-label="Görseli kaldır"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {index === 0 ? (
                      <div className="absolute bottom-1 left-1 rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] font-semibold text-background">
                        Kapak
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {fileError ? (
              <p role="alert" className="text-sm text-destructive">
                {fileError}
              </p>
            ) : null}
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
              onClick={() => router.push("/marketplace")}
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
