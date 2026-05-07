"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getStoredUser } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      const target = window.location.pathname + window.location.search;
      const next = encodeURIComponent(target);
      router.replace(`/login?next=${next}`);
      setAuthed(false);
      return;
    }
    setAuthed(true);
  }, [router]);

  if (authed !== true) return null;
  return <>{children}</>;
}
