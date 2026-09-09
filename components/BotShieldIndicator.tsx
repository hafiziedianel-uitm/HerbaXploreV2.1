"use client";

import React, { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Shield, CheckCircle2, 
  HelpCircle, Eye, EyeOff, Sparkles, Activity, RefreshCw, X
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface BotShieldIndicatorProps {
  humanScore: number;
  isBotConfirmed: boolean;
  rateLimitStatus: Record<string, { blocked: boolean; resetSeconds: number }>;
  triggerHoneypotFlag: () => void;
  onSimulateSpam: () => void;
  onOpenChange?: (isOpen: boolean) => void;
}

const emptySubscribe = () => () => {};

export function BotShieldIndicator({
  humanScore,
  isBotConfirmed,
  rateLimitStatus,
  triggerHoneypotFlag,
  onSimulateSpam,
  onOpenChange,
}: BotShieldIndicatorProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const handleOpen = () => {
    setIsOpen(true);
    onOpenChange?.(true);
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  // Close on Escape key press & body scroll locking
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, handleClose]);

  const en = language === "en";

  // Compute overall security assessment
  const isRateLimited = Object.values(rateLimitStatus).some((s) => s.blocked);
  const isSuspicious = humanScore < 40 && !isBotConfirmed;

  let shieldColor = "text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/30";
  let ShieldIcon = ShieldCheck;
  let statusTextEn = "Secured (Verified Human)";
  let statusTextMs = "Selamat (Manusia Disahkan)";

  if (isBotConfirmed) {
    shieldColor = "text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-900/30 animate-bounce";
    ShieldIcon = ShieldAlert;
    statusTextEn = "Threat Detected (Bot Blocked)";
    statusTextMs = "Ancaman Dikesan (Bot Disekat)";
  } else if (isRateLimited) {
    shieldColor = "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30";
    ShieldIcon = AlertTriangle;
    statusTextEn = "Throttled (Rate Limited)";
    statusTextMs = "Dihadkan (Had Kadar Terlampau)";
  } else if (isSuspicious) {
    shieldColor = "text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/30 border-stone-200 dark:border-stone-800";
    ShieldIcon = Shield;
    statusTextEn = "Analyzing Behavior...";
    statusTextMs = "Menganalisis Kelakuan...";
  }

  return (
    <>
      {/* Floating Status pill */}
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all hover:scale-[1.02] shadow-sm ${shieldColor}`}
        id="bot-shield-pill-btn"
      >
        <ShieldIcon size={14} className={isSuspicious ? "animate-spin" : ""} />
        <span>{en ? statusTextEn : statusTextMs}</span>
        <span className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded-full text-[9px] font-mono">
          {humanScore}%
        </span>
      </button>

      {/* Modern Dialog Overlay Portaled Directly to document.body */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div 
              className="fixed inset-0 flex items-center justify-center p-4 pointer-events-auto"
              style={{ zIndex: 999999 }}
            >
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="fixed inset-0 bg-stone-950/80 backdrop-blur-md"
                style={{ zIndex: 999999 }}
              />

              {/* Modal Box */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden text-stone-850 dark:text-stone-100"
                style={{ zIndex: 1000000 }}
              >
              {/* Header */}
              <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-850 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-stone-800 dark:text-stone-100">
                      {en ? "ShieldX Bot & Spam Defense" : "Sistem Pertahanan Bot ShieldX"}
                    </h3>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold uppercase tracking-widest mt-0.5 font-mono">
                      {en ? "Client Integrity Verification Engine" : "Enjin Pengesahan Integriti Klien"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Score Dial / Progress Bar */}
                <div className="bg-stone-50 dark:bg-stone-950 p-5 rounded-2xl border border-stone-150 dark:border-stone-850 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block font-mono">
                        {en ? "Human Authenticity Coefficient" : "Pekali Ketulenan Manusia"}
                      </span>
                      <h4 className="text-xl font-black mt-1 flex items-center gap-2 text-stone-800 dark:text-stone-100">
                        {humanScore}% {en ? "Human Pattern" : "Corak Manusia"}
                        {humanScore >= 70 && <Sparkles size={16} className="text-amber-500 animate-bounce" />}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block font-mono">
                        {en ? "Verification Status" : "Status Pengesahan"}
                      </span>
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                        isBotConfirmed 
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" 
                          : isRateLimited 
                          ? "bg-amber-500/10 text-amber-600" 
                          : "bg-emerald-500/10 text-emerald-600"
                      } mt-1 inline-block`}>
                        {isBotConfirmed 
                          ? (en ? "FLAGGED BOT" : "BOT DIKENALPASTI") 
                          : isRateLimited 
                          ? (en ? "RATE LIMITED" : "HAD KADAR") 
                          : (en ? "VERIFIED SAFE" : "TERBUKTI SELAMAT")}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic verification bars */}
                  <div className="space-y-2">
                    <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          isBotConfirmed 
                            ? "bg-rose-500" 
                            : humanScore < 50 
                            ? "bg-amber-500" 
                            : "bg-emerald-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${humanScore}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed font-medium">
                      {isBotConfirmed ? (
                        en 
                          ? "🚫 Access restricted: The client was flagged because a honeypot trap field was filled, which only automated scripts do."
                          : "🚫 Akses disekat: Klien ditandakan kerana input perangkap madu (honeypot) telah diisi, yang biasanya hanya dilakukan oleh skrip automasi."
                      ) : (
                        en
                          ? "⚡ Our security system analyzes real-time user gestures (mouse moves, touch coordinates, natural keystrokes) to distinguish between bots and legitimate users."
                          : "⚡ Sistem keselamatan kami menganalisis gerak isyarat masa nyata (pergerakan tetikus, koordinat sentuhan, kelewatan kekunci) untuk membezakan bot dan pengguna sah."
                      )}
                    </p>
                  </div>
                </div>

                {/* Technical Simulation Actions for KIK Presentation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest font-mono">
                      {en ? "KIK Presentation Interactive Sandbox" : "Peti Pasir Interaktif KIK"}
                    </h5>
                    <button
                      onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                      className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      {showTechnicalDetails ? <EyeOff size={10} /> : <Eye size={10} />}
                      <span>{showTechnicalDetails ? (en ? "Hide Architecture" : "Sembunyi Seni Bina") : (en ? "Show Architecture" : "Papar Seni Bina")}</span>
                    </button>
                  </div>

                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-normal">
                    {en 
                      ? "Test the defensive mechanisms live by triggering bot-like actions below. Perfect for demonstrating technology robustness to UiTM panels."
                      : "Uji mekanisma pertahanan secara langsung dengan mencetuskan aksi seumpama bot di bawah. Sesuai untuk demonstrasi ketahanan teknologi kepada panel UiTM."}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Trigger Honeypot */}
                    <button
                      onClick={triggerHoneypotFlag}
                      disabled={isBotConfirmed}
                      className="p-3 bg-stone-50 hover:bg-rose-50 dark:bg-stone-950 dark:hover:bg-rose-950/20 border border-stone-200 dark:border-stone-850 hover:border-rose-200 dark:hover:border-rose-900/30 rounded-xl text-left transition group active:scale-95"
                    >
                      <ShieldAlert size={16} className="text-rose-500 mb-1.5 transition-transform group-hover:scale-110" />
                      <span className="font-extrabold text-xs block text-stone-800 dark:text-stone-200">
                        {en ? "Trigger Honeypot" : "Cetus Perangkap Madu"}
                      </span>
                      <span className="text-[9px] text-stone-400 dark:text-stone-500 block leading-tight mt-1 font-medium">
                        {en ? "Simulates automated form fillings." : "Simulasi pengisian borang automatik."}
                      </span>
                    </button>

                    {/* Trigger Rate Limiting */}
                    <button
                      onClick={onSimulateSpam}
                      className="p-3 bg-stone-50 hover:bg-amber-50 dark:bg-stone-950 dark:hover:bg-amber-950/20 border border-stone-200 dark:border-stone-850 hover:border-amber-200 dark:hover:border-amber-900/30 rounded-xl text-left transition group active:scale-95"
                    >
                      <Activity size={16} className="text-amber-500 mb-1.5 transition-transform group-hover:scale-110" />
                      <span className="font-extrabold text-xs block text-stone-800 dark:text-stone-200">
                        {en ? "Spam Actions (Rate Limit)" : "Spam Tindakan (Had Kadar)"}
                      </span>
                      <span className="text-[9px] text-stone-400 dark:text-stone-500 block leading-tight mt-1 font-medium">
                        {en ? "Simulates rapid DDoS or scraping." : "Simulasi DDoS pantas atau pengikisan."}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Architecture Details Panel */}
                <AnimatePresence>
                  {showTechnicalDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-stone-150 dark:border-stone-850 pt-4 space-y-4"
                    >
                      <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-150 dark:border-stone-850 space-y-2 font-mono text-[10px] text-stone-600 dark:text-stone-400 leading-relaxed">
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold uppercase mb-1">
                          <Activity size={12} />
                          <span>System Architecture Specs:</span>
                        </div>
                        <p>• <strong>Honeypot Protection</strong>: Hidden inputs with name tag `&lt;input name=&quot;faculty_verification_hash&quot; ... /&gt;`. Normal humans cannot see or fill this. Bots scan CSS and automatically try to pre-fill it to bypass security, triggering instant lock-out.</p>
                        <p>• <strong>Interactions Tracker</strong>: Tracks cursor movement velocity and natural delay intervals. Non-interacted requests are flagged suspicious.</p>
                        <p>• <strong>Dynamic Rate Limiting</strong>: Sliding-window queue tracking requests per 8000ms. Excess requests throw `HTTP 429 Too Many Requests` equivalents internally and throttle UI actions.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-stone-50 dark:bg-stone-900/80 border-t border-stone-100 dark:border-stone-850 flex justify-between items-center text-[10px] text-stone-400 dark:text-stone-500 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={10} className="text-emerald-500" />
                  UiTM KIK NatureRx Security Verified
                </span>
                <span>Active 2026</span>
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
