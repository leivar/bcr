"use client";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "@/src/lib/auth";

export type ServerToClient = {
  "rooms:joined": (payload: { roomId: string; members: string[] }) => void;
  "rooms:left": (payload: { roomId: string | null }) => void;
  "rooms:invited": (payload: { roomId: string; inviteCode: string; expiresAt: number }) => void;
  "message": (payload: { from: string; roomId: string; text: string; sentAt: number }) => void;
  "error": (payload: { code: string; message: string }) => void;
};

export type ClientToServer = {
  "rooms:create": (payload: { name?: string }, cb: (res: { roomId: string }) => void) => void;
  "rooms:invite:create": (payload: { roomId: string; ttlSeconds?: number }, cb: (res: { inviteCode: string; expiresAt: number }) => void) => void;
  "rooms:join": (payload: { roomId?: string; inviteCode?: string }, cb: (res: { roomId: string; members: string[] }) => void) => void;
  "rooms:leave": (cb: (res: { ok: true }) => void) => void;
  "message": (payload: { text: string }, cb?: (res: { ok: true }) => void) => void;
};

interface SocketCtx {
  socket: Socket<ServerToClient, ClientToServer> | null;
  connected: boolean;
}

const Ctx = createContext<SocketCtx>({ socket: null, connected: false });
export const useSocket = () => useContext(Ctx);

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket<ServerToClient, ClientToServer> | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    const sock: Socket<ServerToClient, ClientToServer> = io(url, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = sock;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    sock.on("connect", onConnect);
    sock.on("disconnect", onDisconnect);

    return () => {
      sock.off("connect", onConnect);
      sock.off("disconnect", onDisconnect);
      sock.close();
    };
  }, []);

  const value = useMemo(() => ({ socket: socketRef.current, connected }), [connected]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};