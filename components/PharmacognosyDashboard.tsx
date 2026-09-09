"use client";

import Image from "next/image";
import { UitmLogo } from "./UitmLogo";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { plantsData, Plant, PlantPart, Compound, getCompoundBioactiveClass, getCompoundPharmacologicalActivities, getCompoundFormulationRoles } from "@/lib/data";
import { PlantViewer } from "./PlantViewer";
import { DetailsPanel } from "./DetailsPanel";
import { PlantComparison } from "./PlantComparison";
import { 
  Leaf, ArrowLeft, Search, Moon, Sun, ChevronLeft, ChevronRight, Menu, X as CloseIcon, 
  SlidersHorizontal, Filter, RotateCcw, Home, Languages, AlertCircle, ShieldCheck, ShieldAlert,
  Wifi, WifiOff, RefreshCw, Trash2, Database, CheckCircle, DownloadCloud, Globe,
  ArrowLeftRight
} from "lucide-react";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/lib/LanguageContext";
import { translations, translateDb } from "@/lib/i18n";
import { 
  cachePlantMetadata, 
  precacheAllAssets, 
  getOfflineStats, 
  clearOfflineCaches 
} from "@/lib/offlineCache";
import { useBotDetection } from "@/lib/security";
import { BotShieldIndicator } from "./BotShieldIndicator";

const BIOACTIVE_OPTIONS = [
  "Flavonoid",
  "Alkaloid",
  "Fatty Acid",
  "Phenolic derivative / Organic Acid",
  "Polysaccharide / Gum",
  "Glycoside",
  "Phenylpropene / Aldehyde",
  "Ester",
];

const PHARMACOLOGY_OPTIONS = [
  "Anticancer / Anti-tumor",
  "Antipyretic (Fever-reducer)",
  "Anti-inflammatory",
  "Antioxidant",
  "Diuretic / Kidney Health",
  "Antiseptic / Antimicrobial",
  "Analgesic (Pain relief)",
  "Laxative / Bowel Regulator",
  "Neuroactive / Stimulant",
];

const FORMULATION_OPTIONS = [
  "Fatty Base / Ointment Base",
  "Solvent / Vehicle",
  "Emulsifier / Stabilizer",
  "Thickening / Gelling Agent",
];

interface PharmacognosyDashboardProps {
  onBackToMenu?: () => void;
}

export function PharmacognosyDashboard({ onBackToMenu }: PharmacognosyDashboardProps) {
  const isMobile = useIsMobile();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { language, setLanguage } = useLanguage();
  const t = translations[language];

  // ShieldX Bot & Spam Defense System
  const {
    humanScore: rawHumanScore,
    isBotConfirmed,
    rateLimitStatus,
    registerAction,
    triggerHoneypotFlag,
  } = useBotDetection();

  const [overrideBotFlag, setOverrideBotFlag] = useState(false);
  const activeBotFlag = isBotConfirmed && !overrideBotFlag;
  const humanScore = activeBotFlag ? 0 : (overrideBotFlag ? 100 : rawHumanScore);

  const [selectedPlant, setSelectedPlant] = useState<Plant>(plantsData[0]);
  const [selectedPart, setSelectedPart] = useState<PlantPart | null>(null);
  const [selectedCompound, setSelectedCompound] = useState<Compound | null>(null);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(true);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  
  // Custom Filters States
  const [selectedBioactive, setSelectedBioactive] = useState<string>("All");
  const [selectedPharmacology, setSelectedPharmacology] = useState<string>("All");
  const [selectedFormulation, setSelectedFormulation] = useState<string>("All");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(true);

  // Offline Sync and Network Status States
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [cacheStats, setCacheStats] = useState<{
    pdbInCache: string[];
    sdfInCache: string[];
    apisInCache: string[];
    totalCached: number;
  }>({
    pdbInCache: [],
    sdfInCache: [],
    apisInCache: [],
    totalCached: 0
  });

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
    const accepted = localStorage.getItem("herbaXplorerDisclaimerAccepted");
    if (accepted === "true") {
      setShowDisclaimer(false); // eslint-disable-line react-hooks/set-state-in-effect
    }

    // Cache plant metadata on load for true offline redundancy
    cachePlantMetadata(plantsData);

    // Register Progressive Web App (PWA) Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    if (typeof window !== "undefined") {
      setIsOnline(window.navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Load initial offline assets data
      getOfflineStats().then((stats) => setCacheStats(stats));

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncStatus(language === "ms" ? "Memulakan penyelarasan luar talian..." : "Starting offline sync...");
    
    try {
      await precacheAllAssets((prog, name) => {
        setSyncProgress(prog);
        setSyncStatus(name);
      });
      const updatedStats = await getOfflineStats();
      setCacheStats(updatedStats);
    } catch (err) {
      console.error("Sync failed:", err);
      setSyncStatus(language === "ms" ? "Ralat penyelarasan!" : "Sync encountered an error!");
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setSyncStatus("");
        setSyncProgress(0);
      }, 1500);
    }
  };

  const handleClearCache = async () => {
    const confirmMsg = language === "ms" 
      ? "Padam semua data model 3D yang disimpan luar talian?" 
      : "Clear all downloaded 3D structure data from offline cache?";
    if (window.confirm(confirmMsg)) {
      await clearOfflineCaches();
      const updatedStats = await getOfflineStats();
      setCacheStats(updatedStats);
    }
  };

  const handleSimulateSpam = () => {
    for (let i = 0; i < 15; i++) {
      registerAction("dashboard-interaction");
    }
  };

  const handleSearchChange = (val: string) => {
    if (registerAction("dashboard-interaction")) {
      setSearchQuery(val);
    }
  };

  const handleAcceptDisclaimer = () => {
    localStorage.setItem("herbaXplorerDisclaimerAccepted", "true");
    setShowDisclaimer(false);
  };

  const filteredPlants = plantsData.filter((p) => {
    // 1. Search Query text match
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      let matchesText = false;
      
      if (p.name.toLowerCase().includes(query)) matchesText = true;
      if (translateDb(p.name, language).toLowerCase().includes(query)) matchesText = true;
      if (p.scientificName?.toLowerCase().includes(query)) matchesText = true;
      
      for (const part of p.parts) {
        for (const compound of part.compounds) {
          if (compound.name.toLowerCase().includes(query)) matchesText = true;
          if (translateDb(compound.pharmacologicalActivity, language).toLowerCase().includes(query)) matchesText = true;
          if (translateDb(compound.therapeuticActivity, language).toLowerCase().includes(query)) matchesText = true;
        }
      }
      if (!matchesText) return false;
    }

    // 2. Selected Bioactive Compound Class
    if (selectedBioactive !== "All") {
      let matchesBioactive = false;
      for (const part of p.parts) {
        for (const compound of part.compounds) {
          if (getCompoundBioactiveClass(compound).includes(selectedBioactive)) {
            matchesBioactive = true;
            break;
          }
        }
        if (matchesBioactive) break;
      }
      if (!matchesBioactive) return false;
    }

    // 3. Selected Pharmacological Activity
    if (selectedPharmacology !== "All") {
      let matchesPharmacology = false;
      for (const part of p.parts) {
        for (const compound of part.compounds) {
          if (getCompoundPharmacologicalActivities(compound).includes(selectedPharmacology)) {
            matchesPharmacology = true;
            break;
          }
        }
        if (matchesPharmacology) break;
      }
      if (!matchesPharmacology) return false;
    }

    // 4. Selected Formulation Role
    if (selectedFormulation !== "All") {
      let matchesFormulation = false;
      for (const part of p.parts) {
        for (const compound of part.compounds) {
          if (getCompoundFormulationRoles(compound).includes(selectedFormulation)) {
            matchesFormulation = true;
            break;
          }
        }
        if (matchesFormulation) break;
      }
      if (!matchesFormulation) return false;
    }

    return true;
  });

  // Automatically select the first plant of the search results if current selection is filtered out
  useEffect(() => {
    if (filteredPlants.length > 0 && !filteredPlants.some(p => p.id === selectedPlant.id)) {
      setSelectedPlant(filteredPlants[0]); // eslint-disable-line react-hooks/set-state-in-effect
      setSelectedPart(null);
      setSelectedCompound(null);
    }
  }, [searchQuery, selectedBioactive, selectedPharmacology, selectedFormulation, filteredPlants, selectedPlant]);

  // Initialize sidebars based on mobile status
  useEffect(() => {
    if (!isMobile) {
      setLeftSidebarCollapsed(false); // eslint-disable-line react-hooks/set-state-in-effect
      setRightSidebarCollapsed(false);
    } else {
      setLeftSidebarCollapsed(true);
      setRightSidebarCollapsed(true);
    }
  }, [isMobile]);

  const handlePartClick = (part: PlantPart) => {
    setSelectedPart(part);
    setSelectedCompound(null);
    setRightSidebarCollapsed(false);
  };

  const handlePartDoubleClick = (part: PlantPart) => {
    setSelectedPart(part);
    setSelectedCompound(null);
    setRightSidebarCollapsed(false);
  };

  const handleCompoundClick = (compound: Compound) => {
    setSelectedCompound(compound);
  };

  const handleBackToPlant = () => {
    setSelectedPart(null);
    setSelectedCompound(null);
  };

  const handleBackToPart = () => {
    setSelectedCompound(null);
  };

  const handleNextPlant = () => {
    const currentIndex = filteredPlants.findIndex(p => p.id === selectedPlant.id);
    if (currentIndex !== -1 && filteredPlants.length > 0) {
      const nextIndex = (currentIndex + 1) % filteredPlants.length;
      setSelectedPlant(filteredPlants[nextIndex]);
      setSelectedPart(null);
      setSelectedCompound(null);
    }
  };

  const handlePrevPlant = () => {
    const currentIndex = filteredPlants.findIndex(p => p.id === selectedPlant.id);
    if (currentIndex !== -1 && filteredPlants.length > 0) {
      const prevIndex = (currentIndex - 1 + filteredPlants.length) % filteredPlants.length;
      setSelectedPlant(filteredPlants[prevIndex]);
      setSelectedPart(null);
      setSelectedCompound(null);
    }
  };

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  // Mobile Swipe Gesture Recognition
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const target = e.target as HTMLElement;
    // Do not trigger swipe on interactive elements like canvas, inputs, buttons
    if (
      target.tagName.toLowerCase() === 'canvas' ||
      target.tagName.toLowerCase() === 'select' ||
      target.tagName.toLowerCase() === 'input' ||
      target.tagName.toLowerCase() === 'option' ||
      target.closest('.no-swipe') ||
      target.closest('#glmol') ||
      target.closest('.interactive-3d') ||
      target.closest('button') ||
      target.closest('a')
    ) {
      return;
    }

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || touchStartX.current === null || touchStartY.current === null) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const diffX = endX - touchStartX.current;
    const diffY = endY - touchStartY.current;

    // Must be a horizontal swipe
    if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
      if (diffX > 0) {
        // Swiped Right -> reveal left sidebar OR close right sidebar
        if (!rightSidebarCollapsed) {
          setRightSidebarCollapsed(true);
        } else if (leftSidebarCollapsed) {
          setLeftSidebarCollapsed(false);
        }
      } else {
        // Swiped Left -> reveal right sidebar OR close left sidebar
        if (!leftSidebarCollapsed) {
          setLeftSidebarCollapsed(true);
        } else if (rightSidebarCollapsed) {
          setRightSidebarCollapsed(false);
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex flex-col h-screen overflow-hidden bg-stone-100 dark:bg-stone-950 transition-colors duration-300"
    >
      {/* Header */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 shadow-sm z-10 transition-colors duration-300">
        <div 
          onClick={onBackToMenu}
          className={`flex items-center gap-2 sm:gap-3 ${onBackToMenu ? 'cursor-pointer hover:opacity-90 select-none' : ''}`}
          title={onBackToMenu ? "Return to Main Menu Overview" : ""}
        >
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 sm:p-2 rounded-lg text-emerald-700 dark:text-emerald-400">
            <Leaf size={isMobile ? 20 : 24} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100 leading-tight">HerbaXplorer ©</h1>
            {!isMobile && <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">{t.interactiveMoleculeDB}</p>}
          </div>
        </div>
        
        {/* Breadcrumbs / Navigation */}
        <div className="flex items-center gap-3 sm:gap-6">
          {!isMobile && (
            <div className="flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400">
              <button 
                onClick={handleBackToPlant}
                className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${!selectedPart ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}`}
              >
                {translateDb(selectedPlant.name, language)}
              </button>
              
              {selectedPart && (
                <>
                  <span className="text-stone-300 dark:text-stone-600">/</span>
                  <button 
                    onClick={handleBackToPart}
                    className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${!selectedCompound ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}`}
                  >
                    {translateDb(selectedPart.name, language)}
                  </button>
                </>
              )}
              
              {selectedCompound && (
                <>
                  <span className="text-stone-300 dark:text-stone-600">/</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{translateDb(selectedCompound.name, language)}</span>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {onBackToMenu && (
              <button
                onClick={onBackToMenu}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold border border-stone-200/20 dark:border-stone-700/30 transition-colors"
                title="Back to Overview Guide"
              >
                <Home size={14} className="shrink-0" />
                <span className="text-xs sm:text-sm font-bold">{t.mainMenu}</span>
              </button>
            )}

            {/* ShieldX Security Bot Protection Indicator */}
            <BotShieldIndicator
              humanScore={humanScore}
              isBotConfirmed={isBotConfirmed}
              rateLimitStatus={rateLimitStatus}
              triggerHoneypotFlag={triggerHoneypotFlag}
              onSimulateSpam={handleSimulateSpam}
            />

            {/* Search Plants Toggle */}
            <button
              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
              aria-label="Plant Database"
            >
              <Menu size={18} />
              <span className="text-sm font-bold">{t.plantsParams}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ms' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-xs font-bold border border-stone-200/20 dark:border-stone-700/30"
              title="Change Language / Tukar Bahasa"
            >
              <Languages size={15} />
              <span>{language === 'en' ? 'English' : 'B. Melayu'}</span>
            </button>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {activeBotFlag ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-2xl text-center space-y-6"
            >
              <div className="w-16 h-16 mx-auto bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center animate-bounce">
                <ShieldAlert size={36} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 uppercase tracking-wider">
                  {language === 'en' ? "Access Temporarily Suspended" : "Akses Digantung Sementara"}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-semibold uppercase tracking-widest font-mono">
                  {language === 'en' ? "Anti-Bot Honeypot Intercept" : "Pintasan Honeypot Anti-Bot"}
                </p>
                <p className="text-sm text-stone-600 dark:text-stone-400 pt-2 leading-relaxed">
                  {language === 'en' 
                    ? "Our automated protection detected bot-like patterns (such as hidden form injection). To prove you are human and restore high-speed pharmacognosy access, please verify below."
                    : "Sistem pertahanan mengesan corak seumpama bot (seperti kemasukan borang tersembunyi). Sila lengkapkan pengesahan di bawah untuk meneruskan akses HerbaXplorer."}
                </p>
              </div>

              {/* Mini Puzzle */}
              <div className="bg-stone-50 dark:bg-stone-950 p-5 rounded-2xl border border-stone-150 dark:border-stone-800 space-y-4">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block font-mono">
                  {language === 'en' ? "Pharmacognosy Verification Challenge" : "Cabaran Pengesahan Farmakognosi"}
                </span>
                
                <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  {language === 'en'
                    ? 'Identify Orthosiphon stamineus by its popular name:'
                    : 'Kenal pasti Orthosiphon stamineus mengikut nama popularnya:'}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "misai-kucing", label: "Misai Kucing", correct: true },
                    { key: "tongkat-ali", label: "Tongkat Ali", correct: false },
                    { key: "gelenggang", label: "Gelenggang", correct: false },
                    { key: "dukung-anak", label: "Dukung Anak", correct: false }
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        if (item.correct) {
                          setOverrideBotFlag(true);
                        } else {
                          alert(language === 'en' ? "Incorrect, please select again!" : "Salah, sila pilih semula!");
                        }
                      }}
                      className="p-3 bg-white hover:bg-emerald-50 dark:bg-stone-900 dark:hover:bg-emerald-950/20 border border-stone-200 dark:border-stone-850 hover:border-emerald-300 dark:hover:border-emerald-900 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 transition active:scale-95 shadow-sm"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-stone-400 dark:text-stone-500">
                UiTM Faculty of Pharmacy • KIK NatureRx • Security Sandbox
              </p>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Invisible Honeypot Field */}
            <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden', zIndex: -1 }}>
              <label htmlFor="faculty_verification_hash">Verification Hash</label>
              <input
                id="faculty_verification_hash"
                name="faculty_verification_hash"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                onChange={(e) => {
                  if (e.target.value) {
                    triggerHoneypotFlag();
                  }
                }}
              />
            </div>

            {/* Left Sidebar Overlay for Mobile */}
        {isMobile && !leftSidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setLeftSidebarCollapsed(true)}
          />
        )}

        {/* Left Sidebar: Plant List */}
        <div className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'} 
          flex shrink-0 transition-all duration-300 
          ${leftSidebarCollapsed ? (isMobile ? '-translate-x-full' : 'w-0') : (isMobile ? 'w-[280px] translate-x-0' : 'w-64')}
        `}>
          <div className={`w-full bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-colors duration-300 h-full overflow-hidden ${leftSidebarCollapsed ? 'invisible opacity-0 pointer-events-none' : 'visible opacity-100'}`}>
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">{t.plantDatabase}</h2>
                <button
                  onClick={() => {
                    setIsCompareMode(!isCompareMode);
                    if (!isCompareMode) {
                      setRightSidebarCollapsed(true);
                    }
                  }}
                  className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border transition-all flex items-center gap-1 shrink-0 ${
                    isCompareMode 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'bg-stone-50 dark:bg-stone-850 hover:bg-emerald-500/10 hover:text-emerald-600 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400'
                  }`}
                  title={language === 'ms' ? 'Banding Tumbuhan Bersebelahan' : 'Compare Plants Side-by-Side'}
                  id="compare-mode-toggle-btn"
                >
                  <ArrowLeftRight size={10} />
                  <span>{language === 'ms' ? 'Banding' : 'Compare'}</span>
                </button>
              </div>
              {isMobile && (
                <button onClick={() => setLeftSidebarCollapsed(true)} className="text-stone-400 hover:text-stone-600">
                  <CloseIcon size={18} />
                </button>
              )}
            </div>
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex flex-col gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t.searchPlaceholder} 
                  className="w-full bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
              </div>

              {/* Filters Header toggle */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-[10px] font-bold text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors uppercase"
                >
                  <SlidersHorizontal size={11} />
                  <span>{t.interactiveSearchFilters}</span>
                  <span className="text-[9px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1.5 py-0.5 rounded-full font-sans font-extrabold shadow-sm">
                    {[selectedBioactive, selectedPharmacology, selectedFormulation].filter(v => v !== "All").length}
                  </span>
                </button>
                
                {(selectedBioactive !== "All" || selectedPharmacology !== "All" || selectedFormulation !== "All" || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBioactive("All");
                      setSelectedPharmacology("All");
                      setSelectedFormulation("All");
                      setSearchQuery("");
                    }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1 transition-colors uppercase font-sans shrink-0 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-100/50 dark:border-red-900/30"
                    title="Clear All Filters"
                  >
                    <RotateCcw size={10} />
                    <span>{t.reset}</span>
                  </button>
                )}
              </div>

              {/* Collapsible Filter Dropdowns */}
              {showFilters && (
                <div className="space-y-2.5 pt-1 border-t border-stone-100 dark:border-stone-800/60 animate-in slide-in-from-top-2 duration-200">
                  {/* Bioactive Class Filter */}
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase block mb-1">
                      {t.bioactiveType}
                    </label>
                    <select
                      value={selectedBioactive}
                      onChange={(e) => setSelectedBioactive(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                    >
                      <option value="All">{t.allPhytochemicals}</option>
                      {BIOACTIVE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>🧪 {translateDb(opt, language)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pharmacology Activity Filter */}
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase block mb-1">
                      {t.pharmacologyActivityFilter}
                    </label>
                    <select
                      value={selectedPharmacology}
                      onChange={(e) => setSelectedPharmacology(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                    >
                      <option value="All">{t.allBiologicalActions}</option>
                      {PHARMACOLOGY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>⚡ {translateDb(opt, language)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Formulation Role Filter */}
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase block mb-1">
                      {t.formulationRole}
                    </label>
                    <select
                      value={selectedFormulation}
                      onChange={(e) => setSelectedFormulation(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                    >
                      <option value="All">{t.allFormulationUses}</option>
                      {FORMULATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>🛠️ {translateDb(opt, language)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {filteredPlants.length === 0 ? (
                <div className="py-12 px-3 text-center">
                  <Filter size={24} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
                  <p className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.noResults}</p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 max-w-[200px] mx-auto mt-1 leading-normal">
                    {t.noResultsDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBioactive("All");
                      setSelectedPharmacology("All");
                      setSelectedFormulation("All");
                      setSearchQuery("");
                    }}
                    className="mt-4 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/10 transition"
                  >
                    {t.clearFilterCriteria}
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredPlants.map((p, idx) => {
                    const totalCompoundsInPlant = p.parts.reduce((acc, part) => acc + part.compounds.length, 0);
                    return (
                      <motion.button
                        key={p.id}
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ 
                          duration: 0.25, 
                          delay: Math.min(idx * 0.03, 0.3),
                          ease: "easeOut"
                        }}
                        whileHover={{ scale: 1.015, x: 2 }}
                        whileTap={{ scale: 0.985 }}
                        layout="position"
                        onClick={() => {
                          setSelectedPlant(p);
                          setSelectedPart(null);
                          setSelectedCompound(null);
                          if (isMobile) setLeftSidebarCollapsed(true);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl transition-all flex flex-col gap-1 ${
                          selectedPlant.id === p.id 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium shadow-sm border border-emerald-100 dark:border-emerald-800/50' 
                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full transition-colors shrink-0 ${selectedPlant.id === p.id ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-stone-300 dark:bg-stone-600'}`} />
                          <span className="leading-snug text-xs sm:text-sm font-semibold truncate flex-1">
                            {translateDb(p.name, language)}
                          </span>
                        </div>
                        <div className="pl-5 flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500 font-mono italic">
                          <span className="truncate max-w-[140px]">{p.scientificName}</span>
                          <span className="font-normal opacity-80 shrink-0">{totalCompoundsInPlant} {t.cmpds}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Offline Synchronization Controller Card */}
            <div className="p-3.5 bg-stone-50 dark:bg-stone-900/40 border-t border-stone-200/50 dark:border-stone-850 flex flex-col gap-2 shrink-0 select-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full ring-4 shrink-0 ${isOnline ? 'bg-emerald-500 ring-emerald-500/10' : 'bg-amber-500 ring-amber-500/15'}`} />
                  <p className="text-[11px] font-bold text-stone-700 dark:text-stone-300 truncate">
                    {isOnline 
                      ? (language === 'ms' ? 'Mod Atas Talian' : 'Online Mode') 
                      : (language === 'ms' ? 'Mod Luar Talian' : 'Offline Mode')}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-stone-200/50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded-md text-[9px] font-mono leading-none font-bold">
                  <Database size={10} />
                  <span>{cacheStats.totalCached} {language === 'ms' ? 'fail' : 'files'}</span>
                </div>
              </div>

              {isSyncing ? (
                <div className="bg-stone-100 dark:bg-stone-950 p-2 rounded-xl border border-stone-205 dark:border-stone-850 animate-pulse">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 mb-1 font-mono">
                    <span className="truncate max-w-[130px]">{syncStatus}</span>
                    <span className="shrink-0">{syncProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-150 ease-out" 
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal font-medium">
                    {cacheStats.totalCached > 0 
                      ? (language === 'ms' ? '✓ Model 3D sedia untuk kegunaan pengajian luar talian.' : '✓ 3D models available for offline visual reference.')
                      : (language === 'ms' ? 'Penyelarasan membolehkan semua struktur 3D diakses tanpa internet.' : 'Sync 3D models to study structures anytime without active internet.')}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={handleSyncAll}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20 py-1.5 px-2 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                      title="Sync all plant 3D molecular structures for offline access"
                    >
                      <DownloadCloud size={12} className="shrink-0 animate-bounce" />
                      <span>{language === 'ms' ? 'Muat Turun Semua' : 'Sync All Assets'}</span>
                    </button>
                    {cacheStats.totalCached > 0 && (
                      <button
                        onClick={handleClearCache}
                        className="bg-stone-200/50 hover:bg-stone-200 hover:text-red-600 dark:bg-stone-800 dark:hover:bg-red-950/30 dark:hover:text-red-400 p-1.5 rounded-lg text-stone-500 dark:text-stone-400 transition"
                        title="Delete cached offline databases to free space"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Left Toggle Button (Desktop only) */}
          {!isMobile && (
            <button 
              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
              className={`absolute top-1/2 -translate-y-1/2 z-30 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full p-1.5 shadow-lg text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all ${leftSidebarCollapsed ? 'left-2' : 'right-[-14px]'}`}
              title={leftSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {leftSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Middle Column: Plant Viewer / Comparison View */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-stone-200/50 dark:bg-stone-950/50 transition-colors duration-300">
          {/* Mobile Menu Toggles */}
          {isMobile && !isCompareMode && (
            <button 
              onClick={() => setRightSidebarCollapsed(false)}
              className="absolute top-4 right-4 z-30 pointer-events-auto bg-white/90 dark:bg-stone-900/90 p-2.5 rounded-xl shadow-lg border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {isCompareMode ? (
            <PlantComparison 
              onClose={() => setIsCompareMode(false)}
              initialLeftPlant={selectedPlant}
            />
          ) : (
            <PlantViewer 
              plant={selectedPlant} 
              selectedPart={selectedPart}
              onPartClick={handlePartClick} 
              onPartDoubleClick={handlePartDoubleClick}
              isMobile={isMobile}
              onNextPlant={handleNextPlant}
              onPrevPlant={handlePrevPlant}
              currentPlantIndex={filteredPlants.findIndex(p => p.id === selectedPlant.id)}
              totalPlantsCount={filteredPlants.length}
            />
          )}
        </div>

        {/* Right Sidebar Overlay for Mobile */}
        {/* Right Sidebar Overlay for Mobile */}
        {isMobile && !rightSidebarCollapsed && !isCompareMode && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setRightSidebarCollapsed(true)}
          />
        )}

        {/* Right Column: Details Panel */}
        {!isCompareMode && (
          <div className={`
            ${isMobile ? 'fixed inset-y-0 right-0 z-50' : 'relative'} 
            flex shrink-0 transition-all duration-300 
            ${rightSidebarCollapsed ? (isMobile ? 'translate-x-full' : 'w-0') : (isMobile ? 'w-[90%] translate-x-0' : 'w-[400px] xl:w-[480px]')}
          `}>
            {/* Right Toggle Button (Desktop only) */}
            {!isMobile && (
              <button 
                onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
                className={`absolute top-1/2 -translate-y-1/2 z-30 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full p-1.5 shadow-lg text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all ${rightSidebarCollapsed ? 'right-2' : 'left-[-14px]'}`}
                title={rightSidebarCollapsed ? "Expand Details" : "Collapse Details"}
              >
                {rightSidebarCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            )}

            <div className={`w-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-xl flex flex-col h-full overflow-hidden transition-colors duration-300 ${rightSidebarCollapsed ? 'invisible opacity-0 pointer-events-none' : 'visible opacity-100'}`}>
              <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0">
                <h2 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">{t.details}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLanguage(language === 'en' ? 'ms' : 'en')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-xs font-semibold border border-stone-200/20 dark:border-stone-700/30"
                    title="Change Language / Tukar Bahasa"
                  >
                    <Languages size={13} />
                    <span>{language === 'en' ? 'EN' : 'BM'}</span>
                  </button>
                  <button onClick={() => setRightSidebarCollapsed(true)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">
                    <CloseIcon size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <DetailsPanel 
                  plant={selectedPlant}
                  part={selectedPart}
                  compound={selectedCompound}
                  onCompoundClick={handleCompoundClick}
                  onBackToPlant={handleBackToPlant}
                  onBackToPart={handleBackToPart}
                  isMobile={isMobile}
                />
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Disclaimer Overlay Modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 md:p-8 max-h-[90vh] flex flex-col my-8"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-stone-150 dark:border-stone-800/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-amber-500/40 rounded-xl shadow-xs shrink-0 flex items-center justify-center min-w-[100px]">
                    <UitmLogo size="sm" className="h-8 w-auto" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-extrabold text-stone-800 dark:text-stone-100 uppercase tracking-wide">
                      {language === 'ms' ? 'Penafian & Maklumat Hak Cipta' : 'Disclaimer & Copyright Information'}
                    </h3>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500">
                      Faculty of Pharmacy • UiTM KIK Project HerbaXplorer © (CRLY2026W04274)
                    </p>
                  </div>
                </div>

                {/* Language quick switcher */}
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'en' ? 'ms' : 'en')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-xs font-semibold border border-stone-200/20"
                >
                  <Languages size={12} />
                  <span>{language === 'en' ? 'Bahasa Melayu' : 'English'}</span>
                </button>
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto py-5 pr-1 space-y-6 text-xs text-stone-600 dark:text-stone-300 leading-relaxed scrollbar-thin">
                {/* Section 1: Copyright Registration */}
                <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] p-4 rounded-2xl border border-emerald-500/10 dark:border-emerald-500/5 space-y-3">
                  <div className="flex gap-2.5 items-start">
                    <ShieldCheck className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={18} />
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide text-[11px]">
                          {language === 'ms' 
                            ? '1. Pemilikan Harta Intelek & Pendaftaran Karya' 
                            : '1. Intellectual Property Ownership & Work Registration'}
                        </h4>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-amber-500/30 text-[10px] font-bold text-stone-900 shadow-xs">
                          <UitmLogo size="sm" className="h-4 w-auto" />
                          <span>Owner (Pemunya): <strong>UNIVERSITI TEKNOLOGI MARA (UiTM)</strong></span>
                        </div>
                      </div>
                      <p className="text-[11px] whitespace-pre-line leading-relaxed text-stone-600 dark:text-stone-400">
                        {language === 'ms' ? (
                          <>
                            Karya ini didaftarkan di bawah kategori Karya Sastera sebagai sebuah perisian komputer dan aplikasi web pendidikan. Perlindungan hak cipta ini merangkumi dua (2) komponen utama ciptaan asal pembangun (Kumpulan NatureRx, UiTM):
                            {"\n\n"}
                            <strong>• Komponen Literasi & Pengekodan (Source Code & Database Compilation):</strong>{"\n"}
                            Merangkumi himpunan kod sumber (source code), skrip pengaturcaraan, dan seni bina sistem berasaskan awan (cloud-based architecture) yang dibangunkan secara asli bagi membolehkan fungsi visualisasi 3D, navigasi modul pembelajaran, dan penyepaduan (integration) data luaran (seperti NPRA dan PubChem) beroperasi secara masa nyata. Ia juga mencakupi teks modul asal dan struktur susun atur pangkalan data pendidikan (Knowledge Checker) yang direka khusus untuk kursus Farmakognosi.
                            {"\n\n"}
                            <strong>• Komponen Reka Bentuk Antaramuka & Pengalaman Pengguna (UI/UX Design Compilation):</strong>{"\n"}
                            Merangkumi kompilasi visual interaktif, reka letak (layout), hierarki maklumat, dan aliran navigasi sistem (user flow). Reka bentuk UI/UX ini merangkumi elemen antaramuka papan pemuka (dashboard), kawalan manipulasi model 3D (putaran dan zum), serta susun atur responsif yang dioptimumkan untuk pelbagai peranti pintar bagi tujuan pengajaran dan pembelajaran (PdP) sains yang efektif.
                          </>
                        ) : (
                          <>
                            {"This work is registered under the Literary Work category as a computer program and educational web application. This copyright protection covers two (2) primary components of the developer's original creation (Group NatureRx, UiTM):"}
                            {"\n\n"}
                            <strong>• Literacy & Coding Component (Source Code & Database Compilation):</strong>{"\n"}
                            Comprises the suite of source code, programming scripts, and cloud-based architecture natively engineered to support real-time 3D visualizations, custom learning module navigations, and integration with external platforms (such as NPRA and PubChem). It also covers original educational texts, layouts, and knowledge evaluation questionnaires custom-built for the Pharmacognosy course.
                            {"\n\n"}
                            <strong>• Interface Design & User Experience Component (UI/UX Design Compilation):</strong>{"\n"}
                            Encompasses interactive visual comps, layouts, informational hierarchy, and system navigation flow. This UI/UX compilation covers responsive dashboards, 3D molecular manipulation engines (rotation and zooming), and adaptive view layouts crafted to maximize scientific teaching and learning (T&L).
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Data Extraction Disclaimer */}
                <div className="bg-amber-500/[0.03] dark:bg-amber-500/[0.01] p-4 rounded-2xl border border-amber-500/10 dark:border-amber-500/5 space-y-3">
                  <div className="flex gap-2.5 items-start">
                    <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide text-[11px]">
                        {language === 'ms' 
                          ? '2. Penafian Pengambilan Data & Hak Cipta Rujukan' 
                          : '2. Data Extraction & Reference Copyright Disclaimer'}
                      </h4>
                      <p className="text-[11px] leading-relaxed text-stone-600 dark:text-stone-400">
                        {language === 'ms' ? (
                          <>
                            Bagi memudahkan pengajaran serta peningkatan kebolehcapaian maklumat berpusat yang mesra pelajar, HerbaXplorer memaparkan kompilasi maklumat saintifik dan rujukan luaran yang diekstrak secara terus daripada pangkalan data awam berwibawa (seperti <strong>Quest 3+ (NPRA Malaysia)</strong>, <strong>NMRShiftDB</strong>, <strong>PubChem</strong>, dan <strong>Google Scholar</strong>). Segala tanda dagang, hak milik asal, serta hak cipta penulisan/pangkalan data tersebut kekal mutlak di bawah hak proprietary pemilik dan sistem rujukan asal yang rasmi. HerbaXplorer mahupun Fakulti Farmasi tidak menuntut sebarang pemilikan atau hak cipta ke atas data yang diintegrasikan ini, di mana penggunaan data ini bertujuan mempercepatkan navigasi rujukan pelajar secara terkawal.
                            {"\n\n"}
                            Di samping itu, HerbaXplorer tidak menuntut sebarang hak milik atau memegang hak cipta ke atas imej dan gambar tumbuhan yang dipaparkan, di mana gambar-gambar tersebut diperolehi daripada carian Google (Google Search) secara awam khusus untuk tujuan bantuan visual pengajaran bilik darjah sahaja.
                          </>
                        ) : (
                          <>
                            To facilitate optimized digital teaching and centralize informational accessibility for pharmacy students, HerbaXplorer aggregates scientific records and references retrieved directly from external public repositories and state registries (such as <strong>Quest 3+ (NPRA Malaysia)</strong>, <strong>NMRShiftDB</strong>, <strong>PubChem</strong>, and <strong>Google Scholar</strong>). All intellectual property, trademarks, and associated copyright protections remain strictly proprietary to their respective official platforms, registers, and authors. Neither the Faculty of Pharmacy nor HerbaXplorer claims ownership, title, or copyright over this integrated reference data, which is presented solely to enable seamless scholastic navigation and study maneuvers.
                            {"\n\n"}
                            Furthermore, HerbaXplorer does not claim ownership or hold copyright over the pictures or illustrations of the plants displayed throughout the application, which are retrieved from public Google Search indexing specifically for classroom visual aid purposes.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-stone-150 dark:border-stone-800/80 flex items-center justify-end shrink-0 gap-3">
                <button
                  type="button"
                  onClick={handleAcceptDisclaimer}
                  className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-750 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 text-xs font-bold rounded-xl transition shadow-md shadow-emerald-500/10 active:scale-95 duration-150"
                >
                  {language === 'ms' ? 'Saya Faham & Setuju' : 'I Understand & Agree'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
