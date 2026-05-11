import { API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-lg",
  xl: "h-20 w-20 text-2xl",
};

function initialOf(name: string | null | undefined): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src: string | null | undefined;
  name: string | null | undefined;
  size?: AvatarSize;
  className?: string;
}) {
  const sizeClasses = SIZE_CLASS[size];
  if (src) {
    const url = src.startsWith("http") ? src : `${API_BASE_URL}${src}`;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? "Avatar"}
        className={cn(
          "flex-none rounded-full object-cover",
          sizeClasses,
          className,
        )}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        "flex flex-none items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-strong",
        sizeClasses,
        className,
      )}
    >
      {initialOf(name)}
    </div>
  );
}
