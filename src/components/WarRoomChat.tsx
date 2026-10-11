import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Shield, User, Terminal, AlertCircle } from "lucide-react";
import { TeamReaction } from "../types/incident";
import { soundManager } from "../utils/audio";

interface WarRoomChatProps {
  messages: TeamReaction[];
  onSendMessage: (msg: string) => void;
  language: "ar" | "en";
}

export const WarRoomChat: React.FC<WarRoomChatProps> = ({
  messages,
  onSendMessage,
  language,
}) => {
  const isAr = language === "ar";
  const [userInput, setUserInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    soundManager.playKeyTick();
    onSendMessage(userInput.trim());
    setUserInput("");
  };

  const getRoleBadge = (role: TeamReaction["role"]) => {
    switch (role) {
      case "sre":
        return {
          color: "text-cyan-400 bg-cyan-950/60 border-cyan-800/80",
          icon: <Terminal className="w-3 h-3 text-cyan-400" />,
          label: "SRE Lead",
        };
      case "secops":
        return {
          color: "text-rose-400 bg-rose-950/60 border-rose-800/80",
          icon: <Shield className="w-3 h-3 text-rose-400" />,
          label: "SecOps",
        };
      case "devops":
        return {
          color: "text-amber-400 bg-amber-950/60 border-amber-800/80",
          icon: <Terminal className="w-3 h-3 text-amber-400" />,
          label: "DevOps",
        };
      case "management":
        return {
          color: "text-purple-400 bg-purple-950/60 border-purple-800/80",
          icon: <AlertCircle className="w-3 h-3 text-purple-400" />,
          label: "VP Eng",
        };
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[380px] sm:h-[440px]">
      {/* Header */}
      <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            {isAr ? "قناة محادثة الطوارئ (#war-room-incident)" : "#war-room-incident (Bridge)"}
          </h3>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {messages.length} {isAr ? "رسائل" : "msgs"}
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {messages.map((m, idx) => {
          const badge = getRoleBadge(m.role);
          const isCommander = m.author === "Incident Commander" || m.author === "أنت (قائد الحادث)";

          return (
            <div
              key={idx}
              className={`p-2 rounded-lg border text-xs ${
                isCommander
                  ? "bg-slate-800/80 border-slate-700 ml-4"
                  : "bg-slate-950/70 border-slate-800/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-200 font-mono text-[11px]">{m.author}</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded border flex items-center gap-1 ${badge.color}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {m.timestamp || "just now"}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans">{m.message}</p>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={
            isAr
              ? "أرسل توجيهاً أو تحديثاً لفريق العمليات..."
              : "Post an update to the incident bridge..."
          }
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
        />
        <button
          type="submit"
          disabled={!userInput.trim()}
          className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
