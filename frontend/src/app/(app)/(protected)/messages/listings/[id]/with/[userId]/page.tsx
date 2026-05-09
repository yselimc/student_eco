"use client";

import { useParams } from "next/navigation";

import { ThreadView } from "@/components/messages/thread-view";

export default function ListingThreadPage() {
  const params = useParams<{ id: string; userId: string }>();
  const id = params?.id;
  const userId = params?.userId;
  if (!id || !userId) return null;
  return <ThreadView listingId={id} otherUserId={userId} />;
}
