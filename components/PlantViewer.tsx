"use client";

import { Plant, PlantPart } from "@/lib/data";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Leaf } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { translations } from "@/lib/i18n";

interface PlantViewerProps {
  plant: Plant;
  selectedPart: PlantPart | null;
  onPartClick: (part: PlantPart) => void;
  onPartDoubleClick: (part: PlantPart) => void;
  isMobile?: boolean;
}

export function PlantViewer({ plant, selectedPart, onPartClick, onPartDoubleClick, isMobile }: PlantViewerProps) {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  const [prevImageUrl, setPrevImageUrl] = useState(plant.imageUrl);
  if (plant.imageUrl !== prevImageUrl) {
    setPrevImageUrl(plant.imageUrl);
    setImageLoaded(false);
  }

  return (
    <div className="flex-1 relative flex items-start justify-center md:items-center p-4 sm:p-8 overflow-y-auto custom-scrollbar">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
      
      {/* Container wraps the image perfectly so hotspot percentages are aligned, preventing layout crops */}
      <div 
        style={{
          minHeight: !imageLoaded ? "300px" : "auto",
          minWidth: !imageLoaded ? "280px" : "auto",
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
          className={`block w-auto h-auto max-w-full max-h-[65vh] sm:max-h-[75vh] md:max-h-[calc(100vh-180px)] object-contain transition-all duration-500 ease-out select-none ${
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
                  style={{ opacity: 0.4 }} // 60% transparency = 40% opacity
                >
                  <Leaf size={48} />
                </motion.div>
                <motion.p 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-3 text-xs font-mono font-medium text-stone-500/80 dark:text-stone-400/80 tracking-wide text-center"
                >
                  {language === "ms" ? "Memuatkan Imej..." : "Loading Image..."}
                </motion.p>
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
              const isActive = isSelected || isHovered;
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
                  onClick={() => onPartClick(part)}
                  onDoubleClick={() => onPartDoubleClick(part)}
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
                    className={`w-full h-full rounded-xl border-2 transition-all duration-300 relative ${
                      isSelected 
                        ? 'border-emerald-400 bg-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.5)]' 
                        : isHovered 
                          ? 'border-emerald-400 bg-emerald-400/40' 
                          : 'border-emerald-400/70 bg-emerald-400/10 hover:border-emerald-300 border-dashed backdrop-blur-[1px]'
                    }`}
                  >
                    {/* Pulsing ring for selected state */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 rounded-xl border-2 border-emerald-400"
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.15 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                      />
                    )}
                  </div>
                  
                  {/* Label */}
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

      {/* Compact Plant Title Overlay */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm px-3.5 py-2 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl shadow-md border border-stone-200/50 dark:border-stone-800/50 transition-colors duration-300 z-20 select-none max-w-[calc(100%-2rem)] sm:max-w-md">
        <h2 className="text-sm sm:text-2xl md:text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight leading-none">{plant.name}</h2>
        <p className="text-[10px] sm:text-sm md:text-base text-stone-500 dark:text-stone-400 italic font-serif leading-none mt-1 sm:mt-1.5">{plant.scientificName}</p>
        
        {/* Only show double-click notice on larger screens to keep mobile overlay as minimal as possible */}
        <p className="hidden sm:block text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase mt-2.5">
          {language === 'ms' ? 'Dwi-klik bahagian untuk terus ke ligan 3D' : 'Double-click parts to view 3D ligand viewer'}
        </p>
      </div>

      {/* Floating Bottom Instruction Banner - beautifully aligned, readable, and non-blocking */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md border border-stone-200/60 dark:border-stone-800/60 z-20 pointer-events-none flex items-center gap-1.5 text-center transition-all duration-300 select-none">
        <Leaf size={11} className="text-emerald-500 dark:text-emerald-400 animate-pulse shrink-0" />
        <span className="text-[9px] sm:text-xs font-semibold tracking-wider text-stone-600 dark:text-stone-300 uppercase leading-none">
          {language === 'ms' ? 'Ketik kawasan diserlahkan untuk butiran' : 'Tap highlighted areas for details'}
        </span>
      </div>
    </div>
  );
}
