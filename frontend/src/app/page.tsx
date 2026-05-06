import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Student Ecosystem</h1>
      <p className="text-muted-foreground max-w-md text-center">
        Notes, marketplace, events, and study buddy — all in one place.
      </p>
      <Button>Get started</Button>
    </main>
  );
}
