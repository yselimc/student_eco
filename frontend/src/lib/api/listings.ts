import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

export type ListingImage = {
  id: string;
  display_order: number;
};

export type ListingStatus = "active" | "sold";

export type Listing = {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_avatar_url: string | null;
  title: string;
  description: string | null;
  price: number;
  category: string;
  status: ListingStatus;
  images: ListingImage[];
  created_at: string;
  updated_at: string;
};

export type ListingListResponse = {
  items: Listing[];
  total: number;
};

export type ListingFilters = {
  category?: string;
  status?: ListingStatus;
  q?: string;
  limit?: number;
  offset?: number;
};

function buildQuery(f: ListingFilters): string {
  const params = new URLSearchParams();
  if (f.category) params.set("category", f.category);
  if (f.status) params.set("status", f.status);
  if (f.q) params.set("q", f.q);
  if (f.limit !== undefined) params.set("limit", String(f.limit));
  if (f.offset !== undefined) params.set("offset", String(f.offset));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listListings(filters: ListingFilters = {}): Promise<ListingListResponse> {
  return apiFetch<ListingListResponse>(`/listings${buildQuery(filters)}`, {
    method: "GET",
    token: getToken(),
  });
}

export async function getListing(id: string): Promise<Listing> {
  return apiFetch<Listing>(`/listings/${id}`, {
    method: "GET",
    token: getToken(),
  });
}

export async function createListing(form: FormData): Promise<Listing> {
  return apiFetch<Listing>("/listings", {
    method: "POST",
    body: form,
    token: getToken(),
  });
}

export async function deleteListing(id: string): Promise<void> {
  await apiFetch<null>(`/listings/${id}`, {
    method: "DELETE",
    token: getToken(),
  });
}

export async function updateListingStatus(
  id: string,
  status: ListingStatus,
): Promise<Listing> {
  return apiFetch<Listing>(`/listings/${id}/status`, {
    method: "PATCH",
    body: { status },
    token: getToken(),
  });
}

export const listingImagePath = (listingId: string, imageId: string) =>
  `/listings/${listingId}/images/${imageId}`;
