"use client";
import RoomControls from "@/src/components/RoomControls";
import ChatPanel from "@/src/components/ChatPanel";

export default function ChatPage() {
  return (
    <main className="m-2">
      <h2 className="text-xl font-semibold">Chat</h2>
      <section id="panels" className="flex flex-col md:flex-row m-2">
        <section id="panels-room" className="flex-1 m-2"><RoomControls /></section>
        <section id="panels-chat" className="flex-2 m-2"><ChatPanel /></section>
      </section>
    </main>
  );
}