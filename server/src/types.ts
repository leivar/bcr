export type UserID = string;
export type RoomID = string;

export interface ServerToClientEvents {
  "rooms:joined": (payload: { roomId: RoomID; members: UserID[] }) => void;
  "rooms:left": (payload: { roomId: RoomID | null }) => void;
  "rooms:invited": (payload: { roomId: RoomID; inviteCode: string; expiresAt: number }) => void;
  "message": (payload: { from: UserID; roomId: RoomID; text: string; sentAt: number }) => void;
  "error": (payload: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  "rooms:create": (payload: { name?: string }, cb: (res: { roomId: RoomID }) => void) => void;
  "rooms:invite:create": (payload: { roomId: RoomID; ttlSeconds?: number }, cb: (res: { inviteCode: string; expiresAt: number }) => void) => void;
  "rooms:join": (payload: { roomId?: RoomID; inviteCode?: string }, cb: (res: { roomId: RoomID; members: UserID[] }) => void) => void;
  "rooms:leave": (cb: (res: { ok: true }) => void) => void;
  "message": (payload: { text: string }, cb?: (res: { ok: true }) => void) => void;
}

export interface InterServerEvents {}
export interface SocketData {
  userId: UserID;
  currentRoomId?: RoomID;
}