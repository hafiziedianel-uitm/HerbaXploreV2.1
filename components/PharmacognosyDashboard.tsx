"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { plantsData, Plant, PlantPart, Compound, getCompoundBioactiveClass, getCompoundPharmacologicalActivities, getCompoundFormulationRoles } from "@/lib/data";
import { PlantViewer } from "./PlantViewer";
import { DetailsPanel } from "./DetailsPanel";
import { Leaf, ArrowLeft, Search, Moon, Sun, ChevronLeft, ChevronRight, Menu, X as CloseIcon, SlidersHorizontal, Filter, RotateCcw, Home } from "lucide-react";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/lib/LanguageContext";
import { translations, translateDb } from "@/lib/i18n";

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
  const [selectedPlant, setSelectedPlant] = useState<Plant>(plantsData[0]);
  const [selectedPart, setSelectedPart] = useState<PlantPart | null>(null);
  const [selectedCompound, setSelectedCompound] = useState<Compound | null>(null);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(true);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Custom Filters States
  const [selectedBioactive, setSelectedBioactive] = useState<string>("All");
  const [selectedPharmacology, setSelectedPharmacology] = useState<string>("All");
  const [selectedFormulation, setSelectedFormulation] = useState<string>("All");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const filteredPlants = plantsData.filter((p) => {
    // 1. Search Query text match
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      let matchesText = false;
      
      if (p.name.toLowerCase().includes(query)) matchesText = true;
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

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-stone-100 dark:bg-stone-950 transition-colors duration-300">
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
            <h1 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100 leading-tight">HerbaXplorer</h1>
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
                {selectedPlant.name}
              </button>
              
              {selectedPart && (
                <>
                  <span className="text-stone-300 dark:text-stone-600">/</span>
                  <button 
                    onClick={handleBackToPart}
                    className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${!selectedCompound ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}`}
                  >
                    {selectedPart.name}
                  </button>
                </>
              )}
              
              {selectedCompound && (
                <>
                  <span className="text-stone-300 dark:text-stone-600">/</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{selectedCompound.name}</span>
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

            {/* Search Plants Toggle */}
            <button
              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
              aria-label="Plant Database"
            >
              <Menu size={18} />
              <span className="text-sm font-bold">{t.plantsParams}</span>
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
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <h2 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">{t.plantDatabase}</h2>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                            {p.name}
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

        {/* Middle Column: Plant Viewer */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-stone-200/50 dark:bg-stone-950/50 transition-colors duration-300">
          {/* Mobile Menu Toggles */}
          {isMobile && (
            <button 
              onClick={() => setRightSidebarCollapsed(false)}
              className="absolute top-4 right-4 z-30 pointer-events-auto bg-white/90 dark:bg-stone-900/90 p-2.5 rounded-xl shadow-lg border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <PlantViewer 
            plant={selectedPlant} 
            selectedPart={selectedPart}
            onPartClick={handlePartClick} 
            onPartDoubleClick={handlePartDoubleClick}
            isMobile={isMobile}
          />
        </div>

        {/* Right Sidebar Overlay for Mobile */}
        {isMobile && !rightSidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setRightSidebarCollapsed(true)}
          />
        )}

        {/* Right Column: Details Panel */}
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
              <button onClick={() => setRightSidebarCollapsed(true)} className="text-stone-400 hover:text-stone-600">
                <CloseIcon size={18} />
              </button>
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
      </div>
    </div>
  );
}
