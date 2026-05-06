"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { register } from "@/lib/auth";

// TODO(api): backend currently does not store university or department on the
// user. Extend RegisterRequest schema + User model + create_users migration to
// persist these fields and stop discarding them on the client.
const UNIVERSITIES = [
  "Boğaziçi Üniversitesi",
  "Orta Doğu Teknik Üniversitesi",
  "İstanbul Teknik Üniversitesi",
  "Bilkent Üniversitesi",
  "Hacettepe Üniversitesi",
  "Koç Üniversitesi",
  "Sabancı Üniversitesi",
  "Ankara Üniversitesi",
];

const DEPARTMENTS = [
  "Bilgisayar Mühendisliği",
  "Yazılım Mühendisliği",
  "Bilgisayar Bilimleri",
  "Bilişim Sistemleri Mühendisliği",
  "Yapay Zeka Mühendisliği",
  "Veri Bilimi",
  "Elektrik-Elektronik Mühendisliği",
  "Endüstri Mühendisliği",
];

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        email,
        password,
        display_name: displayName,
      });
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Beklenmeyen bir hata oluştu. Tekrar dene.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const selectClasses =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Card>
      <CardHeader className="space-y-2 text-center">
        <CardTitle>Kaydol</CardTitle>
        <CardDescription>Birkaç saniyede hesabını oluştur ve başla.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Ad</Label>
            <Input
              id="display_name"
              name="display_name"
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ayşe Yılmaz"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@ogrenci.edu.tr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">En az 8 karakter.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="university">Üniversite</Label>
            <select
              id="university"
              name="university"
              required
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className={selectClasses}
            >
              <option value="" disabled>
                Üniversiteni seç
              </option>
              {UNIVERSITIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Bölüm</Label>
            <select
              id="department"
              name="department"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={selectClasses}
            >
              <option value="" disabled>
                Bölümünü seç
              </option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Hesap oluşturuluyor..." : "Hesap oluştur"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Giriş yap
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
