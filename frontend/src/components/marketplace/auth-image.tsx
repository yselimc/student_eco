"use client";

import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

import { apiFetchBlob } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

type AuthImageProps = {
  path: string;
  alt: string;
  className?: string;
  containerClassName?: string;
};

export function AuthImage({ path, alt, className, containerClassName }: AuthImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;
    setLoading(true);
    setError(false);
    setUrl(null);
    apiFetchBlob(path, getToken())
      .then((blob) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setUrl(createdUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [path]);

  if (loading) {
    return (
      <div
        className={cn("animate-pulse bg-muted", containerClassName)}
        aria-busy
        aria-label={alt}
      />
    );
  }
  if (error || !url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          containerClassName,
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
