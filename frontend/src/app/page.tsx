"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getStoredUser, type AuthUser } from "@/lib/auth";

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setHydrated(true);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Student Ecosystem</h1>
      <p className="text-muted-foreground max-w-md text-center">
        Not, pazaryeri, etkinlik, arkadaş. Hepsi tek yerde.
      </p>
      {hydrated && user ? (
        <Button asChild>
          <Link href="/">Panele git</Link>
        </Button>
      ) : (
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/register">Hemen başla</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Giriş yap</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
