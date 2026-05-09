"use client";

import { useParams } from "next/navigation";

import { ThreadView } from "@/components/messages/thread-view";

export default function OrphanThreadPage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;
  if (!userId) return null;
  return <ThreadView listingId={null} otherUserId={userId} />;
}
