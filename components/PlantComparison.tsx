"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plant, Compound, plantsData, getCompoundBioactiveClass } from "@/lib/data";
import { translateDb, translations } from "@/lib/i18n";
import { useLanguage } from "@/lib/LanguageContext";
import { 
  ArrowLeftRight, Info, FlaskConical, Activity, Check, ShieldAlert,
  ShoppingBag, Sparkles, AlertCircle, HelpCircle
} from "lucide-react";

interface PlantComparisonProps {
  onClose: () => void;
  initialLeftPlant?: Plant;
}

export function PlantComparison({ onClose, initialLeftPlant }: PlantComparisonProps) {
  const { language } = useLanguage();
  const t = translations[language];

  // Plant options
  const allPlants = plantsData;
  const [leftPlant, setLeftPlant] = useState<Plant>(
    initialLeftPlant || allPlants[0]
  );
  const [rightPlant, setRightPlant] = useState<Plant>(
    allPlants.find(p => p.id !== (initialLeftPlant?.id || allPlants[0].id)) || allPlants[1] || allPlants[0]
  );

  // Sync with parent sidebar clicks
  useEffect(() => {
    if (initialLeftPlant) {
      setLeftPlant(initialLeftPlant); // eslint-disable-line react-hooks/set-state-in-effect
      // If same plant is selected on right, swap/select another for right
      if (initialLeftPlant.id === rightPlant.id) {
        const other = allPlants.find(p => p.id !== initialLeftPlant.id);
        if (other) setRightPlant(other);
      }
    }
  }, [initialLeftPlant, rightPlant.id, allPlants]);

  const [activeTab, setActiveTab] = useState<"phytochemicals" | "pharmacology" | "botany">("phytochemicals");

  // Helper to extract all unique compounds across all plant parts
  const getPlantCompounds = (plant: Plant): { compound: Compound; partName: string }[] => {
    const list: { compound: Compound; partName: string }[] = [];
    const seen = new Set<string>();

    plant.parts.forEach((part) => {
      part.compounds.forEach((comp) => {
        if (!seen.has(comp.id)) {
          seen.add(comp.id);
          list.push({ compound: comp, partName: part.name });
        }
      });
    });
    return list;
  };

  const leftCompounds = getPlantCompounds(leftPlant);
  const rightCompounds = getPlantCompounds(rightPlant);

  // Helper to extract all pharmacological activities
  const getPlantPharmacology = (compList: { compound: Compound; partName: string }[]): string[] => {
    const activities = new Set<string>();
    compList.forEach((item) => {
      if (item.compound.pharmacologicalActivity) {
        // Split if comma separated, otherwise add
        const parts = item.compound.pharmacologicalActivity.split(/,|\//);
        parts.forEach(p => {
          const trimmed = p.trim();
          if (trimmed) {
            activities.add(trimmed);
          }
        });
      }
    });
    return Array.from(activities);
  };

  const leftPharmList = getPlantPharmacology(leftCompounds);
  const rightPharmList = getPlantPharmacology(rightCompounds);

  // Overlapping pharmacology activities
  const overlappingPharm = leftPharmList.filter(act => 
    rightPharmList.some(rAct => rAct.toLowerCase() === act.toLowerCase())
  );

  // Overlapping compound classes
  const getCompoundClasses = (compList: { compound: Compound; partName: string }[]) => {
    const classes = new Set<string>();
    compList.forEach(item => {
      const clsList = getCompoundBioactiveClass(item.compound);
      clsList.forEach(c => classes.add(c));
    });
    return Array.from(classes);
  };

  const leftClasses = getCompoundClasses(leftCompounds);
  const rightClasses = getCompoundClasses(rightCompounds);
  const overlappingClasses = leftClasses.filter(cls => 
    rightClasses.some(rCls => rCls.toLowerCase() === cls.toLowerCase())
  );

  // Get color badges for pharmacology actions
  const getActivityColor = (act: string) => {
    const lower = act.toLowerCase();
    if (lower.includes("anti-inflammatory") || lower.includes("inflamasi")) return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/30";
    if (lower.includes("antioxidant") || lower.includes("oksidan")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/30";
    if (lower.includes("diuretic") || lower.includes("kidney") || lower.includes("ginjal") || lower.includes("kencing")) return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/50 dark:border-blue-900/30";
    if (lower.includes("anticancer") || lower.includes("tumor") || lower.includes("kanser")) return "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/50 dark:border-purple-900/30";
    if (lower.includes("antimicrobial") || lower.includes("septic") || lower.includes("bakteria") || lower.includes("microb")) return "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/50 dark:border-rose-900/30";
    if (lower.includes("analgesic") || lower.includes("sakit") || lower.includes("pain")) return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200/50 dark:border-orange-900/30";
    if (lower.includes("neuro") || lower.includes("stimul") || lower.includes("saraf")) return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-900/30";
    return "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
      {/* Top Header bar inside panel */}
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-850 flex items-center justify-between shrink-0 bg-white dark:bg-stone-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <ArrowLeftRight size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-extrabold text-stone-800 dark:text-stone-100 uppercase tracking-wide">
              {language === 'ms' ? 'Papan Perbandingan Tumbuhan' : 'Botanical Comparison Dashboard'}
            </h2>
            <p className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
              {language === 'ms' 
                ? 'Analisis perbandingan fitokimia dan profil farmakologi secara bersebelahan.' 
                : 'Side-by-side phytochemical composition and pharmacological properties analysis.'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition active:scale-95"
        >
          {language === 'ms' ? 'Tutup Perbandingan' : 'Close Compare'}
        </button>
      </div>

      {/* Selectors Bar */}
      <div className="px-6 py-3.5 bg-stone-100/50 dark:bg-stone-900/40 border-b border-stone-200/60 dark:border-stone-850/60 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
        {/* Left selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            {language === 'ms' ? 'Tumbuhan Kiri (A)' : 'Left Plant (A)'}
          </label>
          <select
            value={leftPlant.id}
            onChange={(e) => {
              const selected = allPlants.find(p => p.id === e.target.value);
              if (selected) setLeftPlant(selected);
            }}
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm font-semibold rounded-xl p-2.5 text-stone-800 dark:text-stone-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-shadow shadow-sm"
          >
            {allPlants.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === rightPlant.id}>
                🌿 {translateDb(p.name, language)} ({p.scientificName})
              </option>
            ))}
          </select>
        </div>

        {/* Right selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            {language === 'ms' ? 'Tumbuhan Kanan (B)' : 'Right Plant (B)'}
          </label>
          <select
            value={rightPlant.id}
            onChange={(e) => {
              const selected = allPlants.find(p => p.id === e.target.value);
              if (selected) setRightPlant(selected);
            }}
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm font-semibold rounded-xl p-2.5 text-stone-800 dark:text-stone-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-shadow shadow-sm"
          >
            {allPlants.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === leftPlant.id}>
                🌿 {translateDb(p.name, language)} ({p.scientificName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-850 shrink-0 flex gap-2">
        <button
          onClick={() => setActiveTab("phytochemicals")}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "phytochemicals"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
          }`}
        >
          <FlaskConical size={14} />
          <span>{language === 'ms' ? 'Konstituen Kimia' : 'Chemical Constituents'}</span>
          <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
            {leftCompounds.length} vs {rightCompounds.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("pharmacology")}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "pharmacology"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
          }`}
        >
          <Activity size={14} />
          <span>{language === 'ms' ? 'Sifat Farmakologi' : 'Pharmacological Actions'}</span>
          <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
            {leftPharmList.length} vs {rightPharmList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("botany")}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "botany"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
          }`}
        >
          <Info size={14} />
          <span>{language === 'ms' ? 'Maklumat Botani' : 'Botanical Info'}</span>
        </button>
      </div>

      {/* Comparison Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Quick Highlights / Synergies Summary */}
        <div className="bg-gradient-to-r from-emerald-500/[0.04] to-blue-500/[0.04] rounded-2xl border border-emerald-500/10 dark:border-emerald-500/5 p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-extrabold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                {language === 'ms' ? 'Sorotan Perbandingan Pintar' : 'Smart Comparison Highlights'}
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
              {language === 'ms' ? (
                <>
                  Membandingkan <strong>{translateDb(leftPlant.name, language)}</strong> dan <strong>{translateDb(rightPlant.name, language)}</strong> mendedahkan profil fitokimia unik.
                  {overlappingClasses.length > 0 && ` Kedua-dua tumbuhan berkongsi kelas kimia utama termasuk: ${overlappingClasses.map(c => translateDb(c, language)).join(", ")}.`}
                  {overlappingPharm.length > 0 && ` Sifat farmakologi terapeutik bertindih dikenal pasti untuk aktiviti ${overlappingPharm.map(a => translateDb(a, language)).join(", ")}.`}
                </>
              ) : (
                <>
                  Comparing <strong>{translateDb(leftPlant.name, language)}</strong> and <strong>{translateDb(rightPlant.name, language)}</strong> reveals custom biochemical matrices.
                  {overlappingClasses.length > 0 && ` Both species share dominant phytochemical classes including: ${overlappingClasses.join(", ")}.`}
                  {overlappingPharm.length > 0 && ` Overlapping therapeutic pharmacological properties identified for: ${overlappingPharm.join(", ")}.`}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Dynamic Tab Panels */}
        {activeTab === "botany" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left botany info */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/60 dark:border-stone-800 p-5 space-y-4 shadow-sm transition-all hover:shadow-md">
              <div className="border-b border-stone-100 dark:border-stone-850 pb-3">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">
                  {language === 'ms' ? 'Profil Botani A' : 'Botanical Profile A'}
                </span>
                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mt-1">{translateDb(leftPlant.name, language)}</h3>
                <p className="text-xs font-mono text-stone-450 dark:text-stone-500 italic mt-0.5">{leftPlant.scientificName}</p>
              </div>

              <div className="space-y-3.5 text-xs text-stone-650 dark:text-stone-300">
                <div className="space-y-1">
                  <span className="font-bold text-stone-500 dark:text-stone-400 block uppercase text-[9px] tracking-wider">
                    {language === 'ms' ? 'Keterangan Terapeutik' : 'Therapeutic Description'}
                  </span>
                  <p className="leading-relaxed">{translateDb(leftPlant.description, language)}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-stone-500 dark:text-stone-400 block uppercase text-[9px] tracking-wider">
                    {language === 'ms' ? 'Ketersediaan Pasaran & Bentuk Produk' : 'Market Availability & Formulations'}
                  </span>
                  <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-950 p-2.5 rounded-xl border border-stone-150 dark:border-stone-800/80 mt-1">
                    <ShoppingBag size={14} className="text-emerald-600 shrink-0" />
                    <p className="font-medium">{translateDb(leftPlant.marketAvailability, language)}</p>
                  </div>
                </div>

                {leftPlant.synonyms && leftPlant.synonyms.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-bold text-stone-500 dark:text-stone-400 block uppercase text-[9px] tracking-wider">
                      {language === 'ms' ? 'Nama Sinonim / Lain' : 'Synonyms / Common Names'}
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {leftPlant.synonyms.map(syn => (
                        <span key={syn} className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] text-stone-600 dark:text-stone-400 font-mono">
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right botany info */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/60 dark:border-stone-800 p-5 space-y-4 shadow-sm transition-all hover:shadow-md">
              <div className="border-b border-stone-100 dark:border-stone-850 pb-3">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">
                  {language === 'ms' ? 'Profil Botani B' : 'Botanical Profile B'}
                </span>
                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mt-1">{translateDb(rightPlant.name, language)}</h3>
                <p className="text-xs font-mono text-stone-450 dark:text-stone-500 italic mt-0.5">{rightPlant.scientificName}</p>
              </div>

              <div className="space-y-3.5 text-xs text-stone-650 dark:text-stone-300">
                <div className="space-y-1">
                  <span className="font-bold text-stone-500 dark:text-stone-400 block uppercase text-[9px] tracking-wider">
                    {language === 'ms' ? 'Keterangan Terapeutik' : 'Therapeutic Description'}
                  </span>
                  <p className="leading-relaxed">{translateDb(rightPlant.description, language)}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-stone-500 dark:text-stone-400 block uppercase text-[9px] tracking-wider">
                    {language === 'ms' ? 'Ketersediaan Pasaran & Bentuk Produk' : 'Market Availability & Formulations'}
                  </span>
                  <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-950 p-2.5 rounded-xl border border-stone-150 dark:border-stone-800/80 mt-1">
                    <ShoppingBag size={14} className="text-emerald-600 shrink-0" />
                    <p className="font-medium">{translateDb(rightPlant.marketAvailability, language)}</p>
                  </div>
                </div>

                {rightPlant.synonyms && rightPlant.synonyms.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-bold text-stone-500 dark:text-stone-400 block uppercase text-[9px] tracking-wider">
                      {language === 'ms' ? 'Nama Sinonim / Lain' : 'Synonyms / Common Names'}
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {rightPlant.synonyms.map(syn => (
                        <span key={syn} className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] text-stone-600 dark:text-stone-400 font-mono">
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "phytochemicals" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left plant phytochemicals */}
            <div className="space-y-4">
              <div className="bg-stone-100/80 dark:bg-stone-900/40 p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-stone-700 dark:text-stone-300">
                  {translateDb(leftPlant.name, language)} ({leftCompounds.length} {language === 'ms' ? 'Sebatian' : 'Compounds'})
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {language === 'ms' ? 'Kompilasi Kimia' : 'Chemical Comp'}
                </span>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {leftCompounds.map(({ compound, partName }) => {
                  const bioClasses = getCompoundBioactiveClass(compound);
                  return (
                    <div 
                      key={compound.id}
                      className="bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-850 p-4 rounded-xl shadow-sm space-y-2.5 transition-all hover:scale-[1.01] hover:shadow-md"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm">{translateDb(compound.name, language)}</h4>
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono italic">
                            {language === 'ms' ? 'Bahagian' : 'Found in'}: {translateDb(partName, language)}
                          </span>
                        </div>
                        {compound.percent && (
                          <span className="text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full shrink-0">
                            {compound.percent}%
                          </span>
                        )}
                      </div>

                      {bioClasses.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {bioClasses.map(cls => (
                            <span key={cls} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-750 dark:text-purple-300 border border-purple-500/10 text-[9px] font-extrabold rounded">
                              🧪 {translateDb(cls, language)}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1 border-t border-stone-50 dark:border-stone-850 pt-2">
                        <div>
                          <strong className="text-[10px] text-stone-400 dark:text-stone-500 uppercase block tracking-wider">
                            {language === 'ms' ? 'Aktiviti Farmakologi' : 'Pharmacological Action'}
                          </strong>
                          <p className="leading-snug">{translateDb(compound.pharmacologicalActivity, language)}</p>
                        </div>
                        {compound.keyFact && (
                          <div className="pt-1.5">
                            <strong className="text-[10px] text-stone-400 dark:text-stone-500 uppercase block tracking-wider">
                              {language === 'ms' ? 'Fakta Utama' : 'Key Fact'}
                            </strong>
                            <p className="italic leading-snug text-stone-500 dark:text-stone-450">&ldquo;{translateDb(compound.keyFact, language)}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right plant phytochemicals */}
            <div className="space-y-4">
              <div className="bg-stone-100/80 dark:bg-stone-900/40 p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-stone-700 dark:text-stone-300">
                  {translateDb(rightPlant.name, language)} ({rightCompounds.length} {language === 'ms' ? 'Sebatian' : 'Compounds'})
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {language === 'ms' ? 'Kompilasi Kimia' : 'Chemical Comp'}
                </span>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {rightCompounds.map(({ compound, partName }) => {
                  const bioClasses = getCompoundBioactiveClass(compound);
                  return (
                    <div 
                      key={compound.id}
                      className="bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-850 p-4 rounded-xl shadow-sm space-y-2.5 transition-all hover:scale-[1.01] hover:shadow-md"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm">{translateDb(compound.name, language)}</h4>
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono italic">
                            {language === 'ms' ? 'Bahagian' : 'Found in'}: {translateDb(partName, language)}
                          </span>
                        </div>
                        {compound.percent && (
                          <span className="text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full shrink-0">
                            {compound.percent}%
                          </span>
                        )}
                      </div>

                      {bioClasses.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {bioClasses.map(cls => (
                            <span key={cls} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-750 dark:text-purple-300 border border-purple-500/10 text-[9px] font-extrabold rounded">
                              🧪 {translateDb(cls, language)}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1 border-t border-stone-50 dark:border-stone-850 pt-2">
                        <div>
                          <strong className="text-[10px] text-stone-400 dark:text-stone-500 uppercase block tracking-wider">
                            {language === 'ms' ? 'Aktiviti Farmakologi' : 'Pharmacological Action'}
                          </strong>
                          <p className="leading-snug">{translateDb(compound.pharmacologicalActivity, language)}</p>
                        </div>
                        {compound.keyFact && (
                          <div className="pt-1.5">
                            <strong className="text-[10px] text-stone-400 dark:text-stone-500 uppercase block tracking-wider">
                              {language === 'ms' ? 'Fakta Utama' : 'Key Fact'}
                            </strong>
                            <p className="italic leading-snug text-stone-500 dark:text-stone-450">&ldquo;{translateDb(compound.keyFact, language)}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "pharmacology" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Pharmacology Actions */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/60 dark:border-stone-800 p-5 space-y-4 shadow-sm">
              <div className="border-b border-stone-100 dark:border-stone-850 pb-3">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono">
                  {language === 'ms' ? 'Spektrum Farmakologi A' : 'Pharmacology Spectrum A'}
                </span>
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-100 mt-0.5">{translateDb(leftPlant.name, language)}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="font-bold text-stone-400 dark:text-stone-500 block uppercase text-[9px] tracking-wider mb-2">
                    {language === 'ms' ? 'Indikasi Makroskopik / Tindakan Biologi' : 'Macroscopic Indications / Biological Actions'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {leftPharmList.map((act) => (
                      <span 
                        key={act} 
                        className={`px-3 py-1 text-xs border rounded-full font-bold shadow-sm transition-transform hover:scale-[1.02] ${getActivityColor(act)}`}
                      >
                        ⚡ {translateDb(act, language)}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-stone-400 dark:text-stone-500 block uppercase text-[9px] tracking-wider mb-2">
                    {language === 'ms' ? 'Kelas Fitokimia Utama' : 'Dominant Phytochemical Classes'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {leftClasses.map((cls) => (
                      <span 
                        key={cls} 
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10 flex items-center gap-1`}
                      >
                        <Check size={10} className="text-emerald-500" />
                        {translateDb(cls, language)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Pharmacology Actions */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/60 dark:border-stone-800 p-5 space-y-4 shadow-sm">
              <div className="border-b border-stone-100 dark:border-stone-850 pb-3">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono">
                  {language === 'ms' ? 'Spektrum Farmakologi B' : 'Pharmacology Spectrum B'}
                </span>
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-100 mt-0.5">{translateDb(rightPlant.name, language)}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="font-bold text-stone-400 dark:text-stone-500 block uppercase text-[9px] tracking-wider mb-2">
                    {language === 'ms' ? 'Indikasi Makroskopik / Tindakan Biologi' : 'Macroscopic Indications / Biological Actions'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {rightPharmList.map((act) => (
                      <span 
                        key={act} 
                        className={`px-3 py-1 text-xs border rounded-full font-bold shadow-sm transition-transform hover:scale-[1.02] ${getActivityColor(act)}`}
                      >
                        ⚡ {translateDb(act, language)}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-stone-400 dark:text-stone-500 block uppercase text-[9px] tracking-wider mb-2">
                    {language === 'ms' ? 'Kelas Fitokimia Utama' : 'Dominant Phytochemical Classes'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {rightClasses.map((cls) => (
                      <span 
                        key={cls} 
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10 flex items-center gap-1`}
                      >
                        <Check size={10} className="text-emerald-500" />
                        {translateDb(cls, language)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
