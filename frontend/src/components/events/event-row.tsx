import Link from "next/link";
import { Users } from "lucide-react";

import {
  categoryLabel,
  dateBlockParts,
  formatTimeRange,
} from "@/lib/events/constants";
import type { EventRead } from "@/lib/api/events";

export function EventRow({ event }: { event: EventRead }) {
  const block = dateBlockParts(event.starts_at);
  const time = formatTimeRange(event.starts_at, event.ends_at);
  return (
    <Link
      href={`/events/${event.id}`}
      className="group block rounded-lg border border-border bg-card p-4 transition-colors hover:border-[hsl(var(--events)/0.5)]"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-[72px] w-16 flex-none flex-col items-center justify-center rounded-md border border-border bg-card">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--events))]">
            {block.monthShort}
          </div>
          <div className="text-[26px] font-bold leading-none tracking-tight">
            {block.day}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[hsl(var(--events)/0.12)] px-2 py-0.5 text-xs font-medium text-[hsl(var(--events))]">
              {categoryLabel(event.category)}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {time}
              {event.location ? ` · ${event.location}` : ""}
            </span>
          </div>
          <div className="mt-1 truncate text-base font-semibold tracking-tight">
            {event.title}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{event.attendee_count} katılımcı</span>
            <span aria-hidden>·</span>
            <span className="truncate">{event.organizer_name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
