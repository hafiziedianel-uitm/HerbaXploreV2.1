"use client";

import { Plant, PlantPart } from "@/lib/data";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef } from "react";
import { Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { translations } from "@/lib/i18n";

interface PlantViewerProps {
  plant: Plant;
  selectedPart: PlantPart | null;
  onPartClick: (part: PlantPart) => void;
  onPartDoubleClick: (part: PlantPart) => void;
  isMobile?: boolean;
  onNextPlant?: () => void;
  onPrevPlant?: () => void;
  currentPlantIndex?: number;
  totalPlantsCount?: number;
}

export function PlantViewer({ 
  plant, 
  selectedPart, 
  onPartClick, 
  onPartDoubleClick, 
  isMobile,
  onNextPlant,
  onPrevPlant,
  currentPlantIndex = 0,
  totalPlantsCount = 1
}: PlantViewerProps) {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [direction, setDirection] = useState<number>(1); // 1 for next (enters from right), -1 for prev (enters from left)
  const { language } = useLanguage();

  const [prevImageUrl, setPrevImageUrl] = useState(plant.imageUrl);
  if (plant.imageUrl !== prevImageUrl) {
    setPrevImageUrl(plant.imageUrl);
    setImageLoaded(false);
  }

  // Swipe gesture tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent event from bubbling up to parents (which controls sidebars)
    e.stopPropagation();

    const target = e.target as HTMLElement;
    if (
      target.closest("button") || 
      target.closest("a") || 
      target.closest(".no-swipe")
    ) {
      return;
    }

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();

    if (touchStartX.current === null || touchStartY.current === null) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const diffX = endX - touchStartX.current;
    const diffY = endY - touchStartY.current;

    // Detect horizontal swipe
    if (Math.abs(diffX) > 40 && Math.abs(diffY) < 40) {
      if (diffX > 0) {
        // Swipe Right -> View PREVIOUS plant
        if (onPrevPlant) {
          setDirection(-1);
          onPrevPlant();
        }
      } else {
        // Swipe Left -> View NEXT plant
        if (onNextPlant) {
          setDirection(1);
          onNextPlant();
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
      className="flex-1 relative flex flex-col items-center justify-start p-4 sm:p-8 overflow-y-auto custom-scrollbar select-none w-full"
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />

      {/* Slide Navigation Overlay */}
      {totalPlantsCount > 1 && (
        <div className="w-full max-w-xl flex items-center justify-between pointer-events-auto mt-16 sm:mt-12 px-2 select-none z-35 shrink-0 no-swipe">
          <button
            onClick={() => {
              if (onPrevPlant) {
                setDirection(-1);
                onPrevPlant();
              }
            }}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-800 shadow-md text-stone-600 dark:text-stone-300 hover:text-emerald-500 hover:border-emerald-500/50 active:scale-95 transition-all duration-200"
            title="Previous Plant"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 tracking-widest uppercase">
              {language === 'ms' ? 'MENEROKA SPESIES' : 'EXPLORING SPECIES'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {currentPlantIndex + 1}
              </span>
              <span className="text-xs text-stone-300 dark:text-stone-700">/</span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                {totalPlantsCount}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (onNextPlant) {
                setDirection(1);
                onNextPlant();
              }
            }}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-800 shadow-md text-stone-600 dark:text-stone-300 hover:text-emerald-500 hover:border-emerald-500/50 active:scale-95 transition-all duration-200"
            title="Next Plant"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Animated Species Viewport */}
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={plant.id}
          custom={direction}
          variants={{
            enter: (dir: number) => ({
              x: dir > 0 ? 140 : -140,
              opacity: 0,
              scale: 0.97
            }),
            center: {
              x: 0,
              opacity: 1,
              scale: 1
            },
            exit: (dir: number) => ({
              x: dir < 0 ? 140 : -140,
              opacity: 0,
              scale: 0.97
            })
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 350, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="w-full flex flex-col items-center"
        >
          {/* Main Visual Display Block */}
          <div className="w-full flex justify-center items-center py-4">
            <div 
              style={{
                minHeight: !imageLoaded ? "260px" : "auto",
                minWidth: !imageLoaded ? "240px" : "auto",
                maxWidth: "100%",
              }}
              className={
                imageLoaded 
                  ? "relative inline-block max-w-full rounded-[2rem] shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden text-left bg-stone-50 dark:bg-stone-950 transition-all duration-300"
                  : "relative rounded-[2rem] shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden text-left bg-stone-50 dark:bg-stone-950 transition-all duration-300 flex items-center justify-center p-8"
              }
            >
              <img
                src={plant.imageUrl}
                alt={plant.name}
                onLoad={() => setImageLoaded(true)}
                className={`block w-auto h-auto max-w-full max-h-[50vh] sm:max-h-[60vh] md:max-h-[calc(100vh-270px)] object-contain transition-all duration-500 ease-out select-none ${
                  imageLoaded ? "opacity-90 hover:opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-md"
                }`}
              />
                
              <AnimatePresence>
                {!imageLoaded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50/70 dark:bg-stone-950/70 backdrop-blur-[2px] z-20 pointer-events-none"
                  >
                    <motion.div
                      animate={{ 
                        rotate: 360,
                        scale: [1, 1.12, 1]
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 2.2, ease: "linear" },
                        scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                      }}
                      className="text-emerald-500/60 dark:text-emerald-400/60"
                      style={{ opacity: 0.4 }}
                    >
                      <Leaf size={40} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="absolute inset-0 group-wrapper">
                {/* Overlay to dim unselected parts when a part is selected */}
                <AnimatePresence>
                  {selectedPart && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 bg-stone-900/40 pointer-events-none z-0" 
                    />
                  )}
                </AnimatePresence>

                {/* Hotspots */}
                {plant.parts.map((part) => {
                  const isSelected = selectedPart?.id === part.id;
                  const isHovered = hoveredPart === part.id;
                  const isAnotherSelected = selectedPart !== null && !isSelected;

                  // Ensure minimum touch target size on mobile
                  const minSize = isMobile ? 44 : 0;

                  return (
                    <motion.button
                      key={part.id}
                      className="absolute group z-10"
                      style={{
                        left: `${part.coordinates.x}%`,
                        top: `${part.coordinates.y}%`,
                        width: `${Math.max(part.coordinates.width, (minSize / 400) * 100)}%`,
                        height: `${Math.max(part.coordinates.height, (minSize / 600) * 100)}%`,
                        minWidth: isMobile ? `${minSize}px` : 'auto',
                        minHeight: isMobile ? `${minSize}px` : 'auto',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPartClick(part);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onPartDoubleClick(part);
                      }}
                      onMouseEnter={() => setHoveredPart(part.id)}
                      onMouseLeave={() => setHoveredPart(null)}
                      animate={{
                        opacity: isAnotherSelected ? 0.3 : 1,
                        scale: isSelected ? 1.05 : 1,
                        zIndex: isSelected ? 20 : 10,
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      whileHover={{ scale: isAnotherSelected ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Highlight Box */}
                      <div 
                        className={`w-full h-full rounded-xl border-2 transition-all duration-350 relative ${
                          isSelected 
                            ? 'border-emerald-400 bg-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.5)]' 
                            : isHovered 
                              ? 'border-emerald-400 bg-emerald-400/40' 
                              : 'border-emerald-400/70 bg-emerald-400/10 hover:border-emerald-300 border-dashed backdrop-blur-[1px]'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            className="absolute inset-0 rounded-xl border-2 border-emerald-400"
                            initial={{ opacity: 0.8, scale: 1 }}
                            animate={{ opacity: 0, scale: 1.15 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                          />
                        )}
                      </div>
                      
                      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 shadow-xl whitespace-nowrap pointer-events-none ${
                        isSelected 
                          ? 'bg-emerald-600 text-white scale-100 opacity-100' 
                          : isHovered
                            ? 'bg-emerald-500 text-white scale-100 opacity-100'
                            : 'bg-white/95 dark:bg-stone-800/95 text-stone-700 dark:text-stone-300 scale-95 opacity-100 border border-emerald-100 dark:border-stone-700'
                      }`}>
                        {part.name}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Plant Title Overlay */}
          <div className="w-full max-w-xl text-center mb-4 select-none px-4">
            <h2 className="text-xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 tracking-tight leading-none">{plant.name}</h2>
            <p className="text-xs sm:text-base text-stone-500 dark:text-stone-400 italic font-serif mt-2 leading-tight">{plant.scientificName}</p>
          </div>

          {/* "How to use this explorer" Guide Section */}
          <div className="w-full max-w-xl bg-white/60 dark:bg-stone-900/40 backdrop-blur-sm border border-stone-200/50 dark:border-stone-800/50 rounded-2xl p-4 sm:p-5 mt-2 mb-16 transition-all duration-300 select-none">
            <h3 className="font-bold text-stone-800 dark:text-stone-200 text-xs sm:text-sm uppercase tracking-wider mb-3 text-center sm:text-left flex items-center justify-center sm:justify-start gap-1.5">
              <Leaf size={14} className="text-emerald-500 shrink-0" />
              {language === 'ms' ? 'Cara Menggunakan Peneroka ini' : 'How to Use this Explorer'}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-[11px] sm:text-xs text-stone-600 dark:text-stone-400">
              <li className="flex items-start gap-2.5">
                <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5 border border-emerald-500/10">1</div>
                <p className="leading-relaxed">
                  {language === 'ms' 
                    ? 'Dwi-ketik atau sapu pada tumbuhan untuk menukar spesies.' 
                    : 'Tap hotspots or swipe on page to navigate other plants.'}
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5 border border-emerald-500/10">2</div>
                <p className="leading-relaxed">
                  {language === 'ms' 
                    ? 'Ketik mana-mana bahagian tetingkap bercahaya (cth. Daun, Bunga) untuk memeriksa sebatian bioaktif.' 
                    : 'Tap any glowing parts (e.g., leaves, bark) to inspect extracted bioactive compounds.'}
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5 border border-emerald-500/10">3</div>
                <p className="leading-relaxed">
                  {language === 'ms' 
                    ? 'Pilih sebatian untuk mendedahkan struktur modeling 3D & sifat farmakologi kompaun.' 
                    : 'Select any chemical compound to render immersive 3D molecule models & target activities.'}
                </p>
              </li>
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Floating Bottom Touch Instruction Banner */}
      {isMobile && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-emerald-500/30 z-35 pointer-events-none flex items-center gap-1.5 text-center transition-all duration-300 select-none animate-bounce">
          <Leaf size={12} className="text-white shrink-0 animate-pulse" />
          <span className="text-[10px] font-extrabold tracking-wider uppercase leading-none">
            {language === 'ms' ? 'Sapu kiri/kanan untuk spesies lain' : 'Swipe left/right to browse plants'}
          </span>
        </div>
      )}
    </div>
  );
}
