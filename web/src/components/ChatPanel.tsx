"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "./SocketProvider";

type Msg = { from: string; roomId: string; text: string; sentAt: number };

export default function ChatPanel() {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLOptionElement | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onMsg = (p: Msg) => setMessages((m) => [...m, p]);
    const onJoined = (p: { roomId: string; members: string[] }) => {
      setCurrentRoom(p.roomId);
      setMessages((m) => [
        ...m,
        { from: "system", roomId: p.roomId, text: `Joined room (${p.members.length} member${p.members.length === 1 ? "" : "s"})`, sentAt: Date.now() }
      ]);
    };
    const onLeft = (p: { roomId: string | null }) => {
      setCurrentRoom(null);
      setMessages((m) => [...m, { from: "system", roomId: p.roomId ?? "unknown", text: "Left room", sentAt: Date.now() }]);
    };
    const onError = (e: { code: string; message: string }) => {
      setMessages((m) => [...m, { from: "system", roomId: currentRoom ?? "n/a", text: `Error: ${e.message}`, sentAt: Date.now() }]);
    };

    socket.on("message", onMsg);
    socket.on("rooms:joined", onJoined);
    socket.on("rooms:left", onLeft);
    socket.on("error", onError);

    return () => {
      socket.off("message", onMsg);
      socket.off("rooms:joined", onJoined);
      socket.off("rooms:left", onLeft);
      socket.off("error", onError);
    };
  }, [socket, currentRoom]);

  useEffect(() => {
    // autoscroll to bottom of chat panel when new message
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages]);

  function send() {
    const t = text.trim();
    if (!t || !socket) return;
    socket.emit("message", { text: t }, () => {});
    setText("");
  }

  return (
    <section className="flex flex-col gap-2">
      <section className="text-sm opacity-70">Room: {currentRoom ?? "— not in a room —"}</section>

      <section ref={scrollerRef} className="border h-120 overflow-auto p-2 rounded">
        {messages.map((m, idx) => (
          <section key={idx} className="text-sm">
            <span className="opacity-60">[{new Date(m.sentAt).toLocaleTimeString()}]</span>{" "}
            <b>{m.from}</b>: {m.text}
          </section>
        ))}
        {messages.length === 0 && <section className="opacity-60 text-sm">No messages yet.</section>}
      </section>

      <section className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something"
          className="border flex-1 p-2 rounded"
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button onClick={send} className="border flex-2 p-2 rounded hover:bg-gray-100 hover:cursor-pointer">Send</button>
      </section>
    </section>
  );
};