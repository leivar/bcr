"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { setToken } from "@/src/lib/auth";
import { useState } from "react";

export default function Page() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function login() {
    if (!userId.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.post("/api/login", { userId });
      setToken(data.token);
      router.push("/chat");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col gap-3 items-center">
      <h1 className="text-2xl font-semibold text-center">BasicChatRoom</h1>
      <input
        className="border w-60 p-2"
        placeholder="Enter a userId"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <button
        onClick={login}
        disabled={loading}
        className="border p-2 w-60 hover:bg-gray-100 hover:cursor-pointer"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </main>
  );
}