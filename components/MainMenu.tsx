"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Leaf, 
  Dna, 
  Search, 
  Users, 
  Mail, 
  Check, 
  Copy, 
  Sun, 
  Moon, 
  Languages,
  ArrowRight,
  BookOpen,
  Target,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Globe,
  Compass,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause
} from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";
import { translations } from "@/lib/i18n";

interface MainMenuProps {
  onEnterApp: () => void;
}

export function MainMenu({ onEnterApp }: MainMenuProps) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"vision" | "academic" | "sdg" | "expert">("vision");

  const cardsToShow = 1;
  const [startIndex, setStartIndex] = useState(0);

  const keyPerformanceTargets = [
    {
      metric: "> 50%",
      label: t.lookupTime,
      detail: t.lookupTimeDesc
    },
    {
      metric: "TRL 7",
      label: t.techReadiness,
      detail: t.techReadinessDesc
    },
    {
      metric: "PHC614",
      label: t.curriculumSynergy,
      detail: t.curriculumSynergyDesc
    }
  ];

  const strategicSDGs = [
    {
      number: "SDG 3",
      title: t.sdg3Title,
      desc: t.sdg3Desc
    },
    {
      number: "SDG 4",
      title: t.sdg4Title,
      desc: t.sdg4Desc
    },
    {
      number: "SDG 9",
      title: t.sdg9Title,
      desc: t.sdg9Desc
    },
    {
      number: "SDG 12",
      title: t.sdg12Title,
      desc: t.sdg12Desc
    }
  ];

  const academicAlignments = [
    {
      tag: t.education50,
      desc: t.education50Desc
    },
    {
      tag: t.smartCampus,
      desc: t.smartCampusDesc
    },
    {
      tag: t.interactive3D,
      desc: t.interactive3DDesc
    }
  ];

  const committeeMembers = [
    {
      name: "En. Mohammad Hafizie Dianel Mohd Tazizi",
      role: "Leader & Web Design",
      title: "Pensyarah Farmasi",
      department: "Department of Pharmaceutical Chemistry",
      email: "hafiziedianel@uitm.edu.my",
      imagePath: "/hafizie-dianel.png"
    },
    {
      name: "En. Fairos Hamid",
      role: "Faculty KIK Coordinator & Supervisor",
      title: "Penyelaras KIK Fakulti",
      department: "Faculty of Pharmacy, UiTM",
      email: "fairos@uitm.edu.my",
      imagePath: "/fairos.png"
    },
    {
      name: "Dr. Abu Sadat Md Sayem",
      role: "Secretary & Pharmacology Expert",
      title: "Pensyarah Kanan",
      department: "Department of Pharmacology\n& Life Sciences",
      email: "asmsayem@uitm.edu.my",
      imagePath: "/abu-sadat.png"
    },
    {
      name: "Dr. Sabrina Sharmin",
      role: "Secretary Assistant & Chemistry Expert",
      title: "Pensyarah Kanan",
      department: "Department of Pharmaceutical Chemistry",
      email: "sabrina@uitm.edu.my",
      imagePath: "/sabrina.png.jpeg"
    },
    {
      name: "PM Dr. Syed Adnan Ali Shah",
      role: "Pharmacognosy Specialist",
      title: "Profesor Madya",
      department: "Department of Pharmaceutical Chemistry",
      email: "syedadnan@uitm.edu.my",
      imagePath: "/syed-adnan.png"
    },
    {
      name: "PM Dr. Sadia Sultan",
      role: "Pharmacognosy Specialist",
      title: "Profesor Madya",
      department: "Department of Pharmaceutical Chemistry",
      email: "sadia_sultan@uitm.edu.my",
      imagePath: "/sadia.png"
    },
    {
      name: "Dr. Kamran Ashraf",
      role: "Pharmacognosy Specialist",
      title: "Pensyarah Kanan",
      department: "Department of Pharmaceutical Chemistry",
      email: "kamran_ashraf@uitm.edu.my",
      imagePath: "/kamran.png"
    },
    {
      name: "Dr. Nur Syamimi Ariffin",
      role: "Documentation Member & Beta Tester",
      title: "Pensyarah Kanan",
      department: "Department of Pharmacology\n& Life Sciences",
      email: "nursyamimi@uitm.edu.my",
      imagePath: "/syamimi.png"
    },
    {
      name: "Pn. Nurul Farhanah Misripin",
      role: "Documentation Member & Beta Tester",
      title: "Pembantu Pegawai Sains Kanan",
      department: "Digital & Laboratory Support",
      email: "farhanah@uitm.edu.my",
      imagePath: "/farhanah.png"
    }
  ];

  const maxIndex = Math.max(0, committeeMembers.length - cardsToShow);
  const handlePrev = () => {
    setStartIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };
  const handleNext = useCallback(() => {
    setStartIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  // Autoplay and Swipe/Drag States
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false); // Hover/manual interaction pause
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  // Reliable mobile touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsInteracting(true);
    const touch = e.touches[0];
    if (touch) {
      setTouchStartX(touch.clientX);
      setTouchStartY(touch.clientY);
      setTouchEndX(touch.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      setTouchEndX(touch.clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsInteracting(false);
    if (touchStartX === null) return;

    // Use changedTouches if available, otherwise fallback to touchEndX
    const finalTouch = e.changedTouches[0];
    const endX = finalTouch ? finalTouch.clientX : touchEndX;
    const endY = finalTouch ? finalTouch.clientY : null;

    if (endX === null) return;

    const diffX = touchStartX - endX;
    const diffY = (touchStartY !== null && endY !== null) ? touchStartY - endY : 0;

    const swipeThreshold = 30; // lower threshold for highly responsive mobile swiping

    // Execute horizontal swipe if horizontal movement is dominant
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
    setTouchEndX(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsInteracting(true);
    setDragStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX === null) return;
    if (Math.abs(dragStartX - e.clientX) > 10) {
      e.preventDefault();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsInteracting(false);
    if (!isDragging || dragStartX === null) return;
    
    const distance = dragStartX - e.clientX;
    const swipeThreshold = 30;

    if (Math.abs(distance) > swipeThreshold) {
      if (distance > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    setIsDragging(false);
    setDragStartX(null);
  };

  const handleMouseLeave = () => {
    setIsInteracting(false);
    setIsDragging(false);
    setDragStartX(null);
  };

  // Autoplay management with interaction pausing
  useEffect(() => {
    if (!autoplayEnabled || isInteracting || isDragging) return;

    const timer = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [autoplayEnabled, isInteracting, isDragging, startIndex, maxIndex, handleNext]);

  const copyEmailToClipboard = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => {
      setCopiedEmail(null);
    }, 2000);
  };

  // Staggered transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div id="main-menu-root" className="min-h-screen relative flex flex-col justify-between transition-colors duration-300 bg-stone-50 dark:bg-stone-950 text-stone-950 dark:text-stone-100 overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-600 dark:selection:text-emerald-400">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-100/50 via-transparent to-stone-200/20 dark:from-stone-950 dark:via-transparent dark:to-stone-900/40 pointer-events-none" />
      
      {/* Interactive geometric hex grid backdrop matching PDF slide theme */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_15%,#000_70%,transparent_100%)] opacity-25 pointer-events-none animate-pulse-slow" />

      {/* HEADER SECTION */}
      <header className="relative w-full z-15 border-b border-stone-200/80 dark:border-stone-900 bg-white/70 dark:bg-stone-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            <Leaf size={16} className="animate-wiggle" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                UiTM KIK Project
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-800 dark:text-[#D4AF37] px-1.5 py-0.5 rounded border border-amber-500/15 font-bold leading-none">
                {t.groupName}
              </span>
            </div>
            <p className="text-[9px] font-medium text-stone-400 dark:text-stone-500">
              {t.deptName}
            </p>
          </div>
        </div>

        {/* Setting controllers */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage(language === "en" ? "ms" : "en")}
            className="px-3 py-1.5 flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors shadow-sm cursor-pointer text-xs font-bold uppercase tracking-wider"
            title="Toggle language"
          >
            <Languages size={14} />
            {language === "en" ? "EN" : "MS"}
          </button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors shadow-sm cursor-pointer"
            title="Toggle theme view"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* PRIMARY CONTEXT LANDING SCREEN */}
      <main className="flex-1 w-full max-w-[1300px] mx-auto px-6 py-12 md:py-16 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-12"
        >
          {/* HERO BANNER SECTION */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Brand Statement */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                <Sparkles size={11} className="text-emerald-600 dark:text-[#D4AF37]" />
                {t.interactiveExplorer}
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-stone-900 dark:text-white">
                {t.appTitle} <br />
                <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-[#D4AF37] dark:from-emerald-400 dark:via-emerald-300 dark:to-amber-300 bg-clip-text text-transparent font-black">
                  {t.appSubtitle}
                </span>
              </h1>

              <p 
                className="text-xs sm:text-sm md:text-base leading-relaxed text-stone-600 dark:text-stone-300 max-w-xl font-sans"
                dangerouslySetInnerHTML={{ __html: t.appDescription }}
              />

              <div className="flex flex-wrap gap-4 pt-1">
                <button
                  onClick={onEnterApp}
                  className="group relative px-6 py-4 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer border border-emerald-600/30 dark:border-emerald-500/30"
                >
                  <span>{t.launchPortal}</span>
                  <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Right Column: Key Performance Outcome Indicators */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
              {keyPerformanceTargets.map((item, id) => (
                <div 
                  key={id}
                  className="p-5 bg-white dark:bg-stone-900/60 rounded-2xl border border-stone-200/80 dark:border-stone-850/60 shadow-sm flex lg:flex-row flex-col items-start gap-4 transition-all hover:bg-white/90 dark:hover:bg-stone-900/90"
                >
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono font-black text-xl shrink-0 leading-none">
                    {item.metric}
                  </div>
                  <div className="space-y-1 text-left">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* PROJECT ACADEMIC DECK & PILLARS */}
          <motion.div variants={itemVariants} className="pt-8 border-t border-stone-200 dark:border-stone-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 text-left">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-bold">
                  {t.projectSpecs}
                </span>
                <h2 className="text-xl md:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                  {t.academicFramework}
                </h2>
              </div>

              {/* Deck Tabs */}
              <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-xl border border-stone-200/60 dark:border-stone-850">
                <button
                  onClick={() => setActiveTab("vision")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    activeTab === "vision" 
                      ? "bg-white dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                      : "text-stone-550 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100"
                  }`}
                >
                  {t.ourVision}
                </button>
                <button
                  onClick={() => setActiveTab("academic")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    activeTab === "academic" 
                      ? "bg-white dark:bg-stone-800 text-[#D4AF37] dark:text-[#D4AF37] shadow-sm" 
                      : "text-stone-550 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100"
                  }`}
                >
                  {t.nationalAgenda}
                </button>
                <button
                  onClick={() => setActiveTab("sdg")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    activeTab === "sdg" 
                      ? "bg-white dark:bg-stone-800 text-purple-600 dark:text-purple-400 shadow-sm" 
                      : "text-stone-550 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100"
                  }`}
                >
                  {t.sdgImpact}
                </button>
              </div>
            </div>

            {/* Tab content wrapper */}
            <div className="min-h-[170px] text-left">
              <AnimatePresence mode="wait">
                {activeTab === "vision" && (
                  <motion.div
                    key="vision"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-6 rounded-2xl shadow-sm space-y-3">
                      <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-450 font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                        <BookOpen size={11} />
                        Interactive Classroom Delivery
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                        {t.replacingStatic}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                        {t.replacingStaticDesc}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-6 rounded-2xl shadow-sm space-y-3">
                      <div className="inline-flex items-center gap-1.5 text-[10px] text-[#D4AF37] font-bold uppercase bg-amber-500/10 px-2 py-0.5 rounded">
                        <ShieldCheck size={11} />
                        Under KIK Supervision
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                        {t.projectEndorsements}
                      </h3>
                      <p 
                        className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: t.projectEndorsementsDesc }}
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === "academic" && (
                  <motion.div
                    key="academic"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    {academicAlignments.map((align, id) => (
                      <div key={id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                        <span className="font-mono text-xs text-[#D4AF37] font-black uppercase">
                          No. 0{id + 1} • Alignment
                        </span>
                        <h4 className="text-xs font-bold text-stone-950 dark:text-stone-100">
                          {align.tag}
                        </h4>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                          {align.desc}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === "sdg" && (
                  <motion.div
                    key="sdg"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    {strategicSDGs.map((sdg, idx) => (
                      <div key={idx} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-855 p-5 rounded-2xl shadow-sm flex flex-col gap-2.5">
                        <div className="w-fit text-[9px] font-mono leading-none py-1 px-2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 font-bold">
                          {sdg.number}
                        </div>
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight">
                          {sdg.title}
                        </h4>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal">
                          {sdg.desc}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* COMMITTEE PORTRAIT DIRECTORY SECTION */}
          <motion.div variants={itemVariants} className="pt-12 border-t border-stone-200 dark:border-stone-900 text-left">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-8">
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  <Users size={14} />
                  <span>{t.projectMembers}</span>
                </div>
                <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                  {t.taskforcePersonnel}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-450 font-sans max-w-xl">
                  {t.taskforceDesc}
                </p>
              </div>

              {/* Precise Slider Navigation Controls and Autoplay Switch */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0 bg-stone-100/80 dark:bg-stone-900/50 p-1.5 rounded-2xl border border-stone-200/50 dark:border-stone-800/80 backdrop-blur-sm shadow-sm">
                <button
                  onClick={() => setAutoplayEnabled(!autoplayEnabled)}
                  className={`p-1.5 px-2.5 rounded-xl flex items-center gap-1.5 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                    autoplayEnabled 
                      ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20" 
                      : "bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  }`}
                  title={autoplayEnabled ? "Pause Auto-play" : "Start Auto-play"}
                >
                  {autoplayEnabled ? (
                    <>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <Pause size={12} className="stroke-[2.5]" />
                      <span className="hidden sm:inline text-[9px]">Autoplay</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} className="stroke-[2.5] fill-current" />
                      <span className="hidden sm:inline text-[9px]">Play</span>
                    </>
                  )}
                </button>

                <div className="h-4 w-[1px] bg-stone-250 dark:bg-stone-800" />

                <button
                  onClick={handlePrev}
                  className="p-2 rounded-xl flex items-center justify-center transition-all bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:text-emerald-650 dark:hover:text-emerald-400 hover:shadow-sm hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                  aria-label="Previous taskforce member"
                >
                  <ChevronLeft size={16} className="stroke-[2.5]" />
                </button>
                <div className="text-[10.5px] font-mono font-bold text-stone-550 dark:text-stone-450 px-2 min-w-[70px] text-center select-none">
                  {startIndex + 1} - {Math.min(startIndex + cardsToShow, committeeMembers.length)} / {committeeMembers.length}
                </div>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-xl flex items-center justify-center transition-all bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:text-emerald-650 dark:hover:text-emerald-400 hover:shadow-sm hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                  aria-label="Next taskforce member"
                >
                  <ChevronRight size={16} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Slider Viewport Container - display exactly 1 card with interactive mouse/touch drag slide and infinite wrapping */}
            <div 
              className="overflow-hidden w-full relative py-2 max-w-4xl mx-auto select-none touch-pan-y cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseEnter={() => setIsInteracting(true)}
              onMouseLeave={() => {
                setIsInteracting(false);
                handleMouseLeave();
              }}
            >
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${startIndex * 100}%)` }}
              >
                {committeeMembers.map((member, idx) => (
                  <div 
                    key={idx} 
                    className="w-full shrink-0 px-1 md:px-2 transition-opacity duration-300"
                    style={{ 
                      opacity: idx === startIndex ? 1 : 0.3
                    }}
                  >
                    <div className="bg-white dark:bg-stone-900/40 border border-stone-200 dark:border-stone-900 rounded-3xl p-6 sm:p-8 hover:border-stone-300 dark:hover:border-stone-850 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center md:items-start text-left">
                        {/* Column 1: Spacious, high-definition crisp member photo */}
                        <div className="col-span-1 md:col-span-4 lg:col-span-4 flex justify-center md:justify-start shrink-0">
                          <div className="relative w-full max-w-[240px] sm:max-w-[280px] md:max-w-full aspect-[4/5] rounded-2xl overflow-hidden border border-emerald-500/15 dark:border-emerald-500/25 shadow-sm bg-stone-100 dark:bg-stone-955/50 group">
                            <Image 
                              src={member.imagePath} 
                              alt={member.name} 
                              fill
                              sizes="(max-width: 768px) 280px, 320px"
                              className="object-cover transition-all duration-500 group-hover:scale-[1.03]"
                              referrerPolicy="no-referrer"
                              priority={idx === 0}
                            />
                          </div>
                        </div>

                        {/* Column 2: Profile metadata with spacious typography description */}
                        <div className="col-span-1 md:col-span-8 lg:col-span-8 flex flex-col justify-between h-auto md:min-h-[280px]">
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono font-bold block whitespace-pre-line leading-relaxed mb-2">
                                {member.department}
                              </span>
                              <h4 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-stone-900 dark:text-white leading-tight tracking-tight">
                                {member.name}
                              </h4>
                              <p className="text-xs sm:text-sm text-stone-550 dark:text-stone-450 mt-1.5 font-medium italic">
                                {member.title}
                              </p>
                            </div>

                            <div className="h-px w-full bg-gradient-to-r from-stone-150 dark:from-stone-850 to-transparent" />

                            <div className="space-y-1.5">
                              <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] dark:text-amber-400 font-bold font-mono block">
                                {t.projectRole}
                              </span>
                              <h5 className="text-xs sm:text-sm font-extrabold text-emerald-800 dark:text-emerald-350 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/10 dark:border-emerald-500/15 px-3 py-1.5 rounded-xl inline-block leading-tight">
                                {member.role}
                              </h5>
                            </div>
                          </div>

                          {/* Contact and professional mail copying */}
                          <div className="pt-5 mt-6 border-t border-stone-100 dark:border-stone-850/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-350 font-mono truncate max-w-full">
                              <Mail size={14} className="text-emerald-600/70 dark:text-emerald-450/70 shrink-0" />
                              <span className="truncate select-all">{member.email}</span>
                            </div>

                            <button
                              onClick={() => copyEmailToClipboard(member.email)}
                              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                                copiedEmail === member.email 
                                  ? "bg-[#D4AF37]/15 border-[#D4AF37]/45 text-[#D4AF37]" 
                                  : "bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-emerald-500/40 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
                              }`}
                              title="Copy professional mail"
                            >
                              {copiedEmail === member.email ? (
                                <>
                                  <Check size={12} className="stroke-[3]" />
                                  <span>{t.copied}</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>{t.copyEmail}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* COMPLIANCE & LEGAL FOOTER STATS */}
      <footer className="relative w-full z-15 border-t border-stone-200 dark:border-stone-900 bg-stone-100/25 dark:bg-stone-950/35 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-stone-450 dark:text-stone-550 font-mono">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-center">
          <span>CLASSIFICATION DEPLOYMENT: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{t.active}</span></span>
          <span>COMPLIANCE INDEX: <span className="text-[#D4AF37] font-bold">{t.approved}</span></span>
          <span className="hidden md:inline">TRL: <span className="text-emerald-650 dark:text-emerald-400 font-bold">{t.demo}</span></span>
        </div>
        <div>
          <span>© {new Date().getFullYear()} NatureRx • HerbaXplorer</span>
        </div>
      </footer>
    </div>
  );
}
