"use server";

import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { auth } from "@/auth";

export async function getParticipantToken(
  roomName: string,
  participantName: string
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    throw new Error("Server misconfigured");
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: session.user.id,
    name: participantName,
    ttl: '1h',
  });

  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

  return at.toJwt();
}

export async function checkLiveKitConnection() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return { success: false, error: "Server misconfigured: Missing keys" };
  }

  const httpUrl = wsUrl.replace('wss://', 'https://');

  try {
    const svc = new RoomServiceClient(httpUrl, apiKey, apiSecret);
    await svc.listRooms();
    return { success: true, message: "Server API Connected", timestamp: Date.now() };
  } catch (e: any) {
    console.error("LiveKit Server Check Failed:", e);
    return { success: false, error: e.message || "Unknown Error", timestamp: Date.now() };
  }
}
