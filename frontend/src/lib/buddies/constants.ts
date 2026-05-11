import type { StudyStyle, Weekday } from "@/lib/api/buddies";

export const STUDY_STYLE_OPTIONS: ReadonlyArray<{
  key: StudyStyle;
  label: string;
}> = [
  { key: "quiet", label: "Sessiz çalışma" },
  { key: "group", label: "Grup çalışması" },
  { key: "cafe", label: "Kafede" },
] as const;

const STUDY_STYLE_LABELS: Record<StudyStyle, string> = {
  quiet: "Sessiz çalışma",
  group: "Grup çalışması",
  cafe: "Kafede",
};

export function studyStyleLabel(key: StudyStyle): string {
  return STUDY_STYLE_LABELS[key];
}

export const WEEKDAY_OPTIONS: ReadonlyArray<{
  key: Weekday;
  label: string;
  short: string;
}> = [
  { key: "monday", label: "Pazartesi", short: "Pzt" },
  { key: "tuesday", label: "Salı", short: "Sal" },
  { key: "wednesday", label: "Çarşamba", short: "Çar" },
  { key: "thursday", label: "Perşembe", short: "Per" },
  { key: "friday", label: "Cuma", short: "Cum" },
  { key: "saturday", label: "Cumartesi", short: "Cmt" },
  { key: "sunday", label: "Pazar", short: "Paz" },
] as const;

const WEEKDAY_LABELS: Record<Weekday, string> = Object.fromEntries(
  WEEKDAY_OPTIONS.map((d) => [d.key, d.label]),
) as Record<Weekday, string>;

const WEEKDAY_SHORT: Record<Weekday, string> = Object.fromEntries(
  WEEKDAY_OPTIONS.map((d) => [d.key, d.short]),
) as Record<Weekday, string>;

export function weekdayLabel(key: Weekday): string {
  return WEEKDAY_LABELS[key];
}

export function weekdayShort(key: Weekday): string {
  return WEEKDAY_SHORT[key];
}

const WEEKDAY_KEYS: ReadonlySet<string> = new Set(
  WEEKDAY_OPTIONS.map((d) => d.key),
);

export function isWeekday(value: string): value is Weekday {
  return WEEKDAY_KEYS.has(value);
}

const STUDY_STYLE_KEYS: ReadonlySet<string> = new Set(
  STUDY_STYLE_OPTIONS.map((s) => s.key),
);

export function isStudyStyle(value: string): value is StudyStyle {
  return STUDY_STYLE_KEYS.has(value);
}

export function formatTelefon(digits: string): string {
  if (digits.length === 12 && digits.startsWith("90")) {
    const rest = digits.slice(2);
    return `+90 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 8)} ${rest.slice(8, 10)}`;
  }
  if (digits.length === 10) {
    return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  return digits;
}
