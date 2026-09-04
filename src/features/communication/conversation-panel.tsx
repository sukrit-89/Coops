"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Message = { id: string; sender_id: string; body: string; created_at: string };

export function ConversationPanel({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    void fetch(`/api/conversations/${bookingId}`).then(async (response) => {
      const result = await response.json() as { messages?: Message[]; error?: string };
      if (response.ok) setMessages(result.messages ?? []);
      else setMessage(result.error ?? "Conversation could not be loaded.");
    });

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`booking-messages-${bookingId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId, open]);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentBody = body;
    setBody("");
    setMessage(null);

    const response = await fetch(`/api/conversations/${bookingId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: currentBody })
    });
    const result = await response.json() as { message?: Message; error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "Message could not be sent.");
      setBody(currentBody);
    } else {
      setMessage("Message sent.");
      if (result.message) {
        setMessages((prev) => (prev.some((m) => m.id === result.message!.id) ? prev : [...prev, result.message!]));
      }
    }
  }

  return <div className="mt-4 border-t border-neutral-200 pt-3"><button type="button" onClick={() => setOpen((value) => !value)} className="text-xs font-medium text-[#ef4d23]">{open ? "Close conversation" : "Open conversation"}</button>{open ? <div className="mt-3 rounded-xl bg-[#f5f2ee] p-3"><div className="max-h-40 space-y-2 overflow-auto">{messages.length ? messages.map((item) => <p key={item.id} className="rounded-lg bg-white px-3 py-2 text-xs text-neutral-700">{item.body}</p>) : <p className="text-xs text-neutral-500">No messages yet.</p>}</div><form onSubmit={send} className="mt-3 flex gap-2"><input required value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a message" className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs" /><button type="submit" className="rounded-lg bg-[#0b0f1a] px-3 py-2 text-xs font-medium text-white">Send</button></form>{message ? <p className="mt-2 text-xs text-neutral-500">{message}</p> : null}</div> : null}</div>;
}
