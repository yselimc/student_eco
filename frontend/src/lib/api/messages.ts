import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

export type Message = {
  id: string;
  listing_id: string | null;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type ConversationItem = {
  listing_id: string | null;
  listing_title: string | null;
  listing_status: string | null;
  other_user_id: string;
  other_user_name: string;
  last_message_body: string;
  last_message_at: string;
  unread_count: number;
};

export type ConversationListResponse = {
  items: ConversationItem[];
};

export type MessageThreadResponse = {
  items: Message[];
};

export async function sendMessage(payload: {
  listing_id: string;
  recipient_id: string;
  body: string;
}): Promise<Message> {
  return apiFetch<Message>("/messages", {
    method: "POST",
    body: payload,
    token: getToken(),
  });
}

export async function listConversations(): Promise<ConversationListResponse> {
  return apiFetch<ConversationListResponse>("/messages/conversations", {
    method: "GET",
    token: getToken(),
  });
}

export async function getListingThread(
  listingId: string,
  otherUserId: string,
): Promise<MessageThreadResponse> {
  return apiFetch<MessageThreadResponse>(
    `/messages/listings/${listingId}/with/${otherUserId}`,
    { method: "GET", token: getToken() },
  );
}

export async function getOrphanThread(
  otherUserId: string,
): Promise<MessageThreadResponse> {
  return apiFetch<MessageThreadResponse>(
    `/messages/orphans/with/${otherUserId}`,
    { method: "GET", token: getToken() },
  );
}
