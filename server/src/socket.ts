import { Server } from "socket.io";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "./types";
import { socketAuthMiddleware } from "./auth";
import { createRoom, joinRoom, leaveCurrentRoom, getRoomMembers } from "./db/queries/rooms";
import { createInvite, resolveInviteAndConsume } from "./db/queries/invites";
import { createMessage } from "./db/queries/messages";

export function attachSocket(server: any) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
    cors: { origin: true, credentials: true },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const userId = socket.data.userId!;

    socket.on("rooms:create", async ({ name }, cb) => {
      try {
        const room = await createRoom(userId, name);
        socket.join(room.id);
        socket.data.currentRoomId = room.id;
        cb({ roomId: room.id });
        const members = await getRoomMembers(room.id);
        socket.emit("rooms:joined", { roomId: room.id, members });
      } catch (e: any) {
        socket.emit("error", { code: "CREATE_ROOM_FAILED", message: e.message });
      }
    });

    socket.on("rooms:invite:create", async ({ roomId, ttlSeconds = 3600 }, cb) => {
      try {
        const inv = await createInvite(roomId, userId, ttlSeconds);
        cb({ inviteCode: inv.code, expiresAt: inv.expiresAt.getTime() });
        socket.emit("rooms:invited", { roomId, inviteCode: inv.code, expiresAt: inv.expiresAt.getTime() });
      } catch (e: any) {
        socket.emit("error", { code: "INVITE_FAILED", message: e.message });
      }
    });

    socket.on("rooms:join", async ({ roomId, inviteCode }, cb) => {
      try {
        let target = roomId;
        if (!target && inviteCode) {
          target = await resolveInviteAndConsume(inviteCode, userId);
        }
        if (!target) throw new Error("roomId or inviteCode is required");

        const prev = socket.data.currentRoomId;
        if (prev && prev !== target) socket.leave(prev);

        const members = await joinRoom(userId, target);
        socket.join(target);
        socket.data.currentRoomId = target;

        cb({ roomId: target, members });
        io.to(target).emit("rooms:joined", { roomId: target, members });
        if (prev && prev !== target) io.to(prev).emit("rooms:left", { roomId: prev });
      } catch (e: any) {
        socket.emit("error", { code: "JOIN_FAILED", message: e.message });
      }
    });

    socket.on("rooms:leave", async (cb) => {
      const current = socket.data.currentRoomId;
      if (current) {
        await leaveCurrentRoom(userId);
        socket.leave(current);
        socket.data.currentRoomId = undefined;
        io.to(current).emit("rooms:left", { roomId: current });
      }
      cb({ ok: true });
    });

    socket.on("message", async ({ text }, cb) => {
      try {
        const msg = await createMessage(userId, text);
        const payload = { from: userId, roomId: msg.roomId, text: msg.text, sentAt: msg.sentAt.getTime() };
        io.to(msg.roomId).emit("message", payload);
        cb?.({ ok: true });
      } catch (e: any) {
        socket.emit("error", { code: "NOT_IN_ROOM", message: e.message });
      }
    });

    socket.on("disconnect", async () => {
      const current = socket.data.currentRoomId;
      if (current) {
        await leaveCurrentRoom(userId);
        io.to(current).emit("rooms:left", { roomId: current });
      }
    });
  });

  return io;
};