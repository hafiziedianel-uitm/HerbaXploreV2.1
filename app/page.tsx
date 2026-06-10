"use client";

import { useState, useEffect } from "react";
import { MainMenu } from "@/components/MainMenu";
import { PharmacognosyDashboard } from "@/components/PharmacognosyDashboard";
import { Leaf } from "lucide-react";
import { motion } from "motion/react";

export default function Home() {
  const [currentView, setCurrentView] = useState<"menu" | "loading" | "explorer">("menu");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentView === "loading") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setCurrentView("explorer"), 200);
            return 100;
          }
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 150);
      
      return () => clearInterval(interval);
    }
  }, [currentView]);

  const handleEnterApp = () => {
    setProgress(0);
    setCurrentView("loading");
  };

  return (
    <main className="min-h-screen font-sans bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {currentView === "menu" && (
        <MainMenu onEnterApp={handleEnterApp} />
      )}
      
      {currentView === "loading" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.9, 1.1, 0.9], opacity: 1 }}
            transition={{
              scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
              opacity: { duration: 0.3 }
            }}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-emerald-100 dark:bg-emerald-950/40 border-2 border-emerald-500/30 flex items-center justify-center shadow-2xl mb-8 relative"
          >
            <div className="absolute inset-0 rounded-3xl bg-emerald-500/10 animate-ping opacity-50" style={{ animationDuration: '2s' }}></div>
            <Leaf className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 tracking-tight mb-2">
            Loading Resources...
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-8 font-mono animate-pulse">
            Downloading 3D Molecular Maps and Models
          </p>

          <div className="w-64 sm:w-80 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(100, progress)}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          </div>
          <span className="mt-4 text-[10px] font-mono font-bold text-stone-400 dark:text-stone-500">
            {Math.min(100, progress)}%
          </span>
        </div>
      )}

      {currentView === "explorer" && (
        <PharmacognosyDashboard onBackToMenu={() => setCurrentView("menu")} />
      )}
    </main>
  );
}

