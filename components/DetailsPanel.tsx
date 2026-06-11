"use client";

import { Plant, PlantPart, Compound, getCompoundBioactiveClass, getCompoundPharmacologicalActivities, getCompoundFormulationRoles } from "@/lib/data";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Beaker, Activity, Pill, ShoppingCart, Info, Dna, Maximize2, Minimize2, Headset, X, Search, Download, Network, Table, AlertCircle, Building2, Sparkles, ExternalLink, ChevronRight, HelpCircle, ZoomIn, ZoomOut, RotateCcw, Crosshair } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { MassSpectrumChart, NMRSpectrumChart, NMRDataTable, CNMRSpectrumChart, CNMRDataTable } from "./SpectrumCharts";
import { useLanguage } from "@/lib/LanguageContext";
import { translations, translateDb } from "@/lib/i18n";

function Interactive3DViewer({ compound, isVRMode, isMobile }: { compound: Compound, isVRMode: boolean, isMobile?: boolean }) {
  const { language } = useLanguage();
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showProtein, setShowProtein] = useState(true);
  const [showLigand, setShowLigand] = useState(true);
  const [showMisc, setShowMisc] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    let viewer: any = null;
    
    // Reset states on compound change
    setLoading(true);
    setError(false);
    setIsSpinning(false);
    
    const initViewer = async () => {
      if (!viewerRef.current || !(window as any).$3Dmol) return;
      
      try {
        // Clear previous
        viewerRef.current.innerHTML = '';
        
        viewer = (window as any).$3Dmol.createViewer(viewerRef.current, {
          backgroundColor: isVRMode ? 'black' : '#1c1917', // stone-900
        });
        viewerInstance.current = viewer;
        
        // Load PDB or SDF
        if (compound.pdbId) {
          const response = await fetch(`https://files.rcsb.org/download/${compound.pdbId}.pdb`);
          if (!response.ok) {
            throw new Error('Failed to fetch PDB structure');
          }
          const pdbData = await response.text();
          viewer.addModel(pdbData, "pdb");
          viewer.zoomTo();
        } else {
          // Fetch SDF from PubChem
          const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(compound.name)}/SDF?record_type=3d`);
          if (!response.ok) {
            throw new Error('Failed to fetch 3D structure');
          }
          const sdfData = await response.text();
          viewer.addModel(sdfData, "sdf");
          viewer.zoomTo();
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading 3D model:", err);
        setError(true);
        setLoading(false);
      }
    };

    // Give the script a moment to load if it hasn't
    if ((window as any).$3Dmol) {
      initViewer();
    } else {
      const checkInterval = setInterval(() => {
        if ((window as any).$3Dmol) {
          clearInterval(checkInterval);
          initViewer();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    return () => {
      if (viewerInstance.current) {
        viewerInstance.current.removeAllModels();
      }
    };
  }, [compound.name, compound.pdbId, isVRMode]);

  useEffect(() => {
    const viewer = viewerInstance.current;
    if (!viewer || loading || error || !(window as any).$3Dmol) return;

    viewer.removeAllSurfaces();
    viewer.setStyle({}, { hidden: true });

    const miscResn = ['HOH', 'WAT', 'NH3', 'NA', 'CL', 'MG', 'ZN', 'CA', 'K', 'SO4', 'PO4', 'NAG', 'MAN', 'EDO', 'FMT', 'GOL', 'DMS', 'ACT', 'PEG', 'PGE', 'SO3', 'NO3', 'IOD', 'BR', 'F'];

    if (compound.pdbId) {
      if (showProtein) {
        viewer.addSurface((window as any).$3Dmol.SurfaceType.VDW, { opacity: 0.85, color: '#e7e5e4' }, { hetflag: false });
      }
      if (showLigand) {
        viewer.setStyle({ hetflag: true }, { stick: { radius: 0.15 }, sphere: { scale: 0.3 } });
      }
      
      if (showMisc) {
        viewer.setStyle({ resn: miscResn }, { sphere: { radius: 0.35, color: 'cyan' } });
      } else if (showLigand) {
        viewer.setStyle({ resn: miscResn }, { hidden: true });
      }
    } else {
      if (showLigand) {
        viewer.setStyle({}, { stick: { radius: 0.15 }, sphere: { scale: 0.3 } });
      }
    }
    
    viewer.render();

  }, [loading, error, showProtein, showLigand, showMisc, compound.pdbId]);

  const handleZoomIn = () => viewerInstance.current?.zoom(1.2);
  const handleZoomOut = () => viewerInstance.current?.zoom(0.8);
  const handleRecenter = () => viewerInstance.current?.zoomTo();
  const toggleSpin = () => {
    const nextState = !isSpinning;
    setIsSpinning(nextState);
    if (viewerInstance.current) {
      if (nextState) {
        viewerInstance.current.spin("y", 1);
      } else {
        viewerInstance.current.spin(false);
      }
    }
  };
  const toggleFullscreen = () => {
    const elem = viewerRef.current?.parentElement;
    if (!elem) return;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((err: any) => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="flex-1 relative w-full h-full bg-stone-900 overflow-hidden group">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-stone-900/80 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-stone-900/80 backdrop-blur-sm text-stone-400">
          <p>Could not load 3D structure for {compound.name}</p>
          <p className="text-sm mt-2">Try another compound.</p>
        </div>
      )}
      <div ref={viewerRef} className="w-full h-full" style={{ position: 'relative' }} />
      
      {!isVRMode && !isMobile && (
        <div className="absolute top-6 left-6 text-stone-400 text-xs flex flex-col gap-3 pointer-events-none z-10 bg-stone-900/50 p-4 rounded-xl border border-stone-800 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-bold">L</div> 
            <span>Left Click + Drag to Rotate</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-bold">↕</div> 
            <span>Scroll Wheel to Zoom</span>
          </div>
        </div>
      )}

      {/* Floating Action Controls for 3D Viewer */}
      {!loading && !error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-stone-900/80 backdrop-blur-md p-2 rounded-2xl border border-stone-800 shadow-xl shadow-black/50">
          <button 
            onClick={toggleSpin}
            className={`p-2.5 rounded-xl transition-all ${isSpinning ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50' : 'text-stone-300 hover:bg-stone-800 border border-transparent'}`}
            title="Auto Rotate"
          >
            <RotateCcw size={18} className={isSpinning ? "animate-spin-slow" : ""} />
          </button>
          <div className="w-px h-6 bg-stone-700 mx-1"></div>
          <button 
            onClick={handleZoomOut}
            className="p-2.5 rounded-xl text-stone-300 hover:bg-stone-800 hover:text-white transition-all border border-transparent"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button 
            onClick={handleRecenter}
            className="p-2.5 rounded-xl text-stone-300 hover:bg-stone-800 hover:text-white transition-all border border-transparent"
            title="Recenter"
          >
            <Crosshair size={18} />
          </button>
          <button 
            onClick={handleZoomIn}
            className="p-2.5 rounded-xl text-stone-300 hover:bg-stone-800 hover:text-white transition-all border border-transparent"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <div className="w-px h-6 bg-stone-700 mx-1"></div>
          <button 
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl text-stone-300 hover:bg-stone-800 hover:text-white transition-all border border-transparent"
            title="Fullscreen"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      )}

      {/* Legend / Controls */}
      {!loading && !error && (
        <div className="absolute top-4 right-4 left-4 sm:left-auto flex flex-wrap gap-1.5 justify-end z-10 pointer-events-auto">
          {compound.pdbId && (
            <label className={`flex items-center gap-2 bg-stone-950/90 backdrop-blur-md py-1 px-2.5 rounded-lg border ${showProtein ? 'border-stone-700 shadow-md' : 'border-stone-900'} cursor-pointer transition-all duration-150 group`}>
              <div className={`w-3 h-3 rounded-full border flex items-center justify-center transition-colors shrink-0 ${showProtein ? 'bg-[#e7e5e4] border-[#e7e5e4]' : 'border-stone-700 bg-transparent'}`}></div>
              <input type="checkbox" checked={showProtein} onChange={e => setShowProtein(e.target.checked)} className="hidden" />
              <span className={`text-[11px] font-medium transition-colors select-none ${showProtein ? 'text-stone-200' : 'text-stone-500 group-hover:text-stone-400'}`}>
                {language === 'ms' ? 'Protein' : 'Protein'}
              </span>
            </label>
          )}
          <label className={`flex items-center gap-2 bg-stone-950/90 backdrop-blur-md py-1 px-2.5 rounded-lg border ${showLigand ? 'border-emerald-700/50 shadow-md' : 'border-stone-900'} cursor-pointer transition-all duration-150 group`}>
            <div className={`w-3 h-3 rounded-full border flex items-center justify-center transition-all shrink-0 text-[7px] font-bold ${showLigand ? 'bg-emerald-500 border-emerald-500 text-stone-950' : 'border-stone-700 bg-transparent text-transparent'}`}>
              ◆
            </div>
            <input type="checkbox" checked={showLigand} onChange={e => setShowLigand(e.target.checked)} className="hidden" />
            <span className={`text-[11px] font-medium transition-colors select-none ${showLigand ? 'text-emerald-400' : 'text-stone-500 group-hover:text-stone-400'}`}>
              {language === 'ms' ? 'Ligan' : 'Ligand'}
            </span>
          </label>
          {compound.pdbId && (
            <label className={`flex items-center gap-2 bg-stone-950/90 backdrop-blur-md py-1 px-2.5 rounded-lg border ${showMisc ? 'border-cyan-700/50 shadow-md' : 'border-stone-900'} cursor-pointer transition-all duration-150 group`}>
              <div className={`w-3 h-3 rounded-full border flex items-center justify-center transition-colors shrink-0 text-[7px] font-bold ${showMisc ? 'bg-cyan-500 border-cyan-500 text-stone-950' : 'border-stone-700 bg-transparent text-transparent'}`}>
                ●
              </div>
              <input type="checkbox" checked={showMisc} onChange={e => setShowMisc(e.target.checked)} className="hidden" />
              <span className={`text-[11px] font-medium transition-colors select-none ${showMisc ? 'text-cyan-400' : 'text-stone-500 group-hover:text-stone-400'}`}>
                {language === 'ms' ? 'Lain-lain' : 'Misc'}
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}

function Structure2DImage({ compound, onEnlarge }: { compound: Compound; onEnlarge: (url: string) => void }) {
  const [error, setError] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  const primaryUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(compound.name)}/PNG`;
  const fallbackUrl = compound.structure2DPlaceholder;
  const currentUrl = error ? fallbackUrl : primaryUrl;

  return (
    <div 
      className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700/50 p-4 flex items-center justify-center aspect-video relative overflow-hidden transition-colors duration-300 cursor-zoom-in group"
      onClick={() => onEnlarge(currentUrl)}
    >
      <Image 
        src={currentUrl} 
        alt={`2D structure of ${compound.name}`}
        fill
        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        referrerPolicy="no-referrer"
        unoptimized
        onError={() => setError(true)}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <span className="bg-white/90 dark:bg-stone-800/90 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border border-stone-200 dark:border-stone-700 flex items-center gap-1.5">
          <Maximize2 size={12} /> {t.enlarge}
        </span>
      </div>
    </div>
  );
}

import { PlantQuiz } from './PlantQuiz';

function NpraSearchSection({ plant }: { plant: Plant }) {
  const [activeTab, setActiveTab] = useState<"1" | "2">("1"); // "1" = Pharmaceutical, "2" = Cosmetic
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState<"6" | "1">("6"); // "6" = Active Ingredient, "1" = Product Name
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter out non-chemical compound suggestions for active ingredient search
  const suggestions = Array.from(new Set(
    plant.parts.flatMap(p => p.compounds.map(c => c.name))
  )).filter(Boolean).slice(0, 5);

  // Generate plant extract synonyms and scientific names
  const plantExtracts = Array.from(new Set([
    plant.name,
    plant.scientificName,
    ...(plant.synonyms || [])
  ])).filter(Boolean).slice(0, 4);

  const performSearch = async (termToSearch: string, category: "1" | "2", searchByMode: "6" | "1" = "6") => {
    if (!termToSearch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let res = await fetch(`/api/npra?term=${encodeURIComponent(termToSearch)}&category=${category}&searchBy=${searchByMode}`);
      if (res.status === 404) {
        res = await fetch(`/app/api/npra?term=${encodeURIComponent(termToSearch)}&category=${category}&searchBy=${searchByMode}`);
      }
      if (!res.ok) {
        throw new Error("Unable to contact Quest 3+ database proxy");
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setProducts(data.products || []);
      setHasSearched(true);
    } catch (err: any) {
      console.error(err);
      setError("Failed to query NPRA Quest 3+ system. Search offline or blocked.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm, activeTab, searchBy);
  };

  const selectSuggested = (ing: string) => {
    setSearchTerm(ing);
    setSearchBy("6"); // Active Ingredient
    performSearch(ing, activeTab, "6");
  };

  const selectShortcut = (term: string, mode: "6" | "1") => {
    setSearchTerm(term);
    setSearchBy(mode);
    performSearch(term, activeTab, mode);
  };

  // Run automatically when the plant changes
  useEffect(() => {
    const chemicalCompounds = plant.parts.flatMap(p => p.compounds.map(c => c.name)).filter(Boolean);
    const initialTerm = chemicalCompounds[0] || plant.name;
    setSearchTerm(initialTerm);
    setSearchBy("6");
    performSearch(initialTerm, "1", "6");
  }, [plant.id, plant.name, plant.parts]);

  // Common UI snippets to avoid code duplication
  const categoryToggler = (
    <div className="flex bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-lg text-xs font-semibold">
      <button 
        type="button"
        onClick={() => { setActiveTab("1"); performSearch(searchTerm, "1", searchBy); }}
        className={`px-3 py-1.5 rounded-md transition-all ${activeTab === "1" ? "bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm" : "text-stone-500 hover:text-stone-700 dark:text-stone-400"}`}
      >
        Pharmaceutical (MAL)
      </button>
      <button 
        type="button"
        onClick={() => { setActiveTab("2"); performSearch(searchTerm, "2", searchBy); }}
        className={`px-3 py-1.5 rounded-md transition-all ${activeTab === "2" ? "bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm" : "text-stone-500 hover:text-stone-700 dark:text-stone-400"}`}
      >
        Cosmetics (NOT)
      </button>
    </div>
  );

  const plantExtractsShortcuts = (
    <div className="bg-emerald-50/40 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-100/60 dark:border-emerald-900/30">
      <div className="flex items-center gap-1.5 mb-2">
        <Building2 size={13} className="text-emerald-700 dark:text-emerald-400" />
        <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 dark:text-emerald-400">Plant Extract Shortcuts:</p>
      </div>
      <p className="text-[10px] text-stone-500 dark:text-stone-400 mb-2 leading-relaxed">
        Search this whole plant as either a Registered Product (brand) or Active Ingredient:
      </p>
      <div className="flex flex-col gap-1.5">
        {plantExtracts.map((extract, idx) => (
          <div 
            key={idx} 
            className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-white dark:bg-stone-900/80 rounded-lg border border-stone-200/50 dark:border-stone-800"
          >
            <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 truncate max-w-[130px] sm:max-w-xs">{extract}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => selectShortcut(extract, "1")}
                className={`text-[9px] px-2 py-0.5 rounded-md font-bold tracking-wide transition-all border ${searchTerm.toLowerCase() === extract.toLowerCase() && searchBy === "1" ? "bg-emerald-500 text-white border-emerald-500" : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-450 border-emerald-500/20"}`}
              >
                📦 Brand Name
              </button>
              <button
                type="button"
                onClick={() => selectShortcut(extract, "6")}
                className={`text-[9px] px-2 py-0.5 rounded-md font-bold tracking-wide transition-all border ${searchTerm.toLowerCase() === extract.toLowerCase() && searchBy === "6" ? "bg-amber-500 text-white border-amber-500" : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-450 border-amber-500/20"}`}
              >
                🧪 Active Ingredient
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const activeIngredientsSuggestions = suggestions.length > 0 && (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400 dark:text-stone-500 mb-2">Detected Active Constituents:</p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((ing, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => selectSuggested(ing)}
            className={`text-[11px] px-2.5 py-1 rounded-full font-medium border transition-all ${searchTerm.toLowerCase() === ing.toLowerCase() && searchBy === "6" ? "bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300 shadow-sm" : "bg-white dark:bg-stone-800/85 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700/65"}`}
          >
            🧪 {ing}
          </button>
        ))}
      </div>
    </div>
  );

  const searchFormAndToggles = (
    <form onSubmit={handleSearchSubmit} className="space-y-3.5">
      <div className="flex flex-col gap-1.5 bg-stone-100 dark:bg-stone-900/60 p-2 rounded-xl">
        <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase px-1">Query Mode:</span>
        <div className="flex bg-stone-200/50 dark:bg-stone-850 p-0.5 rounded-lg text-[10px] font-bold w-full">
          <button 
            type="button"
            onClick={() => setSearchBy("6")}
            className={`flex-1 py-1.5 rounded-md transition-all text-center ${searchBy === "6" ? "bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm" : "text-stone-500 hover:text-stone-750 dark:text-stone-400"}`}
          >
            🧪 Search Active Ingredient
          </button>
          <button 
            type="button"
            onClick={() => setSearchBy("1")}
            className={`flex-1 py-1.5 rounded-md transition-all text-center ${searchBy === "1" ? "bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm" : "text-stone-500 hover:text-stone-750 dark:text-stone-400"}`}
          >
            📦 Search Brand/Product Name
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={searchBy === "6" ? "Search pharmacological compound..." : "Search product or brand name..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs py-2.5 pl-8 pr-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-stone-700 dark:text-stone-200 shadow-sm font-sans"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="text-xs px-4 py-2.5 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shrink-0 disabled:opacity-50 shadow-sm"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
    </form>
  );

  const resultsList = (isExpandedView: boolean = false) => (
    <div className={`mt-2 ${isExpandedView ? "flex-1 overflow-y-auto" : "min-h-[160px] flex flex-col justify-center"}`}>
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400 animate-pulse">Querying NPRA Quest 3+ Registry...</p>
        </div>
      ) : error ? (
        <div className="py-6 px-3 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 flex items-start gap-2.5">
          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-800 dark:text-red-300">Quest 3+ Search Error</p>
            <p className="text-[11px] text-red-600 dark:text-red-400/80 mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      ) : products.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 dark:text-stone-500 px-1 border-b border-stone-200/50 dark:border-stone-700/30 pb-1 mb-1">
            <span>PRODUCT REGISTERED ({products.length})</span>
            <span>REGISTRATION NO.</span>
          </div>
          <div className={`${isExpandedView ? "space-y-2 max-h-[50vh] overflow-y-auto pr-1" : "space-y-2 max-h-[220px] overflow-y-auto pr-1"}`}>
            {products.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-start justify-between gap-3 p-3 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all font-sans shadow-sm"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-xs font-bold text-stone-700 dark:text-stone-200 uppercase leading-snug">{item.name}</p>
                  <div className="flex items-center gap-1 text-[10px] text-stone-500">
                    <Building2 size={10} className="shrink-0 text-stone-400" />
                    <span className="truncate italic">Holder: {item.holder}</span>
                  </div>
                </div>
                <span className="text-[10.5px] font-mono font-extrabold px-2.5 py-1 bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded shrink-0 self-center tracking-wider shadow-inner">
                  {item.regNo}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : hasSearched ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <HelpCircle size={32} className="text-stone-300 dark:text-stone-600 mb-1.5" />
          <p className="text-xs font-bold text-stone-600 dark:text-stone-300">No Active Products Found</p>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 max-w-[240px] mt-0.5 leading-normal">
            Could not locate any registered product matching &ldquo;{searchTerm}&rdquo; using {searchBy === "6" ? "Active Ingredient" : "Brand Name"} under {activeTab === "1" ? "Pharmaceuticals" : "Cosmetics"} in Malaysia.
          </p>
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <Search size={32} className="text-stone-300 dark:text-stone-600 mb-1.5" />
          <p className="text-xs font-bold text-stone-600 dark:text-stone-300">Enter a query to lookup Malaysia registry</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 1. COMPACT EMBEDDED VIEW */}
      <div className="bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/50 rounded-2xl p-4 sm:p-5 transition-colors duration-300">
        <div className="flex items-center justify-between gap-3 mb-4 border-b border-stone-200/60 dark:border-stone-700/50 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-600 dark:text-emerald-500" />
            <h3 className="font-bold text-stone-800 dark:text-stone-100 text-xs sm:text-sm">
              Malaysia Registered Product Under NPRA (Quest 3+)
            </h3>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Toggle for Category */}
            <div className="hidden sm:block">
              {categoryToggler}
            </div>

            {/* Expand View Trigger */}
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              title="Enlarge Quest 3+ Search Workspace"
              className="flex items-center gap-1 text-[10px] px-2 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-emerald-600 dark:hover:text-emerald-400 text-stone-600 rounded-lg shadow-sm font-bold transition-all transition-colors shrink-0"
            >
              <Maximize2 size={12} />
              <span className="hidden xs:inline">Expand Panel</span>
            </button>
          </div>
        </div>

        {/* Small Toggler for Mobile */}
        <div className="block sm:hidden mb-4">
          {categoryToggler}
        </div>

        <div className="space-y-4">
          {/* QUEST 3+ Plant extract shortcut section first (before bioactives) */}
          {plantExtractsShortcuts}

          {/* Plant Bioactive Ingredients Section second */}
          {activeIngredientsSuggestions}

          {/* Search Inputs */}
          {searchFormAndToggles}

          {/* Search Outputs */}
          {resultsList(false)}
        </div>

        {/* Expand Invitation Footer (If results are long and not expanded, offer simple expand) */}
        {products.length > 3 && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="w-full text-center py-2 mt-2 bg-stone-100 dark:bg-stone-800 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-500 dark:text-stone-400 font-bold text-[10px] tracking-wide transition-all uppercase"
          >
            Show full results in expandable big screen dashboard Selection 🔍
          </button>
        )}

        <div className="mt-4 pt-2.5 border-t border-stone-200/50 dark:border-stone-700/50 flex items-center justify-between text-[9px] font-medium text-stone-400 dark:text-stone-500">
          <span>ONLINE REGULATORY COMPLIANCE AGENT</span>
          <a 
            href="https://quest3plus.bpfk.gov.my/pmo2/index.php" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            NPRA Portal <ExternalLink size={8} />
          </a>
        </div>
      </div>

      {/* 2. EXPANDED PORTAL/OVERLAY VIEW */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-5xl h-[92vh] sm:h-[86vh] bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between p-4 border-b border-stone-200/60 dark:border-stone-700/50 bg-white dark:bg-stone-950">
              <div className="flex items-center gap-2">
                <Sparkles className="text-emerald-600 dark:text-emerald-500 shrink-0" size={18} />
                <div className="min-w-0">
                  <h3 className="font-extrabold text-stone-800 dark:text-stone-100 text-xs sm:text-base truncate">
                    Malaysia Registered Product Under NPRA (Quest 3+)
                  </h3>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium hidden sm:block">
                    Real-time official Live database lookup proxy to Quest 3+ registry of NPRA, Malaysia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-850 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg border border-stone-200 dark:border-stone-700 transition flex items-center gap-1 text-[11px] font-bold"
              >
                <Minimize2 size={14} />
                <span>Minimize</span>
              </button>
            </div>

            {/* Modal Body - 2 Columns on desktop */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 select-text">
              
              {/* Left Column: Search Form and Tags (Scrollable) */}
              <div className="lg:col-span-5 p-4 overflow-y-auto border-b lg:border-b-0 lg:border-r border-stone-200/60 dark:border-stone-700/50 bg-stone-50/50 dark:bg-stone-900/30">
                
                {/* Category Toggler on Left block */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase block mb-1.5">Regulatory Category:</span>
                    <div className="flex bg-stone-200/65 dark:bg-stone-800 p-0.5 rounded-lg text-xs font-semibold w-full">
                      <button 
                        type="button"
                        onClick={() => { setActiveTab("1"); performSearch(searchTerm, "1", searchBy); }}
                        className={`flex-1 py-1.5 rounded-md transition-all text-center ${activeTab === "1" ? "bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm" : "text-stone-500 hover:text-stone-700 dark:text-stone-400"}`}
                      >
                        Pharmaceutical (MAL)
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setActiveTab("2"); performSearch(searchTerm, "2", searchBy); }}
                        className={`flex-1 py-1.5 rounded-md transition-all text-center ${activeTab === "2" ? "bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm" : "text-stone-500 hover:text-stone-700 dark:text-stone-400"}`}
                      >
                        Cosmetics (NOT)
                      </button>
                    </div>
                  </div>

                  {/* Scientific extracts first (above bioactives) */}
                  {plantExtractsShortcuts}

                  {/* Active Ingredients second */}
                  {activeIngredientsSuggestions}

                  {/* Form & inputs */}
                  {searchFormAndToggles}
                </div>
              </div>

              {/* Right Column: Search Results Dashboard (Full list display) */}
              <div className="lg:col-span-7 flex flex-col overflow-hidden bg-white dark:bg-stone-950 p-4">
                <div className="flex-1 overflow-y-auto pr-1">
                  {resultsList(true)}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-stone-200/50 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-950 flex flex-col xs:flex-row items-center justify-between gap-2 text-[9px] font-medium text-stone-400 dark:text-stone-500">
              <span className="uppercase">LIVE AGENT CONNECTED TO MALAYSIA NPRA QUEST 3+ SERVICE</span>
              <div className="flex items-center gap-3">
                <a 
                  href="https://quest3plus.bpfk.gov.my/pmo2/index.php" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                >
                  NPRA Portal <ExternalLink size={9} />
                </a>
                <button 
                  type="button" 
                  onClick={() => setIsExpanded(false)}
                  className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 font-bold uppercase transition"
                >
                  Close Modal
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

function PublicationsSection({ plantName, compoundName }: { plantName: string; compoundName: string }) {
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>("unconnected");
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    async function fetchPublications() {
      try {
        const response = await fetch(`/api/publications?plant=${encodeURIComponent(plantName)}&compound=${encodeURIComponent(compoundName)}`);
        if (!response.ok) {
          throw new Error("Failed to load publication records");
        }
        const data = await response.json();
        if (active) {
          setPublications(data.publications || []);
          setApiStatus(data.apiStatus || "success");
        }
      } catch (err: any) {
        console.error("Publications fetch error:", err);
        if (active) {
          setError(err.message || "Error reading academic archives");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchPublications();

    return () => {
      active = false;
    };
  }, [plantName, compoundName]);

  const scholarQueryUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(`"${plantName}" "${compoundName}"`)}`;

  return (
    <div className="space-y-4 border-t border-stone-200 dark:border-stone-800/80 pt-6 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            {t.academicPubs}
          </h4>
          <p className="text-[10px] text-stone-450 dark:text-stone-400 mt-1">
            {t.reconnectGoogle}
          </p>
        </div>
        <a 
          href={scholarQueryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-semibold cursor-pointer transition-colors w-max"
        >
          {t.checkGoogle} <ExternalLink size={12} />
        </a>
      </div>

      <div className="bg-stone-50 dark:bg-stone-900/40 rounded-2xl border border-stone-200 dark:border-stone-800/80 p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <div className="w-6 h-6 border-2 border-emerald-500 border-b-transparent rounded-full animate-spin"></div>
            <span className="text-[11px] font-mono text-stone-500 animate-pulse">Running live Europe PMC / Scholar sweep...</span>
          </div>
        ) : error ? (
          <div className="text-center p-6 text-stone-250">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <span className="text-xs font-semibold">Scholar aggregation offline</span>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 border-b border-stone-200 dark:border-stone-800 pb-2">
              <span>Target: &quot;{plantName}&quot; &amp; &quot;{compoundName}&quot;</span>
              <span className="text-emerald-600 dark:text-emerald-400">status: {apiStatus === 'success' ? 'Europe PMC linked' : 'cached fallback'}</span>
            </div>
            
            <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              {publications.length > 0 ? (
                publications.map((pub, idx) => (
                  <div key={idx} className="bg-white dark:bg-stone-900/60 p-3.5 rounded-xl border border-stone-150 dark:border-stone-800/50 hover:border-emerald-500/20 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-1.5">
                        <a 
                          href={pub.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition"
                        >
                          {pub.title}
                        </a>
                        <span className="shrink-0 text-[10px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 px-1.5 py-0.5 rounded">
                          {pub.year}
                        </span>
                      </div>
                      <p className="text-xs text-stone-550 dark:text-stone-400 italic mb-2">
                        {pub.authors}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 border-t border-stone-100 dark:border-stone-800/40 pt-2 shrink-0">
                      <span className="truncate max-w-[200px] text-emerald-600 dark:text-emerald-400 font-medium">🍃 {pub.journal}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span>Citations: {pub.citationCount}</span>
                        <a 
                          href={pub.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-400 hover:text-stone-800 dark:hover:text-white flex items-center gap-0.5 transition"
                        >
                          Source <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-stone-400">
                  No literature search publications found for this specific pairing.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DetailsPanelProps {
  plant: Plant;
  part: PlantPart | null;
  compound: Compound | null;
  onCompoundClick: (compound: Compound) => void;
  onBackToPlant: () => void;
  onBackToPart: () => void;
  isMobile?: boolean;
}

export function DetailsPanel({ 
  plant, 
  part, 
  compound, 
  onCompoundClick,
  onBackToPlant,
  onBackToPart,
  isMobile
}: DetailsPanelProps) {
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [isVRMode, setIsVRMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; title: string } | null>(null);
  const [enlargedChart, setEnlargedChart] = useState<{ compoundName: string } | null>(null);
  const [activeSpectrumTab, setActiveSpectrumTab] = useState<'1H' | '13C'>('1H');
  const { language } = useLanguage();
  const t = translations[language];

  const filteredCompounds = part?.compounds.filter(comp => 
    comp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    translateDb(comp.pharmacologicalActivity, language).toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-stone-900 relative transition-colors duration-300 custom-scrollbar h-full">
      <AnimatePresence mode="wait">
        {/* VIEW 3: COMPOUND DETAILS */}
        {compound && part && (
          <motion.div 
            key="compound-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="px-6 pb-24 pt-0"
          >
            <div className="sticky top-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md z-30 pt-6 pb-3 mb-6 border-b border-stone-100 dark:border-stone-800/60 -mx-6 px-6">
              <button 
                onClick={onBackToPart}
                className="flex items-center gap-2 text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                {t.backTo} {part.name}
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg sm:p-2.5 sm:rounded-xl text-emerald-700 dark:text-emerald-400">
                <Dna size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100">{compound.name}</h2>
                {compound.percent !== undefined && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
                      <span className="font-bold">{compound.percent}%</span> {t.presentIn} {part.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Categorization Metadata Panel */}
            <div className="bg-stone-50 dark:bg-stone-800 rounded-2xl p-4 mb-6 border border-stone-200 dark:border-stone-800 flex flex-col gap-3 transition-colors duration-300">
              {/* Bioactive Class */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                  {t.bioCompoundCat}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {getCompoundBioactiveClass(compound).map((cls) => (
                    <span
                      key={cls}
                      className="text-xs bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-semibold px-2.5 py-1 rounded-lg border border-emerald-500/10 flex items-center gap-1 shrink-0"
                    >
                      <span>🧪</span> {cls}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pharmacology Activities */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                  {t.associatedPharm}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {getCompoundPharmacologicalActivities(compound).map((act) => (
                    <span
                      key={act}
                      className="text-xs bg-blue-500/10 text-blue-800 dark:text-blue-400 font-semibold px-2.5 py-1 rounded-lg border border-blue-500/10 flex items-center gap-1 shrink-0"
                    >
                      <span>⚡</span> {act}
                    </span>
                  ))}
                </div>
              </div>

              {/* Formulation Role */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                  {t.formulationFunc}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {getCompoundFormulationRoles(compound).map((role) => (
                    <span
                      key={role}
                      className="text-xs bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold px-2.5 py-1 rounded-lg border border-amber-500/10 flex items-center gap-1 shrink-0"
                    >
                      <span>🛠️</span> {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* 2D Structure */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-2">
                    <Beaker size={16} />
                    2D Structure
                  </h3>
                  <a 
                    href={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(compound.name)}/SDF?record_type=2d`}
                    download={`${compound.name}.sdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-700 dark:hover:text-emerald-400 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                  >
                    <Download size={12} /> .sdf
                  </a>
                </div>
                <Structure2DImage 
                  key={compound.id} 
                  compound={compound} 
                  onEnlarge={(url) => setEnlargedImage({ url, title: `${compound.name} - 2D Structure` })} 
                />
              </section>

              {/* 3D Binding Interaction */}
              {!compound.hide3D && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-2">
                      <Dna size={16} />
                      3D Binding Interaction {compound.pdbId && <span className="text-emerald-500 font-mono text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded">PDB: {compound.pdbId}</span>}
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIs3DModalOpen(true)}
                        className="text-stone-400 dark:text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1"
                        title="Enlarge 3D View"
                      >
                        <Maximize2 size={16} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setIs3DModalOpen(true)}
                    className="w-full bg-stone-950 hover:bg-stone-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center aspect-video text-center border border-stone-800 hover:border-emerald-500/50 shadow-inner relative group transition-all duration-300 select-none pb-4"
                  >
                    {/* Futuristic Grid and Glow */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_60%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0%,transparent_60%)] transition-colors duration-500 pointer-events-none" />
                    
                    {/* Abstract Molecule Nodes */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-12 flex justify-center items-center pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
                      <div className="relative w-40 h-20">
                        {/* Central Node */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        
                        {/* Branch 1 */}
                        <div className="absolute top-4 left-6 w-3 h-3 rounded-full bg-emerald-400"></div>
                        <div className="absolute top-1/2 left-[20%] w-px h-10 bg-gradient-to-tr from-emerald-500/50 to-emerald-400/50 origin-bottom-left rotate-[35deg]"></div>
                        
                        {/* Branch 2 */}
                        <div className="absolute bottom-4 right-6 w-3.5 h-3.5 rounded-full bg-cyan-400"></div>
                        <div className="absolute top-1/2 left-1/2 w-16 h-px bg-gradient-to-r from-emerald-500/50 to-cyan-400/50 origin-left rotate-[15deg]"></div>
                        
                        {/* Branch 3 */}
                        <div className="absolute top-3 right-10 w-2 h-2 rounded-full bg-amber-400"></div>
                        <div className="absolute top-1/2 left-1/2 w-14 h-px bg-gradient-to-r from-emerald-500/50 to-amber-400/50 origin-left -rotate-[45deg]"></div>
                      </div>
                    </div>

                    {/* Central Button & Pulse */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-stone-900 border border-stone-800 group-hover:border-emerald-500/50 group-hover:bg-stone-800 transition-all duration-300 shadow-xl mb-4">
                        {/* Pulse effect */}
                        <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping opacity-75 group-hover:opacity-100" />
                        <Dna size={24} className="text-emerald-500 animate-pulse" />
                      </div>
                      
                      <div className="font-bold text-sm text-stone-200 group-hover:text-emerald-400 transition-colors uppercase tracking-wider mb-1 px-4">
                        {language === 'ms' ? 'Ketik Untuk Skrin Penuh' : 'Click for Fullscreen'}
                      </div>
                      <div className="text-xs text-stone-500 group-hover:text-stone-400 transition-colors max-w-[250px] mx-auto px-4 leading-relaxed">
                        {language === 'ms' 
                          ? 'Klik untuk memuat dan berinteraksi dengan model protein & ligan.' 
                          : 'Load and interact with 3D complex modeling structure.'}
                      </div>
                    </div>
                  </button>
                </section>
              )}

              {/* Structural Key Facts & Functional Groups */}
              {compound.keyFact && (
                <section>
                  <h3 className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Info size={16} />
                    {language === 'ms' ? 'Fakta Penting' : 'Key Structural Fact'}
                  </h3>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/50 p-5 transition-colors duration-300">
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-medium italic">&ldquo;{translateDb(compound.keyFact, language)}&rdquo;</p>
                  </div>
                </section>
              )}

              {compound.functionalGroups && compound.functionalGroups.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Network size={16} />
                    {language === 'ms' ? 'Kumpulan Berfungsi' : 'Key Functional Groups'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {compound.functionalGroups.map((group, idx) => (
                      <div key={idx} className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-100 dark:border-stone-700 transition-colors duration-300 hover:border-emerald-500/50">
                        <div className="font-bold text-stone-800 dark:text-stone-200 mb-1">{translateDb(group.name, language)}</div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{translateDb(group.description, language)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Pharmacological Activity */}
              <section>
                <h3 className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity size={16} />
                  Pharmacological Activity
                </h3>
                <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 p-5 transition-colors duration-300">
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">{translateDb(compound.pharmacologicalActivity, language)}</p>
                </div>
              </section>

              {/* Therapeutic Activity */}
              <section>
                <h3 className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Pill size={16} />
                  Therapeutic Activity
                </h3>
                <div className="bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-5 transition-colors duration-300">
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">{translateDb(compound.therapeuticActivity, language)}</p>
                </div>
              </section>

              {/* Chemical Composition Breakdown */}
              {compound.composition && (
                <section>
                  <h3 className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Table size={16} />
                    Chemical Composition Breakdown
                  </h3>
                  <div className="bg-stone-50 dark:bg-stone-800/30 rounded-2xl border border-stone-200/60 dark:border-stone-800 p-5 space-y-4 transition-colors duration-300">
                    <div className="flex justify-between items-center text-xs text-stone-400 font-semibold px-1">
                      <span>Fatty Acid Component</span>
                      <span>Percentage / Formula</span>
                    </div>
                    <div className="space-y-3">
                      {compound.composition.map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-stone-800 dark:text-stone-200">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-stone-500 dark:text-stone-400">{item.formula}</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">{item.percentage}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.1 }}
                              className="bg-emerald-500 h-full rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed pt-2 border-t border-stone-200 dark:border-stone-800/80">
                      Cocoa butter is composed of a high concentration of saturated and monounsaturated stearic, palmitic, and oleic fatty acids. This unique crystalline structure accounts for its stable, solid consistency at room temperature while allowing it to melt evenly right at average human body temperature.
                    </p>
                  </div>
                </section>
              )}

              {/* Pharmaceutical Analysis */}
              {compound.pharmaceuticalAnalysis && (
                <section className="space-y-5 sm:space-y-6">
                  <h3 className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-2">
                    <Beaker size={16} />
                    Pharmaceutical Analysis
                  </h3>
                  
                  {/* Text Data */}
                  <div className="grid grid-cols-1 gap-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-100 dark:border-stone-700">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-stone-500 dark:text-stone-400">Molecular Weight:</span>
                      <span className="font-mono font-medium text-stone-800 dark:text-stone-200">{compound.pharmaceuticalAnalysis.molecularWeight}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-stone-500 dark:text-stone-400">Nominal mass:</span>
                      <span className="font-mono font-medium text-stone-800 dark:text-stone-200">{compound.pharmaceuticalAnalysis.nominalMass}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-stone-500 dark:text-stone-400">Isotope formula:</span>
                      <span className="font-mono font-medium text-stone-800 dark:text-stone-200">{compound.pharmaceuticalAnalysis.isotopeFormula}</span>
                    </div>
                  </div>

                  {/* Interactive Charts */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Mass Spectrum</p>
                      <div className="relative h-64 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900/50 p-2">
                        <MassSpectrumChart compoundName={compound.name} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center justify-between w-full">
                        <span>1H NMR Chemical shifts</span>
                        <span className="lowercase text-[9px] text-stone-500 dark:text-stone-400 font-normal">Click to expand & assignments</span>
                      </p>
                      <div className="relative h-64 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900/50 p-2 hover:border-cyan-500/50 transition-colors">
                        <NMRSpectrumChart compoundName={compound.name} onClick={() => { setActiveSpectrumTab('1H'); setEnlargedChart({ compoundName: compound.name }); }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center justify-between w-full">
                        <span>13C NMR (CNMR) spectrum</span>
                        <span className="lowercase text-[9px] text-stone-500 dark:text-stone-400 font-normal">Click to view carbon assignments</span>
                      </p>
                      <div className="relative h-64 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900/50 p-2 hover:border-purple-500/50 transition-colors">
                        <CNMRSpectrumChart compoundName={compound.name} onClick={() => { setActiveSpectrumTab('13C'); setEnlargedChart({ compoundName: compound.name }); }} />
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer w-max" onClick={() => { setActiveSpectrumTab('1H'); setEnlargedChart({ compoundName: compound.name }); }}>
                        <Table size={12} /> View Full Spectra &amp; Assignments Table
                      </p>
                    </div>

                    {/* Dynamic Google Scholar Publication Integration widget */}
                    <PublicationsSection plantName={plant.name} compoundName={compound.name} />
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: PART DETAILS */}
        {!compound && part && (
          <motion.div 
            key="part-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="px-6 pb-24 pt-0"
          >
            <div className="sticky top-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md z-30 pt-6 pb-3 mb-6 border-b border-stone-100 dark:border-stone-800/60 -mx-6 px-6">
              <button 
                onClick={onBackToPlant}
                className="flex items-center gap-2 text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                {t.backTo} {plant.name}
              </button>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100 mb-2 sm:mb-3">{part.name}</h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-base sm:text-lg">{translateDb(part.description, language)}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Beaker size={16} />
                {language === 'ms' ? 'Sebatian Yang Diekstrak' : 'Extracted Compounds'}
              </h3>

              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-stone-400 dark:text-stone-500" />
                </div>
                <input
                  type="text"
                  placeholder={t.searchCompounds}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
              </div>
              
              <div className="space-y-3">
                {filteredCompounds.length > 0 ? (
                  filteredCompounds.map((comp) => (
                    <button
                      key={comp.id}
                      onClick={() => onCompoundClick(comp)}
                      className="w-full text-left bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20 transition-all duration-200 rounded-2xl p-5 group flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{comp.name}</h4>
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 line-clamp-1">{translateDb(comp.pharmacologicalActivity, language)}</p>
                      </div>
                      <div className="bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 p-2 rounded-full transition-colors shrink-0 ml-4">
                        <ArrowLeft size={20} className="rotate-180" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700/50 border-dashed transition-colors duration-300">
                    <p className="text-stone-500 dark:text-stone-400 text-sm">
                      {language === 'ms' ? `Tiada sebatian ditemui yang padan dengan "${searchQuery}"` : `No compounds found matching "${searchQuery}"`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 1: PLANT DETAILS */}
        {!compound && !part && (
          <motion.div 
            key="plant-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-8 flex flex-col h-full pt-12 sm:pt-20 space-y-8"
          >
            <div>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-colors duration-300">
                <Info size={24} className="sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100 mb-1 sm:mb-2">{plant.name}</h2>
              <p className="text-emerald-700 dark:text-emerald-400 italic font-serif text-base sm:text-lg mb-3">{plant.scientificName}</p>
              
              {plant.synonyms && plant.synonyms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5 items-center">
                  <span className="text-xs uppercase tracking-wider font-bold text-stone-400 dark:text-stone-500 mr-1.5">Other Names:</span>
                  {plant.synonyms.map((syn, idx) => (
                    <span 
                      key={idx} 
                      className="text-[11px] px-2.5 py-0.5 bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 rounded-full font-medium border border-stone-200/50 dark:border-stone-700/50"
                    >
                      {syn}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="prose prose-stone dark:prose-invert">
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-base sm:text-lg">
                  {translateDb(plant.description, language)}
                </p>
              </div>
            </div>

            {/* Market Availability */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-semibold">
                <ShoppingCart size={18} className="text-emerald-600" />
                <h3>{language === 'ms' ? 'Ketersediaan Pasaran' : 'Market Availability'}</h3>
              </div>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-sm sm:text-base">
                {translateDb(plant.marketAvailability, language)}
              </p>
              
              {/* QUEST 3+ Real-time Search Panel */}
              <div className="pt-2">
                <NpraSearchSection plant={plant} />
              </div>
              
              {/* Interactive Quiz */}
              <div className="pt-2 pb-4">
                <PlantQuiz plant={plant} />
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/50 rounded-2xl p-6 transition-colors duration-300">
              <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-2">
                {language === 'ms' ? 'Cara menggunakan peneroka ini:' : 'How to use this explorer:'}
              </h3>
              <ul className="space-y-3 text-stone-600 dark:text-stone-400">
                <li className="flex items-start gap-3">
                  <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                  <p>{language === 'ms' ? 'Tuding pada imej tumbuhan di sebelah kiri untuk melihat kawasan interaktif.' : 'Hover over the plant image on the left to see interactive regions.'}</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                  <p>{language === 'ms' ? 'Klik pada bahagian tertentu (cth. Daun, Bunga) untuk melihat sebatian yang diekstrak.' : 'Click on a specific part (e.g., Leaves, Flowers) to view its extracted compounds.'}</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                  <p>{language === 'ms' ? 'Pilih sebatian untuk mendedahkan struktur 2D/3D serta sifat farmakologinya.' : 'Select a compound to reveal its 2D/3D structure and pharmacological properties.'}</p>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Enlarge Modal */}
      <AnimatePresence>
        {enlargedChart && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-stone-950/95 backdrop-blur-md overflow-y-auto"
            onClick={() => setEnlargedChart(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-6xl my-auto bg-stone-50 dark:bg-stone-950 rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900">
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">
                    {enlargedChart.compoundName} - {activeSpectrumTab === '1H' ? '1H NMR Spectrum' : '13C NMR (CNMR) Spectrum'}
                  </h3>
                  <span className="text-xs text-stone-500">Source: NMRShiftDB (Predictive & Synced Core)</span>
                </div>

                {/* Tab selector */}
                <div className="flex items-center gap-3">
                  <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200/50 dark:border-stone-700/50">
                    <button
                      onClick={() => setActiveSpectrumTab('1H')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                        activeSpectrumTab === '1H'
                          ? 'bg-white dark:bg-stone-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                          : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                      }`}
                    >
                      1H Peak (HNMR)
                    </button>
                    <button
                      onClick={() => setActiveSpectrumTab('13C')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                        activeSpectrumTab === '13C'
                          ? 'bg-white dark:bg-stone-700 text-purple-600 dark:text-purple-400 shadow-sm'
                          : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                      }`}
                    >
                      13C Peak (CNMR)
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setEnlargedChart(null)}
                    className="text-stone-400 hover:text-stone-800 dark:hover:text-white bg-stone-200 dark:bg-stone-800 p-2 rounded-full transition-colors flex items-center justify-center border border-stone-300 dark:border-stone-700"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar space-y-8 bg-white dark:bg-stone-950">
                {activeSpectrumTab === '1H' ? (
                  <>
                    <div className="w-full h-[40vh] sm:h-[50vh] bg-stone-50 border border-stone-200 dark:bg-stone-900 dark:border-stone-800 rounded-2xl p-4">
                      <NMRSpectrumChart compoundName={enlargedChart.compoundName} />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
                        <Table size={20} className="text-cyan-600 dark:text-cyan-500" /> 
                        Proton 1H Assignments Table
                      </h3>
                      <NMRDataTable compoundName={enlargedChart.compoundName} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full h-[40vh] sm:h-[50vh] bg-stone-50 border border-stone-200 dark:bg-stone-900 dark:border-stone-800 rounded-2xl p-4">
                      <CNMRSpectrumChart compoundName={enlargedChart.compoundName} />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
                        <Table size={20} className="text-purple-600 dark:text-purple-500" /> 
                        Carbon-13 CNMR Assignments Table
                      </h3>
                      <CNMRDataTable compoundName={enlargedChart.compoundName} />
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Enlarge Modal */}
      <AnimatePresence>
        {enlargedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-stone-950/90 backdrop-blur-md"
            onClick={() => setEnlargedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-auto max-h-full flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 -mt-12 flex items-center gap-4">
                <h3 className="text-white font-medium text-lg hidden sm:block">{enlargedImage.title}</h3>
                <button 
                  onClick={() => setEnlargedImage(null)}
                  className="text-stone-400 hover:text-white bg-stone-800/50 hover:bg-stone-700/50 p-2 rounded-full transition-colors backdrop-blur-md border border-stone-700/50"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="relative w-full h-[70vh] sm:h-[80vh] bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800">
                <Image 
                  src={enlargedImage.url} 
                  alt={enlargedImage.title} 
                  fill 
                  className="object-contain p-8"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Enlarge Modal */}
      <AnimatePresence>
        {is3DModalOpen && compound && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-stone-900/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 w-full max-w-6xl h-full max-h-[800px] rounded-3xl shadow-2xl border border-stone-700 flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/50">
                <div className="flex items-center gap-3">
                  <div className="bg-stone-800 p-2 rounded-lg text-stone-300">
                    <Dna size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{compound.name} - 3D Binding Interaction</h3>
                    <p className="text-xs text-stone-400">Interactive Molecular Viewer</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsVRMode(!isVRMode)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border ${
                      isVRMode 
                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                        : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700 hover:text-stone-300'
                    }`}
                  >
                    <Headset size={18} />
                    {isVRMode ? 'VR Mode: ON' : 'VR Mode: OFF'}
                  </button>
                  <button 
                    onClick={() => setIs3DModalOpen(false)}
                    className="text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 p-2 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <Interactive3DViewer compound={compound} isVRMode={isVRMode} isMobile={isMobile} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
