"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { uploadNote } from "@/lib/api/notes";
import { NOTE_SEMESTER_OPTIONS, formatFileSize } from "@/lib/notes/constants";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

export default function NewNotePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [semester, setSemester] = useState<string>(NOTE_SEMESTER_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  function validateFile(f: File): string | null {
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      return "Sadece PDF yükleyebilirsin.";
    }
    if (f.size > MAX_BYTES) {
      return "Dosya 10 MB sınırını aşıyor.";
    }
    if (f.size === 0) {
      return "Dosya boş.";
    }
    return null;
  }

  function pickFile(f: File | null) {
    setFileError(null);
    if (!f) {
      setFile(null);
      return;
    }
    const err = validateFile(f);
    if (err) {
      setFileError(err);
      setFile(null);
      return;
    }
    setFile(f);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0] ?? null;
    pickFile(dropped);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    if (!file) {
      setFileError("PDF dosyası seç.");
      return;
    }
    setSubmitting(true);
    const form = new FormData();
    form.set("title", title.trim());
    form.set("course_code", courseCode.trim());
    form.set("semester", semester);
    if (description.trim()) form.set("description", description.trim());
    form.set("file", file, file.name);

    try {
      const note = await uploadNote(form);
      toast.success("Not yüklendi");
      router.push(`/notes/${note.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Yükleme başarısız. Tekrar dene.");
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/notes">
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">Notlara dön</span>
        </Link>
      </Button>

      <h1 className="text-3xl font-bold tracking-tight">Yeni not</h1>
      <p className="mt-1 text-muted-foreground">PDF dosyanı yükle, sınıfla paylaş.</p>

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
              placeholder="Algoritmalar — vize özeti"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="course_code">Kurs kodu</Label>
              <Input
                id="course_code"
                required
                maxLength={50}
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                placeholder="CS301"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Dönem</Label>
              <select
                id="semester"
                required
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {NOTE_SEMESTER_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notlarının kısa bir özetini yaz."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Dosya</Label>
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
              <Upload className="h-6 w-6 text-muted-foreground" />
              {file ? (
                <>
                  <div className="text-sm font-medium text-foreground">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} · değiştirmek için tıkla
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium text-foreground">
                    PDF dosyanı buraya bırak
                  </div>
                  <div className="text-xs text-muted-foreground">
                    veya{" "}
                    <span className="font-medium text-primary">dosya seç</span> · en fazla 10 MB
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </div>
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
              onClick={() => router.push("/notes")}
              disabled={submitting}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={submitting}>
              <Upload className="h-4 w-4" />
              <span className="ml-1.5">{submitting ? "Yükleniyor..." : "Yükle"}</span>
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
