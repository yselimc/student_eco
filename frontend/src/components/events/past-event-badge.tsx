import { cn } from "@/lib/utils";

export function PastEventBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      Geçti
    </span>
  );
}
