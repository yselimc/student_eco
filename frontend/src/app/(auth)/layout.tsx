import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 100% 0%, hsl(var(--primary) / 0.08), transparent 60%), radial-gradient(50% 50% at 0% 100%, hsl(var(--primary) / 0.06), transparent 60%)",
        }}
      />
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
