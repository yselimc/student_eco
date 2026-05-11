"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getStoredUser, logout, type AuthUser } from "@/lib/auth";

type NavLink = { href: string; label: string };

const NAV_LINKS: ReadonlyArray<NavLink> = [
  { href: "/notes", label: "Notlar" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/events", label: "Etkinlikler" },
  { href: "/buddies", label: "Buddy" },
  { href: "/messages", label: "Mesajlar" },
] as const;

function isActiveLink(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const THEME_KEY = "student_eco.theme";
type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(THEME_KEY, theme);
}

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setTheme(readInitialTheme());
    setHydrated(true);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  function handleLogout() {
    logout();
    setUser(null);
    setMobileOpen(false);
    toast.success("Çıkış yapıldı");
    router.push("/");
  }

  const showNavLinks = hydrated && user !== null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            className="flex flex-none items-center gap-2 text-base font-semibold tracking-tight"
            onClick={() => setMobileOpen(false)}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" aria-hidden />
            Student Eco
          </Link>

          {showNavLinks ? (
            <nav
              aria-label="Ana gezinme"
              className="hidden items-center gap-1 md:flex"
            >
              {NAV_LINKS.map((link) => {
                const active = isActiveLink(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeButton theme={theme} hydrated={hydrated} onToggle={toggleTheme} />

          {hydrated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full ring-offset-background transition-shadow hover:ring-2 hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Hesap menüsü"
                >
                  <Avatar src={user.avatar_url} name={user.display_name || user.email} size="md" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="normal-case tracking-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {user.display_name || "Öğrenci"}
                    </span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile/me">Profilim</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                  Çıkış yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div
              className={cn(
                "flex items-center gap-2 transition-opacity",
                hydrated ? "opacity-100" : "opacity-0",
              )}
            >
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Giriş yap</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Kaydol</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeButton theme={theme} hydrated={hydrated} onToggle={toggleTheme} />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6">
            {hydrated && user ? (
              <>
                <div className="flex items-center gap-3 rounded-md bg-primary-soft px-3 py-2">
                  <Avatar src={user.avatar_url} name={user.display_name || user.email} size="md" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {user.display_name || "Öğrenci"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
                <nav aria-label="Ana gezinme" className="flex flex-col gap-1">
                  {NAV_LINKS.map((link) => {
                    const active = isActiveLink(pathname, link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-accent font-medium text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
                <Button asChild variant="outline" onClick={() => setMobileOpen(false)}>
                  <Link href="/profile/me">Profilim</Link>
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Çıkış yap
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" onClick={() => setMobileOpen(false)}>
                  <Link href="/login">Giriş yap</Link>
                </Button>
                <Button asChild onClick={() => setMobileOpen(false)}>
                  <Link href="/register">Kaydol</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function ThemeButton({
  theme,
  hydrated,
  onToggle,
}: {
  theme: Theme;
  hydrated: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {hydrated && theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
