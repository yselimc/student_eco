export const LISTING_CATEGORY_OPTIONS = [
  { key: "book", label: "Kitap" },
  { key: "electronics", label: "Elektronik" },
  { key: "clothing", label: "Kıyafet" },
  { key: "furniture", label: "Mobilya" },
  { key: "other", label: "Diğer" },
] as const;

export type ListingCategoryKey = (typeof LISTING_CATEGORY_OPTIONS)[number]["key"];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  LISTING_CATEGORY_OPTIONS.map((c) => [c.key, c.label]),
);

export function categoryLabel(key: string | null | undefined): string {
  if (!key) return "—";
  return CATEGORY_LABEL[key] ?? key;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  sold: "Satıldı",
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

export const MAX_IMAGES_PER_LISTING = 3;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function formatPriceTl(price: number): string {
  return `${price.toLocaleString("tr-TR")} ₺`;
}
