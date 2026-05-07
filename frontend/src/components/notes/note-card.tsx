import Link from "next/link";
import { FileText } from "lucide-react";

import { formatDateTr, formatFileSize } from "@/lib/notes/constants";
import type { Note } from "@/lib/api/notes";

export function NoteCard({ note }: { note: Note }) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-[hsl(var(--notes)/0.12)] text-[hsl(var(--notes))]">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold tracking-tight text-foreground">
              {note.title}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="rounded-md bg-[hsl(var(--notes)/0.12)] px-2 py-0.5 font-mono text-xs font-semibold text-[hsl(var(--notes))]">
                {note.course_code}
              </span>
              <span aria-hidden className="text-muted-foreground/60">·</span>
              <span>{note.semester}</span>
              <span aria-hidden className="text-muted-foreground/60">·</span>
              <span>{note.author_name}</span>
            </div>
          </div>
        </div>
        <span className="flex-none whitespace-nowrap font-mono text-xs text-muted-foreground">
          {formatFileSize(note.file_size_bytes)}
        </span>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{formatDateTr(note.created_at)}</div>
    </Link>
  );
}
