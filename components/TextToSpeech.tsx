"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, Square, Volume2, VolumeX, Sparkles, 
  ChevronDown, Settings, HelpCircle, AlertCircle, RefreshCw
} from "lucide-react";

interface TextToSpeechProps {
  text: string;
  language: "en" | "ms";
  title?: string;
}

export function TextToSpeech({ text, language, title }: TextToSpeechProps) {
  const [supported, setSupported] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState<number>(1.0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean HTML from text if any, and decode HTML entities for clean reading
  const cleanText = (rawText: string) => {
    if (typeof document === "undefined") return rawText;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = rawText;
    let clean = tempDiv.textContent || tempDiv.innerText || rawText;
    // Replace punctuation spaces if any or normalize string
    return clean.trim();
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSupported(true);

      const loadVoices = () => {
        try {
          const allVoices = window.speechSynthesis.getVoices();
          setVoices(allVoices);
          
          // Filter to select a suitable default voice
          const targetLang = language === "ms" ? "ms" : "en";
          let bestVoice: SpeechSynthesisVoice | null = null;

          if (targetLang === "ms") {
            // Match Malay, then fallback Indonesian which sounds natural for Malay
            bestVoice = allVoices.find(v => 
              v.lang.startsWith("ms") || 
              v.lang.includes("ms-MY")
            ) || allVoices.find(v => 
              v.lang.startsWith("id") || 
              v.lang.includes("id-ID")
            ) || null;
          } else {
            // Find English
            bestVoice = allVoices.find(v => 
              v.lang.includes("en-US") && v.name.includes("Natural")
            ) || allVoices.find(v => 
              v.lang.startsWith("en-")
            ) || allVoices.find(v => 
              v.lang.startsWith("en")
            ) || null;
          }

          // Fallback to first voice
          if (!bestVoice && allVoices.length > 0) {
            bestVoice = allVoices[0];
          }

          setSelectedVoice(bestVoice);
        } catch (e) {
          console.warn("Error loading voices:", e);
        }
      };

      loadVoices();
      
      // Chrome/Safari voice lazy load trigger
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      // Clean up speech on unmount
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  // Cancel speech on text changed, to prevent reading previous text
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        setIsSpeaking(false);
        setIsPaused(false);
      }, 0);
    }
  }, [text]);

  const handlePlayPause = () => {
    if (!supported) return;

    try {
      const synth = window.speechSynthesis;

      if (isSpeaking) {
        if (isPaused) {
          synth.resume();
          setIsPaused(false);
        } else {
          synth.pause();
          setIsPaused(true);
        }
        return;
      }

      // Stop any existing synthesis
      synth.cancel();

      const textToRead = cleanText(text);
      if (!textToRead) return;

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = rate;
      utterance.pitch = 1.0;

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setSpeechError(null);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = (event) => {
        console.error("Speech error occurred:", event);
        if (event.error !== "interrupted") {
          setSpeechError(event.error || "Speech synthesis failed");
        }
        setIsSpeaking(false);
        setIsPaused(false);
      };

      synth.speak(utterance);
    } catch (e) {
      console.error("Failed to speak text:", e);
      setSpeechError(e instanceof Error ? e.message : "Error initiating speech");
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    if (!supported) return;
    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    } catch (e) {
      console.error("Failed to cancel speech synthesis:", e);
    }
  };

  const cycleRate = () => {
    const rates = [0.8, 1.0, 1.2, 1.5, 2.0];
    const currentIndex = rates.indexOf(rate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setRate(nextRate);

    // If speaking, restart with new rate
    if (isSpeaking) {
      setTimeout(() => {
        handleStop();
        // Brief delay to allow cancel to complete, then resume
        setTimeout(() => {
          handlePlayPause();
        }, 100);
      }, 0);
    }
  };

  const selectVoice = (voiceName: string) => {
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);
      // Restart speech if active
      if (isSpeaking) {
        setTimeout(() => {
          handleStop();
          setTimeout(() => {
            handlePlayPause();
          }, 100);
        }, 0);
      }
    }
  };

  // Filter voices compatible with translation language prefix
  const targetPrefix = language === "ms" ? ["ms", "id"] : ["en"];
  const compatibleVoices = voices.filter(v => 
    targetPrefix.some(pref => v.lang.toLowerCase().startsWith(pref))
  );

  if (!supported) {
    return null; // Don't show if window speechSynthesis is not supported
  }

  return (
    <div 
      id="custom-tts-accessibility-controller"
      className="p-3 sm:p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 shadow-sm transition-all duration-300"
    >
      <div className="flex flex-col gap-2.5">
        
        {/* Header & Main Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isSpeaking && !isPaused ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
              <Volume2 size={16} className={`${isSpeaking && !isPaused ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300">
                {language === "ms" ? "Pembaca Audio Kebolehan Akses" : "Accessibility Audio Reader"}
              </h4>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
                {isSpeaking 
                  ? (isPaused ? (language === "ms" ? "Dijeda" : "Paused") : (language === "ms" ? "Sedang membaca..." : "Reading aloud...")) 
                  : (language === "ms" ? "Perihalan teks-ke-ucapan" : "Text-to-speech description")}
              </p>
            </div>
          </div>

          {/* Equalizer Waveform Bars when speaking */}
          {isSpeaking && !isPaused && (
            <div className="flex items-end gap-[2px] h-3 pr-2" aria-hidden="true">
              <span className="w-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-[equalizer_0.6s_ease-in-out_infinite_alternate]" style={{ height: "40%" }} />
              <span className="w-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-[equalizer_0.9s_ease-in-out_infinite_alternate]" style={{ height: "100%" }} />
              <span className="w-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-[equalizer_0.7s_ease-in-out_infinite_alternate]" style={{ height: "60%" }} />
              <span className="w-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-[equalizer_0.5s_ease-in-out_infinite_alternate]" style={{ height: "80%" }} />
            </div>
          )}
        </div>

        {/* Control Button Group */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handlePlayPause}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
              isSpeaking && !isPaused
                ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"
                : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-300 dark:hover:bg-emerald-600/30"
            }`}
            aria-label={isSpeaking && !isPaused ? "Pause Speech" : "Play Speech"}
          >
            {isSpeaking && !isPaused ? (
              <>
                <Pause size={13} className="shrink-0" />
                <span>{language === "ms" ? "Jeda" : "Pause"}</span>
              </>
            ) : (
              <>
                <Play size={13} className="shrink-0 fill-current" />
                <span>
                  {isSpeaking && isPaused 
                    ? (language === "ms" ? "Sambung" : "Resume") 
                    : (language === "ms" ? "Dengar" : "Listen")}
                </span>
              </>
            )}
          </button>

          {isSpeaking && (
            <button
              onClick={handleStop}
              className="p-1.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg text-xs font-bold flex items-center justify-center transition active:scale-95"
              aria-label="Stop reading"
              title={language === "ms" ? "Berhenti" : "Stop"}
            >
              <Square size={13} className="shrink-0 fill-current text-red-500" />
            </button>
          )}

          {/* Rate Selector Badge */}
          <button
            onClick={cycleRate}
            className="px-2 py-1.5 bg-stone-50 dark:bg-stone-805/50 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg font-mono text-[10px] font-extrabold flex items-center gap-1 transition select-none"
            title={language === "ms" ? "Kelajuan suara" : "Voice speed (rate)"}
          >
            <span>{rate.toFixed(1)}x</span>
          </button>

          {/* Settings Trigger for choosing system voices */}
          {compatibleVoices.length > 1 && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg transition ml-auto flex items-center justify-center ${showSettings ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
              aria-label="Voice settings"
            >
              <Settings size={13} />
            </button>
          )}
        </div>

        {/* Detailed custom voice configurations */}
        {showSettings && compatibleVoices.length > 1 && (
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800/60 animate-[fadeIn_0.2s_ease-out]">
            <label htmlFor="voice-select" className="block text-[9px] uppercase tracking-wider font-extrabold text-stone-400 dark:text-stone-500 mb-1 font-mono">
              {language === "ms" ? "Pilih Suara Sistem:" : "Select System Voice:"}
            </label>
            <div className="relative">
              <select
                id="voice-select"
                onChange={(e) => selectVoice(e.target.value)}
                value={selectedVoice?.name || ""}
                className="w-full bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 px-2 py-1.5 rounded-lg text-[10px] text-stone-700 dark:text-stone-300 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none pr-6 cursor-pointer"
              >
                {compatibleVoices.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>
            <p className="text-[9px] text-stone-400 dark:text-stone-500 mt-1 leading-normal font-medium">
              {language === "ms" 
                ? "Sistem autopenyelarasan audio menggunakan suara terbina peranti yang menyokong Bahasa Melayu/Bahasa Indonesia." 
                : "TTS plays using your device's native system voices. Select any available voice from the list."}
            </p>
          </div>
        )}

        {/* Speech Error Status Banner */}
        {speechError && (
          <div className="p-1 px-2 border border-red-200 rounded-md bg-red-50 dark:bg-red-950/15 text-red-500 dark:text-red-400 flex items-center gap-1.5 text-[9px] font-bold">
            <AlertCircle size={10} className="shrink-0" />
            <span>{language === "ms" ? "Peranti tidak menetapkan suara untuk bahasa ini." : `Speech error: ${speechError}`}</span>
          </div>
        )}
      </div>

      {/* Styled equalizer animations in CSS */}
      <style jsx global>{`
        @keyframes equalizer {
          from {
            height: 15%;
          }
          to {
            height: 100%;
          }
        }
      `}</style>
    </div>
  );
}
