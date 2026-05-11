import Link from "next/link";

import type { BuddyProfileRead } from "@/lib/api/buddies";
import { studyStyleLabel, weekdayShort } from "@/lib/buddies/constants";

const MAX_COURSES = 4;
const MAX_DAYS = 7;

export function BuddyCard({ buddy }: { buddy: BuddyProfileRead }) {
  const courses = buddy.courses.slice(0, MAX_COURSES);
  const extraCourses = buddy.courses.length - courses.length;
  const days = buddy.available_days.slice(0, MAX_DAYS);
  return (
    <Link
      href={`/buddies/${buddy.user_id}`}
      className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-[hsl(var(--buddy)/0.5)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight">
            {buddy.display_name}
          </h3>
        </div>
        <span className="flex-none rounded-md bg-[hsl(var(--buddy)/0.12)] px-2 py-0.5 text-xs font-medium text-[hsl(var(--buddy))]">
          {studyStyleLabel(buddy.study_style)}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {buddy.looking_for}
      </p>

      {courses.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {courses.map((c) => (
            <span
              key={c}
              className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs"
            >
              {c}
            </span>
          ))}
          {extraCourses > 0 ? (
            <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
              +{extraCourses}
            </span>
          ) : null}
        </div>
      ) : null}

      {days.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {days.map((d) => (
            <span
              key={d}
              className="rounded bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {weekdayShort(d)}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
