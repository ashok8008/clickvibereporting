"use client";

import { useState } from "react";

interface Message {
  role: "bot" | "user";
  text: string;
}

const QUICK_REPLIES = ["Best offer", "My performance", "How does tracking work?"];

function getReply(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("offer") || m.includes("payout"))
    return "💰 Polymarket is the flagship offer right now at $80 per qualified FTD on iOS (US). Head to Offers to see the full list.";
  if (m.includes("performance") || m.includes("revenue") || m.includes("report"))
    return "📊 Open Reporting to see clicks, conversions and revenue rolled up by publisher and site, with CSV export.";
  if (m.includes("track") || m.includes("link"))
    return "🔗 Tracking links are set per site per offer as DIRECT or CONVERTED. CONVERTED links route through our /c/{id} redirect so we log clicks before forwarding.";
  return "I'm a demo assistant for now — wiring to live data is coming soon. Try: \"best offer\", \"my performance\", or \"how does tracking work?\".";
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showQuick, setShowQuick] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "👋 Hey! I'm your Vibe Assistant. I can help you navigate offers, performance data, and tracking links. What do you need?",
    },
  ]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setShowQuick(false);
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: getReply(trimmed) }]);
    }, 700);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-[94px] right-7 z-[200] flex h-[480px] w-[340px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[18px] border border-cardborder bg-white shadow-[0_16px_60px_rgba(13,27,75,0.20)]">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-navy to-[#1e3a8a] px-4 py-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo to-success text-base">
              ⚡
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-extrabold text-white">Vibe Assistant</h4>
              <p className="flex items-center gap-1.5 text-[11px] text-white/60">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                Online · ClickVibe AI
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-lg text-white/60 hover:text-white"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="cv-scroll flex flex-1 flex-col gap-2.5 overflow-y-auto bg-[#F8F9FF] p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex max-w-[85%] flex-col gap-1 ${
                  msg.role === "user" ? "self-end" : "self-start"
                }`}
              >
                <div
                  className={`px-3 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-[14px_4px_14px_14px] bg-indigo text-white"
                      : "rounded-[4px_14px_14px_14px] border border-cardborder bg-white text-[#1F2937]"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {showQuick && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-3">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border-[1.5px] border-indigo bg-white px-3 py-1.5 text-xs font-semibold text-indigo transition-colors hover:bg-indigo hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-cardborder bg-white px-3.5 py-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask anything…"
              className="flex-1 rounded-full border-[1.5px] border-cardborder bg-[#F8F9FF] px-3.5 py-2 text-[13px] outline-none focus:border-indigo focus:bg-white"
            />
            <button
              onClick={() => send(input)}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo text-base text-white transition-colors hover:bg-indigo-dark"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-7 right-7 z-[200] flex h-[54px] w-[54px] items-center justify-center rounded-full bg-gradient-to-br from-indigo to-indigo-dark text-[22px] shadow-[0_4px_20px_rgba(99,102,241,0.45)] transition-transform hover:scale-110"
        aria-label="Open assistant"
      >
        💬
        {!open && (
          <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#EF4444] text-[10px] font-extrabold text-white">
            1
          </span>
        )}
      </button>
    </>
  );
}
