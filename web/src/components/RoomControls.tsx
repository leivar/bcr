"use client";
import React, { useState } from "react";
import { useSocket } from "./SocketProvider";

export default function RoomControls() {
  const { socket, connected } = useSocket();
  const [roomId, setRoomId] = useState("");
  const [invite, setInvite] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  function create() {
    if (!socket) return;
    socket.emit("rooms:create", { name }, ({ roomId }) => {
      setStatus(`Created room: ${roomId}`);
    });
  }

  function joinById() {
    if (!socket || !roomId) return;
    socket.emit("rooms:join", { roomId }, ({ roomId, members }) => {
      setStatus(`Joined ${roomId}. Members: ${members.join(", ")}`);
    });
  }

  function joinByInvite() {
    if (!socket || !invite) return;
    socket.emit("rooms:join", { inviteCode: invite }, ({ roomId, members }) => {
      setStatus(`Joined ${roomId} via invite. Members: ${members.join(", ")}`);
    });
  }

  function makeInvite() {
    if (!socket || !roomId) {
      setStatus("Enter a room ID to create an invite for.");
      return;
    }
    socket.emit("rooms:invite:create", { roomId }, ({ inviteCode, expiresAt }) => {
      setStatus(`Invite: ${inviteCode} (expires ${new Date(expiresAt).toLocaleString()})`);
      setInvite(inviteCode);
    });
  }

  function leave() {
    if (!socket) return;
    socket.emit("rooms:leave", () => {
      setStatus("Left current room.");
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <section>Connection: {connected ? "✅ connected" : "❌ disconnected"}</section>

      <section className="flex md:gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Room name"
          className="border p-2"
        />
        <button onClick={create} className="border p-2 hover:bg-gray-100 hover:cursor-pointer">Create</button>
      </section>

      <section className="flex md:gap-2">
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Room ID"
          className="border p-2"
        />
        <button onClick={joinById} className="border p-2 hover:bg-gray-100 hover:cursor-pointer">Join by ID</button>
        <button onClick={makeInvite} className="border p-2 hover:bg-gray-100 hover:cursor-pointer">Create Invite</button>
      </section>

      <section className="flex md:gap-2">
        <input
          value={invite}
          onChange={(e) => setInvite(e.target.value)}
          placeholder="Invite code"
          className="border p-2"
        />
        <button onClick={joinByInvite} className="border p-2 hover:bg-gray-100 hover:cursor-pointer">Join by Invite</button>
      </section>

      <section>
        <button onClick={leave} className="border p-2 hover:bg-gray-100 hover:cursor-pointer">Leave Room</button>
      </section>

      {status && <section className="text-sm opacity-70">{status}</section>}
    </section>
  );
}
