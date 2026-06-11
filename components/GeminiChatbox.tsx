"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, X, Send, Sparkles, AlertCircle, RotateCcw, MessageSquare, ExternalLink, ArrowDown, HelpCircle, Leaf, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Plant, Compound } from "@/lib/data";

interface GeminiChatboxProps {
  selectedPlant?: Plant | null;
  selectedCompound?: Compound | null;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function GeminiChatbox({ selectedPlant, selectedCompound }: GeminiChatboxProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Translations
  const text = {
    en: {
      botTitle: "HerbaXplore AI",
      botSub: "Expert Pharmacognosy & Custom Gem",
      placeholder: "Ask about plant biochemistry or mechanisms...",
      gemButton: "Use Custom Gem",
      gemDesc: "Access the full expert Gem on Gemini Advanced.",
      clearChat: "Clear chat history",
      suggestHeader: "Quick Inquiries",
      suggestPlant: `Tell me about ${selectedPlant?.name || "this plant"}`,
      suggestCompound: selectedCompound ? `Explain actions of ${selectedCompound.name}` : `List common phytochemical active compound groups`,
      suggestHowKey: "How do active compounds get classified?",
      loadAnswer: "HerbaXplore AI is analyzing botanical compounds...",
      errorKey: "Error connecting to Gemini. Make sure GEMINI_API_KEY is configured in your Secrets panel.",
      introMsg: `Hello! I am HerbaXplore AI, your expert tutor in pharmacognosy, phytochemistry, and botanical pharmacology. Ask me anything about plant structures, medical properties, chemical formulas, H-NMR spectra, or target mechanisms. You can also explore my customized Gem on the Gemini platform directly!`,
      useGemTooltip: "Launch HerbaXplore Custom Gem",
    },
    ms: {
      botTitle: "AI HerbaXplore",
      botSub: "Pakar Farmakognosi & Gem Khas",
      placeholder: "Tanya tentang biokimia tumbuhan...",
      gemButton: "Guna Gem Khas",
      gemDesc: "Akses Gem pakar penuh di platform Gemini Advanced.",
      clearChat: "Padam sejarah sembang",
      suggestHeader: "Inkuiri Pantas",
      suggestPlant: `Beritahu saya tentang ${selectedPlant?.name || "tumbuhan ini"}`,
      suggestCompound: selectedCompound ? `Terangkan tindakan ${selectedCompound.name}` : `Senaraikan kumpulan kompaun aktif fitokimia`,
      suggestHowKey: "Bagaimanakah sebatian ligan dikelaskan?",
      loadAnswer: "AI HerbaXplore sedang menganalisis sebatian botani...",
      errorKey: "Ralat menyambung ke Gemini. Pastikan GEMINI_API_KEY telah dikonfigurasikan di panel Secrets.",
      introMsg: `Helo! Saya AI HerbaXplore, tutor pakar anda dalam subjek farmakognosi, biokimia tumbuhan, dan farmakologi botani. Tanya saya apa sahaja tentang struktur tumbuhan, sifat perubatan, siri H-NMR, atau mekanisme ligan. Anda juga boleh melancarkan Gem khas saya terus di Gemini!`,
      useGemTooltip: "Lancar Gem Khas HerbaXplore",
    }
  }[language === "ms" ? "ms" : "en"];

  // Initialize with initial greeting
  useEffect(() => {
    setMessages([
      {
        id: "welcome-msg",
        role: "assistant",
        content: text.introMsg,
        timestamp: new Date()
      }
    ]);
  }, [language, text.introMsg]);

  // Handle scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // Show arrow if user has scrolled up more than 150px
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 150);
  };

  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim() || isGenerating) return;

    setErrorStatus(null);
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: msgText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMsg("");
    setIsGenerating(true);

    try {
      // Build the prompt context chain
      const activeContext = [];
      if (selectedPlant) {
        activeContext.push({
          role: "user",
          content: `[CONTEXT] The student is currently studying: ${selectedPlant.name} (${selectedPlant.scientificName}). Description: ${selectedPlant.description}. Available plant parts include: ${selectedPlant.parts.map(p => p.name).join(", ")}.`
        });
      }
      if (selectedCompound) {
        activeContext.push({
          role: "user",
          content: `[CONTEXT] The student has selected this active chemical compound: ${selectedCompound.name}. Bioactive properties: ${selectedCompound.pharmacologicalActivity}. Therapeutic indication: ${selectedCompound.therapeuticActivity}. Smiles structural sequence: ${selectedCompound.smiles || "N/A"}.`
        });
      }

      // Collect some recent history messages (max 6 for concise context)
      const recentHistory = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const payloadMessages = [
        ...activeContext,
        ...recentHistory,
        { role: "user", content: msgText }
      ];

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: payloadMessages })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch response");
      }

      const responseData = await response.json();
      
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: responseData.text || "I was unable to draft an answer. Please review your prompt and try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err?.message || text.errorKey);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: text.introMsg,
        timestamp: new Date()
      }
    ]);
    setErrorStatus(null);
  };

  // Helper to format response text (handles robust lists, headers, bullet points and bold formatting)
  const formatText = (textStr: string) => {
    return textStr.split("\n").map((line, idx) => {
      let content: React.ReactNode = line;

      // Handle main bold titles (**Title**)
      if (line.includes("**")) {
        const parts = line.split("**");
        content = parts.map((part, pIdx) => {
          if (pIdx % 2 === 1) {
            return <strong key={pIdx} className="font-bold text-emerald-800 dark:text-emerald-400">{part}</strong>;
          }
          return part;
        });
      }

      // Headers (e.g. ### Header or ## Header)
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-stone-800 dark:text-stone-200 mt-3 mb-1 uppercase tracking-wide flex items-center gap-1.5 border-l-2 border-emerald-500 pl-2">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ") || line.startsWith("# ")) {
        return (
          <h3 key={idx} className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-4 mb-2">
            {line.replace(/^#+\s+/, "")}
          </h3>
        );
      }

      // Bullet items (e.g. * Item or - Item)
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const cleanLine = line.trim().replace(/^[\*\-]\s+/, "");
        // Resolve nested stars
        let formattedCleanLine: React.ReactNode = cleanLine;
        if (cleanLine.includes("**")) {
          const innerParts = cleanLine.split("**");
          formattedCleanLine = innerParts.map((part, pIdx) => {
            if (pIdx % 2 === 1) {
              return <strong key={pIdx} className="font-bold text-emerald-700 dark:text-emerald-400">{part}</strong>;
            }
            return part;
          });
        }
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-stone-700 dark:text-stone-300 leading-relaxed mb-1 pl-1">
            {formattedCleanLine}
          </li>
        );
      }

      // Code blocks or inline code wraps
      if (line.includes("`")) {
        const codeParts = line.split("`");
        content = codeParts.map((part, codeIdx) => {
          if (codeIdx % 2 === 1) {
            return (
              <code key={codeIdx} className="bg-stone-100 dark:bg-stone-900 px-1 py-0.5 rounded text-[11px] font-mono text-cyan-600 dark:text-cyan-400 select-all border border-stone-200/50 dark:border-stone-800/50">
                {part}
              </code>
            );
          }
          return part;
        });
      }

      // Empty spacing lines
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed mb-2 pl-0.5">
          {content}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Activation Button */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group flex items-center gap-2 px-4 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-full shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_24px_rgba(16,185,129,0.5)] transition-all duration-300 active:scale-95"
          title={text.useGemTooltip}
        >
          {/* Subtle glowing ring */}
          <div className="absolute inset-0 rounded-full bg-emerald-400/25 animate-ping opacity-60 pointer-events-none group-hover:scale-105" />
          
          <div className="relative flex items-center justify-center shrink-0">
            {isOpen ? <X size={18} /> : <MessageSquare size={18} className="animate-pulse" />}
          </div>
          
          <span className="text-xs sm:text-sm font-bold tracking-wide uppercase pr-0.5">
            {isOpen ? (language === "ms" ? "Tutup" : "Close") : (language === "ms" ? "Tanya AI" : "Ask AI")}
          </span>
          <Sparkles size={12} className="text-amber-300" />
        </button>
      </div>

      {/* Main Drawer Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-4 left-4 sm:left-auto sm:w-[420px] max-w-[calc(100vw-2rem)] h-[580px] bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/50 dark:border-stone-800/50 shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden z-40 no-swipe"
          >
            {/* Drawer Header */}
            <header className="p-4 bg-stone-50 dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800/50 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <Bot size={16} />
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-stone-50 dark:border-stone-950 rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 dark:text-stone-100 text-sm leading-none flex items-center gap-1.5">
                    {text.botTitle}
                    <Sparkles size={11} className="text-amber-500" />
                  </h3>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium leading-none mt-1">
                    {text.botSub}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Clear chat command */}
                <button
                  onClick={clearHistory}
                  className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 rounded-lg transition-colors"
                  title={text.clearChat}
                >
                  <RotateCcw size={14} />
                </button>
                {/* Dismiss Drawer button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 rounded-lg transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </header>

            {/* Specialized External Custom Gem CTA */}
            <div className="bg-emerald-500/5 border-b border-emerald-500/10 p-3 flex items-center justify-between gap-3 select-none">
              <div className="flex items-start gap-2 max-w-[70%]">
                <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg mt-0.5 shrink-0">
                  <Leaf size={14} />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide leading-none mb-0.5">HerbaXplore Expert Gem</h4>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                    {text.gemDesc}
                  </p>
                </div>
              </div>
              <a
                href="https://gemini.google.com/gem/1HQ4d6q21BCaV8cISuy7f8xCOO0vuTYLq?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1 shadow-sm shrink-0"
              >
                <span>{text.gemButton}</span>
                <ExternalLink size={9} />
              </a>
            </div>

            {/* Messages Scroll Area */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-stone-50/50 dark:bg-stone-900/30"
            >
              <AnimatePresence initial={false}>
                {messages.map((m) => {
                  const isAI = m.role === "assistant";
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className={`flex ${isAI ? "justify-start" : "justify-end"} items-start gap-2.5`}
                    >
                      {isAI && (
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 shadow-sm">
                          <Bot size={13} />
                        </div>
                      )}

                      <div className={`max-w-[85%] rounded-[1.5rem] px-3.5 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)] border select-text ${
                        isAI 
                          ? "bg-white dark:bg-stone-950 border-stone-200/60 dark:border-stone-850/60 rounded-tl-sm text-stone-800 dark:text-stone-200"
                          : "bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-transparent rounded-tr-sm"
                      }`}>
                        {isAI ? (
                          <div className="prose prose-stone dark:prose-invert max-w-none">
                            {formatText(m.content)}
                          </div>
                        ) : (
                          <p className="text-xs leading-relaxed font-medium">{m.content}</p>
                        )}
                        <span className={`block text-[9px] mt-1 text-right ${isAI ? "text-stone-400" : "text-emerald-200 font-mono"}`}>
                          {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Generating States */}
              {isGenerating && (
                <div className="flex justify-start items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm animate-spin">
                    <Loader2 size={13} />
                  </div>
                  <div className="bg-white dark:bg-stone-950 border border-stone-200/60 dark:border-stone-850/60 rounded-[1.25rem] rounded-tl-sm px-4 py-2.5 text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-2 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="ml-0.5">{text.loadAnswer}</span>
                  </div>
                </div>
              )}

              {/* Error Status banner */}
              {errorStatus && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-850/30 rounded-xl p-3 flex gap-2.5 text-xs text-rose-700 dark:text-rose-400">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold mb-0.5">Connection Error</h5>
                    <p className="leading-relaxed">{errorStatus}</p>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Helper Suggestions Area */}
            <div className="px-4 py-2 bg-stone-50/70 dark:bg-stone-950/40 border-t border-stone-100 dark:border-stone-850">
              <div className="text-[9px] uppercase tracking-wider font-bold mb-1.5 text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                <HelpCircle size={10} />
                <span>{text.suggestHeader}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSendMessage(text.suggestPlant)}
                  className="text-[10px] text-stone-600 dark:text-stone-400 font-semibold bg-white dark:bg-stone-950 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/15 border border-stone-200/70 dark:border-stone-800/70 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 px-2 py-1 rounded-lg transition-all text-left"
                >
                  {text.suggestPlant}
                </button>
                <button
                  onClick={() => handleSendMessage(text.suggestCompound)}
                  className="text-[10px] text-stone-600 dark:text-stone-400 font-semibold bg-white dark:bg-stone-950 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/15 border border-stone-200/70 dark:border-stone-800/70 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 px-2 py-1 rounded-lg transition-all text-left"
                >
                  {text.suggestCompound}
                </button>
                <button
                  onClick={() => handleSendMessage(text.suggestHowKey)}
                  className="text-[10px] text-stone-600 dark:text-stone-400 font-semibold bg-white dark:bg-stone-950 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/15 border border-stone-200/70 dark:border-stone-800/70 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 px-2 py-1 rounded-lg transition-all text-left"
                >
                  {text.suggestHowKey}
                </button>
              </div>
            </div>

            {/* Input Action Form Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputMsg);
              }}
              className="p-3 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder={text.placeholder}
                disabled={isGenerating}
                className="flex-1 bg-stone-100 dark:bg-stone-900 border border-transparent dark:border-stone-800/40 focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-stone-950 text-xs text-stone-800 dark:text-stone-200 rounded-xl px-3 py-2.5 outline-none transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim() || isGenerating}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl p-2.5 transition-all disabled:opacity-40 disabled:hover:bg-emerald-600 active:scale-95 flex items-center justify-center shrink-0"
              >
                <Send size={14} />
              </button>
            </form>

            {/* Scroll bottom helper floating chip */}
            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-16 right-4 bg-emerald-500 text-white p-1 rounded-full shadow-lg hover:bg-emerald-400 transition-all animate-bounce"
              >
                <ArrowDown size={14} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
