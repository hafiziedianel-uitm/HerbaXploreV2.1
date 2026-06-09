"use client";

import { useState } from "react";
import { MainMenu } from "@/components/MainMenu";
import { PharmacognosyDashboard } from "@/components/PharmacognosyDashboard";

export default function Home() {
  const [currentView, setCurrentView] = useState<"menu" | "explorer">("menu");

  return (
    <main className="min-h-screen font-sans bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {currentView === "menu" ? (
        <MainMenu onEnterApp={() => setCurrentView("explorer")} />
      ) : (
        <PharmacognosyDashboard onBackToMenu={() => setCurrentView("menu")} />
      )}
    </main>
  );
}

