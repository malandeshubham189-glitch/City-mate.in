import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { MessageSquare, X, Send, Bot, Sparkles, Loader2, ArrowRight, RefreshCw } from "lucide-react";

interface CityMateBuddyProps {
  currentCity: string;
  currentCategory: string;
  darkMode: boolean;
}

export default function CityMateBuddy({ currentCity, currentCategory, darkMode }: CityMateBuddyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content: `Namaste! 🙏 I'm your CityMate AI relocation assistant.
I can help you find rooms, estimate living expenses, pick safe areas, or find tiffin plans in ${currentCity}. Ask me anything about moving or surviving in the city!`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isStreaming]);

  const executeChatQuery = async (newUserMessage: ChatMessage, history: ChatMessage[]) => {
    setIsLoading(true);
    setIsStreaming(false);
    setStreamingMessageId(null);

    const assistantMessageId = "assistant-" + Math.random().toString();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, newUserMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userContext: {
            city: currentCity,
            category: currentCategory,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Transition from loading state to streaming state
      setIsLoading(false);
      setIsStreaming(true);
      setStreamingMessageId(assistantMessageId);

      // Insert placeholder message for streaming
      const placeholderMsg: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, placeholderMsg]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            if (trimmedLine.startsWith("data: ")) {
              const dataStr = trimmedLine.slice(6).trim();
              if (dataStr === "[DONE]") {
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedContent += parsed.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: accumulatedContent }
                        : m
                    )
                  );
                }
              } catch (e) {
                // Ignore parsing errors for partial or interrupted chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Remove placeholder message if it remains empty or clean up
      setMessages((prev) => prev.filter(m => m.id !== assistantMessageId));
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Math.random().toString(),
          role: "assistant",
          content: "Oops! I hit a traffic jam on the servers. Let's try that again in a second.",
          timestamp: new Date(),
          isError: true,
        } as any,
      ]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessageId(null);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    if (!textToSend) {
      setInputValue("");
    }

    const newUserMessage: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const history = messages.filter(m => !(m as any).isError);
    setMessages([...history, newUserMessage]);

    await executeChatQuery(newUserMessage, history);
  };

  const handleRetryLastMessage = async () => {
    // Find the last user message to retry
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMsg) return;

    // Filter out error messages and rebuild context safely
    const historyWithoutError = messages.filter(m => !(m as any).isError);
    const history = historyWithoutError.filter(m => m.id !== lastUserMsg.id);

    setMessages([...history, lastUserMsg]);

    await executeChatQuery(lastUserMsg, history);
  };

  const QUICK_QUESTIONS = [
    `Average cost of living in ${currentCity}?`,
    `Best student/IT areas in ${currentCity}?`,
    `How does Tiffin/Mess delivery work?`,
    `Packers & Movers rate estimate?`,
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer ${
          darkMode
            ? "bg-gradient-to-tr from-brand-indigo to-brand-violet shadow-purple-500/20 hover:from-indigo-500 hover:to-purple-500"
            : "bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-700"
        }`}
        id="buddy-floating-btn"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {!isOpen && (
          <span className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ring-2 ${
            darkMode ? "bg-purple-400 text-slate-950 ring-slate-950" : "bg-slate-900 text-white ring-white"
          }`}>
            AI
          </span>
        )}
      </button>

      {/* Chat Window Container */}
      {isOpen && (
        <div className={`fixed right-6 bottom-24 z-50 flex h-[510px] w-[390px] max-w-[calc(100vw-32px)] flex-col rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 ${
          darkMode
            ? "border-slate-800 bg-slate-900/90 text-white shadow-black/50"
            : "border-slate-100 bg-white text-slate-800 shadow-slate-200/50"
        } backdrop-blur-xl`}>
          
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-4 text-white ${
            darkMode 
              ? "bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800" 
              : "bg-gradient-to-r from-brand-indigo to-brand-blue"
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-md ${
                darkMode ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-white/20"
              }`}>
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight">CityMate AI Buddy</h4>
                <div className={`flex items-center gap-1 text-[10px] font-bold ${
                  darkMode ? "text-purple-400" : "text-indigo-100"
                }`}>
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  <span>Relocation Expert • Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-1.5 hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
            darkMode ? "bg-slate-950/40" : "bg-slate-50/70"
          }`}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {message.role === "assistant" && (
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    darkMode ? "bg-purple-950/50 text-purple-400 border border-purple-900/30" : "bg-indigo-100 text-brand-indigo"
                  }`}>
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap flex flex-col gap-2 ${
                    message.role === "user"
                      ? darkMode
                        ? "bg-gradient-to-r from-brand-indigo to-brand-violet text-white font-medium rounded-tr-none shadow-md shadow-indigo-950/30"
                        : "bg-indigo-600 text-white font-medium rounded-tr-none"
                      : (message as any).isError
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm rounded-tl-none font-medium"
                        : darkMode
                          ? "bg-slate-900/80 text-slate-200 border border-slate-800 shadow-sm rounded-tl-none"
                          : "bg-white text-slate-800 border border-slate-100/80 shadow-sm rounded-tl-none"
                  }`}
                >
                  <span>
                    {message.content}
                    {isStreaming && message.id === streamingMessageId && (
                      <span className="inline-block ml-1 w-1.5 h-3 bg-purple-400 dark:bg-purple-300 rounded-sm animate-pulse align-middle" />
                    )}
                  </span>
                  
                  {(message as any).isError && (
                    <button
                      onClick={handleRetryLastMessage}
                      className="mt-1 flex w-fit items-center gap-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-3 py-1.5 text-[10px] font-black border border-rose-500/30 transition-all cursor-pointer active:scale-95"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Retry Connection</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  darkMode ? "bg-purple-950/50 text-purple-400 border border-purple-900/30" : "bg-indigo-100 text-brand-indigo"
                }`}>
                  <Bot className="h-4 w-4" />
                </div>
                <div className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs ${
                  darkMode ? "bg-slate-900/80 border-slate-800 text-slate-400" : "bg-white border-slate-100 shadow-sm text-slate-400"
                }`}>
                  <Loader2 className={`h-3.5 w-3.5 animate-spin ${darkMode ? "text-purple-400" : "text-indigo-600"}`} />
                  <span>Consulting local experts...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length < 4 && (
            <div className={`px-4 pb-3 pt-2 border-t ${
              darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-100"
            }`}>
              <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}>
                Quick Prompts
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    disabled={isLoading}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer disabled:opacity-55 ${
                      darkMode
                        ? "border-slate-800 bg-slate-900 text-slate-300 hover:border-purple-500/50 hover:bg-purple-950/20 hover:text-purple-400"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/30 hover:text-indigo-600"
                    }`}
                  >
                    <span>{q}</span>
                    <ArrowRight className="h-2.5 w-2.5 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className={`border-t p-3 ${
            darkMode ? "border-slate-800 bg-slate-950" : "border-slate-100 bg-white"
          }`}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) handleSendMessage();
                }}
                placeholder="Ask about deposits, safety, mess delivery..."
                className={`flex-1 rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all ${
                  darkMode
                    ? "bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:ring-1 focus:ring-purple-500"
                    : "bg-slate-50 border border-slate-100 text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500"
                }`}
                disabled={isLoading}
                id="buddy-chat-input"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputValue.trim()}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer ${
                  darkMode
                    ? "bg-gradient-to-r from-brand-indigo to-brand-violet shadow-purple-950/50"
                    : "bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700"
                }`}
                id="buddy-chat-send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

