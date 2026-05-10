"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { tr } from "date-fns/locale";

import type { EventRead } from "@/lib/api/events";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { tr },
});

const messages = {
  today: "Bugün",
  previous: "Önceki",
  next: "Sonraki",
  month: "Ay",
  week: "Hafta",
  day: "Gün",
  agenda: "Ajanda",
  date: "Tarih",
  time: "Saat",
  event: "Etkinlik",
  noEventsInRange: "Bu aralıkta etkinlik yok.",
  showMore: (total: number) => `+${total} daha`,
};

const formats = {
  dayFormat: (date: Date) => format(date, "EEE", { locale: tr }),
  weekdayFormat: (date: Date) => format(date, "EEEE", { locale: tr }),
  monthHeaderFormat: (date: Date) => format(date, "LLLL yyyy", { locale: tr }),
  dayHeaderFormat: (date: Date) => format(date, "d LLLL yyyy", { locale: tr }),
};

const VIEWS: View[] = ["month"];

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
};

export function EventCalendar({ events }: { events: EventRead[] }) {
  const router = useRouter();

  const calendarEvents = useMemo<CalendarEvent[]>(
    () =>
      events.map((e) => {
        const start = new Date(e.starts_at);
        const end = e.ends_at ? new Date(e.ends_at) : new Date(start.getTime() + 60 * 60 * 1000);
        return { id: e.id, title: e.title, start, end };
      }),
    [events],
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="h-[640px]">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          views={VIEWS}
          defaultView="month"
          messages={messages}
          formats={formats}
          culture="tr"
          popup
          onSelectEvent={(ev) => router.push(`/events/${ev.id}`)}
          eventPropGetter={() => ({
            style: {
              backgroundColor: "hsl(var(--events))",
              borderColor: "hsl(var(--events))",
              color: "white",
            },
          })}
        />
      </div>
    </div>
  );
}
