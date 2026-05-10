export const EVENT_CATEGORY_OPTIONS = [
  { key: "academic", label: "Akademik" },
  { key: "social", label: "Sosyal" },
  { key: "sports", label: "Spor" },
  { key: "culture", label: "Kültür" },
  { key: "other", label: "Diğer" },
] as const;

export type EventCategoryKey = (typeof EVENT_CATEGORY_OPTIONS)[number]["key"];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  EVENT_CATEGORY_OPTIONS.map((c) => [c.key, c.label]),
);

export function categoryLabel(key: string | null | undefined): string {
  if (!key) return "—";
  return CATEGORY_LABEL[key] ?? key;
}

export const TIME_RANGE_OPTIONS = [
  { key: "all", label: "Tümü" },
  { key: "week", label: "Bu hafta" },
  { key: "month", label: "Bu ay" },
] as const;

export type TimeRangeKey = (typeof TIME_RANGE_OPTIONS)[number]["key"];

export function rangeBounds(
  key: TimeRangeKey,
  now: Date = new Date(),
): { from?: string; to?: string } {
  if (key === "all") return {};
  const days = key === "week" ? 7 : 30;
  const to = new Date(now);
  to.setDate(to.getDate() + days);
  return { from: now.toISOString(), to: to.toISOString() };
}

const TZ = "Asia/Istanbul";
const MONTHS_SHORT_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const MONTHS_LONG_TR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function partsInTz(iso: string): { day: number; month: number; year: number; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return {
    day: Number(parts.day),
    month: Number(parts.month),
    year: Number(parts.year),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function dateBlockParts(iso: string): { day: number; monthShort: string } {
  const p = partsInTz(iso);
  return { day: p.day, monthShort: MONTHS_SHORT_TR[p.month - 1] };
}

export function formatLongDate(iso: string): string {
  const p = partsInTz(iso);
  return `${p.day} ${MONTHS_LONG_TR[p.month - 1]} ${p.year}`;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatTimeRange(startIso: string, endIso: string | null): string {
  const s = partsInTz(startIso);
  const startStr = `${pad2(s.hour)}:${pad2(s.minute)}`;
  if (!endIso) return startStr;
  const e = partsInTz(endIso);
  return `${startStr} – ${pad2(e.hour)}:${pad2(e.minute)}`;
}

export function isPastEvent(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getTime() < now.getTime();
}

const TURKEY_OFFSET_HOURS = 3;

export function turkeyLocalToUtcIso(local: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(local);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  const ms = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h) - TURKEY_OFFSET_HOURS,
    Number(mi),
    s ? Number(s) : 0,
  );
  return new Date(ms).toISOString();
}
