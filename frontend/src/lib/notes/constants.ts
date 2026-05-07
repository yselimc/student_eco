export const NOTE_COURSE_OPTIONS = [
  "CS301",
  "CS210",
  "MATH210",
  "MATH102",
  "EE204",
] as const;

export const NOTE_SEMESTER_OPTIONS = [
  "Güz 2025",
  "Bahar 2025",
  "Güz 2024",
  "Bahar 2024",
] as const;

export type NoteCourseOption = (typeof NOTE_COURSE_OPTIONS)[number];
export type NoteSemesterOption = (typeof NOTE_SEMESTER_OPTIONS)[number];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TURKISH_MONTHS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
] as const;

export function formatDateTr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${TURKISH_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
