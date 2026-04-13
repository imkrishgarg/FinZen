"use client";
import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, Send, Bot, User, Sparkles } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; };

const SUGGESTIONS = [
  "Should I invest in mutual funds or FD?",
  "How do I build an emergency fund?",
  "Explain SIP in simple terms",
  "Is a personal loan a good idea?",
  "How much should I save per month?",
  "What is term insurance?",
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm FinZen AI — your personal financial co-pilot 🚀\n\nAsk me anything about investing, saving, insurance, loans, or taxes. I'll answer in plain simple language. You can also tap the mic to speak!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated })
      });
      const data = await res.json();
      const aiMsg: Message = { role: "assistant", content: data.reply || "Sorry, I couldn't process that." };
      setMessages(prev => [...prev, aiMsg]);
      if (voiceMode) speak(aiMsg.content);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ""));
    utter.lang = "en-IN"; utter.rate = 0.9; utter.pitch = 1;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in this browser"); return; }
    const r = new SR();
    r.lang = "en-IN"; r.continuous = false; r.interimResults = false;
    r.onresult = (e: any) => { const t = e.results[0][0].transcript; send(t); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start(); setListening(true);
    recognitionRef.current = r;
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 6rem)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Co-pilot</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-400">Finance specialist · Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {speaking && (
            <button onClick={stopSpeaking}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/20 border border-pink-500/40 rounded-full text-pink-400 text-xs animate-pulse">
              <Volume2 className="w-3 h-3" /> Speaking...
            </button>
          )}
          <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1.5">
            <span className="text-xs text-slate-400">Voice</span>
            <button onClick={() => setVoiceMode(!voiceMode)}
              className={`w-10 h-5 rounded-full transition-all relative ${voiceMode ? "bg-pink-600" : "bg-slate-600"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${voiceMode ? "left-5.5 translate-x-0.5" : "left-0.5"}`} style={{ left: voiceMode ? "22px" : "2px" }} />
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)}
              className="text-xs px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full text-slate-300 hover:border-pink-500/60 hover:text-pink-300 hover:bg-pink-500/10 transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
              m.role === "user"
                ? "bg-purple-600"
                : "bg-gradient-to-br from-pink-500 to-purple-600"
            }`}>
              {m.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[75%] group`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-purple-600 text-white rounded-tr-sm"
                  : "bg-slate-800 text-white border border-slate-700/50 rounded-tl-sm"
              }`}>
                {m.content}
              </div>
              {m.role === "assistant" && (
                <button onClick={() => speak(m.content)}
                  className="mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-pink-400">
                  <Volume2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-800 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1 items-center h-4">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-3 border-t border-slate-800">
        <div className="flex gap-2 items-center">
          <button
            onClick={listening ? stopListening : startListening}
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              listening
                ? "bg-red-500 animate-pulse"
                : "bg-slate-800 border border-slate-700 hover:border-pink-500"
            }`}>
            {listening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-slate-400" />}
          </button>

          <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 focus-within:border-pink-500/60 transition-colors">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)}
              placeholder={listening ? "Listening..." : "Ask anything about money..."}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <button onClick={() => send(input)} disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center flex-shrink-0 hover:opacity-90 disabled:opacity-40 transition-all">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-slate-600 text-center mt-2">Only answers finance-related questions</p>
      </div>
    </div>
  );
}